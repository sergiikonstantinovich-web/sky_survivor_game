const Game = {
    animationFrameId: null,
    isInitialized: false, // Флаг-замок

    start() {
        // Если игра УЖЕ запущена — игнорируем повторный вызов
        if (this.isInitialized) return; 
        this.isInitialized = true; 

        // Железная подстраховка состояния (убрали рудимент upgradeCost)
        if (!window.gameState) {
            window.gameState = {
                hp: 100, gold: 0, score: 0, currentLevel: 1,
                isShieldActive: false, shieldTimer: 0, isPaused: false,
                items: [], splashes: []
            };
        }

        if (window.Engine) window.Engine.init();
        this.setupEvents();
        if (window.UI) window.UI.update();
        
        // Запускаем единственный цикл
        this.loop();
    },

    loop() {
        // Если gameState вдруг пропал, не ломаем игру, а просто ждем его на следующем кадре
        if (!window.gameState) {
            Game.animationFrameId = requestAnimationFrame(() => Game.loop());
            return;
        }

        // Если игра на паузе или ХП кончилось, анимацию холста НЕ останавливаем
        if (window.gameState.hp > 0 && !window.gameState.isPaused) {
            if (window.Engine) window.Engine.render();
        } else if (window.gameState.isPaused) {
            if (window.Engine) window.Engine.render();
        }

        Game.animationFrameId = requestAnimationFrame(() => Game.loop());
    },

    startTimers() {
        setInterval(() => {
            if (!window.gameState || window.gameState.hp <= 0 || window.gameState.isPaused) return; 
            
            if (window.gameState.isShieldActive) {
                window.gameState.shieldTimer--;
                if (window.gameState.shieldTimer <= 0) window.gameState.isShieldActive = false;
            } else {
                let hpLoss = window.LEVEL_CONFIG?.[window.gameState.currentLevel]?.hpLoss || 2;
                window.gameState.hp -= hpLoss; 
            }
            
            window.gameState.score += 1; 
            this.checkLevelUp(); 
            if (window.UI) window.UI.update();
        }, 1000);
    },

    handleItemClick(type) {
        if (!window.gameState) return;

        if (type === window.TYPES.GOLD) {
            window.gameState.gold += 10;
            window.gameState.score += 5;
            this.checkLevelUp();
        } else if (type === window.TYPES.HEAL) {
            window.gameState.hp = Math.min(100, window.gameState.hp + 25);
        } else if (type === window.TYPES.SHIELD) {
            window.gameState.isShieldActive = true;
            window.gameState.shieldTimer += 6; 
        } else if (type === window.TYPES.BOOST) {
            window.gameState.score += 50; 
        } else if (type === window.TYPES.MINE) {
            window.gameState.hp -= 25; 
        }
        if (window.UI) window.UI.update();
    },

    togglePause() {
        if (!window.gameState || window.gameState.hp <= 0) return;
        
        window.gameState.isPaused = !window.gameState.isPaused;
        
        const pauseScreen = window.UI?.pauseScreen || 
                            document.getElementById('pauseScreen') || 
                            document.getElementById('pausescreen');
                            
        const pauseBtn = window.UI?.pauseBtn || 
                          document.getElementById('pauseBtn') || 
                          document.getElementById('pausebtn');
        
        if (window.gameState.isPaused) {
            if (pauseScreen) pauseScreen.classList.remove('hidden');
            if (pauseBtn) pauseBtn.textContent = '▶️'; 
        } else {
            if (pauseScreen) pauseScreen.classList.add('hidden');
            if (pauseBtn) pauseBtn.textContent = '⏸️'; 
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
            
            alert(`🎉 СЛЕДУЮЩИЙ УРОВЕНЬ!\n${nextConfig.name}\nБонус: +50 и +20 ХП`);
            window.UI.update();
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
        window.gameState.items = [];
        window.gameState.splashes = [];
        
        const pauseScreen = window.UI?.pauseScreen || 
                            document.getElementById('pauseScreen') || 
                            document.getElementById('pausescreen');
                            
        const pauseBtn = window.UI?.pauseBtn || 
                          document.getElementById('pauseBtn') || 
                          document.getElementById('pausebtn');
        
        if (pauseScreen) pauseScreen.classList.add('hidden');
        if (pauseBtn) pauseBtn.textContent = '⏸️';
        
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
    },

    setupEvents() {
        // Если ui.js не успел создать объект UI, собираем его без апгрейд-кнопки
        if (!window.UI) {
            window.UI = {
                pauseBtn: document.getElementById('pauseBtn'),
                researchBtn: document.getElementById('researchBtn'),
                pauseScreen: document.getElementById('pauseScreen'),
                update: function() { if (typeof updateUI === 'function') updateUI(); }
            };
        }

        const pauseBtn = window.UI.pauseBtn || document.getElementById('pauseBtn');
        const researchBtn = window.UI.researchBtn || document.getElementById('researchBtn');
        const pauseScreen = window.UI.pauseScreen || document.getElementById('pauseScreen');

        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                this.togglePause();
            });
        }

        if (researchBtn) {
            researchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.gameState && !window.gameState.isPaused && window.gameState.hp > 0) {
                    this.togglePause();
                }
            });
        }

        if (pauseScreen) {
            pauseScreen.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.togglePause();
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && window.gameState && !window.gameState.isPaused && window.gameState.hp > 0) {
                this.togglePause();
            }
        });
        
        this.startTimers();
    }
};

window.Game = Game;
window.onload = () => Game.start();
