import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// HTML 파일들을 복사하는 플러그인
function copyHtmlFiles() {
  return {
    name: 'copy-html-files',
    writeBundle() {
      const srcDir = 'src/html'
      const destDir = 'dist/html'
      
      function copyDir(src, dest) {
        mkdirSync(dest, { recursive: true })
        const files = readdirSync(src)
        
        for (const file of files) {
          const srcPath = join(src, file)
          const destPath = join(dest, file)
          
          if (statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath)
          } else {
            copyFileSync(srcPath, destPath)
          }
        }
      }
      
      copyDir(srcDir, destDir)
    }
  }
}

export default defineConfig({
  root: 'src',
  base: './', // 상대 경로로 빌드
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  plugins: [copyHtmlFiles()],
  server: {
    port: 3000,
    open: true
  }
})
