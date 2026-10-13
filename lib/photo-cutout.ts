/**
 * NBA-style profile photo: remove the background in the browser before the
 * photo is uploaded, so the player stands straight on the profile banner.
 *
 * Runs Google's MediaPipe selfie multiclass segmenter (Apache-2.0). The wasm
 * runtime is copied into /mediapipe/wasm at dev/build time
 * (scripts/copy-mediapipe-wasm.mjs) and the model lives in /models, so
 * nothing loads from a third-party origin. The model is ~16 MB, downloaded
 * once on first use and then cached by the browser.
 *
 * The pure helpers (maskToAlpha, keepLargestPerson, alphaBounds) are exported
 * for tests; the canvas/segmenter part only runs in a browser.
 */

/** Longest side the photo is processed and stored at. Plenty for a banner. */
const MAX_SIDE = 1400;
/** Below this share of the frame we assume no clear person was found. */
const MIN_PERSON_SHARE = 0.04;

/**
 * Background confidence (0..1 per pixel) to an alpha channel (0..255).
 * A smoothstep between 0.25 and 0.75 person-confidence keeps soft, natural
 * edges on hair without leaving a faint halo of background behind.
 */
export function maskToAlpha(backgroundConfidence: Float32Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(backgroundConfidence.length);
  for (let i = 0; i < backgroundConfidence.length; i++) {
    const person = 1 - backgroundConfidence[i];
    const t = Math.min(1, Math.max(0, (person - 0.25) / 0.5));
    out[i] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return out;
}

/**
 * Keep only the biggest person in the frame. The model cuts out everyone,
 * so in a gym photo team-mates in the background come along too; a profile
 * photo is about one player, and they're nearly always the largest. Solid
 * pixels are grouped into connected blobs and only the largest survives;
 * soft edge pixels stay only if they're touching (within `edge` px of) it.
 *
 * Runs on up to ~2M pixels, so it allocates nothing per pixel: typed-array
 * stack and frontier, and neighbour callbacks created once.
 */
export function keepLargestPerson(alpha: Uint8ClampedArray, width: number, height: number, solid = 96, edge = 3): Uint8ClampedArray {
  const n = width * height;
  const eachNeighbour = (i: number, visit: (j: number) => void) => {
    const x = i % width;
    if (x > 0) visit(i - 1);
    if (x < width - 1) visit(i + 1);
    if (i >= width) visit(i - width);
    if (i < n - width) visit(i + width);
  };

  // 1. Label the solid blobs (iterative flood fill) and find the largest.
  const label = new Int32Array(n).fill(-1);
  const stack = new Int32Array(n);
  let top = 0, id = 0, best = -1, bestSize = 0;
  const fill = (j: number) => {
    if (label[j] === -1 && alpha[j] >= solid) {
      label[j] = id;
      stack[top++] = j;
    }
  };
  for (let start = 0; start < n; start++) {
    if (alpha[start] < solid || label[start] !== -1) continue;
    let size = 0;
    label[start] = id;
    stack[top++] = start;
    while (top) {
      const i = stack[--top];
      size++;
      eachNeighbour(i, fill);
    }
    if (size > bestSize) { best = id; bestSize = size; }
    id++;
  }

  // 2. Copy the kept blob, noting its outline: the only place soft edge
  //    pixels can join, so the grow step never walks the blob's interior.
  const out = new Uint8ClampedArray(n);
  if (best < 0) return out;
  let frontier = new Int32Array(n);
  let next = new Int32Array(n);
  let count = 0;
  let onOutline = false;
  const touchesOutside = (j: number) => { if (label[j] !== best) onOutline = true; };
  for (let i = 0; i < n; i++) {
    if (label[i] !== best) continue;
    out[i] = alpha[i];
    onOutline = false;
    eachNeighbour(i, touchesOutside);
    if (onOutline) frontier[count++] = i;
  }

  // 3. Grow `edge` px into the soft (non-solid) pixels touching the outline.
  let grown = 0;
  const grow = (j: number) => {
    if (!out[j] && alpha[j] > 0 && alpha[j] < solid) {
      out[j] = alpha[j];
      next[grown++] = j;
    }
  };
  for (let step = 0; step < edge && count; step++) {
    grown = 0;
    for (let k = 0; k < count; k++) eachNeighbour(frontier[k], grow);
    [frontier, next] = [next, frontier];
    count = grown;
  }
  return out;
}

/**
 * The box around everything at least `threshold` opaque, plus the share of
 * the frame that is "person". Null when nothing is opaque.
 */
export function alphaBounds(
  alpha: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 32,
): { x: number; y: number; w: number; h: number; share: number } | null {
  let minX = width, minY = height, maxX = -1, maxY = -1, solid = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = alpha[y * width + x];
      if (a >= threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (a >= 128) solid++;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, share: solid / (width * height) };
}

type Segmenter = import("@mediapipe/tasks-vision").ImageSegmenter;
let segmenterPromise: Promise<Segmenter> | null = null;

/** One segmenter per page, created on first use (the model download is the slow part). */
function getSegmenter(): Promise<Segmenter> {
  segmenterPromise ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    return ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: "/models/selfie_multiclass_256x256.tflite", delegate: "CPU" },
      runningMode: "IMAGE",
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    });
  })().catch((err) => {
    segmenterPromise = null; // let a later attempt retry
    throw err;
  });
  return segmenterPromise;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/**
 * The photo with its background removed, cropped to the person (kept to the
 * bottom edge so shoulders run off the frame like a headshot). WebP with
 * transparency where the browser can encode it, PNG otherwise (Safari), so
 * upload with the returned blob's own `type`. Null when there's no clear
 * person to cut out.
 */
