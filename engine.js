const Engine = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),

    // Кэшируем часто используемые значения
    _cachedConfig: null,
    _lastConfigCheck: 0,

    init() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
        this.setupTouches();
    },

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    },

    spawnItem() {
        const now = Date.now();
        if (!this._cachedConfig || now - this._lastConfigCheck > 1000) {
            this._cachedConfig = this._getConfig();
            this._lastConfigCheck = now;
        }

        if (!window.gameState) return;

        const config = this._cachedConfig;
        if (Math.random() > config.spawnRate) return;

        let newX = Math.random() * (this.canvas.width - 60) + 30;
        const newY = this.canvas.height + 60; // Чуть ниже, т.к. моб большой
        const minSafeDistance = 75;

        for (const existingItem of window.gameState.items) {
            if (existingItem.y > this.canvas.height - 100) {
                if (Math.abs(newX - existingItem.x) < minSafeDistance) return;
            }
        }

        const rand = Math.random();
        let type;
        let mineChance = config.mineChance;
        let finalRand = rand;

        if (window.gameState.hp < 30) {
            mineChance = mineChance / 2;
            if (rand >= 0.45 && rand < 0.45 + (mineChance * 2)) {
                if (Math.random() > 0.5) finalRand = 0.90;
            }
        }

        // Шансы выпадения: моб забирает последние 1.5% шанса
        if (finalRand < 0.45) type = config.types.GOLD;
        else if (finalRand < 0.45 + mineChance) type = config.types.MINE;
        else if (finalRand < 0.94) type = config.types.HEAL;
        else if (finalRand < 0.97) type = config.types.BOOST;
        else if (finalRand < 0.985) type = config.types.SHIELD;
        else type = config.types.MOB;

        let newItem = { x: newX, y: newY, speed: config.baseSpeed, type: type };
        
        // Если это моб, даем ему здоровье
        if (type === config.types.MOB) {
            newItem.hp = 10; 
            newItem.maxHp = 10;
        }

        window.gameState.items.push(newItem);
    },

    // Вынесена логика получения конфигурации в отдельный метод
 _getConfig() {
        if (!window.LEVEL_CONFIG) {
            window.LEVEL_CONFIG = {
                1: { name: "🚀 Волна 1: Мирное небо", targetScore: 100, hpLoss: 2, spawnRate: 0.03, mineChance: 0.4 },
                2: { name: "💥 Волна 2: Минное поле", targetScore: 300, hpLoss: 3, spawnRate: 0.04, mineChance: 0.6 }
            };
        }
        if (!window.BASE_SPEED) window.BASE_SPEED = 2.5;
        if (!window.TYPES) {
            window.TYPES = {
                GOLD:   { icon: '🪙', color: '#ffd700', radius: 22 },
                HEAL:   { icon: '❤️', color: '#4caf50', radius: 22 },
                SHIELD: { icon: '🛡️', color: '#2196f3', radius: 24 },
                BOOST:  { icon: '⚡', color: '#ff9800', radius: 22 },
                MINE:   { icon: '💥', color: '#f44336', radius: 22 },
                MOB:    { icon: '👾', color: '#9c27b0', radius: 55 }
            };
        }

        const currentLevel = window.LEVEL_CONFIG[window.gameState.currentLevel];
        return {
            spawnRate: currentLevel?.spawnRate || 0.03,
            mineChance: currentLevel?.mineChance || 0.40,
            baseSpeed: window.BASE_SPEED,
            types: window.TYPES
        };
    },

    createSplash(startX, startY, color = '#00f0ff') {
        if (!window.gameState) return;

        const particleCount = 12;
        // Предварительно вычисляем PI * 2
        const twoPI = Math.PI * 2;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * twoPI;
            const speed = Math.random() * 3 + 1;
            window.gameState.splashes.push({
                x: startX, y: startY,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2, alpha: 1,
                decay: Math.random() * 0.03 + 0.02,
                color: color
            });
        }
    },
    createFloatingText(x, y, text) {
        if (!window.gameState) return;
        if (!window.gameState.floatingTexts) window.gameState.floatingTexts = [];
        
        // Добавляем небольшой рандом по оси X, чтобы цифры не слипались при быстром тапе
        const offsetX = (Math.random() - 0.5) * 30; 
        window.gameState.floatingTexts.push({
            x: x + offsetX, 
            y: y - 20, 
            text: text, 
            alpha: 1, 
            vy: -1.5 // Скорость полета текста вверх
        });
    },

    render() {
        if (!window.gameState) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const isGameActive = !window.gameState.isPaused && !window.gameState.isResearchOpen;

        if (isGameActive) {
            this.spawnItem();
        }

        const items = window.gameState.items;
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            
            if (isGameActive) {
                item.y -= item.speed;
            }

            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.type.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = item.type.color + '22';
            this.ctx.strokeStyle = item.type.color;
            this.ctx.lineWidth = 2;
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.font = "24px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(item.type.icon, item.x, item.y);

            // Если это моб, можно опционально нарисовать его ХП прямо на нем (по желанию)
            if (item.type === this._cachedConfig?.types.MOB && item.hp) {
                this.ctx.font = "14px sans-serif";
                this.ctx.fillStyle = "#fff";
                this.ctx.fillText(`${item.hp}/${item.maxHp}`, item.x, item.y + 25);
            }

            if (item.y < -80) items.splice(i, 1); // Увеличили порог удаления из-за большого радиуса
        }

        const splashes = window.gameState.splashes;
        for (let i = splashes.length - 1; i >= 0; i--) {
            const p = splashes[i];
            
            if (isGameActive) {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;
            }

            if (p.alpha <= 0) {
                splashes.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
            this.ctx.restore();
        }

        // --- НОВОЕ: Отрисовка вылетающего текста ---
        if (window.gameState.floatingTexts) {
            const fts = window.gameState.floatingTexts;
            for (let i = fts.length - 1; i >= 0; i--) {
                const ft = fts[i];
                
                if (isGameActive) {
                    ft.y += ft.vy;
                    ft.alpha -= 0.03; // Скорость исчезновения текста
                }

                if (ft.alpha <= 0) {
                    fts.splice(i, 1);
                    continue;
                }

                this.ctx.save();
                this.ctx.globalAlpha = ft.alpha;
                this.ctx.font = "bold 22px sans-serif";
                this.ctx.textAlign = "center";
                this.ctx.fillStyle = "#ff3366"; // Красно-розовый цвет урона
                
                // Делаем белую обводку для читаемости на любом фоне
                this.ctx.strokeStyle = "#ffffff";
                this.ctx.lineWidth = 3;
                this.ctx.strokeText(ft.text, ft.x, ft.y);
                this.ctx.fillText(ft.text, ft.x, ft.y);
                this.ctx.restore();
            }
        }
    },


    setupTouches(){
        this.canvas.addEventListener('touchstart', (e) => {
            if (!window.gameState || window.gameState.hp <= 0 || 
                window.gameState.isPaused || window.gameState.isResearchOpen) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            this.createSplash(touchX, touchY);

            const items = window.gameState.items;
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                const dist = Math.hypot(touchX - item.x, touchY - item.y);

                if (dist < item.type.radius + 18) {
                    this.createSplash(item.x, item.y, '#ff2222');

                    // Проверяем, моб ли это
                    if (item.type === this._cachedConfig?.types.MOB) {
                        // Считаем урон (базовый 1 + прокачка из Лаборатории)
                        let damage = 1 + (window.gameState.research?.clickPower?.lvl || 0);
                        item.hp -= damage;
                        
                        // Запускаем анимацию вылетающего текста
                        this.createFloatingText(item.x, item.y - item.type.radius, `-${damage}`);

                        // Убиваем моба, только если ХП упало до нуля
                        if (item.hp <= 0) {
                            if (window.Game) window.Game.handleItemClick(item.type);
                            items.splice(i, 1);
                        }
                    } else {
                        // Обычные шарики лопаются с одного удара
                        if (window.Game) window.Game.handleItemClick(item.type);
                        items.splice(i, 1);
                    }
                    break;
                }
            }
        });
    }
};

window.Engine = Engine;