else if (isGold) {
    let bonus = (gameState.research?.goldBonus?.lvl || 0) * 5; // старая логика
    // 👇 ЗАМЕНИТЬ НА:
    const rewardGold = calculateGoldBonus(gameState, 10);
    gameState.gold += Math.floor(rewardGold * (gameState.isFeverActive ? 2 : 1));
    gameState.score += Math.floor(5 * comboMult);
    gameState.items = gameState.items.filter(i => i !== item);
    if (onCheckLevelUp) onCheckLevelUp();
}