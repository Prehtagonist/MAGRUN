class MagnitudeManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.currentMagnitude = 0;
        this.maxMagnitude = 9;
        this.scoreThresholds = [0, 100, 250, 500, 1000, 2000, 3000, 3500, 4500, 6000];
        this.subtitles = {
            1: "Initiate",
            2: "Echo",
            3: "Pulse",
            4: "Tremor",
            5: "Quack",
            6: "Aftershock",
            7: "Rift",
            8: "Faultline",
            9: "ALPHA"
        };

        this.magColors = {
            1: "#FFFACD", // Pale Yellow / Cream
            2: "#008080", // Teal / Aqua Green
            3: "#00FF00", // Bright Green
            4: "#90EE90", // Light Green
            5: "#9ACD32", // Yellow-Green
            6: "#FFFF00", // Yellow
            7: "#FFA500", // Orange
            8: "#FF0000", // Red
            9: "#00FFFF"  // Cyan / Turquoise Blue
        };

        // Base values
        this.baseRoadSpeed = 400; // from GameManger Phase 1
        this.baseSpawnRate = 1500;
        this.baseObstacleSpeed = 400;

        this.uiMagnitude = document.getElementById('magnitude-display');
        this.hudBadge = document.getElementById('hud-mag-badge');
        this.levelUpContainer = document.getElementById('level-up-container');
        this.levelUpMagText = document.getElementById('level-up-mag');
        this.levelUpSubText = document.getElementById('level-up-sub');
        this.levelUpBadge = document.getElementById('level-up-badge');
        this.screenFlash = document.getElementById('screen-flash');
        this.gameContainer = document.getElementById('game-container');
        this.redOverlay = document.getElementById('red-overlay');
        this.vignetteOverlay = document.getElementById('vignette-overlay');
        this.cracksOverlay = document.getElementById('cracks-overlay');

        this.preloadBadges();
    }

    preloadBadges() {
        this.preloadedImages = {};
        for (let i = 1; i <= 9; i++) {
            const img = new Image();
            img.src = `assets/mag-badges/mag${i}.png`;
            this.preloadedImages[i] = img;
        }
    }

    reset() {
        this.currentMagnitude = 0;
        this.updateUI();
        this.applyScaling();
        this.resetVisuals();
    }

    checkScore(score) {
        if (this.currentMagnitude >= this.maxMagnitude) return; // Hard Cap Protection

        // Loop handles edge cases where score jumps multiple tiers instantly
        while (this.currentMagnitude < this.maxMagnitude && score >= this.scoreThresholds[this.currentMagnitude + 1]) {
            this.levelUp();
        }
    }

    levelUp() {
        if (this.currentMagnitude >= this.maxMagnitude) return;
        this.currentMagnitude++;

        this.updateUI();
        this.applyScaling();
        this.triggerLevelUpEffects();
    }

    updateUI() {
        if (this.currentMagnitude > 0) {
            const badgeSrc = `assets/mag-badges/mag${this.currentMagnitude}.png`;
            const glowColor = this.magColors[this.currentMagnitude] || "#ff0000";

            // Show badge in HUD
            this.hudBadge.src = badgeSrc;
            this.hudBadge.classList.remove('hidden');
            this.hudBadge.style.filter = `drop-shadow(0 0 5px ${glowColor})`;
        } else {
            this.hudBadge.classList.add('hidden');
        }

        if (this.gameManager.uiManager) {
            this.gameManager.uiManager.updateMagnitude(this.currentMagnitude);
        } else {
            const span = this.uiMagnitude.querySelector('span');
            if (span) span.innerText = `MAG ${this.currentMagnitude}`;
        }
    }

    applyScaling() {
        // Check Xealist perk
        const activeChar = localStorage.getItem('magrun_selected_char') || 'heathcliff';
        let speedMultiplier = 1 + (this.currentMagnitude / 9);

        if (activeChar === 'xealist') {
            speedMultiplier *= 0.95; // 5% slower global speed
        }

        const currentRoadSpeed = this.baseRoadSpeed * speedMultiplier;
        const currentObstacleSpeed = this.baseObstacleSpeed * speedMultiplier;

        let currentSpawnRate = this.baseSpawnRate - (this.currentMagnitude * 100);
        if (currentSpawnRate < 500) currentSpawnRate = 500;

        this.gameManager.roadSpeed = currentRoadSpeed;
        this.gameManager.obstacleSpawner.obstacleSpeed = currentObstacleSpeed;
        this.gameManager.obstacleSpawner.updateSpawnRate(currentSpawnRate);
    }

    triggerLevelUpEffects() {
        // Red screen flash
        const glowColor = this.magColors[this.currentMagnitude] || "#ff0000";
        const subtitle = this.subtitles[this.currentMagnitude] || "Instability Rising";

        // Play level up sound & update audio engine
        if (this.gameManager.audioManager) {
            this.gameManager.audioManager.playLevelUpBoom();
            this.gameManager.audioManager.playAccelRev(); // Pitch rev up on level up
            this.gameManager.audioManager.updateEnginePitch(this.gameManager.roadSpeed, this.currentMagnitude);
        }

        // Check for Mag 9 Collapse Cinematic
        if (this.gameManager.cinematicManager) {
            this.gameManager.cinematicManager.checkCinematicTrigger(this.currentMagnitude);
        }

        // Center text and badge animation setup
        this.levelUpMagText.innerText = `MAG ${this.currentMagnitude}`;
        this.levelUpSubText.innerText = subtitle;

        // Show proper badge image for this MAG
        if (this.currentMagnitude > 0 && this.currentMagnitude <= 9) {
            this.levelUpBadge.src = `assets/mag-badges/mag${this.currentMagnitude}.png`;
            this.levelUpBadge.classList.remove('hidden');
            this.levelUpBadge.style.filter = `drop-shadow(0 0 15px ${glowColor})`;
        } else {
            this.levelUpBadge.classList.add('hidden');
        }

        // Trigger visual escalation on environment
        this.updateVisualEscalation();

        // Apply glow color styling
        this.levelUpMagText.style.color = glowColor;
        this.levelUpMagText.style.textShadow = `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 2px 2px 0 #000`;

        this.levelUpSubText.style.color = glowColor;
        this.levelUpSubText.style.textShadow = `0 0 10px ${glowColor}, 2px 2px 0 #000`;
        this.levelUpSubText.style.opacity = 0.8;

        // Reset animation state to allow re-triggering if levels jump fast
        this.levelUpContainer.classList.remove('show-anim', 'hidden-anim');

        // Force reflow to restart CSS animation
        void this.levelUpContainer.offsetWidth;

        this.levelUpContainer.classList.add('show-anim');

        // Clear existing timeout if multiple level ups happen fast
        if (this.fadeOutTimeout) {
            clearTimeout(this.fadeOutTimeout);
        }

        // Fade out after 2.5s to give time to see badge
        this.fadeOutTimeout = setTimeout(() => {
            this.levelUpContainer.classList.remove('show-anim');
            this.levelUpContainer.classList.add('hidden-anim');
        }, 2800);
    }

    updateVisualEscalation() {
        let redOpacity = 0;
        if (this.currentMagnitude >= 5) {
            redOpacity = (this.currentMagnitude - 4) * 0.08;
        }

        let darknessOpacity = this.currentMagnitude * 0.03;

        this.redOverlay.style.background = `rgba(255, 0, 0, ${redOpacity})`;
        const darkOverlay = document.getElementById('dark-overlay');
        darkOverlay.style.background = `rgba(0, 0, 0, ${darknessOpacity})`;

        if (this.currentMagnitude >= 7) {
            this.cracksOverlay.style.opacity = (this.currentMagnitude - 6) * 0.3;
        } else {
            this.cracksOverlay.style.opacity = 0;
        }

        // Engine vibration on car at Mag 5+
        const playerEl = document.getElementById('player');
        if (playerEl) {
            if (this.currentMagnitude >= 5) {
                playerEl.classList.add('engine-vibrate');
            } else {
                playerEl.classList.remove('engine-vibrate');
            }
        }

        if (this.currentMagnitude >= 7) {
            this.vignetteOverlay.style.boxShadow = `inset 0 0 150px rgba(0,0,0,0.9)`;
            this.gameContainer.style.filter = "saturate(1.2) contrast(1.1) blur(0.5px)";
        } else {
            this.vignetteOverlay.style.boxShadow = `inset 0 0 100px rgba(0,0,0,0)`;
            this.gameContainer.style.filter = "none";
        }

        // Dynamic Camera & Speed Effects
        const speedLines = document.getElementById('speed-lines');
        if (this.currentMagnitude >= 4) {
            this.gameContainer.classList.add('cam-speed-zoom');
            if (speedLines) speedLines.style.opacity = (this.currentMagnitude - 3) * 0.15;

            // Add subtle shake at high speeds
            if (this.currentMagnitude >= 7) {
                this.gameContainer.classList.add('cam-speed-shake');
            } else {
                this.gameContainer.classList.remove('cam-speed-shake');
            }
        } else {
            this.gameContainer.classList.remove('cam-speed-zoom');
            this.gameContainer.classList.remove('cam-speed-shake');
            if (speedLines) speedLines.style.opacity = 0;
        }
    }

    resetVisuals() {
        this.redOverlay.style.background = `transparent`;
        const darkOverlay = document.getElementById('dark-overlay');
        darkOverlay.style.background = `transparent`;
        this.cracksOverlay.style.opacity = 0;
        this.vignetteOverlay.style.boxShadow = `inset 0 0 100px rgba(0,0,0,0)`;
        this.gameContainer.classList.remove('micro-shake');
    }
}
