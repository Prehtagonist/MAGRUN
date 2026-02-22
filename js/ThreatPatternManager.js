class ThreatPatternManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.lastSafeLane = -1;
        this.consecutiveSafeCount = 0;
        this.consecutiveDoubleCount = 0;
    }

    reset() {
        this.lastSafeLane = -1;
        this.consecutiveSafeCount = 0;
        this.consecutiveDoubleCount = 0;
    }

    getPattern(mag, timeSinceLastSwitch) {
        let probs = { A: 100, B: 0, C: 0, D: 0 };

        if (mag <= 2) {
            probs = { A: 80, B: 20, C: 0, D: 0 };
        } else if (mag <= 4) {
            probs = { A: 60, B: 35, C: 5, D: 0 };
        } else if (mag <= 6) {
            probs = { A: 30, B: 50, C: 20, D: 0 };
        } else if (mag <= 8) {
            probs = { A: 20, B: 50, C: 20, D: 10 };
        } else {
            probs = { A: 10, B: 50, C: 25, D: 15 };
        }

        // Advanced Pressure Rule
        if (mag >= 7 && timeSinceLastSwitch > 5000) {
            probs.B += 30; // Increase chance of B
            probs.A = Math.max(0, probs.A - 30);
        }

        // Prevent too many consecutive double patterns (B or D)
        if (this.consecutiveDoubleCount >= 2) {
            probs.A += probs.B + probs.D;
            probs.B = 0;
            probs.D = 0;
        }

        const total = probs.A + probs.B + probs.C + probs.D;
        let r = Math.random() * total;
        let selectedPattern = 'A';

        if (r < probs.A) {
            selectedPattern = 'A';
        } else if (r < probs.A + probs.B) {
            selectedPattern = 'B';
        } else if (r < probs.A + probs.B + probs.C) {
            selectedPattern = 'C';
        } else {
            selectedPattern = 'D';
        }

        if (selectedPattern === 'B' || selectedPattern === 'D') {
            this.consecutiveDoubleCount++;
        } else {
            this.consecutiveDoubleCount = 0;
        }

        return selectedPattern;
    }

    getSafeLaneForDoubleBlock() {
        let safeLane = Math.floor(Math.random() * 3);

        if (this.consecutiveSafeCount >= 3) {
            // Force a different safe lane
            let options = [0, 1, 2].filter(l => l !== this.lastSafeLane);
            safeLane = options[Math.floor(Math.random() * options.length)];
        }

        if (safeLane === this.lastSafeLane) {
            this.consecutiveSafeCount++;
        } else {
            this.lastSafeLane = safeLane;
            this.consecutiveSafeCount = 1;
        }

        return safeLane;
    }
}
