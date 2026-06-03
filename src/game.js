// ========== src/game.js ==========
import { LEVEL_CONFIG } from './config/gameConfig.js';
import Engine from './engine.js';
import UI from './ui.js';
import { handleHitCombo, resetCombo, hideEmergencyHeal } from './combat/comboSystem.js';
import { updateFeverHud, activateFeverMode } from './combat/feverSystem.js';
import { startGameTimers } from './core/gameTimers.js';
import { startGameLoop } from './core/gameLoop.js';
import { handleItemClick } from './core/clickHandler.js';
import { togglePause, toggleResearch } from './ui/gameUI.js';

const Game = {
    isInitialized: false,
    
    startGame() {
        if (UI && typeof UI.hideMainMenu === 'function') {
            UI.hideMainMenu();
        }
        this.resetGame();
        if (window.gameState) {
            window.gameState.isPaused = false;
            window.gameState.hp = 100;
            window.gameState.score = 0;
            window.gameState.gold = 0;
            window.gameState.combo = 0;
            window.gameState.comboRank = 'D';
            window.gameState.fever = 0;
            window.gameState.isFeverActive = false;
            window.gameState.items = [];
            window.gameState.splashes = [];
            window.gameState.floatingTexts = [];
        }
        UI.update();
    }, 
    
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
                healButtonUsed: false,
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
        
        // Показываем главное меню, игру не запускаем
        if (UI && typeof UI.showMainMenu === 'function') {
            UI.showMainMenu();
        }
        
        // Запускаем игровой цикл (он будет рисовать, но игра на паузе)
        startGameLoop(window.gameState, () => this.resetGame(), () => UI.update());
    }, 

    handleItemClick(item) {
        handleItemClick(window.gameState, item, () => this.checkLevelUp(), () => UI.update());
    },

    activateFeverMode() {
        activateFeverMode(window.gameState, () => this.checkLevelUp(), () => UI.update());
    },

    healFromEmergency() {
        const gs = window.gameState;
        if (!gs || gs.hp <= 0) return;
        
        gs.hp = Math.min(100, gs.hp + 25);
        hideEmergencyHeal();
        gs.healButtonUsed = true;
        UI.update();
        
        // Зелёная вспышка
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#00ff00;z-index:9998;pointer-events:none;transition:opacity 0.3s ease-out;opacity:0.5';
        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
        }, 50);
    },

checkLevelUp() {
    const gs = window.gameState;
    if (!gs) return;
    
    const config = LEVEL_CONFIG?.[gs.currentLevel];
    if (!config) return;

    if (gs.score >= config.targetScore && LEVEL_CONFIG?.[gs.currentLevel + 1]) {
        gs.currentLevel++;
        const nextLevelNum = gs.currentLevel;
        const nextConfig = LEVEL_CONFIG[nextLevelNum];
        gs.gold += 50;
        gs.hp = Math.min(100, gs.hp + 20);
        
        // ❌ Убираем старый alert
        // alert(`🎉 СЛЕДУЮЩИЙ УРОВЕНЬ!\n${nextConfig.name}`);
        
        // ✅ Добавляем красивое уведомление
        if (UI && typeof UI.showLevelUp === 'function') {
            UI.showLevelUp(nextLevelNum);
        }
        
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
        gs.healButtonUsed = false;
        updateFeverHud(gs);
        hideEmergencyHeal();
        window.BASE_SPEED = 2.5;

        gs.research = {
            clickPower: { lvl: 0, max: 5, cost: 40 },
            goldBonus: { lvl: 0, max: 5, cost: 50 },
            shieldDuration: { lvl: 0, max: 5, cost: 60 }
        };
        
        const pauseScreen = document.getElementById('pause-screen');
        const researchScreen = document.getElementById('research-screen');
        const pauseBtn = document.getElementById('pause-btn');
        const mainMenu = document.getElementById('main-menu');
        
        if (mainMenu) mainMenu.classList.add('hidden');
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
        const healBtn = document.getElementById('emergency-heal');
        const resumeBtn = document.getElementById('resume-btn');
        const startBtn = document.getElementById('start-btn');
        
        if (startBtn) {
            startBtn.onclick = (e) => {
                e.stopPropagation();
                this.startGame();
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
        if (healBtn) {
            healBtn.onclick = (e) => {
                e.stopPropagation();
                this.healFromEmergency();
            };
        }
        if (resumeBtn) {
            resumeBtn.onclick = (e) => {
                e.stopPropagation();
                this.togglePause();
            };
        }

        document.addEventListener('visibilitychange', () => {
            const gs = window.gameState;
            if (document.hidden && gs && gs.hp > 0) {
                if (!gs.isPaused && !gs.isResearchOpen) this.togglePause();
            }
        });
        
        startGameTimers(window.gameState, () => this.checkLevelUp(), () => UI.update());
    }
};

export default Game;
window.Game = Game;