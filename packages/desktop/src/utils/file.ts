import { readFileSync } from 'fs';
import * as path from 'path';

/**
 * HTML 파일 읽기
 * @param filePath - 읽을 파일 경로
 * @returns Promise<FileReadResult> - 파일 읽기 결과
 */
export async function readHtmlFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const fullPath = path.join(__dirname, '../../../web/src', filePath);
    const content = readFileSync(fullPath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    console.error('HTML 파일 읽기 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
