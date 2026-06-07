// ========== src/game.js ==========
import { LEVEL_CONFIG } from './config/gameConfig.js';
import Engine from './engine.js';
import UI from './ui.js';
import { handleHitCombo, resetCombo, hideEmergencyHeal, hideSlowmoButton, showSlowMotionRing, hideSlowMotionRing } from './combat/comboSystem.js';
import { updateFeverHud, activateFeverMode } from './combat/feverSystem.js';
import { startGameTimers } from './core/gameTimers.js';
import { startGameLoop } from './core/gameLoop.js';
import { handleItemClick } from './core/clickHandler.js';
import { togglePause, toggleResearch } from './ui/gameUI.js';
import { loadGame, saveGame } from './core/saveSystem.js';
import { TECH_TREE, getUpgradeCost } from './config/techTree.js';
import { refreshResearchUI } from './ui/researchUI.js';

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
                slowMotion: false,
                slowMotionTimer: 0,
                slowMotionMultiplier: 1,
                slowmoActive: false,
                slowmoButtonUsed: false,
                slowmoTimeoutId: null,
                // Новая структура исследований
                research: {
                    // Атака
                    clickPower: 0,
                    critChance: 0,
                    critDamage: 0,
                    // Защита
                    shieldDuration: 0,
                    passiveRegen: 0,
                    damageReduction: 0,
                    // Экономика
                    goldBonus: 0,
                    scoreBonus: 0,
                    cashback: 0,
                    // Специальные
                    feverDamage: 0,
                    healBonus: 0,
                    slowmoDuration: 0,
                    // Комбо
                    startCombo: 0,
                    comboTime: 0,
                    ssMultiplier: 0
                }
            };
        }
        
        // Загружаем сохранение
        loadGame(window.gameState);

        Engine.init();
        this.setupEvents();
        UI.update();
        
        if (UI && typeof UI.showMainMenu === 'function') {
            UI.showMainMenu();
        }
        
        startGameLoop(window.gameState, () => this.resetGame(), () => UI.update());
    },

    handleItemClick(item) {
        handleItemClick(window.gameState, item, () => this.checkLevelUp(), () => UI.update());
        saveGame(window.gameState);
    },

    activateFeverMode() {
        activateFeverMode(window.gameState, () => this.checkLevelUp(), () => UI.update());
        saveGame(window.gameState);
    },

    healFromEmergency() {
        const gs = window.gameState;
        if (!gs || gs.hp <= 0) return;
        
        const healBonus = (gs.research.healBonus || 0) * 5;
        gs.hp = Math.min(100, gs.hp + 25 + healBonus);
        hideEmergencyHeal();
        gs.healButtonUsed = true;
        UI.update();
        saveGame(gs);
        
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
            
            if (gs.slowmoActive) {
                if (gs.items) {
                    gs.items.forEach(item => {
                        const currentSpeed = item.speed;
                        const baseSpeed = currentSpeed / 0.5;
                        item.speed = baseSpeed * 0.5;
                    });
                }
                window.BASE_SPEED = 2.5 * 0.5;
            } else {
                window.BASE_SPEED = 2.5;
            }
            
            if (UI && typeof UI.showLevelUp === 'function') {
                UI.showLevelUp(nextLevelNum);
            }
            
            UI.update();
            saveGame(gs);
        }
    },

    resetGame() {
        const gs = window.gameState;
        if (!gs) return;
        
        // 💰 СОХРАНЯЕМ ЗОЛОТО И ИССЛЕДОВАНИЯ ПЕРЕД СБРОСОМ
        const savedGold = gs.gold;
        const savedResearch = JSON.parse(JSON.stringify(gs.research));
        
        gs.currentLevel = 1;
        gs.hp = 100;
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
        
        gs.slowMotion = false;
        gs.slowMotionTimer = 0;
        gs.slowMotionMultiplier = 1;
        gs.slowmoActive = false;
        gs.slowmoButtonUsed = false;
        
        if (gs.slowmoTimeoutId) {
            clearTimeout(gs.slowmoTimeoutId);
            gs.slowmoTimeoutId = null;
        }
        
        window.BASE_SPEED = 2.5;
        
        // 💰 ВОССТАНАВЛИВАЕМ ЗОЛОТО И ИССЛЕДОВАНИЯ
        gs.gold = savedGold;
        gs.research = savedResearch;
        
        updateFeverHud(gs);
        hideEmergencyHeal();
        hideSlowmoButton();
        hideSlowMotionRing();
        
        const pauseScreen = document.getElementById('pause-screen');
        const researchScreen = document.getElementById('research-screen');
        const pauseBtn = document.getElementById('pause-btn');
        const mainMenu = document.getElementById('main-menu');
        const slowmoBtn = document.getElementById('slowmo-btn');
        
        if (mainMenu) mainMenu.classList.add('hidden');
        if (pauseScreen) pauseScreen.classList.add('hidden');
        if (researchScreen) researchScreen.classList.add('hidden');
        if (pauseBtn) pauseBtn.textContent = '⏸️';
        if (slowmoBtn) slowmoBtn.classList.add('hidden');
        
        const ultBtn = document.getElementById('ult-btn');
        if (ultBtn) {
            ultBtn.classList.remove('ready');
            ultBtn.innerHTML = '';
        }
        
        UI.update();
        // ❌ НЕ СОХРАНЯЕМ ПОСЛЕ СМЕРТИ, ЧТОБЫ НЕ ЗАТЕРЕТЬ ЗОЛОТО
        // saveGame(gs);
    },

    togglePause() {
        togglePause(window.gameState);
    },

    toggleResearch() {
        toggleResearch(window.gameState);
    },

    activateSlowmo() {
        const gs = window.gameState;
        if (!gs || gs.slowmoActive) return;
        
        const slowmoBonus = (gs.research.slowmoDuration || 0) * 500;
        const duration = 3000 + slowmoBonus;
        
        console.log('🐢 Активация слоумо!', duration);
        
        gs.slowmoActive = true;
        gs.slowmoTimer = duration;
        gs.slowmoMultiplier = 0.5;
        
        if (gs.items) {
            gs.items.forEach(item => {
                item.speed = item.speed * 0.5;
            });
        }
        
        window.BASE_SPEED = 2.5 * 0.5;
        gs.slowmoButtonUsed = true;
        
        hideSlowmoButton();
        showSlowMotionRing();
        
        if (gs.slowmoTimeoutId) clearTimeout(gs.slowmoTimeoutId);
        
        gs.slowmoTimeoutId = setTimeout(() => {
            gs.slowmoActive = false;
            
            if (gs.items) {
                gs.items.forEach(item => {
                    item.speed = item.speed / 0.5;
                });
            }
            
            window.BASE_SPEED = 2.5;
            hideSlowMotionRing();
            console.log('🐢 Слоумо закончился');
        }, duration);
        
        saveGame(gs);
    },
    
    buyUpgrade(categoryKey, upgradeKey) {
        const gs = window.gameState;
        if (!gs) return;
        
        const category = TECH_TREE[categoryKey];
        if (!category) return;
        
        const upgrade = category[upgradeKey];
        if (!upgrade) return;
        
        const currentLevel = gs.research[upgradeKey] || 0;
        if (currentLevel >= upgrade.maxLevel) return;
        
        const cost = getUpgradeCost(upgrade, currentLevel);
        if (gs.gold < cost) {
            if (UI && typeof UI.showNotification === 'function') {
                UI.showNotification(`❌ Не хватает ${cost - gs.gold} золота!`, '#ff4444');
            }
            return;
        }
        
        gs.gold -= cost;
        gs.research[upgradeKey] = currentLevel + 1;
        
        const cashbackLevel = gs.research.cashback || 0;
        if (cashbackLevel > 0) {
            const refund = Math.floor(cost * (cashbackLevel * 0.05));
            gs.gold += refund;
            if (UI && typeof UI.showNotification === 'function') {
                UI.showNotification(`🔄 Кэшбэк: +${refund}`, '#88ff88');
            }
        }
        
        if (UI && typeof UI.showPurchaseEffect === 'function') {
            UI.showPurchaseEffect(upgrade.name, cost, currentLevel + 1);
        }
        
        saveGame(gs);
        refreshResearchUI();
        UI.update();
    },
    
    setupEvents() {
        const pauseBtn = document.getElementById('pause-btn');
        const researchBtn = document.getElementById('research-btn');
        const healBtn = document.getElementById('emergency-heal');
        const resumeBtn = document.getElementById('resume-btn');
        const startBtn = document.getElementById('start-btn');
        const slowmoBtn = document.getElementById('slowmo-btn');
        
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
        if (slowmoBtn) {
            slowmoBtn.onclick = (e) => {
                e.stopPropagation();
                this.activateSlowmo();
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