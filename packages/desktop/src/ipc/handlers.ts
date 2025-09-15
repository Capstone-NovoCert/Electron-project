import { ipcMain } from 'electron';
import { app } from 'electron';
import { dialog } from 'electron';
import { PipelineController } from '../controllers/PipelineController.js';
import { checkOnlineStatus } from '../utils/network.js';
import { loadResources, getMainWindow } from '../window/window-manager.js';
import { readHtmlFile } from '../utils/file.js';

/**
 * IPC 핸들러 등록
 */
export function registerIpcHandlers(): void {
  // 앱 버전 조회
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // 메시지 박스 표시
  ipcMain.handle('show-message-box', async (event, options) => {
    const result = await dialog.showMessageBox(getMainWindow()!, options);
    return result;
  });

  // 온라인 상태 확인
  ipcMain.handle('check-online-status', async () => {
    return await checkOnlineStatus();
  });

  // 리소스 다시 로드
  ipcMain.handle('reload-resources', async () => {
    if (getMainWindow()) {
      await loadResources();
    }
  });

  // 파일 다이얼로그
  ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(getMainWindow()!, options);
    return result;
  });

  // 폴더 다이얼로그
  ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(getMainWindow()!, options);
    return result;
  });

  // HTML 파일 읽기
  ipcMain.handle('read-html-file', async (event, filePath) => {
    return await readHtmlFile(filePath);
  });

  // === 파이프라인 관련 IPC 핸들러 ===

  // Decoy 파이프라인 실행
  ipcMain.handle('run-decoy', async (event, params) => {
    return await PipelineController.runDecoy(params);
  });

  // 파이프라인 실행 상태 조회
  ipcMain.handle('get-pipeline-status', async (event, executionId) => {
    return await PipelineController.getExecutionStatus(executionId);
  });

  // 모든 파이프라인 실행 기록 조회
  ipcMain.handle('get-all-pipelines', async () => {
    return await PipelineController.getAllExecutions();
  });

  // 특정 타입의 파이프라인 실행 기록 조회
  ipcMain.handle('get-pipelines-by-type', async (event, pipelineType) => {
    return await PipelineController.getExecutionsByType(pipelineType);
  });

  // 파이프라인 실행 기록 삭제
  ipcMain.handle('delete-pipeline', async (event, executionId) => {
    return await PipelineController.deleteExecution(executionId);
  });

  // 파이프라인 실행 통계 조회
  ipcMain.handle('get-pipeline-stats', async () => {
    return await PipelineController.getExecutionStats();
  });

  // 특정 타입의 마지막 실행 파라미터 조회
  ipcMain.handle('get-last-pipeline-params', async (event, pipelineType) => {
    return await PipelineController.getLastExecutionParams(pipelineType);
  });
}
