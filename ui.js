const UI = {
    // Жёсткая структура дерева развития
    nodes: [
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
    ],

    init() {
        const researchScreen = document.getElementById('research-screen');
        const rContent = researchScreen ? researchScreen.querySelector('.pause-content') : null;
        
        // Строим каркас дерева один раз при первом открытии
        if (rContent && !document.getElementById('techTreeContainer')) {
            rContent.innerHTML = `
                <h2 style="text-align: center; color: #ffd700; margin: 0 0 2px 0; font-size: 18px; letter-spacing: 1px; font-family: sans-serif;">🔬 ЛАБОРАТОРИЯ v0.2</h2>
                <p style="text-align: center; color: #888; margin: 0 0 10px 0; font-size: 11px; font-family: sans-serif;">Скролл строго сверху вниз</p>
                
                <div class="tech-tree-scroll-wrapper">
                    <div id="techTreeContainer" style="display: flex; flex-direction: column; align-items: center; min-width: 100%;"></div>
                </div>

                <button id="close-research-btn" onclick="if(window.Game) window.Game.toggleResearch()" style="
                    background: #ff9800; color: white; border: none; 
                    padding: 10px 20px; font-size: 14px; font-weight: bold; 
                    border-radius: 8px; margin-top: 10px; width: 100%;
                    cursor: pointer; font-family: sans-serif; text-transform: uppercase; flex-shrink: 0;
                ">
                    Вернуться в бой 🎮
                </button>
            `;
            this.buildTreeNodes();
        }
    },

    buildTreeNodes() {
        const container = document.getElementById('techTreeContainer');
        if (!container) return;

        container.innerHTML = '';

        // Группируем узлы по тирам для скейлинга сверху вниз
        const tiers = {};
        this.nodes.forEach(node => {
            if (!tiers[node.tier]) tiers[node.tier] = [];
            tiers[node.tier].push(node);
        });

        // Отрисовываем горизонтальные ряды тиров
        Object.keys(tiers).sort().forEach(tierNum => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.flexWrap = 'wrap';
            row.style.justifyContent = 'center';
            row.style.gap = '8px';
            row.style.marginBottom = '25px';
            row.style.width = '100%';
            row.style.boxSizing = 'border-box';

            tiers[tierNum].forEach(node => {
                const btn = document.createElement('button');
                btn.className = 'tech-node-btn';
                btn.id = `tree-node-${node.id}`;
                btn.innerHTML = `
                    <div class="node-label">${node.label}</div>
                    <div class="node-cost">🪙 ${node.cost}</div>
                `;
                
                btn.onclick = () => {
                    this.buyTech(node);
                };

                row.appendChild(btn);
            });

            container.appendChild(row);
        });
    },

    buyTech(node) {
        if (!window.gameState) return;
        alert(`Исследование: ${node.label}\nЦена: ${node.cost} золота.`);
        // Сюда в будущем привяжем реальную покупку под новый gameState
    },

    update() {
        if (!window.gameState) return;

        this.init();

        const goldEl = document.getElementById('gold-val') || document.getElementById('goldVal');
        const scoreEl = document.getElementById('score-val') || document.getElementById('scoreVal');
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
    }
};

window.UI = UI;
