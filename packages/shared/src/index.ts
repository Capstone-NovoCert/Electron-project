// Shared utilities and types for Novo App

export interface AppConfig {
  name: string;
  version: string;
  isElectron: boolean;
  platform: string;
}

export const defaultConfig: AppConfig = {
  name: 'Novo App',
  version: '1.0.0',
  isElectron: false,
  platform: 'web'
};

export function getAppInfo(): AppConfig {
  return {
    ...defaultConfig,
    isElectron: false,
    platform: 'web'
  };
}

export function log(message: string, ...args: any[]): void {
  console.log(`[Novo App] ${message}`, ...args);
}
