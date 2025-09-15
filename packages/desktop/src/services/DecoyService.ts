import { spawn, execSync } from 'child_process';
import * as path from 'path';
import { DecoyParams, DecoyResult } from '../types';

/**
 * Decoy 프로그램 실행 서비스
 */
export class DecoyService {
  /**
   * Java 경로 자동 감지
   */
  private static findJavaPath(): string {
    // 우선순위 경로들 시도
    const javaPaths = [
      '/opt/homebrew/opt/openjdk@21/bin/java', // Homebrew Java 21 (우선순위)
      '/opt/homebrew/opt/openjdk@17/bin/java',
      '/opt/homebrew/opt/openjdk@11/bin/java',
      '/opt/homebrew/opt/openjdk/bin/java',
      '/usr/bin/java',
      'java' // PATH에서 찾기
    ];

    for (const javaPath of javaPaths) {
      try {
        console.log(`Java 경로 테스트: ${javaPath}`);
        const version = execSync(`${javaPath} -version`, { encoding: 'utf8' });
        console.log('Java 경로 감지 성공:', javaPath);
        console.log('Java 버전:', version);
        return javaPath;
      } catch (error) {
        console.log(`Java 경로 실패: ${javaPath}`);
        continue;
      }
    }

    console.warn('모든 Java 경로 실패, 기본 경로 사용');
    return javaPaths[0];
  }

  static async run(params: DecoyParams): Promise<DecoyResult> {
    return new Promise((resolve) => {
      try {
        // Java 실행 파일 경로 자동 감지
        const javaPath = this.findJavaPath();
        const jarPath = path.join(__dirname, '../../binaries/macos/decoy/PrecursorSwap.jar');
        
        // 명령어 인수 구성
        const args = [
          '-Xmx' + params.memory + 'G',
          '-jar', jarPath,
          '-i', params.input_dir,
          '-o', params.output_dir,
          '-d', params.precursor_tolerance,
          '-r', params.random_seed
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
  }
}

// 기존 함수와의 호환성을 위한 래퍼
export async function runDecoyProgram(params: DecoyParams): Promise<DecoyResult> {
  return await DecoyService.run(params);
}
