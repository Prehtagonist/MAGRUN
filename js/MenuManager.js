class MenuManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.menuElement = document.getElementById('main-menu');
        this.buttons = document.querySelectorAll('.menu-btn');
        this.playBtn = document.getElementById('btn-play');
        this.carBtn = document.getElementById('btn-car');
        this.charBtn = document.getElementById('btn-character');
        this.leadBtn = document.getElementById('btn-leaderboard');
        this.setBtn = document.getElementById('btn-settings');

        this.setupListeners();
    }

    setupListeners() {
        // Initialize audio context synchronously on the very first user interaction
        // This prevents browsers from blocking the autoplay of background music.
        const initAudio = () => {
            if (this.gameManager && this.gameManager.audioManager && !this.gameManager.audioManager.initialized) {
                this.gameManager.audioManager.init();
            }
            document.removeEventListener('click', initAudio);
        };
        document.addEventListener('click', initAudio);

        this.playBtn.addEventListener('click', () => {
            this.handlePlayClick();
        });

        if (this.carBtn) {
            this.carBtn.addEventListener('click', () => {
                if (this.gameManager.carSelectionManager) {
                    this.gameManager.carSelectionManager.show();
                }
            });
        }

        if (this.charBtn) {
            this.charBtn.addEventListener('click', () => {
                if (this.gameManager.characterSelectionManager) {
                    this.gameManager.characterSelectionManager.show();
                }
            });
        }

        this.setBtn.addEventListener('click', () => {
            if (this.gameManager.settingsManager) {
                this.gameManager.settingsManager.show();
            }
        });

        if (this.leadBtn) {
            this.leadBtn.addEventListener('click', () => {
                if (this.gameManager.leaderboardManager) {
                    this.gameManager.leaderboardManager.show();
                }
            });
        }
    }

    showMenu() {
        this.menuElement.classList.remove('hidden');
        this.menuElement.classList.add('fade-in');

        // Enable subtle background road movement
        this.gameManager.state = 'MENU';
        this.gameManager.roadSpeedMultiplier = 0.5; // slow menu road
        if (!this.gameManager.animationFrameId) {
            this.gameManager.lastFrameTime = performance.now();
            this.gameManager.animationFrameId = requestAnimationFrame((time) => this.gameManager.gameLoop(time));
        }

        // Sequentially fade in buttons
        this.buttons.forEach((btn, index) => {
            btn.style.opacity = '0';
            btn.style.transform = 'translateY(20px)';

            setTimeout(() => {
                btn.style.transition = 'all 0.5s ease-out';
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });
    }

    handlePlayClick() {
        const gameContainer = document.getElementById('game-container');
        const screenFlash = document.getElementById('screen-flash');

        // Quick red flash
        screenFlash.classList.add('flash-active');
        setTimeout(() => screenFlash.classList.remove('flash-active'), 200);

        // Zoom-in effect on road
        gameContainer.classList.add('zoom-in-active');

        // Hide menu
        this.menuElement.classList.add('fade-out');

        setTimeout(() => {
            this.menuElement.classList.add('hidden');
            this.menuElement.classList.remove('fade-out');
            gameContainer.classList.remove('zoom-in-active');

            // Start the actual game
            this.gameManager.startGame();
        }, 600);
    }
}
