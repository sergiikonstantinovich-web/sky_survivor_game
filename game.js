const Game = {
    animationFrameId: null,

    start() {
        // Железная подстраховка: если config.js не успел, создаем gameState прямо здесь
        if (!window.gameState) {
            window.gameState = {
                hp: 100, gold: 0, score: 0, currentLevel: 1,
                isShieldActive: false, shieldTimer: 0, isPaused: false,
                upgradeCost: 100, items: [], splashes: []
            };
        }

        if (window.Engine) window.Engine.init();
        this.setupEvents();
        if (window.UI) window.UI.update();
        
        // Запускаем цикл
        this.loop();
    },

    loop() {
        // Если gameState вдруг пропал, не ломаем игру, а просто ждем его на следующем кадре
        if (!window.gameState) {
            Game.animationFrameId = requestAnimationFrame(() => Game.loop());
            return;
        }

        // Если игра на паузе или ХП кончилось, анимацию холста НЕ останавливаем (чтобы рисовалась пауза/сплэши)
        if (window.gameState.hp > 0 && !window.gameState.isPaused) {
            if (window.Engine) window.Engine.render();
        } else if (window.gameState.isPaused) {
            // Если пауза, всё равно рендерим, чтобы видеть застывший экран и искры от тапов
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
        
        if (window.gameState.isPaused) {
            window.UI.pauseScreen.classList.remove('hidden');
            window.UI.pauseBtn.textContent = '▶️'; 
        } else {
            window.UI.pauseScreen.classList.add('hidden');
            window.UI.pauseBtn.textContent = '⏸️'; 
        }
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
        
        window.UI.pauseScreen.classList.add('hidden');
        window.UI.pauseBtn.textContent = '⏸️';
        window.UI.update();
    },

    setupEvents() {
        window.UI.pauseBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            this.togglePause();
        });

        window.UI.researchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.gameState && !window.gameState.isPaused && window.gameState.hp > 0) {
                this.togglePause();
            }
        });

        window.UI.pauseScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.togglePause();
        });

        window.UI.upgradeBtn.addEventListener('click', () => {
            if (!window.gameState) return;
            if (window.gameState.gold >= window.gameState.upgradeCost && window.gameState.hp > 0 && !window.gameState.isPaused) {
                window.gameState.gold -= window.gameState.upgradeCost;
                window.gameState.upgradeCost += 50;
                window.UI.update();
            }
        });

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
