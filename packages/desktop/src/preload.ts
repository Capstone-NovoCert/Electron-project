import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),
  checkOnlineStatus: () => ipcRenderer.invoke('check-online-status'),
  reloadResources: () => ipcRenderer.invoke('reload-resources'),
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
