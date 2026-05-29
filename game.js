const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Статы
let hp = 100;
let gold = 0;
let score = 0;
let isShieldActive = false;
let shieldTimer = 0;
let isPaused = false; // ТУТ ХРАНИМ СОСТОЯНИЕ ПАУЗЫ

// Настройки скорости и спавна
let baseSpeed = 2; 
let spawnRate = 0.02; 
let upgradeCost = 100;

// Массивы для игры
let items = [];
let splashes = []; 

// Типы объектов
const TYPES = {
    GOLD:   { icon: '🪙', color: '#ffd700', radius: 22 },
    HEAL:   { icon: '❤️', color: '#4caf50', radius: 22 },
    SHIELD: { icon: '🛡️', color: '#2196f3', radius: 24 },
    BOOST:  { icon: '⚡', color: '#ff9800', radius: 22 },
    MINE:   { icon: '💥', color: '#f44336', radius: 22 }
};

// UI элементы
const hpEl = document.getElementById('hp-val');
const goldEl = document.getElementById('gold-val');
const scoreEl = document.getElementById('score-val');
const upgradeBtn = document.getElementById('upgrade-btn');
const upgradeCostText = document.getElementById('upgrade-cost-text');
const pauseBtn = document.getElementById('pause-btn');
const pauseScreen = document.getElementById('pause-screen');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Пассивная потеря ХП (срабатывает только если нет паузы)
setInterval(() => {
    if (hp <= 0 || isPaused) return; // Если пауза — ХП не капает!
    
    if (isShieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) isShieldActive = false;
    } else {
        hp -= 2; 
    }
    score += 1; 
    updateUI();
}, 1000);

// Умный спавн без слипания шариков
function spawnItem() {
    if (Math.random() > spawnRate) return;

    let newX = Math.random() * (canvas.width - 60) + 30;
    const newY = canvas.height + 50; 
    const minSafeDistance = 65; 

    for (let i = 0; i < items.length; i++) {
        let existingItem = items[i];
        if (existingItem.y > canvas.height - 100) {
            let distanceX = Math.abs(newX - existingItem.x);
            if (distanceX < minSafeDistance) {
                return; 
            }
        }
    }

    const rand = Math.random();
    let type;

    if (rand < 0.45) type = TYPES.GOLD;       
    else if (rand < 0.85) type = TYPES.MINE;  
    else if (rand < 0.94) type = TYPES.HEAL;  
    else if (rand < 0.98) type = TYPES.BOOST; 
    else type = TYPES.SHIELD;                 

    items.push({
        x: newX,
        y: newY, 
        speed: baseSpeed + Math.random() * 1.5,
        type: type
    });
}

// Создание частиц сплэша
function createSplash(startX, startY) {
    const particleCount = 12; 
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1; 
        
        splashes.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 4 + 2, 
            alpha: 1, 
            decay: Math.random() * 0.03 + 0.02 
        });
    }
}

// Главный цикл анимации
function gameLoop() {
    if (hp <= 0) return;

    // Если игра на паузе, мы просто стопим этот цикл и не перерисовываем кадры
    if (isPaused) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spawnItem();

    // Отрисовка летящих фигур
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y -= item.speed; 

        ctx.beginPath();
        ctx.arc(item.x, item.y, item.type.radius, 0, Math.PI * 2);
        ctx.fillStyle = item.type.color + '22'; 
        ctx.strokeStyle = item.type.color;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.type.icon, item.x, item.y);

        if (item.y < -50) {
            items.splice(i, 1);
        }
    }

    // Отрисовка сплэш-искр
    for (let i = splashes.length - 1; i >= 0; i--) {
        let p = splashes[i];
        p.x += p.vx; 
        p.y += p.vy; 
        p.alpha -= p.decay; 

        if (p.alpha <= 0) {
            splashes.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff'; 
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.fill();
        ctx.restore();
    }

    requestAnimationFrame(gameLoop);
}

// ЛОГИКА ВКЛЮЧЕНИЯ / ВЫКЛЮЧЕНИЯ ПАУЗЫ
function togglePause() {
    if (hp <= 0) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        pauseBtn.textContent = '▶️'; // Меняем значок кнопки на Плей
    } else {
        pauseScreen.classList.add('hidden');
        pauseBtn.textContent = '⏸️'; // Возвращаем значок Паузы
        gameLoop(); // Перезапускаем цикл анимации
    }
}

// Клик по кнопке паузы в углу
pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Чтобы клик не засчитался как тап по игровому полю
    togglePause();
});

// Клик по самому экрану паузы, чтобы быстро вернуться в игру
pauseScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    togglePause();
});

// Обработка тапа по игровому полю
canvas.addEventListener('touchstart', (e) => {
    if (hp <= 0 || isPaused) return; // Если пауза — тапы по шарам заблокированы
    e.preventDefault(); 
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    createSplash(touchX, touchY);

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        let dist = Math.hypot(touchX - item.x, touchY - item.y);

        if (dist < item.type.radius + 18) { 
            handleItemClick(item.type);
            items.splice(i, 1); 
            break;
        }
    }
});

function handleItemClick(type) {
    if (type === TYPES.GOLD) {
        gold += 10;
        score += 5;
    } else if (type === TYPES.HEAL) {
        hp = Math.min(100, hp + 15);
    } else if (type === TYPES.SHIELD) {
        isShieldActive = true;
        shieldTimer += 6; 
    } else if (type === TYPES.BOOST) {
        baseSpeed += 0.4; 
        spawnRate += 0.005;
        score += 30;
    } else if (type === TYPES.MINE) {
        hp -= 25; 
    }
    updateUI();
}

function updateUI() {
    hpEl.textContent = hp;
    goldEl.textContent = gold;
    scoreEl.textContent = score;
    upgradeCostText.textContent = `(Цена: ${upgradeCost} 🪙)`;

    if (isShieldActive) {
        upgradeBtn.textContent = `🛡️ ЩИТ АКТИВЕН (${shieldTimer}с)`;
    } else {
        if (!isPaused) upgradeBtn.textContent = `🔬 Замедлить поток времени`;
    }

    if (hp <= 0) {
        hpEl.textContent = 0;
        alert(`💀 Твой отряд разбит! Вы набрали ${score} очков. Нажмите ОК для рестарта.`);
        resetGame();
    }
}

function resetGame() {
    hp = 100;
    gold = 0;
    score = 0;
    baseSpeed = 2;
    spawnRate = 0.02;
    isShieldActive = false;
    shieldTimer = 0;
    isPaused = false;
    items = [];
    splashes = [];
    pauseScreen.classList.add('hidden');
    pauseBtn.textContent = '⏸️';
    updateUI();
    gameLoop();
}

upgradeBtn.addEventListener('click', () => {
    if (gold >= upgradeCost && hp > 0 && !isPaused) {
        gold -= upgradeCost;
        baseSpeed = Math.max(1.2, baseSpeed - 0.6); 
        upgradeCost += 50;
        updateUI();
    }
});

updateUI();
gameLoop();
// ==========================================
// ЛОГИКА АВТОПАУЗЫ ПРИ СВОРАЧИВАНИИ
// ==========================================

// 1. Если человек свернул приложение или переключился на звонок
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Если игра еще не на паузе и игрок жив — принудительно ставим на паузу
        if (!isPaused && hp > 0) {
            togglePause();
        }
    }
});

// 2. Дополнительная страховка: если приложение просто потеряло фокус (например, вылезла шторка уведомлений)
window.addEventListener('blur', () => {
    if (!isPaused && hp > 0) {
        togglePause();
    }
});
