console.log('🔷 Game.js загружен');
console.log('  - handleHitCombo:', typeof handleHitCombo);
console.log('  - resetCombo:', typeof resetCombo);
console.log('  - startGameTimers:', typeof startGameTimers);
console.log('  - startGameLoop:', typeof startGameLoop);
console.log('  - handleItemClick:', typeof handleItemClick);
// ========== src/game.js (новая версия — ~120 строк вместо 400) ==========
import { LEVEL_CONFIG } from './config/gameConfig.js';
import Engine from './engine.js';
import UI from './ui.js';
import { handleHitCombo, resetCombo } from './combat/comboSystem.js';
import { updateFeverHud, activateFeverMode } from './combat/feverSystem.js';
import { startGameTimers, stopGameTimers } from './core/gameTimers.js';
import { startGameLoop, stopGameLoop } from './core/gameLoop.js';
import { handleItemClick } from './core/clickHandler.js';
import { togglePause, toggleResearch } from './ui/gameUI.js';

const Game = {
    isInitialized: false,

    start() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (!window.gameState) {
            window.gameState = {
                hp: 100, gold: 0, score: 0, currentLevel: 1,
                isShieldActive: false, shieldTimer: 0, isPaused: false,
                isResearchOpen: false,
                items: [], splashes: [], floatingTexts: [],
                combo: 0, comboRank: 'D',
                fever: 0, isFeverActive: false, feverDuration: 0,
                research: {
                    clickPower: { lvl: 0, max: 5, cost: 40 },
                    goldBonus: { lvl: 0, max: 5, cost: 50 },
                    shieldDuration: { lvl: 0, max: 5, cost: 60 }
                }
            };
        }

        Engine.init();
        this.setupEvents();
        UI.update();
        
        startGameLoop(window.gameState, () => this.resetGame(), () => UI.update());
    },

    handleItemClick(item) {
        console.log('🖱️ handleItemClick вызван, тип:', item.type?.icon);
        handleItemClick(window.gameState, item, () => this.checkLevelUp(), () => UI.update());
    },

    activateFeverMode() {
        activateFeverMode(window.gameState, () => this.checkLevelUp(), () => UI.update());
    },

    checkLevelUp() {
        const gs = window.gameState;
        if (!gs) return;
        
        const config = LEVEL_CONFIG?.[gs.currentLevel];
        if (!config) return;

        if (gs.score >= config.targetScore && LEVEL_CONFIG?.[gs.currentLevel + 1]) {
            gs.currentLevel++;
            const nextConfig = LEVEL_CONFIG[gs.currentLevel];
            gs.gold += 50;
            gs.hp = Math.min(100, gs.hp + 20);
            
            alert(`🎉 СЛЕДУЮЩИЙ УРОВЕНЬ!\n${nextConfig.name}`);
            UI.update();
        }
    },

    resetGame() {
        const gs = window.gameState;
        if (!gs) return;
        
        gs.currentLevel = 1;
        gs.hp = 100;
        gs.gold = 0;
        gs.score = 0;
        gs.isShieldActive = false;
        gs.shieldTimer = 0;
        gs.isPaused = false;
        gs.isResearchOpen = false;
        gs.items = [];
        gs.splashes = [];
        gs.floatingTexts = [];
        
        resetCombo(gs);
        gs.fever = 0;
        gs.isFeverActive = false;
        gs.feverDuration = 0;
        updateFeverHud(gs);
        window.BASE_SPEED = 2.5;

        gs.research = {
            clickPower: { lvl: 0, max: 5, cost: 40 },
            goldBonus: { lvl: 0, max: 5, cost: 50 },
            shieldDuration: { lvl: 0, max: 5, cost: 60 }
        };
        
        const pauseScreen = document.getElementById('pause-screen');
        const researchScreen = document.getElementById('research-screen');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (pauseScreen) pauseScreen.classList.add('hidden');
        if (researchScreen) researchScreen.classList.add('hidden');
        if (pauseBtn) pauseBtn.textContent = '⏸️';
        
        const ultBtn = document.getElementById('ult-btn');
        if (ultBtn) {
            ultBtn.classList.remove('ready');
            ultBtn.innerHTML = '';
        }
        
        UI.update();
    },

    togglePause() {
        togglePause(window.gameState);
    },

    toggleResearch() {
        toggleResearch(window.gameState);
    },

    setupEvents() {
        const pauseBtn = document.getElementById('pause-btn');
        const researchBtn = document.getElementById('research-btn');
        const resumeBtn = document.getElementById('resume-btn');
        const ultBtn = document.getElementById('ult-btn');
        if (ultBtn) {
            ultBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.gameState && window.gameState.fever >= 100) {
                    this.activateFeverMode();
                }
            };
        }
        if (resumeBtn) {
            resumeBtn.onclick = (e) => {
                e.stopPropagation();
                this.togglePause();
            };
        }
        if (pauseBtn) {
            pauseBtn.onclick = (e) => {
                e.stopPropagation();
                this.togglePause();
            };
        }
        if (researchBtn) {
            researchBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleResearch();
            };
        }

        document.addEventListener('visibilitychange', () => {
            const gs = window.gameState;
            if (document.hidden && gs && gs.hp > 0) {
                if (!gs.isPaused && !gs.isResearchOpen) this.togglePause();
            }
        });
        
        // Запускаем таймеры отдельно от цикла
        startGameTimers(window.gameState, () => this.checkLevelUp(), () => UI.update());
    }
};
console.log('🔷 Game объект создан, экспортирую');
export default Game;
window.Game = Game;