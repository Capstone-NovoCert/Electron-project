import { app, BrowserWindow, ipcMain, net } from 'electron';
import * as path from 'path';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

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
      console.log('오프라인 모드: src 폴더에서 직접 리소스 로드');
      const offlinePath = path.join(__dirname, '../../web/src/index.html');
      console.log('오프라인 파일 경로:', offlinePath);
      await mainWindow.loadFile(offlinePath);
    }
  } catch (error) {
    console.error('리소스 로드 실패:', error);
    // 오프라인 모드로 폴백
    try {
      const fallbackPath = path.join(__dirname, '../../web/src/index.html');
      console.log('폴백 파일 경로:', fallbackPath);
      await mainWindow.loadFile(fallbackPath);
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

// 파일 다이얼로그 IPC
ipcMain.handle('show-open-dialog', async (event, options) => {
  const { dialog } = await import('electron');
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// 폴더 다이얼로그 IPC
ipcMain.handle('show-save-dialog', async (event, options) => {
  const { dialog } = await import('electron');
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Decoy 프로그램 실행 IPC
ipcMain.handle('run-decoy', async (event, params) => {
  return new Promise((resolve) => {
    try {
      // Java 실행 파일 경로 설정
      const javaPath = 'java';
      const jarPath = path.join(__dirname, '../binaries/macos/decoy/PrecursorSwap.jar');
      const unimodPath = path.join(__dirname, '../binaries/macos/decoy/csv/unimod.csv');
      
      // 명령어 인수 구성 (PrecursorSwap.jar의 실제 사용법에 맞게)
      const args = [
        '-Xmx' + params.memory + 'G',  // 메모리 설정
        '-jar', jarPath,
        '-i', params.input_dir,        // 입력 MGF 파일 경로
        '-o', params.output_dir,       // 출력 MGF 파일 경로
        '-d', params.precursor_tolerance, // ppm tolerance
        '-r', params.random_seed       // random seed
      ];
      
      console.log('Decoy 실행 명령어:', javaPath, args.join(' '));
      
      // Java 프로세스 실행
      const javaProcess = spawn(javaPath, args, {
        cwd: path.dirname(jarPath),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let errorOutput = '';
      
      // 표준 출력 수집
      javaProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log('Decoy stdout:', data.toString());
      });
      
      // 에러 출력 수집
      javaProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Decoy stderr:', data.toString());
      });
      
      // 프로세스 종료 처리
      javaProcess.on('close', (code) => {
        console.log(`Decoy 프로세스 종료, 코드: ${code}`);
        
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            message: 'Decoy spectra generation completed successfully!'
          });
        } else {
          // Java 버전 오류 체크
          const isJavaVersionError = errorOutput.includes('UnsupportedClassVersionError') || 
                                   errorOutput.includes('java.lang.UnsupportedClassVersionError');
          
          resolve({
            success: false,
            java_version_error: isJavaVersionError,
            message: isJavaVersionError ? 
              'Java 버전이 호환되지 않습니다. Java 8 이상이 필요합니다.' : 
              'Decoy 프로그램 실행 중 오류가 발생했습니다.',
            error: errorOutput,
            output: output
          });
        }
      });
      
      // 프로세스 에러 처리
      javaProcess.on('error', (error) => {
        console.error('Decoy 프로세스 에러:', error);
        resolve({
          success: false,
          message: 'Java 프로그램을 실행할 수 없습니다. Java가 설치되어 있는지 확인해주세요.',
          error: error.message
        });
      });
      
    } catch (error) {
      console.error('Decoy 실행 중 예외 발생:', error);
      resolve({
        success: false,
        message: 'Decoy 프로그램 실행 중 예외가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
});

// HTML 파일 읽기 IPC
ipcMain.handle('read-html-file', async (event, filePath) => {
  try {
    const fullPath = path.join(__dirname, '../../web/src', filePath);
    const content = readFileSync(fullPath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.error('HTML 파일 읽기 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});
