import { realpathSync } from 'node:fs';
import { defineConfig } from 'vite';
// D:/work is a junction. A canonical root avoids mixed D:/ and E:/ bundle paths.
const root = realpathSync(process.cwd());
export default defineConfig({ root, base: './', server: { strictPort: true }, build: {
  target: 'es2020', rollupOptions: { input: { index: `${root}/index.html`, canvas: `${root}/canvas.html` } },
} });
