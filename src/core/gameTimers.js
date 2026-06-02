// ========== src/core/gameTimers.js ==========
import { LEVEL_CONFIG } from '../config/gameConfig.js';
import { updateFeverHud } from '../combat/feverSystem.js';

let intervalId = null;

export function startGameTimers(gameState, onCheckLevelUp, onUpdateUI) {
    if (intervalId) clearInterval(intervalId);
    
    intervalId = setInterval(() => {
        if (!gameState || gameState.hp <= 0 || gameState.isPaused || gameState.isResearchOpen) return;
        
        if (gameState.isFeverActive) {
            gameState.feverDuration--;
            gameState.fever = Math.max(0, (gameState.feverDuration / 7) * 100);
            if (gameState.feverDuration <= 0) {
                gameState.isFeverActive = false;
                window.BASE_SPEED = 2.5;
            }
            updateFeverHud(gameState);
        }

        if (gameState.isShieldActive) {
            gameState.shieldTimer--;
            if (gameState.shieldTimer <= 0) gameState.isShieldActive = false;
        } else {
            let hpLoss = LEVEL_CONFIG?.[gameState.currentLevel]?.hpLoss || 2;
            if (!gameState.isFeverActive) {
                gameState.hp -= hpLoss;
            }
        }
        
        gameState.score += 1;
        if (onCheckLevelUp) onCheckLevelUp();
        if (onUpdateUI) onUpdateUI();
    }, 1000);
    
    return intervalId;
}

export function stopGameTimers() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}