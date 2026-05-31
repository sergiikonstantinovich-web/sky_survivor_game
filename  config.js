// Проверяем, существует ли уже window.gameState, чтобы случайно не перезаписать его при рестарте
if (!window.gameState) {
    window.gameState = {
        hp: 100,
        gold: 0,
        score: 0,
        currentLevel: 1,
        isShieldActive: false,
        shieldTimer: 0,
        isPaused: false,
        upgradeCost: 100,
        items: [],
        splashes: []
    };
}

// Базовая скорость — обязательно через window
window.BASE_SPEED = 2.5; 

// Настройки уровней — обязательно через window
window.LEVEL_CONFIG = {
    1: { name: "🚀 Волна 1: Мирное небо", targetScore: 100, hpLoss: 2, spawnRate: 0.02, mineChance: 0.4 },
    2: { name: "💥 Волна 2: Минное поле", targetScore: 300, hpLoss: 3, spawnRate: 0.03, mineChance: 0.6 },
    3: { name: "⚡ Волна 3: Гиперскорость", targetScore: Infinity, hpLoss: 5, spawnRate: 0.04, mineChance: 0.5 }
};

// Типы объектов — обязательно через window
window.TYPES = {
    GOLD:   { icon: '🪙', color: '#ffd700', radius: 22 },
    HEAL:   { icon: '❤️', color: '#4caf50', radius: 22 },
    SHIELD: { icon: '🛡️', color: '#2196f3', radius: 24 },
    BOOST:  { icon: '⚡', color: '#ff9800', radius: 22 },
    MINE:   { icon: '💥', color: '#f44336', radius: 22 }
};
