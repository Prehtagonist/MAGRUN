class UIManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.scoreDisplay = document.getElementById('score-display');
        this.magnitudeDisplay = document.getElementById('magnitude-display');

        this.pressureContainer = document.getElementById('pressure-container');
        this.pressureFill = document.getElementById('pressure-fill');

        this.finalMagText = document.getElementById('final-mag');
        this.finalScoreText = document.getElementById('final-score');

        this.lastScore = 0;
    }

    updateScore(score) {
        const flooredScore = Math.floor(score);
        if (flooredScore > this.lastScore) {
            this.scoreDisplay.innerText = flooredScore;
            this.scoreDisplay.classList.add('score-pop');
            setTimeout(() => this.scoreDisplay.classList.remove('score-pop'), 100);
            this.lastScore = flooredScore;
        }
    }

    updateMagnitude(mag) {
        this.magnitudeDisplay.innerText = `MAG ${mag}`;
        this.magnitudeDisplay.classList.add('mag-pop');
        setTimeout(() => this.magnitudeDisplay.classList.remove('mag-pop'), 200);
    }

    updatePressureBar(pressure, mag) {
        const pct = Math.min(100, Math.max(0, pressure));
        this.pressureFill.style.width = `${pct}%`;

        // At Mag 7+, pulsing animation
        if (mag >= 7) {
            this.pressureContainer.classList.add('pulse-active');
        } else {
            this.pressureContainer.classList.remove('pulse-active');
        }

        // At Mag 9, glowing red vibration
        if (mag >= 9) {
            this.pressureContainer.classList.add('critical-vibration');
            this.pressureFill.style.background = '#ff0000';
            this.pressureFill.style.boxShadow = '0 0 10px #ff0000';
        } else {
            this.pressureContainer.classList.remove('critical-vibration');
            let color = '#ffaa00';
            if (pct > 75) color = '#ff3300';
            this.pressureFill.style.background = color;
            this.pressureFill.style.boxShadow = `0 0 5px ${color}`;
        }
    }

    showGameOver(finalScore, finalMag) {
        this.finalScoreText.innerText = Math.floor(finalScore);
        if (this.finalMagText) {
            this.finalMagText.innerText = finalMag;
        }
    }

    reset() {
        this.lastScore = 0;
        this.scoreDisplay.innerText = "0";
        this.magnitudeDisplay.innerText = "MAG 0";
        this.updatePressureBar(0, 0);
    }
}
