// ========== src/combat/comboSystem.js ==========
import { COMBAT_CONFIG } from '../config/gameConfig.js';
import { updateFeverHud } from './feverSystem.js';  // ← добавить эту строку
let comboTimer = null;

export function handleHitCombo(gameState, onUpdateUI) {
    if (!gameState) return;

    clearTimeout(comboTimer);
    gameState.combo++;

    const oldRank = gameState.comboRank;
    const c = gameState.combo;

    if (c >= 25) gameState.comboRank = 'S';
    else if (c >= 15) gameState.comboRank = 'A';
    else if (c >= 8) gameState.comboRank = 'B';
    else if (c >= 3) gameState.comboRank = 'C';
    else gameState.comboRank = 'D';

    const maxFever = COMBAT_CONFIG?.feverMax || 100;
    const feverGain = 2.5;
    
    if (!gameState.isFeverActive) {
    gameState.fever = Math.min(maxFever, gameState.fever + feverGain);
    
    // 👇 ЭТУ СТРОКУ ДОБАВЛЯЕМ
    updateFeverHud(gameState);
    
    if (gameState.fever >= maxFever) {
        const ultBtn = document.getElementById('ult-btn');
        if (ultBtn) {
            ultBtn.classList.add('ready');
            ultBtn.innerHTML = '<span>Жми!</span>';
        }
    }
}
    if (!gameState.isFeverActive) {
        gameState.fever = Math.min(maxFever, gameState.fever + feverGain);
        
        if (gameState.fever >= maxFever) {
            const ultBtn = document.getElementById('ult-btn');
            if (ultBtn) {
                ultBtn.classList.add('ready');
                ultBtn.innerHTML = '<span>Жми!</span>';
            }
        }
    }

    updateComboHud(gameState, oldRank !== gameState.comboRank);
    if (onUpdateUI) onUpdateUI();

    const timeout = COMBAT_CONFIG?.comboTimeout || 3500;
    comboTimer = setTimeout(() => {
        resetCombo(gameState);
        if (onUpdateUI) onUpdateUI();
    }, timeout);
    
    return gameState.fever;
}

export function resetCombo(gameState) {
    if (!gameState) return;
    gameState.combo = 0;
    gameState.comboRank = 'D';
    const comboHud = document.getElementById('combo-hud');
    if (comboHud) comboHud.classList.add('hidden');
}

export function getComboMultiplier(gameState) {
    const rank = gameState?.comboRank;
    if (rank === 'C') return 1.2;
    if (rank === 'B') return 1.5;
    if (rank === 'A') return 1.8;
    if (rank === 'S') return 2.5;
    return 1;
}

// ВАЖНО: функция принимает gameState как ПЕРВЫЙ параметр
function updateComboHud(gameState, isRankUp) {
    const comboHud = document.getElementById('combo-hud');
    const rankEl = document.getElementById('combo-rank');
    const countEl = document.getElementById('combo-count');

    if (!comboHud || !rankEl || !countEl) return;

    comboHud.classList.remove('hidden');
    countEl.textContent = `x${gameState.combo}`;
    
    rankEl.textContent = gameState.comboRank;
    rankEl.className = `combo-rank rank-${gameState.comboRank.toLowerCase()}`;

    if (isRankUp) {
        rankEl.classList.add('rank-up-anim');
        setTimeout(() => rankEl.classList.remove('rank-up-anim'), 200);
    }
}