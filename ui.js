const UI = {
    init() {
        const researchScreen = document.getElementById('research-screen');
        const rContent = researchScreen ? researchScreen.querySelector('.pause-content') : null;
        
        if (rContent && !document.getElementById('researchTree')) {
            const treeHtml = `
                <button id="close-research-btn" onclick="if(window.Game) window.Game.toggleResearch()" style="
                    background: #ff9800; color: white; border: none; 
                    padding: 12px 24px; font-size: 16px; font-weight: bold; 
                    border-radius: 8px; margin-bottom: 15px; width: 100%;
                    cursor: pointer; font-family: sans-serif; text-transform: uppercase;
                ">
                    Вернуться в бой 🎮
                </button>

                <div id="researchTree" style="color: white; width: 100%; max-height: 50vh; overflow-y: auto; font-family: sans-serif; background: rgba(0,0,0,0.6); padding: 10px; border-radius: 8px; box-sizing: border-box;">
                    <h3 style="text-align: center; margin: 5px 0 15px 0; color: #00f0ff; text-transform: uppercase; font-size: 15px; letter-spacing: 1px;">🔬 Лаборатория Исследований</h3>
                    
                    <div class="branch" style="margin-bottom: 12px; border-left: 3px solid #ff3366; padding-left: 10px; text-align: left;">
                        <h4 style="margin: 0 0 6px 0; color: #ff3366; font-size: 13px;">⚔️ Мощь тапа</h4>
                        <div id="node-clickPower" class="research-node"></div>
                    </div>

                    <div class="branch" style="margin-bottom: 12px; border-left: 3px solid #ffd700; padding-left: 10px; text-align: left;">
                        <h4 style="margin: 0 0 6px 0; color: #ffd700; font-size: 13px;">💰 Экономика</h4>
                        <div id="node-goldBonus" class="research-node"></div>
                    </div>

                    <div class="branch" style="margin-bottom: 5px; border-left: 3px solid #2196f3; padding-left: 10px; text-align: left;">
                        <h4 style="margin: 0 0 6px 0; color: #2196f3; font-size: 13px;">🛡️ Защита</h4>
                        <div id="node-shieldDuration" class="research-node"></div>
                    </div>
                </div>
            `;
            rContent.innerHTML = treeHtml;
        }
    },

    renderNode(id, name, icon, currentLvl, maxLvl, cost, color) {
        const nodeEl = document.getElementById(`node-${id}`);
        if (!nodeEl) return;

        const isMax = currentLvl >= maxLvl;
        const playerGold = window.gameState ? window.gameState.gold : 0;
        const canAfford = playerGold >= cost && !isMax;

        nodeEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.06); padding: 6px 8px; margin-bottom: 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 18px;">${icon}</span>
                    <div>
                        <div style="font-weight: bold; font-size: 12px; color: #fff;">${name}</div>
                        <div style="font-size: 10px; color: #aaa;">Ур: <span style="color: ${color}; font-weight: bold;">${currentLvl}/${maxLvl}</span></div>
                    </div>
                </div>
                <button onclick="if(window.UI) window.UI.buyResearch('${id}')" ${!canAfford ? 'disabled' : ''} style="
                    background: ${isMax ? '#444' : (canAfford ? color : '#222')};
                    color: ${canAfford ? '#000' : '#888'};
                    border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; min-width: 65px; cursor: pointer;
                ">
                    ${isMax ? 'МАКС' : '🪙 ' + cost}
                </button>
            </div>
        `;
    },

     update() {
        if (!window.gameState) return;

        this.init();

        const goldEl = document.getElementById('gold-val') || document.getElementById('goldVal');
        const scoreEl = document.getElementById('score-val') || document.getElementById('scoreVal');
        const hpBarFill = document.getElementById('hp-bar-fill');
        const hpBarContainer = document.querySelector('.hp-bar-container'); // Находим контейнер рамки

        if (goldEl) goldEl.textContent = window.gameState.gold;
        if (scoreEl) scoreEl.textContent = window.gameState.score;
        
        if (hpBarFill) {
            // Устанавливаем только ширину полоски здоровья
            hpBarFill.style.width = `${window.gameState.hp}%`;
            
            // РАБОТА СО ЩИТОМ ЧЕРЕЗ ТВОИ CSS КЛАССЫ
            if (window.gameState.isShieldActive && window.gameState.shieldTimer > 0) {
                // Включаем родной ледяной неон
                hpBarFill.classList.add('frozen-fill');
                if (hpBarContainer) hpBarContainer.classList.add('frozen-active');
            } else {
                // Выключаем щит — классы уходят, возвращается стандартный CSS градиент
                hpBarFill.classList.remove('frozen-fill');
                if (hpBarContainer) hpBarContainer.classList.remove('frozen-active');
            }
        }

        // Обновление Лаборатории (значки строго те, что ты утвердил в gameState)
        const res = window.gameState.research;
        if (res && document.getElementById('researchTree')) {
            this.renderNode('clickPower', 'Урон по боссу', '🥊', res.clickPower.lvl, res.clickPower.max, res.clickPower.cost, '#ff3366');
            this.renderNode('goldBonus', 'Бонус монет', '💰', res.goldBonus.lvl, res.goldBonus.max, res.goldBonus.cost, '#ffd700');
            this.renderNode('shieldDuration', 'Длина щита', '🛡️', res.shieldDuration.lvl, res.shieldDuration.max, res.shieldDuration.cost, '#2196f3');
        }
    },


    buyResearch(id) {
        if (!window.gameState || !window.gameState.research) return;
        
        const item = window.gameState.research[id];
        if (item.lvl >= item.max || window.gameState.gold < item.cost) return;

        window.gameState.gold -= item.cost;
        item.lvl++;
        item.cost = Math.floor(item.cost * 1.8);

        this.update();
    }
};

window.UI = UI;
