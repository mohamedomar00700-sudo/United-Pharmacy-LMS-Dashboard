import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // This is the crucial part for GitHub Pages.
  // The error URL shows the site is hosted at the root (e.g., your-username.github.io),
  // not in a sub-directory. Therefore, the base path should be '/'.
  base: '/',
  plugins: [react()],
})