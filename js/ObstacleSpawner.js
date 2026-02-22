class ObstacleSpawner {
    constructor(lanes, containerElement, gameManager) {
        this.lanes = lanes;
        this.containerElement = containerElement;
        this.gameManager = gameManager; // Need ref to check magnitude
        this.obstacles = [];
        this.spawnTimer = null;
        this.spawnRate = 1500;
        this.obstacleSpeed = 400;

        this.lastSpawnLanes = [];
        this.patternCooldownTimer = 0;
        this.lastSpawnY = 0;
        this.minSpawnDistanceFromPlayerY = 0;
    }

    start() {
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        this.spawnTimer = setInterval(() => this.spawnObstacle(), this.spawnRate);
    }

    updateSpawnRate(newRate) {
        if (this.spawnRate === newRate) return;
        this.spawnRate = newRate;
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = setInterval(() => this.spawnObstacle(), this.spawnRate);
        }
    }

    stop() {
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = null;
        }
    }

    getSpawnType(mag) {
        let types = [{ type: 'rock', weight: 100 }];

        if (mag >= 3) types.push({ type: 'vehicle', weight: 40 + mag * 5 });
        if (mag >= 5) types.push({ type: 'oil', weight: 30 + mag * 5 });
        if (mag >= 7) types.push({ type: 'moving', weight: 20 + mag * 10 });
        if (mag >= 8) types.push({ type: 'lava', weight: 10 + mag * 15 });

        // Normalize weights
        const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;

        for (let t of types) {
            if (random < t.weight) return t.type;
            random -= t.weight;
        }

        return 'rock';
    }

    spawnObstacle() {
        if (this.patternCooldownTimer > 0) {
            this.patternCooldownTimer--;
        }

        const mag = this.gameManager.magnitudeManager ? this.gameManager.magnitudeManager.currentMagnitude : 0;
        const timeSinceSwitch = this.gameManager.playerController ? this.gameManager.playerController.getTimeSinceLastSwitch() : 0;

        let pattern = 'A';
        if (this.gameManager.threatPatternManager) {
            pattern = this.gameManager.threatPatternManager.getPattern(mag, timeSinceSwitch);
        }

        // Spawn Stacking Protection
        if (this.patternCooldownTimer > 0 && (pattern === 'C' || pattern === 'D')) {
            pattern = 'A';
        }

        if (pattern === 'C' || pattern === 'D') {
            this.patternCooldownTimer = 2; // Next 2 spawns should be A or B
        }

        if (pattern === 'A') {
            this.executePatternA(mag);
        } else if (pattern === 'B') {
            this.executePatternB(mag);
        } else if (pattern === 'C') {
            this.executePatternC(mag);
        } else if (pattern === 'D') {
            this.executePatternD(mag);
        }
    }

    executePatternA(mag) {
        const lane = Math.floor(Math.random() * 3);
        this.createObstacle(lane, this.getSpawnType(mag));
    }

    executePatternB(mag) {
        let safeLane = 1;
        if (this.gameManager.threatPatternManager) {
            safeLane = this.gameManager.threatPatternManager.getSafeLaneForDoubleBlock();
        } else {
            safeLane = Math.floor(Math.random() * 3);
        }

        const lanesToBlock = [0, 1, 2].filter(l => l !== safeLane);
        lanesToBlock.forEach(lane => {
            this.createObstacle(lane, this.getSpawnType(mag));
        });

        this.triggerDoubleLaneHighlight(lanesToBlock, safeLane);
    }

    executePatternC(mag) {
        const lane = Math.floor(Math.random() * 3);
        const obsIndex = this.createObstacle(lane, this.getSpawnType(mag));

        // Ensure it's marked to move later
        if (obsIndex !== -1) {
            this.obstacles[this.obstacles.length - 1].type = 'moving'; // Force to be moving type
            this.obstacles[this.obstacles.length - 1].hasMoved = false;
        }
    }

    executePatternD(mag) {
        const lane1 = Math.floor(Math.random() * 3);
        const obsIndex = this.createObstacle(lane1, this.getSpawnType(mag));

        // Delayed spawn in adjacent lane
        setTimeout(() => {
            if (this.gameManager.state !== 'PLAYING') return;

            // Check distance between first obstacle and player
            const safeDistanceThreshold = this.gameManager.roadSpeed * 1.0;
            if (this.obstacles.length > 0 && obsIndex !== -1 && this.obstacles[this.obstacles.length - 1].yPos > safeDistanceThreshold) {
                return; // First obstacle is too close, cancel double trap
            }

            const adjacentLanes = [];
            if (lane1 > 0) adjacentLanes.push(lane1 - 1);
            if (lane1 < 2) adjacentLanes.push(lane1 + 1);

            const lane2 = adjacentLanes[Math.floor(Math.random() * adjacentLanes.length)];
            this.createObstacle(lane2, this.getSpawnType(mag));
        }, 500);
    }

    triggerDoubleLaneHighlight(dangerLanes, safeLane) {
        dangerLanes.forEach(lane => {
            const el = document.getElementById(`highlight-${lane}`);
            if (el) {
                el.classList.add('danger');
                setTimeout(() => el.classList.remove('danger'), 300);
            }
        });

        const safeEl = document.getElementById(`highlight-${safeLane}`);
        if (safeEl) {
            safeEl.classList.add('safe');
            setTimeout(() => safeEl.classList.remove('safe'), 300);
        }
    }

    createObstacle(laneIndex, obsType) {
        const xPos = this.lanes.getLanePosition(laneIndex);

        const obstacleEl = document.createElement('div');
        obstacleEl.className = `obstacle obs-${obsType}`;
        obstacleEl.style.left = `${xPos}px`;

        // Dynamic spawn point based on safe reaction distance
        this.minSpawnDistanceFromPlayerY = this.gameManager.roadSpeed * 1.2;
        const containerHeight = this.containerElement.clientHeight;
        const playerY = containerHeight * 0.85; // Player is positioned near bottom 15%

        let spawnY = -100;

        // Temporarily log spawns
        if (this.gameManager.debugLogging) {
            console.log(`[SPAWN] Type: ${obsType} | Lane: ${laneIndex} | Speed: ${this.gameManager.roadSpeed}`);
        }

        obstacleEl.style.top = `${spawnY}px`;

        this.containerElement.appendChild(obstacleEl);

        this.obstacles.push({
            element: obstacleEl,
            yPos: spawnY,
            laneIndex: laneIndex,
            type: obsType,
            spawnTime: performance.now(),
            hasMoved: false
        });

        return this.obstacles.length - 1;
    }

    update(dt) {
        const containerHeight = this.containerElement.clientHeight;
        const currentTime = performance.now();

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.yPos += this.obstacleSpeed * dt;

            // Moving obstacle logic
            if (obs.type === 'moving' && !obs.hasMoved && currentTime - obs.spawnTime > 1000) {
                // Check if Y is safely above player
                if (obs.yPos < containerHeight * 0.6) {
                    obs.hasMoved = true;
                    // Move towards center or random adjacent
                    let newLane;
                    if (obs.laneIndex === 0) newLane = 1;
                    else if (obs.laneIndex === 2) newLane = 1;
                    else newLane = Math.random() > 0.5 ? 0 : 2;

                    obs.laneIndex = newLane;
                    const nx = this.lanes.getLanePosition(newLane);
                    obs.element.style.transition = 'left 0.3s ease-in-out';
                    obs.element.style.left = `${nx}px`;
                }
            }

            obs.element.style.top = `${obs.yPos}px`;

            if (obs.yPos > containerHeight + 150) {
                obs.element.remove();
                this.obstacles.splice(i, 1);
            }
        }
    }

    clearAll() {
        this.obstacles.forEach(obs => obs.element.remove());
        this.obstacles = [];
        this.lastSpawnLanes = [];
    }
}
