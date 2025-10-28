import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Keep default root (.) so `npm run dev` serves ui/index.html.
  // If someone runs `npm run dev boss`, Vite treats `boss` as root;
  // we allow FS access to parent so imports like "../styles/globals.css" work.
  server: {
    fs: {
      allow: [
        // project root
        path.resolve(__dirname),
        // parent directories (for safety when root becomes ui/boss)
        path.resolve(__dirname, ".."),
      ],
    },
  },
  resolve: {
    alias: {
      "@ui": path.resolve(__dirname, "."),
    },
  },
}))

