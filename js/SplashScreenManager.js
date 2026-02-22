class SplashScreenManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.splashElement = document.getElementById('splash-screen');
    }

    start() {
        // Show splash
        this.splashElement.classList.remove('hidden');

        // Wait 2.5 seconds, then transition to Main Menu
        setTimeout(() => {
            this.splashElement.classList.add('fade-out');

            setTimeout(() => {
                this.splashElement.classList.add('hidden');
                this.splashElement.classList.remove('fade-out');

                // Trigger Login Flow
                if (this.gameManager.loginManager) {
                    this.gameManager.loginManager.init();
                } else if (this.gameManager.menuManager) {
                    this.gameManager.menuManager.showMenu();
                }
            }, 500); // 0.5s transition
        }, 2500);
    }
}
