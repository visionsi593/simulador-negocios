import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' para que el build funcione también empaquetado como app de escritorio.
export default defineConfig({
  plugins: [react()],
  base: './',
});
