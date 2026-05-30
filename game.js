const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Статы
let hp = 100;
let gold = 0;
let score = 0;
let isShieldActive = false;
let shieldTimer = 0;
let isPaused = false; 

// СИСТЕМА УРОВНЕЙ
let currentLevel = 1;
const LEVEL_CONFIG = {
    1: { name: "🚀 Волна 1: Мирное небо", targetScore: 100, hpLoss: 2, spawnRate: 0.02, mineChance: 0.4 },
    2: { name: "💥 Волна 2: Минное поле", targetScore: 300, hpLoss: 3, spawnRate: 0.03, mineChance: 0.6 },
    3: { name: "⚡ Волна 3: Гиперскорость", targetScore: Infinity, hpLoss: 5, spawnRate: 0.04, mineChance: 0.5 }
};
// НАСТРОЙКИ СКОРОСТИ (Жестко фиксированная базовая скорость)
const BASE_SPEED = 2.5; 
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
const hpBarFill = document.getElementById('hp-bar-fill');
const goldEl = document.getElementById('gold-val');
const scoreEl = document.getElementById('score-val');
const upgradeBtn = document.getElementById('upgrade-btn');
const upgradeCostText = document.getElementById('upgrade-cost-text');
const pauseBtn = document.getElementById('pause-btn');
const researchBtn = document.getElementById('research-btn');
const pauseScreen = document.getElementById('pause-screen');

// Хранилище для ID анимации, чтобы циклы не накладывались
let animationFrameId = null;

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Пассивная потеря ХП в зависимости от уровня
setInterval(() => {
    if (hp <= 0 || isPaused) return; 
    
    if (isShieldActive) {
        shieldTimer--;
        if (shieldTimer <= 0) isShieldActive = false;
    } else {
        // Берем урон текущего уровня (например: 2, 3 или 5 в секунду)
        let hpLoss = LEVEL_CONFIG[currentLevel]?.hpLoss || 2;
        hp -= hpLoss; 
    }
    
    score += 1; 
    checkLevelUp(); // На всякий случай проверяем уровень по времени
    updateUI();
}, 1000);


// Спавн шариков
function spawnItem() {
    // 1. Динамически берем частоту спавна из текущего уровня
    let currentSpawnRate = LEVEL_CONFIG[currentLevel]?.spawnRate || 0.02;
    if (Math.random() > currentSpawnRate) return;

    let newX = Math.random() * (canvas.width - 60) + 30;
    const newY = canvas.height + 50; 
    const minSafeDistance = 65; 

    // Проверка на то, чтобы шары не налезали друг на друга при появлении
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

    // 2. Берем базовый шанс мины из текущего уровня
    let mineChance = LEVEL_CONFIG[currentLevel]?.mineChance || 0.40;

    // ========================================================
    // СИСТЕМА ГАРАНТА (Защита от злого рандома)
    // ========================================================
    let finalRand = rand;
    
    if (hp < 30) {
        // Если у игрока меньше 30 ХП, мы искусственно режем шанс появления мины в 2 раза
        mineChance = mineChance / 2;
        
        // И если рандом изначально целился в мину, с вероятностью 50% превращаем её в аптечку
        if (rand >= 0.45 && rand < 0.45 + (mineChance * 2)) {
            if (Math.random() > 0.5) {
                finalRand = 0.90; // Принудительно сдвигаем значение в зону спавна ТYPES.HEAL
            }
        }
    }
    // ========================================================

    // Динамическое распределение типов в зависимости от волны и работы гаранта
    if (finalRand < 0.45) {
        type = TYPES.GOLD;       
    } else if (finalRand < 0.45 + mineChance) { 
        type = TYPES.MINE;  
    } else if (finalRand < 0.94) {
        type = TYPES.HEAL;  // Сюда теперь чаще залетают шары при критическом ХП
    } else if (finalRand < 0.98) {
        type = TYPES.BOOST; 
    } else {
        type = TYPES.SHIELD;                 
    }

    items.push({
        x: newX,
        y: newY, 
        speed: BASE_SPEED, 
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

    // Если пауза — просто останавливаем отрисовку, не плодя новые кадры
    if (isPaused) {
        animationFrameId = null;
        return; 
    }

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

    // Запоминаем ID текущего кадра
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Логика паузы
function togglePause() {
    if (hp <= 0) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Жестко стопим старый цикл анимации
            animationFrameId = null;
        }
        pauseScreen.classList.remove('hidden');
        pauseBtn.textContent = '▶️'; 
    } else {
        pauseScreen.classList.add('hidden');
        pauseBtn.textContent = '⏸️'; 
        
        // Перед запуском нового цикла убеждаемся, что старый мертв
        if (!animationFrameId) {
            gameLoop(); 
        }
    }
}

// Кнопка паузы справа
pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    togglePause();
});

