// ========== src/ui/gameUI.js ==========
import UI from '../ui.js';

export function togglePause(gameState) {
    if (!gameState || gameState.hp <= 0 || gameState.isResearchOpen) return;
    
    gameState.isPaused = !gameState.isPaused;
    const pauseScreen = document.getElementById('pause-screen');
    const pauseBtn = document.getElementById('pause-btn');
    
    if (gameState.isPaused) {
        if (pauseScreen) pauseScreen.classList.remove('hidden');
        if (pauseBtn) pauseBtn.textContent = '▶️';
    } else {
        if (pauseScreen) pauseScreen.classList.add('hidden');
        if (pauseBtn) pauseBtn.textContent = '⏸️';
    }
    UI.update();
}

export function toggleResearch(gameState) {
    if (!gameState || gameState.hp <= 0 || gameState.isPaused) return;
    
    gameState.isResearchOpen = !gameState.isResearchOpen;
    const researchScreen = document.getElementById('research-screen');
    
    if (gameState.isResearchOpen) {
        if (researchScreen) researchScreen.classList.remove('hidden');
    } else {
        if (researchScreen) researchScreen.classList.add('hidden');
    }
    UI.update();
}