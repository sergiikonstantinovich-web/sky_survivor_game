const Game = {
    animationFrameId: null,
    isInitialized: false,
    comboTimer: null,

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

        if (window.Engine) window.Engine.init();
        this.setupEvents();
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
        
        this.loop();
    },

    loop() {
        if (!window.gameState) {
            Game.animationFrameId = requestAnimationFrame(() => Game.loop());
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
            if (window.Engine) window.Engine.render();
            Game.animationFrameId = requestAnimationFrame(() => Game.loop());
            return;
        }

        if (window.Engine) window.Engine.render();
        Game.animationFrameId = requestAnimationFrame(() => Game.loop());
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
                let hpLoss = window.LEVEL_CONFIG?.[window.gameState.currentLevel]?.hpLoss || 2;
                if (!window.gameState.isFeverActive) {
                    window.gameState.hp -= hpLoss;
                }
            }
            
            window.gameState.score += 1; 
            this.checkLevelUp(); 
            if (window.UI && typeof window.UI.update === 'function') window.UI.update();
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

        let maxFever = window.COMBAT_CONFIG?.feverMax || 100;
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

        let timeout = window.COMBAT_CONFIG?.comboTimeout || 3500;
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

        // Белая вспышка на весь экран
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.backgroundColor = '#ffffff';
        flash.style.zIndex = '9999';
        flash.style.pointerEvents = 'none';
        flash.style.transition = 'opacity 0.4s ease-out';
        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 400);
        }, 30);

        // Универсальная зачистка экрана ультой
        if (window.gameState.items && window.gameState.items.length > 0) {
            window.gameState.items = window.gameState.items.filter(item => {
                // Если у объекта есть здоровье (hp) — значит это моб. Любой моб!
                if (item.hp !== undefined) {
                    
                    item.hp -= 10; // Наносим фиксированные 10 урона
                    
                    if (window.Engine && typeof window.Engine.createFloatingText === 'function') {
                        window.Engine.createFloatingText(item.x, item.y, "-10 🔥", true);
                    }

                    // Если моб погиб от ульты
                    if (item.hp <= 0) {
                        let comboMult = 1;
                        if (window.gameState.comboRank === 'C') comboMult = 1.2;
                        else if (window.gameState.comboRank === 'B') comboMult = 1.5;
                        else if (window.gameState.comboRank === 'A') comboMult = 1.8;
                        else if (window.gameState.comboRank === 'S') comboMult = 2.5;
                        
                        // Проверяем, тяжелый ли это моб, чтобы выдать двойную награду
                        let isHeavy = (item.type && (item.type.icon === '😈' || item.type === window.TYPES?.HEAVY_MOB));
                        window.gameState.score += Math.floor((isHeavy ? 200 : 100) * comboMult);
                        window.gameState.gold += 120; // В ульте всегда x2 золото (60 * 2)
                        return false; // Удаляем из массива (убит)
                    }
                    return true; // Оставляем на экране (выжил, но получил урон)
                }
                return true; // Все остальные предметы (золото, мины, щиты) ульта не трогает
            });
            this.checkLevelUp();
        }

        if (window.Engine && typeof window.Engine.triggerScreenShake === 'function') {
            window.Engine.triggerScreenShake();
        }
        
        if (window.Engine && typeof window.Engine.createFloatingText === 'function') {
            window.Engine.createFloatingText(window.innerWidth / 2, window.innerHeight / 2, "🔥 АННИГИЛЯЦИЯ!", true);
        }
        
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
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
        
        const types = window.TYPES || {
            GOLD: '🪙', MINE: '💥', HEAL: '❤️', BOOST: '⚡', SHIELD: '🛡️', MOB: '👾', HEAVY_MOB: '😈'
        };

        const isMine = (icon === '💥' || type === types.MINE);
        const isGold = (icon === '🪙' || type === types.GOLD);
        const isHeal = (icon === '❤️' || type === types.HEAL);
        const isShield = (icon === '🛡️' || type === types.SHIELD);
        const isBoost = (icon === '⚡' || type === types.BOOST);
        // Теперь проверяем оба типа мобов: и обычного, и тяжелого
        const isMob = (icon === '👾' || type === types.MOB || icon === '😈' || type === types.HEAVY_MOB);

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
            if (window.Engine && typeof window.Engine.triggerScreenShake === 'function') {
                window.Engine.triggerScreenShake(); 
            }
            if (!window.gameState.isFeverActive) window.gameState.hp -= 25; 
            window.gameState.items = window.gameState.items.filter(i => i !== item);
        } 
        else if (isMob) {
            if (item.hp !== undefined) {
                let damage = 1 + (window.gameState.research?.clickPower?.lvl || 0);
                item.hp -= damage;

                if (window.Engine && typeof window.Engine.createFloatingText === 'function') {
                    window.Engine.createFloatingText(item.x, item.y - 20, `-${damage}`, false);
                }

                if (item.hp > 0) {
                    if (window.UI && typeof window.UI.update === 'function') window.UI.update();
                    return; 
                }
            }

            // Награда за убийство моба (тяжелому можно отсыпать чуть больше очков)
            let isHeavy = (icon === '😈' || type === types.HEAVY_MOB);
            window.gameState.score += Math.floor((isHeavy ? 200 : 100) * comboMult);
            window.gameState.gold += (window.gameState.isFeverActive ? 120 : 60);
            window.gameState.items = window.gameState.items.filter(i => i !== item);
            this.checkLevelUp();
        }
        
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
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
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
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
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
    },

    checkLevelUp() {
        if (!window.gameState) return;
        let config = window.LEVEL_CONFIG?.[window.gameState.currentLevel];
        if (!config) return;

        if (window.gameState.score >= config.targetScore && window.LEVEL_CONFIG?.[window.gameState.currentLevel + 1]) {
            window.gameState.currentLevel++;
            let nextConfig = window.LEVEL_CONFIG[window.gameState.currentLevel];
            window.gameState.gold += 50;
            window.gameState.hp = Math.min(100, window.gameState.hp + 20);
            
            alert(`🎉 СЛЕДУЮЩИЙ УРОВЕНЬ!\n${nextConfig.name}`);
            if (window.UI && typeof window.UI.update === 'function') window.UI.update();
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
            grid.classList.remove('ready');
            ultBtn.innerHTML = '';
        }
        
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
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

window.Game = Game;
window.onload = () => Game.start();