export async function cutOutPerson(file: Blob): Promise<Blob | null> {
  // Start the model download now, alongside decoding the photo, not after.
  const segmenterReady = getSegmenter();
  segmenterReady.catch(() => {}); // a failure surfaces at the await below

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const src = canvas(w, h);
  src.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const result = (await segmenterReady).segment(src);
  try {
    // Multiclass masks: 0 background, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 other.
    const bg = result.confidenceMasks?.[0];
    if (!bg) throw new Error("The segmenter returned no mask.");
    const mw = bg.width;
    const mh = bg.height;
    const alpha = keepLargestPerson(maskToAlpha(bg.getAsFloat32Array()), mw, mh);

    const bounds = alphaBounds(alpha, mw, mh);
    if (!bounds || bounds.share < MIN_PERSON_SHARE) return null;

    // Alpha as a white image. One 32-bit write per pixel: bytes are RGBA in
    // memory, so on little-endian (every browser platform) alpha is the top byte.
    const maskCanvas = canvas(mw, mh);
    const md = new ImageData(mw, mh);
    const px = new Uint32Array(md.data.buffer);
    for (let i = 0; i < alpha.length; i++) px[i] = ((alpha[i] << 24) | 0xffffff) >>> 0;
    maskCanvas.getContext("2d")!.putImageData(md, 0, 0);

    // Crop to the person with a little air, always down to the bottom edge,
    // then mask just that region, so no full-size intermediate canvas.
    const sx = w / mw;
    const sy = h / mh;
    const pad = Math.round(Math.max(w, h) * 0.03);
    const x0 = Math.max(0, Math.floor(bounds.x * sx) - pad);
    const y0 = Math.max(0, Math.floor(bounds.y * sy) - pad);
    const cw = Math.min(w, Math.ceil((bounds.x + bounds.w) * sx) + pad) - x0;
    const ch = h - y0;
    const out = canvas(cw, ch);
    const ctx = out.getContext("2d")!;
    ctx.drawImage(src, x0, y0, cw, ch, 0, 0, cw, ch);
    ctx.globalCompositeOperation = "destination-in";
    ctx.imageSmoothingQuality = "high";
    ctx.filter = "blur(0.6px)"; // slight feather on the scaled-up mask edge
    ctx.drawImage(maskCanvas, x0 / sx, y0 / sy, cw / sx, ch / sy, 0, 0, cw, ch);

    return await new Promise<Blob>((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode the cut-out."))), "image/webp", 0.85),
    );
  } finally {
    result.close();
  }
}
