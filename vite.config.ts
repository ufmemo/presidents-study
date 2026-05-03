import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages: base must match the repo name when hosted at
// https://<user>.github.io/<repo>/. Update if you rename the repo.
export default defineConfig({
  plugins: [react()],
  base: '/daddy-study/',
});
