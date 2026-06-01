const Game = {
    animationFrameId: null,
    isInitialized: false,

    start() {
        if (this.isInitialized) return; 
        this.isInitialized = true; 

        if (!window.gameState) {
            window.gameState = {
                hp: 100, gold: 0, score: 0, currentLevel: 1,
                isShieldActive: false, shieldTimer: 0, isPaused: false,
                isResearchOpen: false, // Новый флаг для отслеживания Лаборатории
                items: [], splashes: [],
                    floatingTexts: [],
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

        // КРИТИЧЕСКИЙ ФИКС: Если игрок умер
        if (window.gameState.hp <= 0) {
            if (!window.gameState.isPaused) {
                window.gameState.isPaused = true; // Тормозим логику таймеров
                
                setTimeout(() => {
                    alert(`💀 ИГРА ОКОНЧЕНА!\nВы набрали очков: ${window.gameState.score}`);
                    this.resetGame();
                }, 10);
            }
            
            if (window.Engine) window.Engine.render();
            Game.animationFrameId = requestAnimationFrame(() => Game.loop());
            return;
        }

        // Отрисовка кадра (Движок внутри себя в движении шариков проверит и паузу, и лабораторию)
        if (window.Engine) window.Engine.render();

        Game.animationFrameId = requestAnimationFrame(() => Game.loop());
    },



    startTimers() {
        setInterval(() => {
            if (!window.gameState || window.gameState.hp <= 0 || window.gameState.isPaused || window.gameState.isResearchOpen) return; 
            
            if (window.gameState.isShieldActive) {
                window.gameState.shieldTimer--;
                if (window.gameState.shieldTimer <= 0) window.gameState.isShieldActive = false;
            } else {
                let hpLoss = window.LEVEL_CONFIG?.[window.gameState.currentLevel]?.hpLoss || 2;
                window.gameState.hp -= hpLoss; 
            }
            
            window.gameState.score += 1; 
            this.checkLevelUp(); 
            if (window.UI && typeof window.UI.update === 'function') window.UI.update();
        }, 1000);
    },

    handleItemClick(type) {
        if (!window.gameState) return;

        if (type === window.TYPES.GOLD) {
            let bonus = (window.gameState.research?.goldBonus?.lvl || 0) * 5;
            window.gameState.gold += (10 + bonus);
            window.gameState.score += 5;
            this.checkLevelUp();
        } else if (type === window.TYPES.HEAL) {
            window.gameState.hp = Math.min(100, window.gameState.hp + 25);
        } else if (type === window.TYPES.SHIELD) {
            window.gameState.isShieldActive = true;
            let extraTime = (window.gameState.research?.shieldDuration?.lvl || 0) * 2;
            window.gameState.shieldTimer += (6 + extraTime); 
        } else if (type === window.TYPES.BOOST) {
            window.gameState.score += 50; 
        } else if (type === window.TYPES.MINE) {
            window.gameState.hp -= 25; 
        } else if (type === window.TYPES.MOB) {
            // Награда за уничтожение жирного моба!
            window.gameState.score += 100;
            window.gameState.gold += 30;
            this.checkLevelUp();
        }
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
    },

    // КЛАССИЧЕСКАЯ ПАУЗА (ОКНО СПРАВА)
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

    // ЛАБОРАТОРИЯ ИССЛЕДОВАНИЙ (ОКНО СЛЕВА)
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
            
            alert(`🎉 СЛЕДУЮЩИЙ УРОВЕНЬ!\n${nextConfig.name}\nБонус: +50 и +20 ХП`);
            if (window.UI && typeof window.UI.update === 'function') window.UI.update();
        }
    },

 resetGame() {
        if (!window.gameState) return;

        // Полный сброс всех параметров к стартовым
        window.gameState.currentLevel = 1;
        window.gameState.hp = 100;
        window.gameState.gold = 0;
        window.gameState.score = 0;
        window.gameState.isShieldActive = false;
        window.gameState.shieldTimer = 0;
        window.gameState.isPaused = false; // Снимаем паузу смерти!
        window.gameState.isResearchOpen = false;
        window.gameState.items = [];
        window.gameState.splashes = [];
        window.gameState.floatingTexts = [];
        // Сброс дерева лаборатории
        window.gameState.research = {
            clickPower: { lvl: 0, max: 5, cost: 40 },
            goldBonus: { lvl: 0, max: 5, cost: 50 },
            shieldDuration: { lvl: 0, max: 5, cost: 60 }
        };
        
        // Скрываем экраны, если они были открыты
        const pauseScreen = document.getElementById('pause-screen') || document.getElementById('pauseScreen');
        const researchScreen = document.getElementById('research-screen') || document.getElementById('researchScreen');
        const pauseBtn = document.getElementById('pause-btn') || document.getElementById('pauseBtn');
        
        if (pauseScreen) pauseScreen.classList.add('hidden');
        if (researchScreen) researchScreen.classList.add('hidden');
        if (pauseBtn) pauseBtn.textContent = '⏸️';
        
        // Обновляем интерфейс, чтобы игрок увидел 100 ХП и 0 золота
        if (window.UI && typeof window.UI.update === 'function') window.UI.update();
    },

    setupEvents() {
        const pauseBtn = document.getElementById('pause-btn') || document.getElementById('pauseBtn');
        const researchBtn = document.getElementById('research-btn') || document.getElementById('researchBtn');

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
            if (document.hidden && window.gameState && window.gameState.hp > 0) {
                if (!window.gameState.isPaused && !window.gameState.isResearchOpen) {
                    this.togglePause();
                }
            }
        });
        
        this.startTimers();
    }
};

window.Game = Game;
window.onload = () => Game.start();
