// ========== src/game.js ==========
import { LEVEL_CONFIG, COMBAT_CONFIG } from './config/gameConfig.js';
import Engine from './engine.js';
import UI from './ui.js';

const Game = {
    animationFrameId: null,
    isInitialized: false,
    comboTimer: null,
    intervalId: null,

    start() {
        if (this.isInitialized) return; 
        this.isInitialized = true; 

        if (!window.gameState) {
            window.gameState = {
                hp: 100, gold: 0, score: 0, currentLevel: 1,
                isShieldActive: false, shieldTimer: 0, isPaused: false,
                isResearchOpen: false,
                items: [], splashes: [], floatingTexts: [],
                
                combo: 0,
                comboRank: 'D',
                fever: 0,
                isFeverActive: false,
                feverDuration: 0,

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
        
        this.loop();
    },

    loop() {
        if (!window.gameState) {
            this.animationFrameId = requestAnimationFrame(() => this.loop());
            return;
        }

        if (window.gameState.hp <= 0) {
            if (!window.gameState.isPaused) {
                window.gameState.isPaused = true;
                setTimeout(() => {
                    alert(`💀 ИГРА ОКОНЧЕНА!\nВы набрали очков: ${window.gameState.score}`);
                    this.resetGame();
                }, 10);
            }
            Engine.render();
            this.animationFrameId = requestAnimationFrame(() => this.loop());
            return;
        }

        Engine.render();
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    },

    startTimers() {
        if (this.intervalId) clearInterval(this.intervalId);
        
        this.intervalId = setInterval(() => {
            if (!window.gameState || window.gameState.hp <= 0 || window.gameState.isPaused || window.gameState.isResearchOpen) return; 
            
            if (window.gameState.isFeverActive) {
                window.gameState.feverDuration--;
                window.gameState.fever = Math.max(0, (window.gameState.feverDuration / 7) * 100);
                if (window.gameState.feverDuration <= 0) {
                    window.gameState.isFeverActive = false;
                    window.BASE_SPEED = 2.5; 
                }
                this.updateFeverHud();
            }

            if (window.gameState.isShieldActive) {
                window.gameState.shieldTimer--;
                if (window.gameState.shieldTimer <= 0) window.gameState.isShieldActive = false;
            } else {
                let hpLoss = LEVEL_CONFIG?.[window.gameState.currentLevel]?.hpLoss || 2;
                if (!window.gameState.isFeverActive) {
                    window.gameState.hp -= hpLoss;
                }
            }
            
            window.gameState.score += 1; 
            this.checkLevelUp(); 
            UI.update();
        }, 1000);
    },

    handleHitCombo() {
        if (!window.gameState) return;

        clearTimeout(this.comboTimer);
        window.gameState.combo++;

        let oldRank = window.gameState.comboRank;
        let c = window.gameState.combo;

        if (c >= 25) window.gameState.comboRank = 'S';
        else if (c >= 15) window.gameState.comboRank = 'A';
        else if (c >= 8) window.gameState.comboRank = 'B';
        else if (c >= 3) window.gameState.comboRank = 'C';
        else window.gameState.comboRank = 'D';

        let maxFever = COMBAT_CONFIG?.feverMax || 100;
        if (!window.gameState.isFeverActive) {
            window.gameState.fever = Math.min(maxFever, window.gameState.fever + 2.5);
            this.updateFeverHud();
            
            if (window.gameState.fever >= maxFever) {
                const ultBtn = document.getElementById('ult-btn');
                if (ultBtn) {
                    ultBtn.classList.add('ready');
                    ultBtn.innerHTML = '<span>Жми!</span>';
                }
            }
        }

        this.updateComboHud(oldRank !== window.gameState.comboRank);

        let timeout = COMBAT_CONFIG?.comboTimeout || 3500;
        this.comboTimer = setTimeout(() => {
            this.resetCombo();
        }, timeout);
    },

    resetCombo() {
        if (!window.gameState) return;
        window.gameState.combo = 0;
        window.gameState.comboRank = 'D';
        const comboHud = document.getElementById('combo-hud');
        if (comboHud) comboHud.classList.add('hidden');
    },

    activateFeverMode() {
        if (!window.gameState || window.gameState.isFeverActive) return;

        window.gameState.isFeverActive = true;
        window.gameState.feverDuration = 7; 
        window.BASE_SPEED = 2.5; 
        
        const ultBtn = document.getElementById('ult-btn');
        if (ultBtn) {
            ultBtn.classList.remove('ready'); 
            ultBtn.innerHTML = '';            
        }
        window.gameState.fever = 0;           
        this.updateFeverHud();

        // Белая вспышка
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:9999;pointer-events:none;transition:opacity 0.4s ease-out';
        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 400);
        }, 30);

        // Ультимейт очистка
        if (window.gameState.items && window.gameState.items.length > 0) {
            window.gameState.items = window.gameState.items.filter(item => {
                if (item.hp !== undefined) {
                    item.hp -= 10;
                    
                    if (Engine.createFloatingText) {
                        Engine.createFloatingText(item.x, item.y, "-10 🔥", true);
                    }

                    if (item.hp <= 0) {
                        let comboMult = 1;
                        if (window.gameState.comboRank === 'C') comboMult = 1.2;
                        else if (window.gameState.comboRank === 'B') comboMult = 1.5;
                        else if (window.gameState.comboRank === 'A') comboMult = 1.8;
                        else if (window.gameState.comboRank === 'S') comboMult = 2.5;
                        
                        let isHeavy = (item.type && (item.type.icon === '😈'));
                        window.gameState.score += Math.floor((isHeavy ? 200 : 100) * comboMult);
                        window.gameState.gold += 120;
                        return false;
                    }
                    return true;
                }
                return true;
            });
            this.checkLevelUp();
        }

        Engine.triggerScreenShake();
        Engine.createFloatingText(window.innerWidth / 2, window.innerHeight / 2, "🔥 АННИГИЛЯЦИЯ!", true);
        UI.update();
    },

    updateComboHud(isRankUp) {
        const comboHud = document.getElementById('combo-hud');
        const rankEl = document.getElementById('combo-rank');
        const countEl = document.getElementById('combo-count');

        if (!comboHud || !rankEl || !countEl) return;

        comboHud.classList.remove('hidden');
        countEl.textContent = `x${window.gameState.combo}`;
        
        rankEl.textContent = window.gameState.comboRank;
        rankEl.className = `combo-rank rank-${window.gameState.comboRank.toLowerCase()}`;

        if (isRankUp) {
            rankEl.classList.add('rank-up-anim');
            setTimeout(() => rankEl.classList.remove('rank-up-anim'), 200);
        }
    },

    updateFeverHud() {
        const bar = document.getElementById('fever-bar-fill');
        if (bar) bar.style.width = `${window.gameState.fever}%`;

        if (window.gameState && window.gameState.fever < 100) {
            const ultBtn = document.getElementById('ult-btn');
            if (ultBtn) {
                ultBtn.classList.remove('ready');
                ultBtn.innerHTML = '';
            }
        }
    },

    handleItemClick(item) {
        if (!window.gameState || !item || !item.type) return;

        const type = item.type;
        const icon = type.icon;
        
        const isMine = (icon === '💥');
        const isGold = (icon === '🪙');
        const isHeal = (icon === '❤️');
        const isShield = (icon === '🛡️');
        const isBoost = (icon === '⚡');
        const isMob = (icon === '👾' || icon === '😈');

        if (!isMine) {
            this.handleHitCombo();
        }

        let comboMult = 1;
        if (window.gameState.comboRank === 'C') comboMult = 1.2;
        else if (window.gameState.comboRank === 'B') comboMult = 1.5;
        else if (window.gameState.comboRank === 'A') comboMult = 1.8;
        else if (window.gameState.comboRank === 'S') comboMult = 2.5;

        if (isGold) {
            let bonus = (window.gameState.research?.goldBonus?.lvl || 0) * 5;
            window.gameState.gold += Math.floor((10 + bonus) * (window.gameState.isFeverActive ? 2 : 1));
            window.gameState.score += Math.floor(5 * comboMult);
            window.gameState.items = window.gameState.items.filter(i => i !== item);
            this.checkLevelUp();
        } 
        else if (isHeal) {
            window.gameState.hp = Math.min(100, window.gameState.hp + 25);
            window.gameState.items = window.gameState.items.filter(i => i !== item);
        } 
        else if (isShield) {
            window.gameState.isShieldActive = true;
            let extraTime = (window.gameState.research?.shieldDuration?.lvl || 0) * 2;
            window.gameState.shieldTimer += (6 + extraTime); 
            window.gameState.items = window.gameState.items.filter(i => i !== item);
        } 
        else if (isBoost) {
            window.gameState.score += Math.floor(50 * comboMult); 
            window.gameState.items = window.gameState.items.filter(i => i !== item);
        } 
        else if (isMine) {
            this.resetCombo(); 
            Engine.triggerScreenShake();
            if (!window.gameState.isFeverActive) window.gameState.hp -= 25; 
            window.gameState.items = window.gameState.items.filter(i => i !== item);
        } 
        else if (isMob) {
            if (item.hp !== undefined) {
                let damage = 1 + (window.gameState.research?.clickPower?.lvl || 0);
                item.hp -= damage;

                Engine.createFloatingText(item.x, item.y - 20, `-${damage}`, false);

                if (item.hp > 0) {
                    UI.update();
                    return; 
                }
            }

            let isHeavy = (icon === '😈');
            window.gameState.score += Math.floor((isHeavy ? 200 : 100) * comboMult);
            window.gameState.gold += (window.gameState.isFeverActive ? 120 : 60);
            window.gameState.items = window.gameState.items.filter(i => i !== item);
            this.checkLevelUp();
        }
        
        UI.update();
    },

    togglePause() {
        if (!window.gameState || window.gameState.hp <= 0 || window.gameState.isResearchOpen) return;
        window.gameState.isPaused = !window.gameState.isPaused;
        const pauseScreen = document.getElementById('pause-screen');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (window.gameState.isPaused) {
            if (pauseScreen) pauseScreen.classList.remove('hidden');
            if (pauseBtn) pauseBtn.textContent = '▶️'; 
        } else {
            if (pauseScreen) pauseScreen.classList.add('hidden');
            if (pauseBtn) pauseBtn.textContent = '⏸️'; 
        }
        UI.update();
    },

    toggleResearch() {
        if (!window.gameState || window.gameState.hp <= 0 || window.gameState.isPaused) return;
        window.gameState.isResearchOpen = !window.gameState.isResearchOpen;
        const researchScreen = document.getElementById('research-screen');
        if (window.gameState.isResearchOpen) {
            if (researchScreen) researchScreen.classList.remove('hidden');
        } else {
            if (researchScreen) researchScreen.classList.add('hidden');
        }
        UI.update();
    },

    checkLevelUp() {
        if (!window.gameState) return;
        let config = LEVEL_CONFIG?.[window.gameState.currentLevel];
        if (!config) return;

        if (window.gameState.score >= config.targetScore && LEVEL_CONFIG?.[window.gameState.currentLevel + 1]) {
            window.gameState.currentLevel++;
            let nextConfig = LEVEL_CONFIG[window.gameState.currentLevel];
            window.gameState.gold += 50;
            window.gameState.hp = Math.min(100, window.gameState.hp + 20);
            
            alert(`🎉 СЛЕДУЮЩИЙ УРОВЕНЬ!\n${nextConfig.name}`);
            UI.update();
        }
    },

    resetGame() {
        if (!window.gameState) return;
        window.gameState.currentLevel = 1;
        window.gameState.hp = 100;
        window.gameState.gold = 0;
        window.gameState.score = 0;
        window.gameState.isShieldActive = false;
        window.gameState.shieldTimer = 0;
        window.gameState.isPaused = false;
        window.gameState.isResearchOpen = false;
        window.gameState.items = [];
        window.gameState.splashes = [];
        window.gameState.floatingTexts = [];
        
        this.resetCombo();
        window.gameState.fever = 0;
        window.gameState.isFeverActive = false;
        window.gameState.feverDuration = 0;
        this.updateFeverHud();
        window.BASE_SPEED = 2.5;

        window.gameState.research = {
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

    setupEvents() {
        const pauseBtn = document.getElementById('pause-btn');
        const researchBtn = document.getElementById('research-btn');

        if (pauseBtn) pauseBtn.onclick = (e) => { e.stopPropagation(); this.togglePause(); };
        if (researchBtn) researchBtn.onclick = (e) => { e.stopPropagation(); this.toggleResearch(); };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && window.gameState && window.gameState.hp > 0) {
                if (!window.gameState.isPaused && !window.gameState.isResearchOpen) this.togglePause();
            }
        });
        
        this.startTimers();
    }
};

// Экспортируем и вешаем в window для обратной совместимости
export default Game;
window.Game = Game;