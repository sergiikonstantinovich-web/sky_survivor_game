const UI = {
    hpBarFill: document.getElementById('hp-bar-fill'),
    goldEl: document.getElementById('gold-val'),
    scoreEl: document.getElementById('score-val'),
    pauseBtn: document.getElementById('pause-btn'),
    researchBtn: document.getElementById('research-btn'),
    pauseScreen: document.getElementById('pause-screen'),

    update() {
        if (!window.gameState) return; // Жесткая защита периметра

        const hpContainer = document.querySelector('.hp-bar-container');
        
        // Обновляем ширину полоски ХП
        this.hpBarFill.style.width = `${Math.max(0, window.gameState.hp)}%`;
        
        // Проверка на щит (заморозка)
        if (window.gameState.isShieldActive) {
            if (hpContainer) hpContainer.classList.add('frozen-active');
            this.hpBarFill.classList.add('frozen-fill');
        } else {
            if (hpContainer) hpContainer.classList.remove('frozen-active');
            this.hpBarFill.classList.remove('frozen-fill');
            
            if (window.gameState.hp < 30) {
                this.hpBarFill.style.background = 'linear-gradient(90deg, #ff0000, #b30000)';
            } else {
                this.hpBarFill.style.background = 'linear-gradient(90deg, #ff4b4b, #ff2222)';
            }
        }

        this.goldEl.textContent = window.gameState.gold;
        this.scoreEl.textContent = window.gameState.score;

        if (window.gameState.hp <= 0) {
            this.hpBarFill.style.width = '0%';
            alert(`💀 Твой отряд разбит! Вы набрали ${window.gameState.score} очков. Нажмите ОК для рестарта.`);
            if (window.Game) window.Game.resetGame();
        }
    }
};

window.UI = UI;
