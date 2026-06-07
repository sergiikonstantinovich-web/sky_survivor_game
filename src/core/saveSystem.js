// ========== src/core/saveSystem.js ==========

const SAVE_KEY = 'sky_survivor_save';

// Сохраняем прогресс
export function saveGame(gameState) {
    const saveData = {
        gold: gameState.gold,
        research: gameState.research,
        savedAt: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log('💾 Игра сохранена (золото:', gameState.gold, ')');
}

// Загружаем прогресс
export function loadGame(gameState) {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
        console.log('📁 Нет сохранений, начинаем новую игру');
        return false;
    }
    
    try {
        const saveData = JSON.parse(saved);
        gameState.gold = saveData.gold || 0;
        gameState.research = saveData.research;
        console.log('📀 Прогресс загружен! Золото:', gameState.gold);
        return true;
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        return false;
    }
}

// Сброс сохранения
export function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    console.log('🗑️ Сохранение удалено');
}