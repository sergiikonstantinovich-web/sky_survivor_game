// ========== src/core/gameLoop.js ==========
import Engine from '../engine.js';
import UI from '../ui.js';

let animationFrameId = null;

export function startGameLoop(gameState, onResetGame, onUpdateUI) {
    function loop() {
        if (!gameState) {
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        if (gameState.hp <= 0) {
            if (!gameState.isPaused) {
                gameState.isPaused = true;
                
                // Показываем экран Game Over
                if (UI && typeof UI.showGameOver === 'function') {
                    UI.showGameOver(gameState.score, gameState.gold, gameState.currentLevel);
                }
                
                // 👇 РЕКЛАМА ЧЕРЕЗ 0.5 СЕКУНДЫ ПОСЛЕ GAME OVER
                setTimeout(() => {
                    if (UI && typeof UI.showYandexAd === 'function') {
                        UI.showYandexAd();
                    }
                }, 500);
                
                if (onResetGame) onResetGame();
            }
            Engine.render();
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        Engine.render();
        animationFrameId = requestAnimationFrame(loop);
    }
    
    loop();
    return animationFrameId;
}

export function stopGameLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}