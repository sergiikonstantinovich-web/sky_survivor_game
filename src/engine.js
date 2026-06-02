console.log('🔶 Engine.js загружен');
// ========== src/engine.js ==========
import { BASE_SPEED, TYPES } from './config/gameConfig.js';

// Храним ссылки на canvas и ctx
let canvas, ctx;

// Функции для доступа из Game (пока оставляем в глобальном window)
const Engine = {
    canvas: null,
    ctx: null,

    init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.ctx = ctx;
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
        this.setupTouches();
    },

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    },

    triggerScreenShake() {
        const container = this.canvas ? this.canvas.parentElement : null;
        if (!container) return;
        container.classList.add('shake-active');
        setTimeout(() => {
            container.classList.remove('shake-active');
        }, 150);
    },

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

        let type;
        const rand = Math.random();
        let mineChance = currentLevel?.mineChance || 0.40;

        // Спасение игрока: если ХП < 30, с шансом 35% выкидываем аптечку
        if (window.gameState.hp < 30 && Math.random() < 0.35) {
            type = TYPES.HEAL;
        } else {
            if (rand < 0.40) type = TYPES.GOLD;
            else if (rand < 0.40 + mineChance) type = TYPES.MINE;
            else if (rand < 0.75) type = TYPES.HEAL;
            else if (rand < 0.80) type = TYPES.BOOST;
            else if (rand < 0.85) type = TYPES.SHIELD;
            else {
                type = (Math.random() < 0.30) ? TYPES.HEAVY_MOB : TYPES.MOB;
            }
        }

        const radius = type.radius || 22;
        let newX = Math.random() * (this.canvas.width - (radius * 2)) + radius;
        const newY = this.canvas.height + radius + 10; 

        let newItem = { 
            x: newX, 
            y: newY, 
            speed: BASE_SPEED, 
            type: type 
        };
        
        if (type === TYPES.MOB) {
            newItem.hp = 10; 
            newItem.maxHp = 10;
        } else if (type === TYPES.HEAVY_MOB) {
            newItem.hp = 20;
            newItem.maxHp = 20;
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
                item.y -= item.speed || BASE_SPEED;
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

            // Полоска HP для мобов
            if (item.hp !== undefined) {
                this.ctx.font = "bold 13px sans-serif";
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillText(`HP: ${item.hp}/${item.maxHp}`, item.x, item.y + (item.type.radius ? item.type.radius - 27 : 28));
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

        // Отрисовка плавающего текста
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
        let hit = false;
        
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            const radius = item.type.radius || 22;

            const dist = Math.hypot(touchX - item.x, touchY - item.y);

            if (dist <= radius + 15) { 
                e.preventDefault();
                e.stopPropagation();
                hit = true;
                this.createSplash(item.x, item.y, item.type.color || '#fff');

                if (window.Game && typeof window.Game.handleItemClick === 'function') {
                    window.Game.handleItemClick(item);
                }
                break; 
            }
        }
        
        // Если кликнули в пустоту — сплэш
        if (!hit) {
            this.createSplash(touchX, touchY, '#00d2ff');
        }
    };

    this.canvas.addEventListener('touchstart', handler, { passive: false });
    this.canvas.addEventListener('mousedown', handler);
}
};

// Экспортируем и вешаем в window для обратной совместимости
export default Engine;
window.Engine = Engine;