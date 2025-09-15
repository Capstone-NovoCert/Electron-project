// 폴더 선택 기능 설정
function setupDenovoFolderSelectors() {
    const targetSpectraDirBtn = document.getElementById('target-spectra-dir');
    const decoySpectraDirBtn = document.getElementById('decoy-spectra-dir');
    const casanovoYamlBtn = document.getElementById('casanovo-yaml-path');
    const casanovoModelBtn = document.getElementById('casanovo-model-path');
    
    const targetSpectraDirInput = document.getElementById('target-spectra-dir');
    const decoySpectraDirInput = document.getElementById('decoy-spectra-dir');
    const casanovoYamlInput = document.getElementById('casanovo-yaml-path');
    const casanovoModelInput = document.getElementById('casanovo-model-path');
    
    // Target spectra 디렉토리 선택
    if (targetSpectraDirBtn && targetSpectraDirInput) {
        targetSpectraDirBtn.addEventListener('click', async () => {
            try {
                if (window.electronAPI && window.electronAPI.showOpenDialog) {
                    const result = await window.electronAPI.showOpenDialog({
                        properties: ['openDirectory'],
                        title: 'Target spectra 디렉토리 선택'
                    });
                    
                    if (!result.canceled && result.filePaths.length > 0) {
                        targetSpectraDirInput.value = result.filePaths[0];
                    }
                }
            } catch (error) {
                console.error('Target spectra 디렉토리 선택 오류:', error);
                alert('디렉토리 선택 중 오류가 발생했습니다.');
            }
        });
    }
    
    // Decoy spectra 디렉토리 선택
    if (decoySpectraDirBtn && decoySpectraDirInput) {
        decoySpectraDirBtn.addEventListener('click', async () => {
            try {
                if (window.electronAPI && window.electronAPI.showOpenDialog) {
                    const result = await window.electronAPI.showOpenDialog({
                        properties: ['openDirectory'],
                        title: 'Decoy spectra 디렉토리 선택'
                    });
                    
                    if (!result.canceled && result.filePaths.length > 0) {
                        decoySpectraDirInput.value = result.filePaths[0];
                    }
                }
            } catch (error) {
                console.error('Decoy spectra 디렉토리 선택 오류:', error);
                alert('디렉토리 선택 중 오류가 발생했습니다.');
            }
        });
    }
    
    // Casanovo YAML 파일 선택
    if (casanovoYamlBtn && casanovoYamlInput) {
        casanovoYamlBtn.addEventListener('click', async () => {
            try {
                if (window.electronAPI && window.electronAPI.showOpenDialog) {
                    const result = await window.electronAPI.showOpenDialog({
                        properties: ['openFile'],
                        filters: [
                            { name: 'YAML Files', extensions: ['yaml', 'yml'] },
                            { name: 'All Files', extensions: ['*'] }
                        ],
                        title: 'Casanovo YAML 파일 선택'
                    });
                    
                    if (!result.canceled && result.filePaths.length > 0) {
                        casanovoYamlInput.value = result.filePaths[0];
                    }
                }
            } catch (error) {
                console.error('Casanovo YAML 파일 선택 오류:', error);
                alert('파일 선택 중 오류가 발생했습니다.');
            }
        });
    }
    
    // Casanovo model 파일 선택
    if (casanovoModelBtn && casanovoModelInput) {
        casanovoModelBtn.addEventListener('click', async () => {
            try {
                if (window.electronAPI && window.electronAPI.showOpenDialog) {
                    const result = await window.electronAPI.showOpenDialog({
                        properties: ['openFile'],
                        filters: [
                            { name: 'Model Files', extensions: ['pth', 'pt', 'model'] },
                            { name: 'All Files', extensions: ['*'] }
                        ],
                        title: 'Casanovo model 파일 선택'
                    });
                    
                    if (!result.canceled && result.filePaths.length > 0) {
                        casanovoModelInput.value = result.filePaths[0];
                    }
                }
            } catch (error) {
                console.error('Casanovo model 파일 선택 오류:', error);
                alert('파일 선택 중 오류가 발생했습니다.');
            }
        });
    }
}

// De novo 파이프라인 폼 제출 (임시로 구현만)
function submitDenovoForm() {
    const formData = {
        target_spectra_dir: document.getElementById('target-spectra-dir').value.trim(),
        decoy_spectra_dir: document.getElementById('decoy-spectra-dir').value.trim(),
        casanovo_yaml_path: document.getElementById('casanovo-yaml-path').value.trim(),
        casanovo_model_path: document.getElementById('casanovo-model-path').value.trim()
    };
        
    // 상세한 유효성 검사
    const validationResult = validateDenovoForm(formData);
    
    if (!validationResult.isValid) {
        alert(`입력 오류:\n${validationResult.errors.join('\n')}`);
        return;
    }
    
    // 임시로 성공 메시지만 표시 (실제 실행 로직은 나중에 구현)
    alert('De novo 실행 기능은 아직 구현 중입니다.\n입력된 파라미터들이 올바르게 설정되었습니다.');
    
    // 파라미터 자동 저장
    if (window.parameterManager) {
        window.parameterManager.saveFormParameters('denovo');
    }
    
    console.log('De novo 폼 데이터:', formData);
}

