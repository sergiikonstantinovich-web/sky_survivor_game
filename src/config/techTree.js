// ========== src/config/techTree.js ==========

export const TECH_TREE = {
    // Ветка АТАКИ
    attack: {
        clickPower: {
            name: '💪 Сила клика',
            desc: '+1 урон клика',
            maxLevel: 5,
            baseCost: 100,
            costMultiplier: 2,
            effect: (level) => level  // +1 урон за уровень
        },
        critChance: {
            name: '🎯 Критический шанс',
            desc: '+5% шанс крита',
            maxLevel: 5,
            baseCost: 150,
            costMultiplier: 2,
            effect: (level) => level * 5  // +5% за уровень
        },
        critDamage: {
            name: '💥 Критический урон',
            desc: '+25% к крит урону',
            maxLevel: 5,
            baseCost: 200,
            costMultiplier: 2,
            effect: (level) => 2.5 + (level * 0.25)  // 2.5x → 3.75x
        }
    },
    
    // Ветка ЗАЩИТЫ
    defense: {
        shieldDuration: {
            name: '🛡️ Стальной щит',
            desc: '+3 сек к длительности щита',
            maxLevel: 5,
            baseCost: 100,
            costMultiplier: 2,
            effect: (level) => level * 3  // +3 сек за уровень
        },
        passiveRegen: {
            name: '💚 Пассивная регенерация',
            desc: '+1 ХП в 5 сек',
            maxLevel: 5,
            baseCost: 150,
            costMultiplier: 2,
            effect: (level) => level  // +1 ХП за уровень
        },
        damageReduction: {
            name: '🛡️ Снижение урона',
            desc: '-2% пассивного урона',
            maxLevel: 5,
            baseCost: 200,
            costMultiplier: 2,
            effect: (level) => level * 2  // -2% за уровень
        }
    },
    
    // Ветка ЭКОНОМИКИ
    economy: {
        goldBonus: {
            name: '💰 Золотая лихорадка',
            desc: '+5 золота за сбор',
            maxLevel: 5,
            baseCost: 100,
            costMultiplier: 2,
            effect: (level) => level * 5  // +5 золота за уровень
        },
        scoreBonus: {
            name: '🏆 Бонус за убийство',
            desc: '+10% очков за мобов',
            maxLevel: 5,
            baseCost: 150,
            costMultiplier: 2,
            effect: (level) => 1 + (level * 0.1)  // +10% за уровень
        },
        cashback: {
            name: '🔄 Кэшбэк',
            desc: '+5% возврата золота',
            maxLevel: 5,
            baseCost: 200,
            costMultiplier: 2,
            effect: (level) => level * 5  // +5% за уровень
        }
    },
    
    // Ветка СПЕЦИАЛЬНЫХ
    special: {
        feverDamage: {
            name: '⚡ Усиление ульты',
            desc: '+100% урона ульты',
            maxLevel: 5,
            baseCost: 200,
            costMultiplier: 2,
            effect: (level) => 1 + (level * 0.2)  // x1.2 → x2.0
        },
        healBonus: {
            name: '❤️ Усиление аптечки',
            desc: '+5 ХП к лечению',
            maxLevel: 5,
            baseCost: 150,
            costMultiplier: 2,
            effect: (level) => level * 5  // +5 ХП за уровень
        },
        slowmoDuration: {
            name: '🐢 Слоумо мастер',
            desc: '+0.5 сек к слоумо',
            maxLevel: 5,
            baseCost: 250,
            costMultiplier: 2,
            effect: (level) => level * 0.5  // +0.5 сек за уровень
        }
    },
    
    // Ветка КОМБО
    combo: {
        startCombo: {
            name: '⚡ Быстрый старт',
            desc: 'Начинать с +5 комбо',
            maxLevel: 3,
            baseCost: 200,
            costMultiplier: 2,
            effect: (level) => level * 5  // +5 комбо за уровень
        },
        comboTime: {
            name: '⏱️ Удержание комбо',
            desc: '+0.5 сек к таймеру',
            maxLevel: 5,
            baseCost: 150,
            costMultiplier: 2,
            effect: (level) => level * 0.5  // +0.5 сек за уровень
        },
        ssMultiplier: {
            name: '👑 Комбо бустер',
            desc: '+0.5 к множителю SS',
            maxLevel: 3,
            baseCost: 300,
            costMultiplier: 2,
            effect: (level) => 3.0 + (level * 0.5)  // 3.0x → 4.5x
        }
    }
};

// Вспомогательная функция для получения стоимости уровня
export function getUpgradeCost(upgrade, currentLevel) {
    if (currentLevel >= upgrade.maxLevel) return null;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

// Вспомогательная функция для применения эффекта
export function applyUpgradeEffect(upgrade, level, baseValue) {
    const effect = upgrade.effect(level);
    if (typeof effect === 'number' && upgrade.name.includes('крита')) {
        return baseValue * effect;
    }
    return effect;
}

