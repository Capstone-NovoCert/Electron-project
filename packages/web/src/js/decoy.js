// 폴더 선택 기능 설정
function setupFolderSelectors() {
    const selectInputDirBtn = document.getElementById('select-input-dir');
    const selectOutputDirBtn = document.getElementById('select-output-dir');
    const inputDirInput = document.getElementById('input-dir');
    const outputDirInput = document.getElementById('output-dir');
    
    if (selectInputDirBtn && inputDirInput) {
        selectInputDirBtn.addEventListener('click', async () => {
            try {
                // Electron 환경
                if (window.electronAPI && window.electronAPI.showOpenDialog) {
                    const result = await window.electronAPI.showOpenDialog({
                        properties: ['openDirectory'],
                        title: '입력 폴더 선택'
                    });
                    
                    if (!result.canceled && result.filePaths.length > 0) {
                        inputDirInput.value = result.filePaths[0];
                    }
                } 
                // 웹 브라우저 환경
                else {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.webkitdirectory = true;

                    // Promise 기반으로 비동기 처리
                    const getPath = new Promise((resolve, reject) => {
                        input.addEventListener('change', (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                // 폴더 경로는 파일 경로에서 추출
                                const firstFile = e.target.files[0];
                                const relativePath = firstFile.webkitRelativePath;
                                const dir = relativePath.substring(0, relativePath.indexOf('/'));
                                resolve(dir);
                            } else {
                                resolve(null); // 선택 취소
                            }
                        });
                        input.addEventListener('error', reject);
                    });
                    
                    input.click();
                    const directoryPath = await getPath;

                    if (directoryPath) {
                        inputDirInput.value = directoryPath;
                    }
                }

            } catch (error) {
                console.error('폴더 선택 과정에서 오류가 발생했습니다:', error);
                alert(`오류가 발생했습니다.\n\n${error.message}`);
            }
        });
    } else {
        console.error("필요한 UI 요소를 찾을 수 없습니다: 'select-input-dir-btn' 또는 'input-dir-input'");
    }
    
    if (selectOutputDirBtn && outputDirInput) {
        selectOutputDirBtn.addEventListener('click', async () => {
            try {
                if (window.electronAPI && window.electronAPI.showOpenDialog) {
                    const result = await window.electronAPI.showOpenDialog({
                        properties: ['openDirectory'],
                        title: '출력 폴더 선택'
                    });
                    
                    if (!result.canceled && result.filePaths.length > 0) {
                        outputDirInput.value = result.filePaths[0];
                    }
                } else {
                    // 웹 브라우저에서는 기본 파일 입력 사용
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.webkitdirectory = true;
                    input.addEventListener('change', (e) => {
                        if (e.target.files.length > 0) {
                            const path = e.target.files[0].webkitRelativePath;
                            const dir = path.split('/')[0];
                            outputDirInput.value = dir;
                        }
                    });
                    input.click();
                }
            } catch (error) {
                console.error('폴더 선택 오류:', error);
                alert('폴더 선택 중 오류가 발생했습니다.');
            }
        });
    }
}

// Decoy 파이프라인 폼 제출
function submitDecoyForm() {
    
    const formData = {
        input_dir: document.getElementById('input-dir').value.trim(),
        output_dir: document.getElementById('output-dir').value.trim(),
        precursor_tolerance: document.getElementById('precursor-tolerance').value.trim(),
        memory: document.getElementById('memory').value.trim(),
        random_seed: document.getElementById('random-seed').value.trim()
    };
        
    // 상세한 유효성 검사
    const validationResult = validateDecoyForm(formData);
    
    if (!validationResult.isValid) {
        alert(`입력 오류:\n${validationResult.errors.join('\n')}`);
        return;
    }
    
    
    // 버튼 비활성화
    const startBtn = document.getElementById('start-btn');
    startBtn.disabled = true;
    startBtn.textContent = 'Running...';
    
    // 파라미터 자동 저장
    if (window.parameterManager) {
        window.parameterManager.saveFormParameters('decoy');
    }
    
    // Electron API 호출
    if (window.electronAPI && window.electronAPI.runDecoy) {
        window.electronAPI.runDecoy(formData)
        .then(data => {
            if (data.success) {
                alert('Decoy spectra generation completed successfully!');
                console.log('Output:', data.output);
            } else {
                // Java 버전 오류 특별 처리
                if (data.java_version_error) {
                    alert(`🚨 Java 버전 호환성 문제\n\n${data.message}\n\n${data.error}`);
                } else {
                    alert(`Error: ${data.message}`);
                    if (data.error) {
                        console.error('Error details:', data.error);
                    }
                }
            }
        })
        .catch(error => {
            console.error('Decoy 실행 오류:', error);
            alert('Decoy 프로그램 실행 중 오류가 발생했습니다.');
        })
        .finally(() => {
            // 버튼 복원
            startBtn.disabled = false;
            startBtn.textContent = 'Start';
        });
    } else {
        // Electron 환경이 아닌 경우 (웹 브라우저)
        alert('이 기능은 Electron 데스크톱 앱에서만 사용할 수 있습니다.');
        startBtn.disabled = false;
        startBtn.textContent = 'Start';
    }
}

// Decoy 폼 유효성 검사 (상세한 오류 메시지 반환)
function validateDecoyForm(formData) {
    
    const errors = [];
    const requiredFields = [
        { name: 'input_dir', display: '입력 디렉토리' },
        { name: 'output_dir', display: '출력 디렉토리' },
        { name: 'precursor_tolerance', display: 'Precursor tolerance' },
        { name: 'memory', display: 'Memory' },
        { name: 'random_seed', display: 'Random seed' }
    ];
    
    // 1. 필수 필드 검사
    for (const field of requiredFields) {
        if (!formData[field.name] || formData[field.name] === '') {
            errors.push(`• ${field.display}을(를) 입력해주세요.`);
        }
    }
    
    // 2. 숫자 필드 검증
    const numericFields = [
        { name: 'precursor_tolerance', display: 'Precursor tolerance' },
        { name: 'memory', display: 'Memory' },
        { name: 'random_seed', display: 'Random seed' }
    ];
    
    for (const field of numericFields) {
        if (formData[field.name] && isNaN(parseFloat(formData[field.name]))) {
            errors.push(`• ${field.display}은(는) 숫자여야 합니다.`);
        }
    }
    
    const result = {
        isValid: errors.length === 0,
        errors: errors
    };
    
    return result;
}

// Decoy 폼 이벤트 리스너 설정
function setupDecoyForm() {
    const startBtn = document.getElementById('start-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', submitDecoyForm);
        // 버튼을 항상 활성화
        startBtn.disabled = false;
    } else {
        console.error('Start button not found!');
    }
}