// De novo 폼 유효성 검사 (상세한 오류 메시지 반환)
function validateDenovoForm(formData) {
    const errors = [];
    const requiredFields = [
        { name: 'target_spectra_dir', display: 'Target spectra 디렉토리' },
        { name: 'decoy_spectra_dir', display: 'Decoy spectra 디렉토리' },
        { name: 'casanovo_yaml_path', display: 'Casanovo YAML 파일 경로' },
        { name: 'casanovo_model_path', display: 'Casanovo model 파일 경로' }
    ];
    
    // 1. 필수 필드 검사
    for (const field of requiredFields) {
        if (!formData[field.name] || formData[field.name] === '') {
            errors.push(`• ${field.display}을(를) 입력해주세요.`);
        }
    }
    
    const result = {
        isValid: errors.length === 0,
        errors: errors
    };
    
    return result;
}

// 이전 단계(Decoy)의 마지막 결과를 De novo 입력으로 자동 설정
async function loadPreviousStepResult() {
    try {
        if (window.electronAPI && window.electronAPI.getLastPipelineParams) {
            // 1. 먼저 denovo 파라미터가 있는지 확인
            const denovoParams = await window.electronAPI.getLastPipelineParams('denovo');
            
            if (denovoParams) {
                console.log('마지막 De novo 파라미터 로드:', denovoParams);
                applyDenovoParams(denovoParams);
                return;
            }
            
            // 2. denovo 파라미터가 없다면 decoy 결과를 가져와서 사용
            const decoyParams = await window.electronAPI.getLastPipelineParams('decoy');
            
            if (decoyParams) {
                console.log('이전 Decoy 결과를 De novo 입력으로 사용:', decoyParams);
                
                // Decoy의 output_dir을 target_spectra_dir로 설정
                const targetSpectraDirInput = document.getElementById('target-spectra-dir');
                if (targetSpectraDirInput && decoyParams.output_dir) {
                    targetSpectraDirInput.value = decoyParams.output_dir;
                    console.log('Target spectra dir 설정:', decoyParams.output_dir);
                }
                
                // Decoy의 output_dir을 decoy_spectra_dir로도 설정 (Decoy 스펙트라가 생성된 곳)
                const decoySpectraDirInput = document.getElementById('decoy-spectra-dir');
                if (decoySpectraDirInput && decoyParams.output_dir) {
                    decoySpectraDirInput.value = decoyParams.output_dir;
                    console.log('Decoy spectra dir 설정:', decoyParams.output_dir);
                }
                
                console.log('✅ 이전 Decoy 결과를 De novo 입력으로 적용 완료');
            } else {
                console.log('❌ 저장된 Decoy 파라미터가 없습니다.');
            }
        } else {
            console.log('Electron API를 사용할 수 없습니다. 로컬 스토리지에서 파라미터를 로드합니다.');
            
            // 로컬 스토리지에서 파라미터 로드 (기존 방식)
            if (window.parameterManager) {
                await window.parameterManager.loadAllParameters();
                window.parameterManager.applyParametersToForm('denovo');
            }
        }
    } catch (error) {
        console.error('이전 단계 결과 로드 실패:', error);
    }
}

// De novo 파라미터를 폼에 적용
function applyDenovoParams(params) {
    const targetSpectraDirInput = document.getElementById('target-spectra-dir');
    const decoySpectraDirInput = document.getElementById('decoy-spectra-dir');
    const casanovoYamlInput = document.getElementById('casanovo-yaml-path');
    const casanovoModelInput = document.getElementById('casanovo-model-path');
    
    if (targetSpectraDirInput) targetSpectraDirInput.value = params.target_spectra_dir || '';
    if (decoySpectraDirInput) decoySpectraDirInput.value = params.decoy_spectra_dir || '';
    if (casanovoYamlInput) casanovoYamlInput.value = params.casanovo_yaml_path || '';
    if (casanovoModelInput) casanovoModelInput.value = params.casanovo_model_path || '';
    
    console.log('De novo 폼에 파라미터 적용 완료');
}

// Download Casanovo parameters .yaml file 버튼 기능
function setupDownloadButton() {
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            try {
                // 기본 Casanovo YAML 설정을 다운로드
                const defaultYamlContent = `# Casanovo Configuration
model:
  model_path: "path/to/your/model.pth"
  num_workers: 4

data:
  target_spectra_dir: ""
  decoy_spectra_dir: ""
  output_dir: ""

prediction:
  batch_size: 32
  n_beams: 5
  max_length: 50

output:
  format: "csv"
  include_confidence: true
`;

                // 파일 다운로드
                const blob = new Blob([defaultYamlContent], { type: 'text/yaml' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'casanovo-config.yaml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                console.log('Casanovo YAML 설정 파일 다운로드 완료');
            } catch (error) {
                console.error('YAML 파일 다운로드 오류:', error);
                alert('YAML 파일 다운로드 중 오류가 발생했습니다.');
            }
        });
    }
}

// De novo 폼 이벤트 리스너 설정
function setupDenovoForm() {
    const startBtn = document.getElementById('start-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', submitDenovoForm);
        // 버튼을 항상 활성화
        startBtn.disabled = false;
    } else {
        console.error('Start button not found!');
    }
    
    // 폴더/파일 선택 기능 설정
    setupDenovoFolderSelectors();
    
    // Download 버튼 설정
    setupDownloadButton();
    
    // 이전 단계 결과 로드
    loadPreviousStepResult();
}
