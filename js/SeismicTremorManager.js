class SeismicTremorManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.nextTremorTime = performance.now() + 5000;
        this.isTremoring = false;
        this.tremorEndTime = 0;
        this.roadContainer = document.getElementById('road-container');
        this.entitiesLayer = document.getElementById('entities-layer');
        this.gameContainer = document.getElementById('game-container');
    }

    reset() {
        this.isTremoring = false;
        this.scheduleNextTremor();
        this.roadContainer.style.transform = `translateX(0px)`;
        this.entitiesLayer.style.transform = `translateX(0px)`;
        this.gameContainer.classList.remove('tremor-shake');
    }

    scheduleNextTremor() {
        const mag = this.gameManager.magnitudeManager.currentMagnitude;
        if (mag < 4) {
            this.nextTremorTime = performance.now() + 2000;
            return;
        }

        let min = mag >= 7 ? 5000 : 8000;
        let max = mag >= 7 ? 10000 : 15000;
        let delay = Math.random() * (max - min) + min;

        this.nextTremorTime = performance.now() + delay;
    }

    update(currentTime) {
        const mag = this.gameManager.magnitudeManager.currentMagnitude;
        if (mag < 4) return;

        if (!this.isTremoring && currentTime >= this.nextTremorTime) {
            this.startTremor();
        }

        if (this.isTremoring) {
            if (currentTime >= this.tremorEndTime) {
                this.endTremor();
            } else {
                const intensity = mag >= 8 ? 2 : 1;
                const offset = (Math.random() - 0.5) * 15 * intensity;
                this.roadContainer.style.transform = `translateX(${offset}px)`;
                this.entitiesLayer.style.transform = `translateX(${offset}px)`;
            }
        }
    }

    startTremor() {
        this.isTremoring = true;
        this.tremorEndTime = performance.now() + 1000 + Math.random() * 1000;
        this.gameContainer.classList.add('tremor-shake');
    }

    endTremor() {
        this.isTremoring = false;
        this.gameContainer.classList.remove('tremor-shake');
        this.roadContainer.style.transform = `translateX(0px)`;
        this.entitiesLayer.style.transform = `translateX(0px)`;
        this.scheduleNextTremor();
    }
}
