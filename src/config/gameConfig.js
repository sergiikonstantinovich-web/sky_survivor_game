// ========== src/config/gameConfig.js ==========
export const BASE_SPEED = 2.5;

// Старые типы (для обратной совместимости)
export const TYPES = {
    GOLD:      { icon: '🪙', color: '#ffd700', radius: 22 },
    HEAL:      { icon: '❤️', color: '#4caf50', radius: 22 },
    SHIELD:    { icon: '🛡️', color: '#2196f3', radius: 24 },
    BOOST:     { icon: '⚡', color: '#ff9800', radius: 22 },
    MINE:      { icon: '💥', color: '#f44336', radius: 22 }, 
    MOB:       { icon: '👾', color: '#9c27b0', radius: 55, hp: 10 },
    HEAVY_MOB: { icon: '😈', color: '#ff0055', radius: 60, hp: 20 }
};

// Новые настройки уровней сложности (1-10)
export const LEVEL_CONFIG = {
    1: { name: "🌱 УРОВЕНЬ 1", targetScore: 200, hpLoss: 2, spawnRate: 0.02, speedMult: 1.0, mineChance: 0.35, mobTiers: [10] },
    2: { name: "⚙️ УРОВЕНЬ 2", targetScore: 400, hpLoss: 3, spawnRate: 0.025, speedMult: 1.2, mineChance: 0.37, mobTiers: [10, 20] },
    3: { name: "🔥 УРОВЕНЬ 3", targetScore: 800, hpLoss: 4, spawnRate: 0.03, speedMult: 1.5, mineChance: 0.39, mobTiers: [10, 20, 30] },
    4: { name: "💀 УРОВЕНЬ 4", targetScore: 1600, hpLoss: 5, spawnRate: 0.035, speedMult: 1.8, mineChance: 0.41, mobTiers: [10, 20, 30, 40] },
    5: { name: "⚡ УРОВЕНЬ 5", targetScore: 3200, hpLoss: 6, spawnRate: 0.04, speedMult: 2.2, mineChance: 0.43, mobTiers: [10, 20, 30, 40, 50] },
    6: { name: "🌀 УРОВЕНЬ 6", targetScore: 6400, hpLoss: 7, spawnRate: 0.045, speedMult: 2.6, mineChance: 0.45, mobTiers: [10, 20, 30, 40, 50, 60] },
    7: { name: "👹 УРОВЕНЬ 7", targetScore: 12800, hpLoss: 9, spawnRate: 0.05, speedMult: 3.0, mineChance: 0.47, mobTiers: [10, 20, 30, 40, 50, 60, 70] },
    8: { name: "😈 УРОВЕНЬ 8", targetScore: 25600, hpLoss: 11, spawnRate: 0.055, speedMult: 3.5, mineChance: 0.49, mobTiers: [10, 20, 30, 40, 50, 60, 70, 80] },
    9: { name: "💢 УРОВЕНЬ 9", targetScore: 51200, hpLoss: 13, spawnRate: 0.06, speedMult: 4.0, mineChance: 0.51, mobTiers: [10, 20, 30, 40, 50, 60, 70, 80, 90] },
    10: { name: "👑 УРОВЕНЬ 10", targetScore: 102400, hpLoss: 15, spawnRate: 0.07, speedMult: 4.5, mineChance: 0.55, mobTiers: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] }
};

// Новые мобы
export const MOB_TYPES = {
    10: { icon: '👾', color: '#9c27b0', radius: 55, hp: 10 },
    20: { icon: '😈', color: '#ff0055', radius: 58, hp: 20 },
    30: { icon: '👻', color: '#aa66ff', radius: 60, hp: 30 },
    40: { icon: '🧟', color: '#66cc66', radius: 62, hp: 40 },
    50: { icon: '🐉', color: '#ff6600', radius: 65, hp: 50 },
    60: { icon: '🦇', color: '#9933ff', radius: 58, hp: 60 },
    70: { icon: '👁️', color: '#ff44cc', radius: 62, hp: 70 },
    80: { icon: '🤖', color: '#33ccff', radius: 65, hp: 80 },
    90: { icon: '💀', color: '#cccccc', radius: 60, hp: 90 },
    100: { icon: '👑', color: '#ffdd00', radius: 70, hp: 100 }
};

export const COMBAT_CONFIG = {
    critChance: 0.15,
    critMultiplier: 2.5,
    comboTimeout: 2000,
    feverMax: 100
};

// Глобальные объекты для доступа из engine.js
window.TYPES = TYPES;
window.LEVEL_CONFIG = LEVEL_CONFIG;
window.MOB_TYPES = MOB_TYPES;
window.COMBAT_CONFIG = COMBAT_CONFIG;
window.BASE_SPEED = BASE_SPEED;