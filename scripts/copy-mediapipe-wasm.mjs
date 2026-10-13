// Copies MediaPipe's WebAssembly runtime into public/ so the photo cut-out
// (lib/photo-cutout.ts) loads it from this site, not a third-party CDN: the
// CSP only allows same-origin scripts. Runs before `dev` and `build`; the
// copied files are gitignored (they come from node_modules each time).
import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules", "@mediapipe", "tasks-vision", "wasm");
const dest = join(process.cwd(), "public", "mediapipe", "wasm");
mkdirSync(dest, { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) {
  cpSync(join(src, f), join(dest, f));
}
console.log("MediaPipe wasm copied to public/mediapipe/wasm");
