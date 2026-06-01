const Engine = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),

    init() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
        this.setupTouches();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    },

    // Метод вызова тряски игрового контейнера
    triggerScreenShake() {
        const container = this.canvas.parentElement;
        if (!container) return;
        container.classList.add('shake-active');
        setTimeout(() => {
            container.classList.remove('shake-active');
        }, 150);
    },

    // Создание вылетающих цифр урона
    createFloatingText(x, y, text, isCrit = false) {
        if (!window.gameState || !window.gameState.floatingTexts) return;
        window.gameState.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            vy: -2,
            alpha: 1,
            isCrit: isCrit
        });
    },

    // Создание частиц взрыва (сплэша)
    createSplash(x, y, color) {
        if (!window.gameState || !window.gameState.splashes) return;
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            window.gameState.splashes.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 3 + 2,
                color: color || '#ffffff',
                alpha: 1,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    },

    spawnItem() {
        if (!window.gameState) return;

        const lvl = window.gameState.currentLevel || 1;
        const currentLevel = window.LEVEL_CONFIG?.[lvl];
        
        let baseRate = currentLevel?.spawnRate || 0.02; 
        let rate = window.gameState.isFeverActive ? baseRate * 2.5 : baseRate;

        if (Math.random() > rate) return;

        const types = window.TYPES || {
            GOLD:   { icon: '🪙', color: '#ffd700', radius: 22 },
            MINE:   { icon: '💥', color: '#f44336', radius: 22 },
            HEAL:   { icon: '❤️', color: '#4caf50', radius: 22 },
            BOOST:  { icon: '⚡', color: '#ff9800', radius: 22 },
            SHIELD: { icon: '🛡️', color: '#2196f3', radius: 24 },
            MOB:    { icon: '👾', color: '#9c27b0', radius: 55 }
        };

        let type;
        const rand = Math.random();
        let mineChance = currentLevel?.mineChance || 0.40;

        // СПАСЕНИЕ ИГРОКА: Если ХП < 30, с шансом 35% выкидываем аптечку
        if (window.gameState.hp < 30 && Math.random() < 0.35) {
            type = types.HEAL;
        } else {
            if (rand < 0.40) type = types.GOLD;
            else if (rand < 0.40 + mineChance) type = types.MINE;
            else if (rand < 0.75) type = types.HEAL;
            else if (rand < 0.80) type = types.BOOST;
            else if (rand < 0.85) type = types.SHIELD;
            else type = types.MOB;
        }

        // ФИКС ОСИ X: Отступ рассчитывается от радиуса шара! Моб больше не вылезет за экран
        const radius = type.radius || 22;
        let newX = Math.random() * (this.canvas.width - (radius * 2)) + radius;
        const newY = this.canvas.height + radius + 10; 

        let speed = window.BASE_SPEED || 2.5;

        let newItem = { 
            x: newX, 
            y: newY, 
            speed: speed, 
            type: type 
        };
        
        if (type === types.MOB || type.icon === '👾') {
            newItem.hp = 10; 
            newItem.maxHp = 10;
        }

        window.gameState.items.push(newItem);
    },

    render() {
        if (!window.gameState || !this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const isGameActive = !window.gameState.isPaused && !window.gameState.isResearchOpen;

        if (isGameActive) {
            this.spawnItem();
        }

        const items = window.gameState.items || [];
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            
            if (isGameActive) {
                let currentSpeed = window.BASE_SPEED || item.speed || 2.5;
                item.y -= currentSpeed;
            }

            // Отрисовка неонового шара
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.type.radius || 22, 0, Math.PI * 2);
            this.ctx.fillStyle = (item.type.color || '#fff') + '22';
            this.ctx.strokeStyle = item.type.color || '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.fill();
            this.ctx.stroke();

            // Эмодзи
            this.ctx.font = "24px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(item.type.icon, item.x, item.y);

            // Полоска HP для моба
            if (item.hp !== undefined) {
                this.ctx.font = "bold 13px sans-serif";
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillText(`HP: ${item.hp}/${item.maxHp}`, item.x, item.y + 28);
            }

            if (item.y < -100) {
                items.splice(i, 1);
            }
        }

        // Отрисовка сплэшей
        const splashes = window.gameState.splashes || [];
        for (let i = splashes.length - 1; i >= 0; i--) {
            const p = splashes[i];
            if (isGameActive) {
                p.x += p.vx; 
                p.y += p.vy; 
                p.alpha -= p.decay;
            }
            if (p.alpha <= 0) { splashes.splice(i, 1); continue; }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            this.ctx.restore();
        }

        // Отрисовка плавающего текста урона
        const fts = window.gameState.floatingTexts || [];
        for (let i = fts.length - 1; i >= 0; i--) {
            const ft = fts[i];
            if (isGameActive) {
                ft.y += ft.vy;
                ft.alpha -= 0.025;
            }
            if (ft.alpha <= 0) { fts.splice(i, 1); continue; }

            this.ctx.save();
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.font = "bold 22px sans-serif";
            this.ctx.fillStyle = "#ff3366";
            this.ctx.strokeStyle = "#ffffff";
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = "center";
            this.ctx.strokeText(ft.text, ft.x, ft.y);
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();
        }
    },

    setupTouches() {
        const handler = (e) => {
            if (!window.gameState || window.gameState.isPaused || window.gameState.isResearchOpen) return;

            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const touchX = clientX - rect.left;
            const touchY = clientY - rect.top;

            const items = window.gameState.items || [];
            let hitSomething = false; // Флаг: попали ли мы хоть в один шар?
            
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                const radius = item.type.radius || 22;

                const dist = Math.hypot(touchX - item.x, touchY - item.y);

                // Если попали в шар (с учетом форы +15px)
                if (dist <= radius + 15) { 
                    e.preventDefault();
                    e.stopPropagation();

                    hitSomething = true; // Фиксируем попадание

                    // Бахаем РОДНОЙ ЦВЕТ шара (золотой, зеленый, фиолетовый и т.д.)
                    this.createSplash(item.x, item.y, item.type.color || '#fff');

                    // Передаем ВЕСЬ объект шара в игру
                    if (window.Game && typeof window.Game.handleItemClick === 'function') {
                        window.Game.handleItemClick(item);
                    }
                    
                    break; // Выходим из цикла, чтобы не зацепить нижние шары
                }
            }

            // ЕСЛИ ПРОМАХНУЛИСЬ (кликнули в пустое место холста)
            if (!hitSomething) {
                // Создаем неоново-голубой сплэш строго в точке тапа/клика!
                this.createSplash(touchX, touchY, '#00d2ff');
            }
        };

        this.canvas.addEventListener('touchstart', handler, { passive: false });
        this.canvas.addEventListener('mousedown', handler);
    }

};

window.Engine = Engine;
