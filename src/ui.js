// ========== src/ui.js ==========
// Импортируем дерево технологий (пока оставим внутри)
const TECH_NODES = [
    { id: 't1_root', label: 'Основа 🎯', tier: 1, cost: 10 },
    { id: 't2_atk', label: 'Урон I 🥊', tier: 2, cost: 20 },
    { id: 't2_eco', label: 'Золото I 💰', tier: 2, cost: 20 },
    { id: 't2_def', label: 'Щит I 🛡️', tier: 2, cost: 20 },
    { id: 't3_crit', label: 'Крит I ⚡', tier: 3, cost: 50 },
    { id: 't3_speed', label: 'Скорость ⏳', tier: 3, cost: 50 },
    { id: 't3_drop', label: 'Шанс дропа 🍀', tier: 3, cost: 50 },
    { id: 't3_tax', label: 'Кэшбэк 📈', tier: 3, cost: 50 },
    { id: 't3_hp', label: 'Макс ХП I ❤️', tier: 3, cost: 50 },
    { id: 't3_regen', label: 'Реген 🧪', tier: 3, cost: 50 },
    { id: 't4_atk2', label: 'Урон II 🔥', tier: 4, cost: 150 },
    { id: 't4_crit2', label: 'Крит II 💥', tier: 4, cost: 150 },
    { id: 't4_mob', label: 'Охотник 👾', tier: 4, cost: 200 },
    { id: 't4_eco2', label: 'Золото II 💎', tier: 4, cost: 150 },
    { id: 't4_boss', label: 'Боссы 👑', tier: 4, cost: 250 },
    { id: 't4_def2', label: 'Щит II 🌌', tier: 4, cost: 150 },
    { id: 't4_absorb', label: 'Поглощение 🌀', tier: 4, cost: 200 },
    { id: 't5_ult_atk', label: 'БОГ ВОЙНЫ ⚔️', tier: 5, cost: 1000 },
    { id: 't5_ult_eco', label: 'МАГНАТ 👑', tier: 5, cost: 1000 },
    { id: 't5_ult_def', label: 'АРХОНТ 🌟', tier: 5, cost: 1000 },
    { id: 't5_secret', label: 'КОД 🌀', tier: 5, cost: 5000 }
];

// Основной объект UI
const UI = {
    nodes: TECH_NODES,
    treeBuilt: false,

    init() {
        const researchScreen = document.getElementById('research-screen');
        const rContent = researchScreen ? researchScreen.querySelector('.pause-content') : null;
        
        if (rContent && !this.treeBuilt) {
            rContent.innerHTML = `
                <h2 style="text-align: center; color: #ffd700; margin: 0 0 2px 0; font-size: 18px;">🔬 ЛАБОРАТОРИЯ</h2>
                <p style="text-align: center; color: #888; margin: 0 0 10px 0; font-size: 11px;">Скролл сверху вниз</p>
                <div class="tech-tree-scroll-wrapper">
                    <div id="techTreeContainer" style="display: flex; flex-direction: column; align-items: center;"></div>
                </div>
                <button id="close-research-btn" style="background:#ff9800;color:white;border:none;padding:10px 20px;font-size:14px;font-weight:bold;border-radius:8px;margin-top:10px;width:100%;cursor:pointer;">
                    Вернуться в бой 🎮
                </button>
            `;
            this.buildTreeNodes();
            this.treeBuilt = true;
            
            // Вешаем обработчик на кнопку закрытия
            const closeBtn = document.getElementById('close-research-btn');
            if (closeBtn && window.Game) {
                closeBtn.onclick = () => window.Game.toggleResearch();
            }
        }
    },

    buildTreeNodes() {
        const container = document.getElementById('techTreeContainer');
        if (!container) return;
        container.innerHTML = '';

        const tiers = {};
        this.nodes.forEach(node => {
            if (!tiers[node.tier]) tiers[node.tier] = [];
            tiers[node.tier].push(node);
        });

        Object.keys(tiers).sort().forEach(tierNum => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:25px;width:100%;box-sizing:border-box';
            
            tiers[tierNum].forEach(node => {
                const btn = document.createElement('button');
                btn.className = 'tech-node-btn';
                btn.id = `tree-node-${node.id}`;
                btn.innerHTML = `<div class="node-label">${node.label}</div><div class="node-cost">🪙 ${node.cost}</div>`;
                btn.onclick = () => {
                    if (window.gameState) {
                        alert(`Исследование: ${node.label}\nЦена: ${node.cost} золота.`);
                    }
                };
                row.appendChild(btn);
            });
            container.appendChild(row);
        });
    },

    update() {
        if (!window.gameState) return;
        
        this.init();
        
        const goldEl = document.getElementById('gold-val');
        const scoreEl = document.getElementById('score-val');
        const hpBarFill = document.getElementById('hp-bar-fill');
        const hpBarContainer = document.querySelector('.hp-bar-container');
        
        if (goldEl) goldEl.textContent = window.gameState.gold;
        if (scoreEl) scoreEl.textContent = window.gameState.score;
        
        if (hpBarFill) {
            hpBarFill.style.width = `${window.gameState.hp}%`;
            if (window.gameState.isShieldActive && window.gameState.shieldTimer > 0) {
                hpBarFill.classList.add('frozen-fill');
                if (hpBarContainer) hpBarContainer.classList.add('frozen-active');
            } else {
                hpBarFill.classList.remove('frozen-fill');
                if (hpBarContainer) hpBarContainer.classList.remove('frozen-active');
            }
        }
    }, 
    showLevelUp(level) {
        const notification = document.getElementById('level-notification');
        const levelText = document.getElementById('level-text');
        
        if (!notification || !levelText) return;
        
        levelText.textContent = `LEVEL ${level}`;
        notification.classList.remove('hidden');
        
        // Убираем предыдущую анимацию, чтобы перезапустить
        notification.style.animation = 'none';
        setTimeout(() => {
            notification.style.animation = 'slideInOut 1.5s ease-in-out forwards';
        }, 10);
        
        // Скрываем после анимации
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 1500);
    }, 
    
    showGameOver(score, gold, level) {
    const screen = document.getElementById('gameover-screen');
    const finalScore = document.getElementById('final-score');
    const finalGold = document.getElementById('final-gold');
    const finalLevel = document.getElementById('final-level');
    
    if (!screen) return;
    
    if (finalScore) finalScore.textContent = score;
    if (finalGold) finalGold.textContent = gold;
    if (finalLevel) finalLevel.textContent = level;
    
    screen.classList.remove('hidden');
    
    // Вешаем обработчик на кнопку рестарта
    const restartBtn = document.getElementById('gameover-restart-btn');
    if (restartBtn) {
        // Удаляем старый обработчик, чтобы не дублировался
        const newBtn = restartBtn.cloneNode(true);
        restartBtn.parentNode.replaceChild(newBtn, restartBtn);
        newBtn.onclick = () => {
            screen.classList.add('hidden');
            if (window.Game && typeof window.Game.resetGame === 'function') {
                window.Game.resetGame();
            }
        };
    }
}
};

// Экспортируем и вешаем в window (для обратной совместимости)
export default UI;
window.UI = UI;