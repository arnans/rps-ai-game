
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'YOUR_REPO_NAME' with your actual repository name if not deploying to a custom domain
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/.', // Resolves @/ to the project root
    },
  },
  base: './', 
  build: {
    outDir: 'dist',
  },
});
