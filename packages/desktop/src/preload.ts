import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
  checkOnlineStatus: () => ipcRenderer.invoke('check-online-status'),
  reloadResources: () => ipcRenderer.invoke('reload-resources'),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  runDecoy: (params: any) => ipcRenderer.invoke('run-decoy', params),
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
