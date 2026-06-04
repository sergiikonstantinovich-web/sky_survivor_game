// ========== src/ui/researchUI.js ==========
import { TECH_TREE, getUpgradeCost } from '../config/techTree.js';
import { saveGame } from '../core/saveSystem.js';
import UI from '../ui.js';

// Динамическое описание в зависимости от следующего уровня
function getUpgradeDesc(upgrade, currentLevel) {
    const nextLevel = currentLevel + 1;
    
    switch(upgrade.name) {
        case '⚡ Усиление ульты':
            const percent = nextLevel * 100;
            return `+${percent}% урона ульты`;
        case '❤️ Усиление аптечки':
            return `+${nextLevel * 5} ХП к лечению`;
        case '🐢 Слоумо мастер':
            return `+${nextLevel * 0.5} сек к слоумо`;
        case '💪 Сила клика':
            return `+${nextLevel} урон клика`;
        case '🎯 Критический шанс':
            return `+${nextLevel * 5}% шанс крита`;
        case '💥 Критический урон':
            return `+${nextLevel * 25}% к крит урону`;
        case '🛡️ Стальной щит':
            return `+${nextLevel * 3} сек к щиту`;
        case '💚 Пассивная регенерация':
            return `+${nextLevel * 0.5} ХП/5сек`;
        case '🛡️ Снижение урона':
            return `-${nextLevel * 2}% пассивного урона`;
        case '💰 Золотая лихорадка':
            return `+${nextLevel * 5} золота за сбор`;
        case '🏆 Бонус за убийство':
            return `+${nextLevel * 10}% очков за мобов`;
        case '🔄 Кэшбэк':
            return `+${nextLevel * 5}% возврата золота`;
        case '⚡ Быстрый старт':
            return `+${nextLevel * 5} стартового комбо`;
        case '⏱️ Удержание комбо':
            return `+${nextLevel * 0.5} сек к таймеру`;
        case '👑 Комбо бустер':
            return `+${nextLevel * 0.5} к множителю SS`;
        default:
            return upgrade.desc;
    }
}

export function initResearchUI() {
    const researchScreen = document.getElementById('research-screen');
    if (!researchScreen) return;
    
    const content = researchScreen.querySelector('.pause-content');
    if (!content) return;
    
    content.innerHTML = `
        <h2 style="text-align: center; color: #ffd700; margin: 0 0 10px 0; font-size: 18px;">🔬 ДЕРЕВО УМЕНИЙ</h2>
        <div id="tech-tree-container" style="overflow-y: auto; max-height: 65vh; padding: 10px;"></div>
        <button id="close-tech-btn" style="background:#ff9800;color:white;border:none;padding:12px;margin-top:10px;border-radius:8px;width:100%;cursor:pointer;font-weight:bold;">✖️ ЗАКРЫТЬ</button>
    `;
    
    buildTechTree();
    
    document.getElementById('close-tech-btn').onclick = () => {
        if (window.Game) window.Game.toggleResearch();
    };
}

function buildTechTree() {
    const container = document.getElementById('tech-tree-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const categories = {
        attack: { name: '⚔️ АТАКА', color: '#ff6666' },
        defense: { name: '🛡️ ЗАЩИТА', color: '#6666ff' },
        economy: { name: '💰 ЭКОНОМИКА', color: '#66ff66' },
        special: { name: '✨ СПЕЦИАЛЬНЫЕ', color: '#ff66ff' },
        combo: { name: '🌀 КОМБО', color: '#ffaa66' }
    };
    
    for (const [catKey, catData] of Object.entries(categories)) {
        const category = TECH_TREE[catKey];
        if (!category) continue;
        
        const catDiv = document.createElement('div');
        catDiv.style.cssText = `
            background: rgba(0,0,0,0.5);
            border-radius: 10px;
            margin-bottom: 15px;
            padding: 10px;
            border-left: 4px solid ${catData.color};
        `;
        catDiv.innerHTML = `<h3 style="color: ${catData.color}; margin: 0 0 10px 0; font-size: 14px;">${catData.name}</h3>`;
        
        const upgradesDiv = document.createElement('div');
        upgradesDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
        
        for (const [upgradeKey, upgrade] of Object.entries(category)) {
            const currentLevel = window.gameState?.research[upgradeKey] || 0;
            const maxLevel = upgrade.maxLevel;
            const cost = getUpgradeCost(upgrade, currentLevel);
            const isMaxed = currentLevel >= maxLevel;
            
            // 👇 ДИНАМИЧЕСКОЕ ОПИСАНИЕ
            const dynamicDesc = getUpgradeDesc(upgrade, currentLevel);
            
            const upgradeDiv = document.createElement('div');
            upgradeDiv.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255,255,255,0.1);
                border-radius: 8px;
                padding: 8px 12px;
            `;
            
            upgradeDiv.innerHTML = `
                <div style="flex: 2;">
                    <div style="font-weight: bold; font-size: 13px;">${upgrade.name}</div>
                    <div style="font-size: 9px; color: #aaa;">${dynamicDesc}</div>
                    <div style="font-size: 10px; color: #ffd700;">Уровень: ${currentLevel}/${maxLevel}</div>
                </div>
                <button class="buy-upgrade-btn" data-upgrade="${upgradeKey}" data-cat="${catKey}" ${isMaxed ? 'disabled' : ''} style="
                    background: ${isMaxed ? '#555' : '#4caf50'};
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: ${isMaxed ? 'not-allowed' : 'pointer'};
                    font-weight: bold;
                    font-size: 12px;
                ">
                    ${isMaxed ? 'MAX' : `${cost} 💰`}
                </button>
            `;
            
            upgradesDiv.appendChild(upgradeDiv);
        }
        
        catDiv.appendChild(upgradesDiv);
        container.appendChild(catDiv);
    }
    
    document.querySelectorAll('.buy-upgrade-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const upgradeKey = btn.dataset.upgrade;
            const catKey = btn.dataset.cat;
            if (window.Game) window.Game.buyUpgrade(catKey, upgradeKey);
        };
    });
}

export function refreshResearchUI() {
    buildTechTree();
}