// import { spawn, execSync } from 'child_process';
// import * as path from 'path';
// import { DenovoParams, DenovoResult } from '../types';

// /**
//  * De novo 프로그램 실행 서비스 (Casanovo)
//  */
// export class DenovoService {
//   /**
//    * Python 경로 자동 감지
//    */
//   private static findPythonPath(): string {
//     // 우선순위 경로들 시도
//     const pythonPaths = [
//       '/opt/homebrew/bin/python3', // Homebrew Python 3
//       '/usr/bin/python3',
//       '/usr/local/bin/python3',
//       'python3', // PATH에서 찾기
//       'python' // PATH에서 찾기
//     ];

//     for (const pythonPath of pythonPaths) {
//       try {
//         console.log(`Python 경로 테스트: ${pythonPath}`);
//         const version = execSync(`${pythonPath} --version`, { encoding: 'utf8' });
//         console.log('Python 경로 감지 성공:', pythonPath);
//         console.log('Python 버전:', version);
//         return pythonPath;
//       } catch (error) {
//         console.log(`Python 경로 실패: ${pythonPath}`);
//         continue;
//       }
//     }

//     console.warn('모든 Python 경로 실패, 기본 경로 사용');
//     return pythonPaths[0];
//   }

//   /**
//    * Casanovo 실행
//    */
//   static async run(params: DenovoParams): Promise<DenovoResult> {
//     return new Promise((resolve) => {
//       try {
//         // Python 실행 파일 경로 자동 감지
//         const pythonPath = this.findPythonPath();
        
//         // Casanovo 명령어 구성 (실제 Casanovo 명령어에 맞게 수정 필요)
//         const args = [
//           '-m', 'casanovo',
//           '--model', params.casanovo_model_path,
//           '--config', params.casanovo_yaml_path,
//           '--target-dir', params.target_spectra_dir,
//           '--decoy-dir', params.decoy_spectra_dir,
//           '--output-dir', path.join(params.target_spectra_dir, '../denovo_output')
//         ];
        
//         console.log('De novo 실행 명령어:', pythonPath, args.join(' '));
        
//         // Python 프로세스 실행
//         const pythonProcess = spawn(pythonPath, args, {
//           stdio: ['pipe', 'pipe', 'pipe']
//         });
        
//         let output = '';
//         let errorOutput = '';
        
//         // 표준 출력 수집
//         pythonProcess.stdout.on('data', (data) => {
//           output += data.toString();
//           console.log('De novo stdout:', data.toString());
//         });
        
//         // 에러 출력 수집
//         pythonProcess.stderr.on('data', (data) => {
//           errorOutput += data.toString();
//           console.error('De novo stderr:', data.toString());
//         });
        
//         // 프로세스 종료 처리
//         pythonProcess.on('close', (code) => {
//           console.log(`De novo 프로세스 종료, 코드: ${code}`);
          
//           if (code === 0) {
//             resolve({
//               success: true,
//               output: output,
//               message: 'De novo peptide sequencing completed successfully!'
//             });
//           } else {
//             // Python 모듈 오류 체크
//             const isModuleError = errorOutput.includes('ModuleNotFoundError') || 
//                                  errorOutput.includes('ImportError');
            
//             resolve({
//               success: false,
//               python_module_error: isModuleError,
//               message: isModuleError ? 
//                 'Casanovo 모듈을 찾을 수 없습니다. pip install casanovo를 실행해주세요.' : 
//                 'De novo 프로그램 실행 중 오류가 발생했습니다.',
//               error: errorOutput,
//               output: output
//             });
//           }
//         });
        
//         // 프로세스 에러 처리
//         pythonProcess.on('error', (error) => {
//           console.error('De novo 프로세스 에러:', error);
//           resolve({
//             success: false,
//             message: 'Python 프로그램을 실행할 수 없습니다. Python이 설치되어 있는지 확인해주세요.',
//             error: error.message
//           });
//         });
        
//       } catch (error) {
//         console.error('De novo 실행 중 예외 발생:', error);
//         resolve({
//           success: false,
//           message: 'De novo 프로그램 실행 중 예외가 발생했습니다.',
//           error: error instanceof Error ? error.message : String(error)
//         });
//       }
//     });
//   }
// }

// // 기존 함수와의 호환성을 위한 래퍼
// export async function runDenovoProgram(params: DenovoParams): Promise<DenovoResult> {
//   return await DenovoService.run(params);
// }
