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
                
                // ❌ Убираем старый alert
                // alert(`💀 ИГРА ОКОНЧЕНА!\nВы набрали очков: ${gameState.score}`);
                
                // ✅ Показываем красивый экран Game Over
                if (UI && typeof UI.showGameOver === 'function') {
                    UI.showGameOver(gameState.score, gameState.gold, gameState.currentLevel);
                }
                
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