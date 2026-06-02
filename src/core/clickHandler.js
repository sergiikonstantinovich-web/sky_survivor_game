// ========== src/core/clickHandler.js ==========
import Engine from '../engine.js';
import { handleHitCombo, getComboMultiplier, resetCombo } from '../combat/comboSystem.js';

export function handleItemClick(gameState, item, onCheckLevelUp, onUpdateUI) {
    if (!gameState || !item || !item.type) return;

    const icon = item.type.icon;
    
    const isMine = (icon === '💥');
    const isGold = (icon === '🪙');
    const isHeal = (icon === '❤️');
    const isShield = (icon === '🛡️');
    const isBoost = (icon === '⚡');
    const isMob = (icon === '👾' || icon === '😈');

    if (!isMine) {
        handleHitCombo(gameState, onUpdateUI);
    }

    const comboMult = getComboMultiplier(gameState);

    if (isGold) {
        let bonus = (gameState.research?.goldBonus?.lvl || 0) * 5;
        gameState.gold += Math.floor((10 + bonus) * (gameState.isFeverActive ? 2 : 1));
        gameState.score += Math.floor(5 * comboMult);
        gameState.items = gameState.items.filter(i => i !== item);
        if (onCheckLevelUp) onCheckLevelUp();
    } 
    else if (isHeal) {
        gameState.hp = Math.min(100, gameState.hp + 25);
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    else if (isShield) {
        gameState.isShieldActive = true;
        let extraTime = (gameState.research?.shieldDuration?.lvl || 0) * 2;
        gameState.shieldTimer += (6 + extraTime);
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    else if (isBoost) {
        gameState.score += Math.floor(50 * comboMult);
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    else if (isMine) {
        resetCombo(gameState);
        Engine.triggerScreenShake();
        if (!gameState.isFeverActive) gameState.hp -= 25;
        gameState.items = gameState.items.filter(i => i !== item);
    } 
    else if (isMob) {
        if (item.hp !== undefined) {
            let damage = 1 + (gameState.research?.clickPower?.lvl || 0);
            item.hp -= damage;

            Engine.createFloatingText(item.x, item.y - 20, `-${damage}`, false);

            if (item.hp > 0) {
                if (onUpdateUI) onUpdateUI();
                return;
            }
        }

        let isHeavy = (icon === '😈');
        gameState.score += Math.floor((isHeavy ? 200 : 100) * comboMult);
        gameState.gold += (gameState.isFeverActive ? 120 : 60);
        gameState.items = gameState.items.filter(i => i !== item);
        if (onCheckLevelUp) onCheckLevelUp();
    }
    
    if (onUpdateUI) onUpdateUI();
}