import { BrowserWindow } from 'electron';
import * as path from 'path';
import { checkOnlineStatus } from '../utils/network';

let mainWindow: BrowserWindow | null = null;

/**
 * 메인 윈도우 생성
 */
export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // 윈도우가 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 윈도우가 닫힐 때
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * 리소스 로드 (온라인/오프라인 모드)
 */
export async function loadResources(): Promise<void> {
  if (!mainWindow) return;

  try {
    // 온라인 상태 확인
    const isOnline = await checkOnlineStatus();
    
    if (isOnline) {
      console.log('온라인 모드: localhost:3000에서 리소스 로드');
      await mainWindow.loadURL('http://localhost:3000');
    } else {
      console.log('오프라인 모드: src 폴더에서 직접 리소스 로드');
      const offlinePath = path.join(__dirname, '../../../web/src/index.html');
      const fileUrl = `file://${offlinePath.replace(/\\/g, '/')}`;
      console.log('오프라인 파일 URL:', fileUrl);
      await mainWindow.loadURL(fileUrl);
    }
  } catch (error) {
    console.error('리소스 로드 실패:', error);
    // 오프라인 모드로 폴백
    try {
      const fallbackPath = path.join(__dirname, '../../../web/src/index.html');
      const fallbackUrl = `file://${fallbackPath.replace(/\\/g, '/')}`;
      console.log('폴백 파일 URL:', fallbackUrl);
      await mainWindow.loadURL(fallbackUrl);
    } catch (fallbackError) {
      console.error('오프라인 모드도 실패:', fallbackError);
    }
  }
}

/**
 * 메인 윈도우 인스턴스 반환
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
