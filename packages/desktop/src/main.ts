import { app, BrowserWindow, ipcMain, net } from 'electron';
import * as path from 'path';

// 개발 모드인지 확인
const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow;

// 온라인 상태 확인 함수
async function checkOnlineStatus(): Promise<boolean> {
  try {
    const request = net.request({
      method: 'GET',
      url: 'http://localhost:3000'
    });
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000);
      
      request.on('response', () => {
        clearTimeout(timeout);
        resolve(true);
      });
      
      request.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
      
      request.end();
    });
  } catch (error) {
    return false;
  }
}

// 리소스 로드 함수
async function loadResources(): Promise<void> {
  if (!mainWindow) return;

  try {
    // 온라인 상태 확인
    const isOnline = await checkOnlineStatus();
    
    if (isOnline) {
      console.log('온라인 모드: localhost:3000에서 리소스 로드');
      await mainWindow.loadURL('http://localhost:3000');
    } else {
      console.log('오프라인 모드: 로컬 파일에서 리소스 로드');
      await mainWindow.loadFile(path.join(__dirname, '../../web/dist/index.html'));
    }
  } catch (error) {
    console.error('리소스 로드 실패:', error);
    // 오프라인 모드로 폴백
    try {
      await mainWindow.loadFile(path.join(__dirname, '../../web/dist/index.html'));
    } catch (fallbackError) {
      console.error('오프라인 모드도 실패:', fallbackError);
    }
  }
}

function createWindow(): void {
  // 메인 윈도우 생성
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'), // 아이콘 경로 (선택사항)
    titleBarStyle: 'default',
    show: false // 로딩 완료 후 표시
  });

  // 리소스 로드
  loadResources();

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 윈도우가 닫힐 때
  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });
}

// 앱이 준비되면 윈도우 생성
app.whenReady().then(() => {
  createWindow();

  // macOS에서 독립적으로 동작
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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

// IPC 통신 예제
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const { dialog } = await import('electron');
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// 온라인 상태 확인 IPC
ipcMain.handle('check-online-status', async () => {
  return await checkOnlineStatus();
});

// 리소스 다시 로드 IPC
ipcMain.handle('reload-resources', async () => {
  if (mainWindow) {
    await loadResources();
  }
});
