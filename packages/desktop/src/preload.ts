import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
  checkOnlineStatus: () => ipcRenderer.invoke('check-online-status'),
  reloadResources: () => ipcRenderer.invoke('reload-resources'),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  runDecoy: (params: any) => ipcRenderer.invoke('run-decoy', params),
  readHtmlFile: (filePath: string) => ipcRenderer.invoke('read-html-file', filePath),
  // 파이프라인 관련 API
  getPipelineStatus: (executionId: string) => ipcRenderer.invoke('get-pipeline-status', executionId),
  getAllPipelines: () => ipcRenderer.invoke('get-all-pipelines'),
  getPipelinesByType: (pipelineType: string) => ipcRenderer.invoke('get-pipelines-by-type', pipelineType),
  deletePipeline: (executionId: string) => ipcRenderer.invoke('delete-pipeline', executionId),
  getPipelineStats: () => ipcRenderer.invoke('get-pipeline-stats'),
  getLastPipelineParams: (pipelineType: string) => ipcRenderer.invoke('get-last-pipeline-params', pipelineType),
  platform: process.platform,
  isElectron: true,
  isDev: process.env.NODE_ENV === 'development'
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
