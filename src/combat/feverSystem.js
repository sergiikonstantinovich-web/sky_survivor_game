// ========== src/combat/feverSystem.js ==========
import Engine from '../engine.js';
import { calculateFeverDamage, getFeverKillTier } from '../core/applyUpgrades.js';

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
    
    // УЛЬТИМЕЙТ ОЧИСТКА — улучшенная версия
    if (gameState.items && gameState.items.length > 0) {
        const feverDamage = calculateFeverDamage(gameState, 10);
        const maxKillTier = getFeverKillTier(gameState);
        
        gameState.items = gameState.items.filter(item => {
            // Проверяем, является ли предмет мобом
            const isMob = item.type?.isMob === true || 
                          item.hp !== undefined ||
                          (item.type?.icon === '👾') || (item.type?.icon === '😈') ||
                          (item.type?.icon === '👻') || (item.type?.icon === '🧟') ||
                          (item.type?.icon === '🐉') || (item.type?.icon === '🦇') ||
                          (item.type?.icon === '👁️') || (item.type?.icon === '🤖') ||
                          (item.type?.icon === '💀') || (item.type?.icon === '👑');
            
            if (isMob) {
                const mobTier = item.mobTier || 10;
                
                // Если ульта может убить моба этого tier — одним ударом
                if (mobTier <= maxKillTier) {
                    item.hp = 0;
                    const killText = `💀 УБИТ 💀 (${mobTier})`;
                    Engine.createFloatingText(item.x, item.y, killText, true);
                } else {
                    item.hp -= feverDamage;
                    Engine.createFloatingText(item.x, item.y, `-${feverDamage} 🔥`, true);
                }
                
                if (item.hp <= 0) {
                    let comboMult = 1;
                    if (gameState.comboRank === 'C') comboMult = 1.2;
                    else if (gameState.comboRank === 'B') comboMult = 1.5;
                    else if (gameState.comboRank === 'A') comboMult = 1.8;
                    else if (gameState.comboRank === 'S') comboMult = 2.5;
                    else if (gameState.comboRank === 'SS') comboMult = 3.0;
                    
                    const baseReward = Math.floor(mobTier * 5);
                    gameState.score += Math.floor(baseReward * comboMult);
                    gameState.gold += 120;
                    return false; // удаляем моба
                }
                return true; // оставляем, но хп уменьшили
            }
            return true; // не моб — оставляем
        });
        if (onCheckLevelUp) onCheckLevelUp();
    }
    
    Engine.triggerScreenShake();
    Engine.createFloatingText(window.innerWidth / 2, window.innerHeight / 2, "🔥 АННИГИЛЯЦИЯ!", true);
    if (onUpdateUI) onUpdateUI();
}