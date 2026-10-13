// Copies MediaPipe's WebAssembly runtime into public/ so the photo cut-out
// (lib/photo-cutout.ts) loads it from this site, not a third-party CDN: the
// CSP only allows same-origin scripts. Runs before `dev` and `build`; the
// copied files are gitignored (they come from node_modules each time); a
// file already there at the same size is left alone, so a dev start doesn't
// rewrite ~23 MB.
import { cpSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules", "@mediapipe", "tasks-vision", "wasm");
const dest = join(process.cwd(), "public", "mediapipe", "wasm");
mkdirSync(dest, { recursive: true });
let copied = 0;
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm", "vision_wasm_nosimd_internal.js", "vision_wasm_nosimd_internal.wasm"]) {
  const from = join(src, f);
  const to = join(dest, f);
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  cpSync(from, to);
  copied++;
}
console.log(`MediaPipe wasm: ${copied} file(s) copied to public/mediapipe/wasm`);
