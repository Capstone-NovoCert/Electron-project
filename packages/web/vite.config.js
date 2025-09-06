import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  base: './', // 상대 경로로 빌드
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
})
