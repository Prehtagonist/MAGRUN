class SettingsManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.settingsScreen = document.getElementById('settings-screen');
        this.closeBtn = document.getElementById('btn-close-settings');

        // Difficulty elements
        this.diffBtns = document.querySelectorAll('.diff-btn');

        // Audio elements
        this.toggleMusic = document.getElementById('toggle-music');
        this.toggleSfx = document.getElementById('toggle-sfx');
        this.toggleMute = document.getElementById('toggle-mute');

        // State
        this.difficulty = 'medium';
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.muteAll = false;

        this.loadSettings();
        this.setupListeners();
        this.applySettingsToUI();
        this.updateAudioSystem();
    }

    loadSettings() {
        const savedDiff = localStorage.getItem('magrun_diff');
        if (savedDiff) this.difficulty = savedDiff;

        const savedMusic = localStorage.getItem('magrun_music');
        if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';

        const savedSfx = localStorage.getItem('magrun_sfx');
        if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';

        const savedMute = localStorage.getItem('magrun_mute');
        if (savedMute !== null) this.muteAll = savedMute === 'true';
    }

    saveSettings() {
        localStorage.setItem('magrun_diff', this.difficulty);
        localStorage.setItem('magrun_music', this.musicEnabled);
        localStorage.setItem('magrun_sfx', this.sfxEnabled);
        localStorage.setItem('magrun_mute', this.muteAll);
    }

    applySettingsToUI() {
        // Apply Difficulty
        this.diffBtns.forEach(btn => {
            if (btn.getAttribute('data-diff') === this.difficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Apply Audio
        this.toggleMusic.checked = this.musicEnabled;
        this.toggleSfx.checked = this.sfxEnabled;
        this.toggleMute.checked = this.muteAll;
    }

    setupListeners() {
        this.closeBtn.addEventListener('click', () => {
            this.hide();
        });

        // Difficulty selection
        this.diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const diff = e.currentTarget.getAttribute('data-diff');
                this.setDifficulty(diff);
                this.playClickSound();
            });
        });

        // Audio Togles
        this.toggleMusic.addEventListener('change', (e) => {
            this.musicEnabled = e.target.checked;
            if (this.muteAll && this.musicEnabled) {
                this.muteAll = false;
                this.toggleMute.checked = false;
            }
            this.saveSettings();
            this.updateAudioSystem();
            this.playClickSound();
        });

        this.toggleSfx.addEventListener('change', (e) => {
            this.sfxEnabled = e.target.checked;
            if (this.muteAll && this.sfxEnabled) {
                this.muteAll = false;
                this.toggleMute.checked = false;
            }
            this.saveSettings();
            this.updateAudioSystem();
            this.playClickSound();
        });

        this.toggleMute.addEventListener('change', (e) => {
            this.muteAll = e.target.checked;
            if (this.muteAll) {
                // If muting all, visually toggle others off but maintain state in background
                this.toggleMusic.checked = false;
                this.toggleSfx.checked = false;
            } else {
                // Restore visual state
                this.toggleMusic.checked = this.musicEnabled;
                this.toggleSfx.checked = this.sfxEnabled;
            }
            this.saveSettings();
            this.updateAudioSystem();
            this.playClickSound();
        });
    }

    setDifficulty(diff) {
        this.difficulty = diff;
        this.diffBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = Array.from(this.diffBtns).find(b => b.getAttribute('data-diff') === diff);
        if (activeBtn) activeBtn.classList.add('active');

        this.saveSettings();

        // Apply immediately
        if (this.gameManager && this.gameManager.obstacleSpawner) {
            this.gameManager.applyDifficultySettings();
        }
    }

    updateAudioSystem() {
        if (this.gameManager && this.gameManager.audioManager) {
            const isMusicEnabled = this.muteAll ? false : this.musicEnabled;
            const isSfxEnabled = this.muteAll ? false : this.sfxEnabled;

            this.gameManager.audioManager.applySettings(isMusicEnabled, isSfxEnabled);

            // Explicitly handle background music
            if (isMusicEnabled && this.gameManager.audioManager.initialized) {
                this.gameManager.audioManager.playBackgroundMusic();

                // Set appropriate volume based on state
                if (this.gameManager.state === 'GAMEOVER') {
                    this.gameManager.audioManager.setMusicVolume(0.2);
                } else {
                    this.gameManager.audioManager.setMusicVolume(0.6);
                }
            } else {
                this.gameManager.audioManager.pauseBackgroundMusic();
            }
        }
    }

    playClickSound() {
        if (this.gameManager && this.gameManager.audioManager) {
            // Only play if SFX is on
            if (!this.muteAll && this.sfxEnabled && this.gameManager.audioManager.audioCtx) {
                // simple quick click sound
                const context = this.gameManager.audioManager.audioCtx;
                if (context.state !== 'running') return; // Might not be initialized

                const osc = context.createOscillator();
                const gain = context.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.1);

                gain.gain.setValueAtTime(0.1, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

                osc.connect(gain);
                gain.connect(this.gameManager.audioManager.masterGain);

                osc.start();
                osc.stop(context.currentTime + 0.1);
            }
        }
    }

    show() {
        this.settingsScreen.classList.remove('hidden');
        this.settingsScreen.classList.add('fade-in');
        setTimeout(() => this.settingsScreen.classList.remove('fade-in'), 500);
    }

    hide() {
        this.settingsScreen.classList.add('fade-out');
        setTimeout(() => {
            this.settingsScreen.classList.add('hidden');
            this.settingsScreen.classList.remove('fade-out');
        }, 500);
    }
}
