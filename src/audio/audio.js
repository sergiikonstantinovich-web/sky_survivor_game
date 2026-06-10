// ========== src/audio/sounds.js ==========

class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
    }

    // Загрузка звука
    loadSound(name, url) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.load();  // принудительная загрузка
        this.sounds[name] = audio;
    }

    // Проигрывание звука (оптимизированная версия без cloneNode)
    playSound(name, volume = 0.5) {
        if (!this.sfxEnabled) return;
        const sound = this.sounds[name];
        if (sound) {
            // Останавливаем, если уже играет, и перематываем в начало
            sound.currentTime = 0;
            sound.volume = volume;
            sound.play().catch(e => console.log('Audio error:', e));
        }
    }

    // Фоновая музыка
    playMusic(url, loop = true) {
        if (!this.musicEnabled) return;
        if (this.music) {
            this.music.pause();
        }
        this.music = new Audio(url);
        this.music.loop = loop;
        this.music.volume = 0.3;
        this.music.play().catch(e => console.log('Music error:', e));
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music = null;
        }
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled && this.music) {
            this.music.pause();
        } else if (this.musicEnabled && this.music) {
            this.music.play();
        }
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
    }
}

export const soundManager = new SoundManager();