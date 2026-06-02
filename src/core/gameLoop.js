// ========== src/core/gameLoop.js ==========
import Engine from '../engine.js';

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
                setTimeout(() => {
                    alert(`💀 ИГРА ОКОНЧЕНА!\nВы набрали очков: ${gameState.score}`);
                    if (onResetGame) onResetGame();
                }, 10);
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