import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  resolve: {
    // alias: {
    //   // FIX: `__dirname` is not available in ES modules. Using `.` as a base for
    //   // path resolution points to the current working directory, which is the
    //   // project root when running Vite and achieves the same result.
    //   '@': path.resolve('.'),
    // },
  },
})