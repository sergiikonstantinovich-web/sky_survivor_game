// ========== src/combat/feverSystem.js ==========
import Engine from '../engine.js';

export function updateFeverHud(gameState) {
    const bar = document.getElementById('fever-bar-fill');
    if (bar) bar.style.width = `${gameState.fever}%`;
    
    if (gameState.fever < 100) {
        const ultBtn = document.getElementById('ult-btn');
        if (ultBtn) {
            ultBtn.classList.remove('ready');
            ultBtn.innerHTML = '';
        }
    }
}

export function activateFeverMode(gameState, onCheckLevelUp, onUpdateUI) {
    if (!gameState || gameState.isFeverActive) return;
    
    console.log('🔥 АКТИВАЦИЯ УЛЬТЫ!');
    
    gameState.isFeverActive = true;
    gameState.feverDuration = 7;
    gameState.fever = 0;
    window.BASE_SPEED = 2.5;
    
    const ultBtn = document.getElementById('ult-btn');
    if (ultBtn) {
        ultBtn.classList.remove('ready');
        ultBtn.innerHTML = '';
    }
    
    updateFeverHud(gameState);
    
    // Белая вспышка
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:9999;pointer-events:none;transition:opacity 0.4s ease-out';
    document.body.appendChild(flash);
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 400);
    }, 30);
    
    // Урон всем мобам
    if (gameState.items && gameState.items.length > 0) {
        let killed = false;
        gameState.items = gameState.items.filter(item => {
            if (item.hp !== undefined) {
                item.hp -= 10;
                Engine.createFloatingText(item.x, item.y, "-10 🔥", true);
                
                if (item.hp <= 0) {
                    let comboMult = 1;
                    if (gameState.comboRank === 'C') comboMult = 1.2;
                    else if (gameState.comboRank === 'B') comboMult = 1.5;
                    else if (gameState.comboRank === 'A') comboMult = 1.8;
                    else if (gameState.comboRank === 'S') comboMult = 2.5;
                    
                    const isHeavy = (item.type && item.type.icon === '😈');
                    gameState.score += Math.floor((isHeavy ? 200 : 100) * comboMult);
                    gameState.gold += 120;
                    killed = true;
                    return false;
                }
                return true;
            }
            return true;
        });
        if (killed && onCheckLevelUp) onCheckLevelUp();
    }
    
    Engine.triggerScreenShake();
    Engine.createFloatingText(window.innerWidth / 2, window.innerHeight / 2, "🔥 АННИГИЛЯЦИЯ!", true);
    if (onUpdateUI) onUpdateUI();
}