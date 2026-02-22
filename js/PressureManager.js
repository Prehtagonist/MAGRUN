class PressureManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.pressure = 0; // 0 to 100
        this.maxPressure = 100;
        this.uiManager = null; // assigned later
    }

    update(dt) {
        if (this.gameManager.state !== 'PLAYING') return;
        const currentMag = this.gameManager.magnitudeManager.currentMagnitude;
        const increaseRate = 0.5 + (currentMag * 0.2);

        this.pressure += increaseRate * dt * 10; // dt is in seconds, *10 to make it noticeable

        if (this.pressure > this.maxPressure) {
            this.pressure = this.maxPressure;
        }

        if (this.uiManager) {
            this.uiManager.updatePressureBar(this.pressure, currentMag);
        }
    }

    relievePressure(amount) {
        this.pressure -= amount;
        if (this.pressure < 0) this.pressure = 0;
    }

    reset() {
        this.pressure = 0;
        if (this.uiManager) {
            this.uiManager.updatePressureBar(0, 0);
        }
    }
}
