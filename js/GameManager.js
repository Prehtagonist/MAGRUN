class GameManager {
    constructor() {
        this.state = 'START';
        this.score = 0;
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        this.roadSpeed = 400;
        this.roadOffset = 0;
        this.survivalTime = 0;

        this.uiScore = document.getElementById('score-display');
        this.uiMagnitude = document.getElementById('magnitude-display');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalScoreText = document.getElementById('final-score');

        this.roadSprite1 = document.querySelector('.road-sprite-1');
        this.roadSprite2 = document.querySelector('.road-sprite-2');
        this.container = document.getElementById('game-container');
        this.containerHeight = this.container.clientHeight;

        this.laneManager = new LaneManager(this.container.clientWidth);
        this.playerController = new PlayerController(this.laneManager, document.getElementById('player'), this);
        this.obstacleSpawner = new ObstacleSpawner(this.laneManager, document.getElementById('entities-layer'), this);
        this.magnitudeManager = new MagnitudeManager(this);
        this.seismicManager = new SeismicTremorManager(this);
        this.threatPatternManager = new ThreatPatternManager(this);
        this.pressureManager = new PressureManager(this);
        this.audioManager = new AudioManager();
        this.cinematicManager = new CinematicManager(this);
        this.uiManager = new UIManager(this);

        this.menuManager = new MenuManager(this);
        this.settingsManager = new SettingsManager(this);
        this.characterSelectionManager = new CharacterSelectionManager(this);
        this.carSelectionManager = new CarSelectionManager(this);
        this.splashScreenManager = new SplashScreenManager(this);
        this.uiAnimations = new UIAnimationsManager(this);

        this.loginManager = new LoginManager(this);
        this.leaderboardManager = new LeaderboardManager();

        this.pressureManager.uiManager = this.uiManager;

        this.roadSpeedMultiplier = 1.0;

        this.debugLogging = false; // Turn off debug logging

        // Define fairness buffer
        this.collisionMargin = 5;

        this.roadSprite1.style.top = "0px";
        this.roadSprite2.style.top = `-${this.containerHeight}px`;

        this.setupButtons();

        window.addEventListener('resize', () => {
            this.containerHeight = this.container.clientHeight;
            this.laneManager.containerWidth = this.container.clientWidth;
            this.laneManager.setupLanes();
            this.playerController.updatePosition();
        });

        // Boot sequence
        if (this.characterSelectionManager) this.characterSelectionManager.updatePlayerAvatar();
        if (this.carSelectionManager) {
            // Setup car on player object initially
            const carData = this.carSelectionManager.getActiveCarData();
            if (this.playerController) this.playerController.applyCar(carData);
        }

        this.splashScreenManager.start();
    }

    setupButtons() {
        document.getElementById('restart-button').addEventListener('click', () => {
            // Full restart: hide game over, reset state
            this.gameOverScreen.classList.add('hidden');
            this.startGame();
        });

        document.getElementById('return-menu-button').addEventListener('click', () => {
            this.returnToMenu();
        });
    }

    returnToMenu() {
        this.gameOverScreen.classList.add('hidden');

        // Complete full state reset and stop playing
        this.state = 'MENU';
        this.score = 0;
        this.survivalTime = 0;
        this.uiManager.reset();
        this.playerController.reset();
        this.obstacleSpawner.clearAll();
        this.magnitudeManager.reset();
        this.seismicManager.reset();
        this.threatPatternManager.reset();
        this.pressureManager.reset();
        this.cinematicManager.reset();
        this.audioManager.reset();

        // Restore music volume to full for menu
        if (this.audioManager.musicEnabled) {
            this.audioManager.setMusicVolume(0.6);
        }

        // Clear crash effects / overlays
        this.container.classList.remove('flash-active');
        this.container.classList.remove('shake-active');
        this.container.classList.remove('cam-speed-zoom');
        this.container.classList.remove('cam-speed-shake');

        // Bring back the main menu UI using MenuManager
        if (this.menuManager) {
            this.menuManager.showMenu();
        }
    }

    startGame() {
        this.audioManager.init();

        // Grab current character for perks
        this.activeCharacterId = localStorage.getItem('magrun_selected_char') || 'heathcliff';
        this.revivesRemaining = this.activeCharacterId === 'heathcliff' ? 1 : 0;
        this.scoreMultiplier = this.activeCharacterId === 'xplanett' ? 1.1 : 1.0;

        // Check smaller hitbox perk
        this.collisionMargin = this.activeCharacterId === 'prehofweb3' ? 8 : 5;

        this.state = 'PLAYING';
        this.score = 0;
        this.survivalTime = 0;

        this.uiManager.reset();

        // Hide UI from menu or previous ends
        this.gameOverScreen.classList.add('hidden');

        this.playerController.reset();
        this.obstacleSpawner.clearAll();
        this.magnitudeManager.reset();
        this.seismicManager.reset();
        this.threatPatternManager.reset();
        this.pressureManager.reset();
        this.cinematicManager.reset();
        this.audioManager.reset();
        this.obstacleSpawner.start();

        this.lastFrameTime = performance.now();
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        this.applyDifficultySettings();
    }

    applyDifficultySettings() {
        if (!this.settingsManager) return;

        switch (this.settingsManager.difficulty) {
            case 'easy':
                this.roadSpeed = 300;
                if (this.obstacleSpawner) {
                    this.obstacleSpawner.updateSpawnRate(2000);
                    this.obstacleSpawner.obstacleSpeed = 300;
                }
                break;
            case 'medium':
                this.roadSpeed = 400;
                if (this.obstacleSpawner) {
                    this.obstacleSpawner.updateSpawnRate(1500);
                    this.obstacleSpawner.obstacleSpeed = 400;
                }
                break;
            case 'hard':
                this.roadSpeed = 500;
                if (this.obstacleSpawner) {
                    this.obstacleSpawner.updateSpawnRate(1000);
                    this.obstacleSpawner.obstacleSpeed = 500;
                }
                break;
        }
    }

    async gameOver() {
        this.state = 'GAMEOVER';
        this.playerController.die();
        this.obstacleSpawner.stop();
        this.audioManager.playCrashSound();

        // Duck the music volume
        if (this.audioManager.musicEnabled) {
            this.audioManager.setMusicVolume(0.2);
        }

        // Save score to leaderboard
        if (this.loginManager && this.loginManager.username) {
            const isNewRecord = await this.leaderboardManager.updateLeaderboard(
                this.loginManager.username,
                this.score,
                this.magnitudeManager.currentMagnitude
            );

            const finalScoreText = document.getElementById('final-score');
            if (finalScoreText) {
                if (isNewRecord) {
                    finalScoreText.classList.add('record-highlight-text');
                } else {
                    finalScoreText.classList.remove('record-highlight-text');
                }
            }
        }

        // Slow mo crash effect
        this.roadSpeedMultiplier = 0.2;

        setTimeout(() => {
            this.uiManager.showGameOver(this.score, this.magnitudeManager.currentMagnitude);
            this.gameOverScreen.classList.remove('hidden');
            this.roadSpeedMultiplier = 1.0;
        }, 500);
    }

    gameLoop(currentTime) {
        const dt = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        if (dt < 0.1) {
            // Update particles whether playing or in menu
            this.uiAnimations.update(dt);

            if (this.state === 'PLAYING' || this.state === 'MENU') {
                this.updateSystem(dt);
            }

            // Run player physics frame update
            if (this.playerController && this.state !== 'GAMEOVER') {
                this.playerController.update(dt);
            }
        }

        if (this.state === 'PLAYING' || this.state === 'MENU') {
            this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    updateSystem(dt) {
        // Apply slow-mo from cinematic or crash
        let effectiveDt = dt * this.roadSpeedMultiplier;

        this.survivalTime += effectiveDt;
        this.score = this.survivalTime * 10 * this.scoreMultiplier;
        this.uiManager.updateScore(this.score);

        this.magnitudeManager.checkScore(this.score);
        this.pressureManager.update(effectiveDt);

        this.roadOffset += this.roadSpeed * this.roadSpeedMultiplier * effectiveDt;
        if (this.roadOffset >= this.containerHeight) {
            this.roadOffset -= this.containerHeight;
        }

        this.roadSprite1.style.top = `${this.roadOffset}px`;
        this.roadSprite2.style.top = `${this.roadOffset - this.containerHeight}px`;

        if (this.state === 'PLAYING') {
            this.obstacleSpawner.update(effectiveDt);
            this.seismicManager.update(performance.now());
            this.checkCollisions();
        }
    }

    checkCollisions() {
        const playerRect = this.playerController.getRect();
        const playerLane = this.playerController.currentLaneIndex;

        for (let i = this.obstacleSpawner.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacleSpawner.obstacles[i];

            // Check real lane index rather than visual position to ignore tremors
            if (obs.laneIndex === playerLane) {
                const obsRect = obs.element.getBoundingClientRect();

                // Add fairness buffer. 
                // Since the car is now 220px tall, we trim the visual rect to maintain fair gameplay.
                const hitboxTrimY = 45; // Trim 45px off the visual front and back bounds

                const pTop = playerRect.top + hitboxTrimY + this.collisionMargin;
                const pBottom = playerRect.bottom - hitboxTrimY - this.collisionMargin;
                const oTop = obsRect.top + this.collisionMargin;
                const oBottom = obsRect.bottom - this.collisionMargin;

                if (pTop < oBottom && pBottom > oTop) {
                    if (this.debugLogging) {
                        console.log(`[COLLISION] Hit! Player: Lane ${playerLane}, Y: ${pTop}-${pBottom} | Obs Type: ${obs.type}, Y: ${oTop}-${oBottom}`);
                    }

                    if (obs.type === 'oil') {
                        this.playerController.hitOilSlick();
                    } else {
                        if (this.revivesRemaining > 0) {
                            // Heathcliff Perk Triggered
                            this.revivesRemaining--;
                            this.triggerReviveState(obs);
                        } else {
                            this.gameOver();
                            break;
                        }
                    }
                }
            } else {
                // Not in player lane. Check near miss for pressure relief
                const obsRect = obs.element.getBoundingClientRect();
                const oTop = obsRect.top;

                // If obstacle just passed below player
                if (oTop > playerRect.bottom && !obs.passedPlayerSafe) {
                    obs.passedPlayerSafe = true; // custom flag
                    if (this.pressureManager) {
                        this.pressureManager.relievePressure(5); // Minor pressure relief for near miss
                    }
                }
            }
        }
    }

    triggerReviveState(fatalObstacle) {
        // Play special revive animation / sound
        if (this.audioManager) this.audioManager.playLevelUpBoom();

        this.container.classList.add('flash-active');
        setTimeout(() => this.container.classList.remove('flash-active'), 500);

        // Destroy the obstacle that hit us
        fatalObstacle.element.remove();
        this.obstacleSpawner.obstacles = this.obstacleSpawner.obstacles.filter(o => o !== fatalObstacle);

        // Brief invulnerability or pressure clear
        if (this.pressureManager) this.pressureManager.currentPressure = 0;
    }
}
