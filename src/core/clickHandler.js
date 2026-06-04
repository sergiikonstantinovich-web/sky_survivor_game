// ========== src/core/clickHandler.js ==========
import Engine from '../engine.js';
import { handleHitCombo, getComboMultiplier, resetCombo } from '../combat/comboSystem.js';
import { calculateDamage, calculateMobReward, calculateGoldBonus } from '../core/applyUpgrades.js';

export function handleItemClick(gameState, item, onCheckLevelUp, onUpdateUI) {
    if (!gameState || !item || !item.type) return;

    const icon = item.type.icon;
    
    const isMine = (icon === '💥');
    const isGold = (icon === '🪙');
    const isHeal = (icon === '❤️');
    const isShield = (icon === '🛡️');
    const isBoost = (icon === '⚡');
    
    // 🔥 РАСШИРЕННОЕ ОПРЕДЕЛЕНИЕ МОБОВ — все новые иконки
    const isMob = item.type.isMob === true || 
                  icon === '👾' || icon === '😈' || 
                  icon === '👻' || icon === '🧟' || 
                  icon === '🐉' || icon === '🦇' || 
                  icon === '👁️' || icon === '🤖' || 
                  icon === '💀' || icon === '👑';

    if (!isMine) {
        handleHitCombo(gameState, onUpdateUI);
    }

    const comboMult = getComboMultiplier(gameState);

    // ЗОЛОТО с улучшением
    if (isGold) {
        const rewardGold = calculateGoldBonus(gameState, 10);
        gameState.gold += Math.floor(rewardGold * (gameState.isFeverActive ? 2 : 1));
        gameState.score += Math.floor(5 * comboMult);
        gameState.items = gameState.items.filter(i => i !== item);
        if (onCheckLevelUp) onCheckLevelUp();
    } 
    // АПТЕЧКА
    else if (isHeal) {
        const healBonus = (gameState.research?.healBonus || 0) * 5;
        gameState.hp = Math.min(100, gameState.hp + 25 + healBonus);
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    // ЩИТ с улучшением
    else if (isShield) {
        gameState.isShieldActive = true;
        const shieldBonus = (gameState.research?.shieldDuration || 0) * 3;
        gameState.shieldTimer += (6 + shieldBonus);
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    // БУСТ
    else if (isBoost) {
        gameState.score += Math.floor(50 * comboMult);
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    // МИНА
    else if (isMine) {
        resetCombo(gameState);
        Engine.triggerScreenShake();
        // Снижение урона от мины через улучшения
        const reductionLevel = gameState.research?.damageReduction || 0;
        const reductionPercent = reductionLevel * 0.02;
        let mineDamage = 25 * (1 - reductionPercent);
        mineDamage = Math.max(10, Math.floor(mineDamage));
        if (!gameState.isFeverActive) gameState.hp -= mineDamage;
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    // МОБ с улучшениями
    else if (isMob) {
        if (item.hp !== undefined) {
            // Применяем улучшение силы клика и криты
            const { damage, isCrit } = calculateDamage(gameState, 1);
            item.hp -= damage;
            
            const critText = isCrit ? '💥 КРИТ! ' : '';
            Engine.createFloatingText(item.x, item.y - 20, `${critText}-${damage}`, isCrit);
            
            if (item.hp > 0) {
                if (onUpdateUI) onUpdateUI();
                return;
            }
        }

        // Награда с улучшениями
        const mobTier = item.mobTier || 10;
        const baseScore = Math.floor(mobTier * 5);
        const baseGold = gameState.isFeverActive ? mobTier * 6 : mobTier * 3;
        
        const { score, gold } = calculateMobReward(gameState, baseScore, baseGold);
        gameState.score += Math.floor(score * comboMult);
        gameState.gold += gold;
        gameState.items = gameState.items.filter(i => i !== item);
        if (onCheckLevelUp) onCheckLevelUp();
    }
    
    if (onUpdateUI) onUpdateUI();
}