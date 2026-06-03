// ========== src/combat/comboSystem.js ==========
import { COMBAT_CONFIG } from '../config/gameConfig.js';
import { updateFeverHud } from './feverSystem.js';

let comboTimer = null;

// Показывает кнопку аптечки при достижении S ранга
function showEmergencyHeal() {
    const healBtn = document.getElementById('emergency-heal');
    if (healBtn) {
        healBtn.classList.remove('hidden');
        healBtn.style.animation = 'none';
        setTimeout(() => {
            healBtn.style.animation = 'healPulse 0.5s ease-out';
        }, 10);
    }
}

export function hideEmergencyHeal() {
    const healBtn = document.getElementById('emergency-heal');
    if (healBtn) {
        healBtn.classList.add('hidden');
    }
}

// Функции для слоумо
function showSlowmoButton() {
    const btn = document.getElementById('slowmo-btn');
    if (btn) {
        btn.classList.remove('hidden');
        btn.style.animation = 'none';
        setTimeout(() => {
            btn.style.animation = 'slowmoPulse 0.5s ease-out';
        }, 10);
    }
}

export function hideSlowmoButton() {
    const btn = document.getElementById('slowmo-btn');
    if (btn) {
        btn.classList.add('hidden');
    }
}

export function showSlowMotionRing() {
    let slowmoRing = document.getElementById('slowmo-ring');
    if (!slowmoRing) {
        slowmoRing = document.createElement('div');
        slowmoRing.id = 'slowmo-ring';
        slowmoRing.className = 'slowmo-ring';
        slowmoRing.innerHTML = `
            <div class="blur-edges"></div>
            <div class="distortion"></div>
            <div class="vignette"></div>
            <div class="perspective"></div>
        `;
        document.body.appendChild(slowmoRing);
    }
    slowmoRing.classList.add('active');
}

export function hideSlowMotionRing() {
    const slowmoRing = document.getElementById('slowmo-ring');
    if (slowmoRing) {
        slowmoRing.classList.remove('active');
    }
}

export function handleHitCombo(gameState, onUpdateUI) {
    if (!gameState) return;

    clearTimeout(comboTimer);
    gameState.combo++;

    const oldRank = gameState.comboRank;
    const c = gameState.combo;

    if (c >= 35) gameState.comboRank = 'SS';
    else if (c >= 25) gameState.comboRank = 'S';
    else if (c >= 15) gameState.comboRank = 'A';
    else if (c >= 8) gameState.comboRank = 'B';
    else if (c >= 3) gameState.comboRank = 'C';
    else gameState.comboRank = 'D';

    // Показываем кнопку слоумо при достижении SS
    if (gameState.comboRank === 'SS' && !gameState.slowmoButtonUsed) {
        showSlowmoButton();
    }

    const maxFever = COMBAT_CONFIG?.feverMax || 100;
    const feverGain = 2.5;
    
    if (!gameState.isFeverActive) {
        gameState.fever = Math.min(maxFever, gameState.fever + feverGain);
        
        updateFeverHud(gameState);
        
        if (gameState.fever >= maxFever) {
            const ultBtn = document.getElementById('ult-btn');
            if (ultBtn) {
                ultBtn.classList.add('ready');
                ultBtn.innerHTML = '<span>Жми!</span>';
            }
        }
    }

    updateComboHud(gameState, oldRank !== gameState.comboRank);
    
    // Показываем аптечку при достижении ранга S
    if (gameState.comboRank === 'S' && !gameState.healButtonUsed) {
        showEmergencyHeal();
    }
    
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
    
    // 👇 ОТМЕНА ТАЙМЕРА СЛОУМО
    if (gameState.slowmoTimeoutId) {
        clearTimeout(gameState.slowmoTimeoutId);
        gameState.slowmoTimeoutId = null;
    }
    
    gameState.combo = 0;
    gameState.comboRank = 'D';
    gameState.healButtonUsed = false;
    gameState.slowmoButtonUsed = false;
    gameState.slowmoActive = false;
    
    // Возвращаем скорость, если была изменена
    window.BASE_SPEED = 2.5;
    
    hideEmergencyHeal();
    hideSlowmoButton();
    hideSlowMotionRing();
    
    const comboHud = document.getElementById('combo-hud');
    if (comboHud) comboHud.classList.add('hidden');
}

export function getComboMultiplier(gameState) {
    const rank = gameState?.comboRank;
    if (rank === 'C') return 1.2;
    if (rank === 'B') return 1.5;
    if (rank === 'A') return 1.8;
    if (rank === 'S') return 2.5;
    if (rank === 'SS') return 3.0;
    return 1;
}

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