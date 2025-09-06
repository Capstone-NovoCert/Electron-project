// Main JavaScript file for Novo App
import '../css/style.css';
import '../css/service.css';

console.log('Novo App loaded successfully!');

// DOM elements
const testBtn = document.getElementById('test-btn');
const statusDiv = document.getElementById('status');

// Create status div if it doesn't exist
if (!statusDiv) {
    const statusElement = document.createElement('div');
    statusElement.id = 'status';
    statusElement.style.cssText = 'margin: 10px 0; padding: 10px; border-radius: 4px; background: #f0f0f0;';
    document.querySelector('main section').appendChild(statusElement);
}

// Check if running in Electron
const isElectron = window.electronAPI && window.electronAPI.isElectron;

// Update status display
function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.background = type === 'error' ? '#ffebee' : 
                                       type === 'success' ? '#e8f5e8' : '#f0f0f0';
        statusElement.style.color = type === 'error' ? '#c62828' : 
                                   type === 'success' ? '#2e7d32' : '#333';
    }
}

// Check online status
async function checkOnlineStatus() {
    if (isElectron && window.electronAPI.checkOnlineStatus) {
        try {
            const isOnline = await window.electronAPI.checkOnlineStatus();
            updateStatus(`현재 모드: ${isOnline ? '온라인 (localhost:3000)' : '오프라인 (로컬 파일)'}`, 
                        isOnline ? 'success' : 'info');
            return isOnline;
        } catch (error) {
            console.error('온라인 상태 확인 실패:', error);
            updateStatus('온라인 상태 확인 실패', 'error');
            return false;
        }
    } else {
        updateStatus('웹 브라우저 모드', 'info');
        return true;
    }
}

// Event listeners
testBtn.addEventListener('click', async () => {
    const isOnline = await checkOnlineStatus();
    const message = isOnline ? 
        'Hello from Novo App! 온라인 모드에서 실행 중입니다.' : 
        'Hello from Novo App! 오프라인 모드에서 실행 중입니다.';
    
    alert(message);
    console.log('Test button clicked');
});

// Reload resources button (Electron only)
if (isElectron && window.electronAPI.reloadResources) {
    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = '리소스 다시 로드';
    reloadBtn.style.cssText = 'margin-left: 10px; background: #e74c3c;';
    reloadBtn.addEventListener('click', async () => {
        try {
            await window.electronAPI.reloadResources();
            updateStatus('리소스 다시 로드 중...', 'info');
        } catch (error) {
            console.error('리소스 다시 로드 실패:', error);
            updateStatus('리소스 다시 로드 실패', 'error');
        }
    });
    testBtn.parentNode.appendChild(reloadBtn);
}

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('main section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Service section is active by default
    const serviceSection = document.getElementById('service');
    if (serviceSection) {
        serviceSection.classList.add('active');
    }
}

// Utility functions
function showMessage(message) {
    console.log(message);
    updateStatus(message);
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    showMessage('Novo App 초기화 중...');
    await checkOnlineStatus();
    initNavigation();
});

// Export for potential use in other modules
export { showMessage, checkOnlineStatus };
