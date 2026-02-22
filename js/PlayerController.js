class PlayerController {
    constructor(lanes, playerElement, gameManager) {
        this.lanes = lanes;
        this.playerElement = playerElement;
        this.gameManager = gameManager;
        this.currentLaneIndex = 1;

        // Smooth movement properties
        this.currentX = 0;
        this.targetX = 0;
        this.currentTilt = 0;
        this.isMoving = false;
        this.bounceTimer = 0;

        // Setup internal elements for dynamic styling
        this.underglowElement = document.createElement('div');
        this.underglowElement.className = 'player-underglow';
        this.playerElement.appendChild(this.underglowElement);

        this.headlightElement = document.createElement('div');
        this.headlightElement.className = 'player-headlights';
        this.playerElement.appendChild(this.headlightElement);

        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isDead = false;

        this.isSlowed = false;
        this.slowdownTimer = null;
        this.switchCooldown = 0;

        this.lastSwitchTime = performance.now();

        // Initialize target and current X to the center lane immediately to avoid flying in
        this.targetX = this.lanes.getLanePosition(1);
        this.currentX = this.targetX;
        this.playerElement.style.left = `${this.currentX}px`;

        this.setupControls();
    }

    update(dt) {
        if (this.isDead) return;

        // Smooth horizontal Lerp
        const lerpFactor = 15 * dt; // Adjust for snappiness
        this.currentX += (this.targetX - this.currentX) * lerpFactor;

        // Calculate body tilt based on distance to target lane
        const diffX = this.targetX - this.currentX;
        let targetTilt = 0;

        if (Math.abs(diffX) > 2) {
            // Max tilt of ~5 degrees
            targetTilt = (diffX / this.lanes.laneWidth) * 15;
            // Clamp tilt
            targetTilt = Math.max(-6, Math.min(6, targetTilt));
        }

        // Smooth the tilt
        this.currentTilt += (targetTilt - this.currentTilt) * (10 * dt);

        // Suspension bounce based on current speed
        let bounceY = 0;
        let pitchX = 0; // backward acceleration lean

        // Speed scaling simulation (GameManager would normally handle this but we approximate via magnitude logic)
        const speedRatio = this.gameManager ? (this.gameManager.roadSpeed / 800) : 0.5;
        this.bounceTimer += dt * (10 * speedRatio);

        // Very subtle sine wave bounce (1-3px)
        bounceY = Math.sin(this.bounceTimer) * 1.5;

        // Apply transformations
        this.playerElement.style.left = `${this.currentX}px`;

        // Dynamic transform origin to fake a slight rear tire drift slip by swinging the front
        this.playerElement.style.transformOrigin = "top center";
        this.playerElement.style.transform = `translateX(-50%) translateY(${bounceY}px) rotateZ(${this.currentTilt}deg)`;
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.isDead || performance.now() < this.switchCooldown) return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.moveLeft();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.moveRight();
            }
        });

        const gameContainer = document.getElementById('game-container');
        gameContainer.addEventListener('touchstart', (e) => {
            if (this.isDead) return;
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        gameContainer.addEventListener('touchend', (e) => {
            if (this.isDead) return;
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }

    handleSwipe() {
        if (performance.now() < this.switchCooldown) return;
        const diffX = this.touchEndX - this.touchStartX;
        const swipeThreshold = 30;

        if (diffX > swipeThreshold) {
            this.moveRight();
        } else if (diffX < -swipeThreshold) {
            this.moveLeft();
        }
    }

    moveLeft() {
        if (this.currentLaneIndex > 0) {
            this.currentLaneIndex--;
            this.lastSwitchTime = performance.now();
            this.updatePosition();

            // Relieve pressure slightly
            if (this.gameManager && this.gameManager.pressureManager) {
                this.gameManager.pressureManager.relievePressure(15);
            }
        }
    }

    moveRight() {
        if (this.currentLaneIndex < 2) {
            this.currentLaneIndex++;
            this.lastSwitchTime = performance.now();
            this.updatePosition();

            if (this.gameManager && this.gameManager.pressureManager) {
                this.gameManager.pressureManager.relievePressure(15);
            }

            if (this.isSlowed) this.switchCooldown = performance.now() + 400;
        }
    }

    updatePosition() {
        this.targetX = this.lanes.getLanePosition(this.currentLaneIndex);
    }

    applyCharacter(charData) {
        if (!charData) return;
        const head = document.getElementById('player-head');
        if (head) {
            head.style.backgroundImage = `url('${charData.image}')`;
            head.style.backgroundColor = 'transparent'; // Remove placeholder red
            head.style.backgroundSize = 'cover';
        }
    }

    applyCar(carData) {
        if (!carData) return;
        this.playerElement.style.backgroundImage = `url('${carData.image}')`;
        this.playerElement.style.backgroundColor = 'transparent';
        this.playerElement.style.boxShadow = 'none'; // remove old block shadow

        // Apply glow
        if (carData.glowColor) {
            this.underglowElement.style.boxShadow = `0 0 30px 10px ${carData.glowColor}`;
        } else {
            this.underglowElement.style.boxShadow = 'none';
        }

        // Update head position specifically for this car geometry
        const head = document.getElementById('player-head');
        if (head && carData.headOffset) {
            head.style.top = carData.headOffset;
        }
    }

    hitOilSlick() {
        if (this.isSlowed) return;
        this.isSlowed = true;
        this.playerElement.classList.add('oiled');

        const activeChar = localStorage.getItem('magrun_selected_char') || 'heathcliff';
        const duration = activeChar === 'noxx' ? 750 : 1500; // Noxx recovers 2x faster

        if (this.slowdownTimer) clearTimeout(this.slowdownTimer);
        this.slowdownTimer = setTimeout(() => {
            this.isSlowed = false;
            this.playerElement.classList.remove('oiled');
        }, duration);
    }

    getRect() {
        return this.playerElement.getBoundingClientRect();
    }

    die() {
        this.isDead = true;
    }

    reset() {
        this.isDead = false;
        this.currentLaneIndex = 1;
        this.isSlowed = false;
        this.switchCooldown = 0;
        this.lastSwitchTime = performance.now();
        if (this.slowdownTimer) clearTimeout(this.slowdownTimer);
        this.playerElement.classList.remove('oiled');
        this.updatePosition();
    }

    getTimeSinceLastSwitch() {
        return performance.now() - this.lastSwitchTime;
    }
}
