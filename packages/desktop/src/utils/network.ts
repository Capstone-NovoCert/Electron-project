import { net } from 'electron';

/**
 * 온라인 상태 확인
 * @returns Promise<boolean> - 온라인 상태 여부
 */
export async function checkOnlineStatus(): Promise<boolean> {
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
    console.error('네트워크 상태 확인 실패:', error);
    return false;
  }
}
