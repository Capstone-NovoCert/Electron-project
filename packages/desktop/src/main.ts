import { app, BrowserWindow } from 'electron';
import { createMainWindow, loadResources } from './window/window-manager';
import { registerIpcHandlers } from './ipc/handlers';

// 개발 모드인지 확인
const isDev = process.env.NODE_ENV === 'development';

// 앱이 준비되면 윈도우 생성
app.whenReady().then(() => {
  // 메인 윈도우 생성
  createMainWindow();
  
  // 리소스 로드
  loadResources();
  
  // IPC 핸들러 등록
  registerIpcHandlers();

  // macOS에서 독립적으로 동작
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      loadResources();
    }
  });
});

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 보안: 새 윈도우 생성 방지
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    event.preventDefault();
  });
});