// Кнопка исследований слева (заглушка)
researchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isPaused && hp > 0) {
        togglePause();
    }
    console.log("В будущем тут откроется UI исследований!");
});

// Клик по экрану паузы для возврата в игру
pauseScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    togglePause();
});

// Обработка тапа по игровому полю
canvas.addEventListener('touchstart', (e) => {
    if (hp <= 0 || isPaused) return; 
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
        checkLevelUp ();
    } else if (type === TYPES.HEAL) {
        hp = Math.min(100, hp + 25);
    } else if (type === TYPES.SHIELD) {
        isShieldActive = true;
        shieldTimer += 6; 
    } else if (type === TYPES.BOOST) {
        // Убрали разгон скорости от буста, теперь он дает просто больше очков
        score += 50; 
    } else if (type === TYPES.MINE) {
        hp -= 25; 
    }
    updateUI();
}

function checkLevelUp() {
    let config = LEVEL_CONFIG[currentLevel];
    if (!config) return;

    // Если набрали нужное количество очков для следующего уровня
    if (score >= config.targetScore && LEVEL_CONFIG[currentLevel + 1]) {
        currentLevel++;
        let nextConfig = LEVEL_CONFIG[currentLevel];
        
        // Даем жирный бонус за переход на новую волну!
        gold += 50;
        hp = Math.min(100, hp + 20);
        
        // Всплывающее уведомление (пока системное, чтобы протестировать механику)
        alert(`🎉 СЛЕДУЮЩИЙ УРОВЕНЬ!\n${nextConfig.name}\nБонус: +50 🪙 и +20 ❤️`);
        updateUI();
    }
}

function updateUI() {
    // Получаем контейнер полоски, чтобы вешать свечение на рамку
    const hpContainer = document.querySelector('.hp-bar-container');
    
    // Обновляем ширину полоски ХП
    hpBarFill.style.width = `${Math.max(0, hp)}%`;
    
    // ПРОВЕРКА НА ЩИТ (ЗАМОРОЗКА)
    if (isShieldActive) {
        hpContainer.classList.add('frozen-active');
        hpBarFill.classList.add('frozen-fill');
    } else {
        // Если щита нет — возвращаем обычные цвета (красный или критический темный)
        hpContainer.classList.remove('frozen-active');
        hpBarFill.classList.remove('frozen-fill');
        
        if (hp < 30) {
            hpBarFill.style.background = 'linear-gradient(90deg, #ff0000, #b30000)';
        } else {
            hpBarFill.style.background = 'linear-gradient(90deg, #ff4b4b, #ff2222)';
        }
    }

    goldEl.textContent = gold;
    scoreEl.textContent = score;
    upgradeCostText.textContent = `(Цена: ${upgradeCost} 🪙)`;

    if (isShieldActive) {
        upgradeBtn.textContent = `🛡️ ЩИТ АКТИВЕН (${shieldTimer}с)`;
    } else {
        if (!isPaused) upgradeBtn.textContent = `🔬 Замедлить поток времени`;
    }

    if (hp <= 0) {
        hpBarFill.style.width = '0%';
        alert(`💀 Твой отряд разбит! Вы набрали ${score} очков. Нажмите ОК для рестарта.`);
        resetGame();
    }
}


function resetGame() {
    currentLevel = 1;
    hp = 100;
    gold = 0;
    score = 0;
    spawnRate = 0.02;
    isShieldActive = false;
    shieldTimer = 0;
    isPaused = false;
    items = [];
    splashes = [];
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    pauseScreen.classList.add('hidden');
    pauseBtn.textContent = '⏸️';
    updateUI();
    gameLoop();
}

// Кнопка внизу (пока оставили логику, но она не ломает общую базу)
upgradeBtn.addEventListener('click', () => {
    if (gold >= upgradeCost && hp > 0 && !isPaused) {
        gold -= upgradeCost;
        upgradeCost += 50;
        updateUI();
    }
});

// Стартовый запуск
updateUI();
if (animationFrameId) cancelAnimationFrame(animationFrameId);
gameLoop();

// Автопауза при сворачивании
document.addEventListener('visibilitychange', () => {
    if (document.hidden && !isPaused && hp > 0) {
        togglePause();
    }
});
window.addEventListener('blur', () => {
    if (!isPaused && hp > 0) {
        togglePause();
    }
});
