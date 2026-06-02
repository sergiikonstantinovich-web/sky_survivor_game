// ========== src/config/gameConfig.js ==========
// БАЗОВАЯ СКОРОСТЬ
export const BASE_SPEED = 2.5;

// НАСТРОЙКИ ВОЛН
export const LEVEL_CONFIG = {
  1: { name: "🚀 Волна 1: Мирное небо", targetScore: 100, hpLoss: 2, spawnRate: 0.02, mineChance: 0.4 },
  2: { name: "💥 Волна 2: Минное поле", targetScore: 300, hpLoss: 3, spawnRate: 0.03, mineChance: 0.6 },
  3: { name: "⚡ Волна 3: Гиперскорость", targetScore: Infinity, hpLoss: 5, spawnRate: 0.04, mineChance: 0.5 }
};

// ТИПЫ ОБЪЕКТОВ
export const TYPES = {
  GOLD: { icon: '🪙', color: '#ffd700', radius: 22 },
  HEAL: { icon: '❤️', color: '#4caf50', radius: 22 },
  SHIELD: { icon: '🛡️', color: '#2196f3', radius: 24 },
  BOOST: { icon: '⚡', color: '#ff9800', radius: 22 },
  MINE: { icon: '💥', color: '#f44336', radius: 22 },
  MOB: { icon: '👾', color: '#9c27b0', radius: 55 },
  HEAVY_MOB: { icon: '😈', color: '#ff0055', radius: 60 }
};

// КОНФИГ БОЯ (криты, комбо)
export const COMBAT_CONFIG = {
  critChance: 0.15,
  critMultiplier: 2.5,
  comboTimeout: 2000,
  feverMax: 100
};