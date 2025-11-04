import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // This is the crucial part for GitHub Pages.
  // It tells Vite that the final website will be in a subfolder.
  // Make sure 'lms-dashboard' is the exact name of your GitHub repository.
  // If your repository has a different name, change it here.
  base: '/lms-dashboard/',
  plugins: [react()],
})
