// ========== src/core/applyUpgrades.js ==========
// Единый файл для применения всех улучшений из дерева умений

// 1. РАСЧЁТ УРОНА С КРИТАМИ
export function calculateDamage(gameState, baseDamage = 1) {
    const clickPower = gameState.research?.clickPower || 0;
    let damage = baseDamage + clickPower;
    
    // Критический урон
    const critChance = (gameState.research?.critChance || 0) * 0.05; // 5% за уровень
    const critDamage = 2.5 + ((gameState.research?.critDamage || 0) * 0.25); // +25% за уровень
    
    const isCrit = Math.random() < critChance;
    if (isCrit) {
        damage = Math.floor(damage * critDamage);
        return { damage, isCrit };
    }
    
    return { damage, isCrit: false };
}

// 2. НАГРАДА ЗА УБИЙСТВО МОБА
export function calculateMobReward(gameState, baseScore, baseGold) {
    const scoreBonus = 1 + ((gameState.research?.scoreBonus || 0) * 0.1); // +10% за уровень
    const goldBonus = (gameState.research?.goldBonus || 0) * 5; // +5 золота за уровень
    
    return {
        score: Math.floor(baseScore * scoreBonus),
        gold: baseGold + goldBonus
    };
}

// 3. РАСЧЁТ УРОНА ОТ УЛЬТЫ (теперь зависит от уровня прокачки)
export function calculateFeverDamage(gameState, baseDamage = 10) {
    const feverLevel = gameState.research?.feverDamage || 0;
    // Бонус: +10 урона за уровень (1 ур = 20, 2 ур = 30, 3 ур = 40...)
    const bonusDamage = feverLevel * 10;
    return baseDamage + bonusDamage;
}

// 3.1 ПОЛУЧИТЬ МАКСИМАЛЬНЫЙ TIER МОБА, КОТОРОГО МОЖЕТ УБИТЬ УЛЬТА
export function getFeverKillTier(gameState) {
    const feverLevel = gameState.research?.feverDamage || 0;
    // 0 уровень: убивает мобов до 10 tier
    // 1 уровень: до 20 tier
    // 2 уровень: до 30 tier
    // 3 уровень: до 40 tier
    // и так далее
    return (feverLevel + 1) * 10;
}

// 4. РАСЧЁТ ПАССИВНОЙ РЕГЕНЕРАЦИИ
export function calculatePassiveRegen(gameState) {
    const regenLevel = gameState.research?.passiveRegen || 0;
    // 0.5 HP за уровень, минимум 0
    return regenLevel * 0.5;
}

// 5. РАСЧЁТ СНИЖЕНИЯ УРОНА
export function calculateDamageReduction(gameState, incomingDamage) {
    const reductionLevel = gameState.research?.damageReduction || 0;
    const reductionPercent = reductionLevel * 0.02; // 2% за уровень
    const reduced = Math.floor(incomingDamage * (1 - reductionPercent));
    return Math.max(1, reduced); // минимум 1 урон
}

// 6. БОНУСНОЕ ЗОЛОТО ПРИ СБОРЕ
export function calculateGoldBonus(gameState, baseGold) {
    const goldBonus = (gameState.research?.goldBonus || 0) * 5;
    return baseGold + goldBonus;
}

// 7. СТАРТОВОЕ КОМБО
export function getStartingCombo(gameState) {
    return (gameState.research?.startCombo || 0) * 5;
}

// 8. БОНУС К ТАЙМЕРУ КОМБО (в мс)
export function getComboTimeBonus(gameState) {
    return (gameState.research?.comboTime || 0) * 500; // +0.5 сек за уровень
}

// 9. МНОЖИТЕЛЬ ДЛЯ SS РАНГА
export function getSSMultiplier(gameState) {
    return 3.0 + ((gameState.research?.ssMultiplier || 0) * 0.5); // +0.5 за уровень
}