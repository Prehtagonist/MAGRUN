class CinematicManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.hasTriggeredMag9 = false;
        this.cinematicActive = false;

        this.collapseContainer = document.getElementById('cinematic-collapse-container');
    }

    reset() {
        this.hasTriggeredMag9 = false;
        this.cinematicActive = false;
        this.gameManager.roadSpeedMultiplier = 1.0;
        this.collapseContainer.classList.add('hidden-anim');
    }

    checkCinematicTrigger(mag) {
        if (mag === 9 && !this.hasTriggeredMag9) {
            this.triggerSeismicCollapse();
        }
    }

    triggerSeismicCollapse() {
        this.hasTriggeredMag9 = true;
        this.cinematicActive = true;

        // Slow down time slightly
        this.gameManager.roadSpeedMultiplier = 0.8;

        // Heavy screen shake burst
        const gameContainer = document.getElementById('game-container');
        gameContainer.classList.add('heavy-shake-active');

        // Red crack lines appear over screen -> via updating the cracks effect highly briefly
        const cracksOverlay = document.getElementById('cracks-overlay');
        const oldOpacity = cracksOverlay.style.opacity;
        cracksOverlay.style.opacity = 1.0;
        cracksOverlay.classList.add('flash-cracks');

        // Text appears in center
        this.collapseContainer.classList.remove('hidden-anim');
        this.collapseContainer.classList.add('show-anim');

        // Play huge sound
        if (this.gameManager.audioManager) {
            this.gameManager.audioManager.playLevelUpBoom();
        }

        // Restore normal game after 1.5 seconds
        setTimeout(() => {
            this.collapseContainer.classList.remove('show-anim');
            this.collapseContainer.classList.add('hidden-anim');

            cracksOverlay.classList.remove('flash-cracks');
            cracksOverlay.style.opacity = oldOpacity;

            gameContainer.classList.remove('heavy-shake-active');

            // Restore speed smoothly
            let step = 0;
            const restoreInt = setInterval(() => {
                step++;
                this.gameManager.roadSpeedMultiplier = 0.8 + (0.2 * (step / 10));
                if (step >= 10) {
                    this.gameManager.roadSpeedMultiplier = 1.0;
                    this.cinematicActive = false;
                    clearInterval(restoreInt);
                }
            }, 50);

        }, 1500);
    }
}
