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
 * The pure helpers (maskToAlpha, alphaBounds) are exported for tests; the
 * canvas/segmenter part only runs in a browser.
 */

/** Longest side the photo is processed and stored at. Plenty for a banner. */
const MAX_SIDE = 1400;
/** Below this share of the frame we assume no clear person was found. */
const MIN_PERSON_SHARE = 0.04;

export class NoPersonFoundError extends Error {
  constructor() {
    super("We couldn't find a person clearly enough to cut out.");
    this.name = "NoPersonFoundError";
  }
}

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
 */
export function keepLargestPerson(alpha: Uint8ClampedArray, width: number, height: number, solid = 96, edge = 3): Uint8ClampedArray {
  const label = new Int32Array(alpha.length).fill(-1);
  const stack: number[] = [];
  let best = -1, bestSize = 0, next = 0;
  for (let start = 0; start < alpha.length; start++) {
    if (alpha[start] < solid || label[start] !== -1) continue;
    const id = next++;
    let size = 0;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      size++;
      const x = i % width, y = (i - x) / width;
      const near = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1];
      for (const n of near) {
        if (n >= 0 && label[n] === -1 && alpha[n] >= solid) {
          label[n] = id;
          stack.push(n);
        }
      }
    }
    if (size > bestSize) { best = id; bestSize = size; }
  }

  const out = new Uint8ClampedArray(alpha.length);
  if (best < 0) return out;
  // Distance-limited grow from the kept blob, so its soft hair/edge pixels stay.
  const keep = new Uint8Array(alpha.length);
  let frontier: number[] = [];
  for (let i = 0; i < alpha.length; i++) if (label[i] === best) { keep[i] = 1; frontier.push(i); }
  for (let step = 0; step < edge; step++) {
    const grown: number[] = [];
    for (const i of frontier) {
      const x = i % width, y = (i - x) / width;
      for (const n of [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1]) {
        if (n >= 0 && !keep[n] && alpha[n] > 0 && alpha[n] < solid) { keep[n] = 1; grown.push(n); }
      }
    }
    frontier = grown;
  }
  for (let i = 0; i < alpha.length; i++) if (keep[i]) out[i] = alpha[i];
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
 * bottom edge so shoulders run off the frame like a headshot), as a PNG.
 * Throws NoPersonFoundError when there's no clear person to cut out.
 */
export async function cutOutPerson(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const src = canvas(w, h);
  src.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const segmenter = await getSegmenter();
  const result = segmenter.segment(src);
  try {
    // Multiclass masks: 0 background, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 other.
    const bg = result.confidenceMasks?.[0];
    if (!bg) throw new Error("The segmenter returned no mask.");
    const mw = bg.width;
    const mh = bg.height;
    const alpha = keepLargestPerson(maskToAlpha(bg.getAsFloat32Array()), mw, mh);

    const bounds = alphaBounds(alpha, mw, mh);
    if (!bounds || bounds.share < MIN_PERSON_SHARE) throw new NoPersonFoundError();

    // Alpha as an image, scaled up to the photo with smoothing, slightly feathered.
    const maskCanvas = canvas(mw, mh);
    const md = new ImageData(mw, mh);
    for (let i = 0; i < alpha.length; i++) {
      md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = 255;
      md.data[i * 4 + 3] = alpha[i];
    }
    maskCanvas.getContext("2d")!.putImageData(md, 0, 0);

    const cut = canvas(w, h);
    const ctx = cut.getContext("2d")!;
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.imageSmoothingQuality = "high";
    ctx.filter = "blur(0.6px)";
    ctx.drawImage(maskCanvas, 0, 0, w, h);

    // Crop to the person with a little air, always down to the bottom edge.
    const sx = w / mw;
    const sy = h / mh;
    const pad = Math.round(Math.max(w, h) * 0.03);
    const x0 = Math.max(0, Math.floor(bounds.x * sx) - pad);
    const y0 = Math.max(0, Math.floor(bounds.y * sy) - pad);
    const x1 = Math.min(w, Math.ceil((bounds.x + bounds.w) * sx) + pad);
    const out = canvas(x1 - x0, h - y0);
    out.getContext("2d")!.drawImage(cut, x0, y0, x1 - x0, h - y0, 0, 0, x1 - x0, h - y0);

    return await new Promise<Blob>((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode the cut-out."))), "image/png"),
    );
  } finally {
    result.close();
  }
}
