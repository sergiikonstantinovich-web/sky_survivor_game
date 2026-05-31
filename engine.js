const Engine = {
    canvas: document.getElementById('gameCanvas'),
    ctx: document.getElementById('gameCanvas').getContext('2d'),

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
        // ПОДСТРАХОВКА: Если config.js не загрузился, принудительно создаем конфиги в window
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
                MINE:   { icon: '💥', color: '#f44336', radius: 22 }
            };
        }

        if (!window.gameState) return;

        let currentSpawnRate = window.LEVEL_CONFIG[window.gameState.currentLevel]?.spawnRate || 0.03;
        if (Math.random() > currentSpawnRate) return;

        let newX = Math.random() * (this.canvas.width - 60) + 30;
        const newY = this.canvas.height + 50; 
        const minSafeDistance = 65; 

        for (let i = 0; i < window.gameState.items.length; i++) {
            let existingItem = window.gameState.items[i];
            if (existingItem.y > this.canvas.height - 100) {
                if (Math.abs(newX - existingItem.x) < minSafeDistance) return; 
            }
        }

        const rand = Math.random();
        let type;
        let mineChance = window.LEVEL_CONFIG[window.gameState.currentLevel]?.mineChance || 0.40;
        let finalRand = rand;
        
        if (window.gameState.hp < 30) {
            mineChance = mineChance / 2;
            if (rand >= 0.45 && rand < 0.45 + (mineChance * 2)) {
                if (Math.random() > 0.5) finalRand = 0.90; 
            }
        }

        if (finalRand < 0.45) type = window.TYPES.GOLD;       
        else if (finalRand < 0.45 + mineChance) type = window.TYPES.MINE;  
        else if (finalRand < 0.94) type = window.TYPES.HEAL;  
        else if (finalRand < 0.98) type = window.TYPES.BOOST; 
        else type = window.TYPES.SHIELD;                 

        window.gameState.items.push({ x: newX, y: newY, speed: window.BASE_SPEED, type: type });
    },

    createSplash(startX, startY) {
        if (!window.gameState) return;

        const particleCount = 12; 
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1; 
            window.gameState.splashes.push({
                x: startX, y: startY,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2, alpha: 1, decay: Math.random() * 0.03 + 0.02 
            });
        }
    },

    render() {
        if (!window.gameState) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Генерируем новые шарики
        this.spawnItem();

        // Отрисовка летящих фигур
        for (let i = window.gameState.items.length - 1; i >= 0; i--) {
    let item = window.gameState.items[i];
    
    // СТРОГО ВОТ ТАК: Если игра на паузе, item.y НЕ должен меняться!
    if (!window.gameState.isPaused) {
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

            if (item.y < -50) window.gameState.items.splice(i, 1);
        }

        // Отрисовка сплэш-искр
        for (let i = window.gameState.splashes.length - 1; i >= 0; i--) {
            let p = window.gameState.splashes[i];
            p.x += p.vx; p.y += p.vy; p.alpha -= p.decay; 

            if (p.alpha <= 0) {
                window.gameState.splashes.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#00f0ff'; 
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00f0ff';
            this.ctx.fill();
            this.ctx.restore();
        }
    },

    setupTouches() {
        this.canvas.addEventListener('touchstart', (e) => {
            if (!window.gameState || window.gameState.hp <= 0 || window.gameState.isPaused) return; 
            e.preventDefault(); 
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            this.createSplash(touchX, touchY);

            for (let i = window.gameState.items.length - 1; i >= 0; i--) {
                let item = window.gameState.items[i];
                let dist = Math.hypot(touchX - item.x, touchY - item.y);

                if (dist < item.type.radius + 18) { 
                    if (window.Game) window.Game.handleItemClick(item.type);
                    window.gameState.items.splice(i, 1); 
                    break;
                }
            }
        });
    }
};

window.Engine = Engine;
