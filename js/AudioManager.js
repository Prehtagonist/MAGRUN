class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.baseOscillator = null;
        this.baseGain = null;
        this.heartbeatInterval = null;
        this.distortionOsc = null;
        this.initialized = false;

        this.masterGain = null;
        this.isMusicPlaying = false;
        this.bgAudioElement = null;
        this.bgAudioFadeInterval = null;

        this.gameplayAudioElement = null;
        this.isGameplayMusicPlaying = false;
        this.gameplayAudioFadeInterval = null;

        // Playlist setup
        this.playlist = [
            'assets/audio/background-music.mp3',
            'assets/audio/background-music-2.mp3'
        ];
        this.currentTrackIndex = 0;
    }

    applySettings(musicOn, sfxOn) {
        this.musicEnabled = musicOn;
        this.sfxEnabled = sfxOn;

        if (!this.musicEnabled) {
            this.stopMusicNodes();
            this.pauseBackgroundMusic();
            this.pauseGameplayMusic();
        } else if (this.initialized) {
            // Restart base ambience if on and wasn't playing
            if (!this.baseOscillator) this.startBaseAmbience();
            if (!this.isMusicPlaying && !this.isGameplayMusicPlaying) this.playBackgroundMusic();
        }
    }

    stopMusicNodes() {
        if (this.baseOscillator) {
            this.baseOscillator.stop();
            this.baseOscillator = null;
        }
        if (this.distortionOsc) {
            this.distortionOsc.stop();
            this.distortionOsc = null;
        }
    }

    init() {
        if (this.initialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.audioCtx.destination);

            this.setupBackgroundMusic();
            if (this.musicEnabled) {
                this.playBackgroundMusic();
            }

            this.startBaseAmbience();
            this.initialized = true;
        } catch (e) {
            console.warn("AudioContext init failed", e);
        }
    }

    setupBackgroundMusic() {
        this.bgAudioElement = new Audio();
        this.bgAudioElement.src = this.playlist[this.currentTrackIndex];
        this.bgAudioElement.loop = false; // We want it to end to trigger next track
        this.bgAudioElement.volume = 0;

        // Auto-play next track when current one finishes
        this.bgAudioElement.addEventListener('ended', () => {
            this.playNextTrack();
        });

        this.gameplayAudioElement = new Audio();
        this.gameplayAudioElement.src = 'assets/audio/gameplay-music.mp3';
        this.gameplayAudioElement.loop = true;
        this.gameplayAudioElement.volume = 0;
    }

    playNextTrack() {
        if (!this.musicEnabled) return;

        // Move to next track, wrap around to start if at end
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;

        this.bgAudioElement.src = this.playlist[this.currentTrackIndex];
        // Reset volume slightly for the new track fade-in
        this.bgAudioElement.volume = 0;

        this.bgAudioElement.play().then(() => {
            // Fade in to default volume over 1.5 seconds
            this.fadeMusicVolume(0.6, 1.5);
        }).catch(e => {
            console.warn("Failed to autoplay next track", e);
        });
    }

    playBackgroundMusic() {
        if (!this.musicEnabled || !this.bgAudioElement || this.isMusicPlaying) return;

        this.isMusicPlaying = true;
        this.bgAudioElement.play().then(() => {
            this.fadeMusicVolume(this.bgAudioElement, 0.6, 1.5);
        }).catch(e => {
            console.warn("Autoplay blocked or file not found.", e);
            this.isMusicPlaying = false;
        });
    }

    pauseBackgroundMusic() {
        if (!this.isMusicPlaying || !this.bgAudioElement) return;

        this.isMusicPlaying = false;
        this.fadeMusicVolume(this.bgAudioElement, 0, 0.5, () => {
            if (!this.isMusicPlaying) {
                this.bgAudioElement.pause();
            }
        });
    }

    playGameplayMusic() {
        if (!this.musicEnabled || !this.gameplayAudioElement || this.isGameplayMusicPlaying) return;

        this.isGameplayMusicPlaying = true;
        this.gameplayAudioElement.play().then(() => {
            this.fadeMusicVolume(this.gameplayAudioElement, 0.8, 1.5);
        }).catch(e => {
            console.warn("Gameplay music blocked or missing (assets/audio/gameplay-music.mp3)", e);
            this.isGameplayMusicPlaying = false;
        });
    }

    pauseGameplayMusic() {
        if (!this.isGameplayMusicPlaying || !this.gameplayAudioElement) return;

        this.isGameplayMusicPlaying = false;
        this.fadeMusicVolume(this.gameplayAudioElement, 0, 0.5, () => {
            if (!this.isGameplayMusicPlaying) {
                this.gameplayAudioElement.pause();
                this.gameplayAudioElement.currentTime = 0; // Rewind for next run
            }
        });
    }

    setMusicVolume(level) {
        if (!this.musicEnabled) return;
        if (this.isMusicPlaying && this.bgAudioElement) this.fadeMusicVolume(this.bgAudioElement, level, 1.0);
        if (this.isGameplayMusicPlaying && this.gameplayAudioElement) this.fadeMusicVolume(this.gameplayAudioElement, level, 1.0);
    }

    fadeMusicVolume(audioElement, targetVolume, duration, onComplete = null) {
        if (!audioElement) return;

        // Custom property to hold the active interval per element
        if (audioElement._fadeInterval) {
            clearInterval(audioElement._fadeInterval);
        }

        const startVolume = audioElement.volume;
        const volumeChange = targetVolume - startVolume;

        // Ensure duration is safe
        if (duration <= 0) {
            audioElement.volume = targetVolume;
            if (onComplete) onComplete();
            return;
        }

        const ticks = duration * 20; // 20 updates per second
        const stepTime = (duration * 1000) / ticks;
        const volumeStep = volumeChange / ticks;

        let currentTick = 0;

        audioElement._fadeInterval = setInterval(() => {
            currentTick++;
            let newVol = startVolume + (volumeStep * currentTick);

            if (newVol > 1) newVol = 1;
            if (newVol < 0) newVol = 0;

            audioElement.volume = newVol;

            if (currentTick >= ticks) {
                clearInterval(audioElement._fadeInterval);
                audioElement.volume = targetVolume;
                if (onComplete) onComplete();
            }
        }, stepTime);
    }

    startBaseAmbience() {
        if (!this.audioCtx || !this.musicEnabled) return;

        // Low rumble ambience
        this.baseOscillator = this.audioCtx.createOscillator();
        this.baseOscillator.type = 'sawtooth';
        this.baseOscillator.frequency.value = 40; // Low frequency rumble

        this.baseGain = this.audioCtx.createGain();
        this.baseGain.gain.value = 0.1; // Very low volume init

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 100;

        this.baseOscillator.connect(filter);
        filter.connect(this.baseGain);
        this.baseGain.connect(this.masterGain);

        this.baseOscillator.start();
    }

    updateEnginePitch(currentRoadSpeed, mag) {
        if (!this.initialized || !this.baseOscillator || !this.musicEnabled) return;

        // Base mapping: 400 speed = 40Hz, 800 speed = 80Hz
        const speedRatio = currentRoadSpeed / 400;
        const newFreq = 40 * speedRatio;

        let targetGain = 0.1 + (mag * 0.02);
        // Add a slight volume boost based on raw speed differences
        targetGain *= Math.min(1.5, Math.max(1, speedRatio * 0.8));

        this.baseOscillator.frequency.setTargetAtTime(newFreq, this.audioCtx.currentTime, 0.5);
        this.baseGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.5);

        if (mag >= 7 && !this.distortionOsc) {
            this.startDistortion();
        }

        if (mag >= 8 && !this.heartbeatInterval) {
            this.startHeartbeatPulse();
        }
    }

    playAccelRev() {
        if (!this.initialized || !this.baseOscillator || !this.sfxEnabled) return;
        // Pitch bend up briefly from current freq
        const currentFreq = this.baseOscillator.frequency.value;
        this.baseOscillator.frequency.cancelScheduledValues(this.audioCtx.currentTime);
        this.baseOscillator.frequency.setValueAtTime(currentFreq, this.audioCtx.currentTime);
        this.baseOscillator.frequency.linearRampToValueAtTime(currentFreq * 1.5, this.audioCtx.currentTime + 0.1);
        this.baseOscillator.frequency.exponentialRampToValueAtTime(currentFreq, this.audioCtx.currentTime + 0.5);
    }

    startDistortion() {
        if (!this.audioCtx || !this.musicEnabled) return;
        // Subtle high pitch distortion in the background
        this.distortionOsc = this.audioCtx.createOscillator();
        this.distortionOsc.type = 'square';
        this.distortionOsc.frequency.value = 120;

        const distGain = this.audioCtx.createGain();
        distGain.gain.value = 0.02;

        this.distortionOsc.connect(distGain);
        distGain.connect(this.masterGain);
        this.distortionOsc.start();
    }

    startHeartbeatPulse() {
        if (!this.audioCtx || !this.sfxEnabled) return;
        this.heartbeatInterval = setInterval(() => {
            this.playPulse();
        }, 1000);
    }

    playPulse() {
        if (!this.audioCtx || !this.sfxEnabled) return;
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.3);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    playLevelUpBoom() {
        if (!this.initialized || !this.sfxEnabled) return;
        const osc = this.audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.audioCtx.currentTime + 0.5);

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.5);

        // Lowpass filter for boom effect
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, this.audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.audioCtx.currentTime + 1.0);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.5);
    }

    playCrashSound() {
        if (!this.initialized || !this.sfxEnabled) return;
        this.stopAll();

        const osc = this.audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.5);

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.8, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.0);

        // Distortion curve
        const curve = new Float32Array(44100);
        for (let i = 0; i < 44100; ++i) {
            const x = i * 2 / 44100 - 1;
            curve[i] = (3 + 50) * x * 20 * (Math.PI / 180) / (Math.PI + 50 * Math.abs(x));
        }

        const waveShaper = this.audioCtx.createWaveShaper();
        waveShaper.curve = curve;
        waveShaper.oversample = '4x';

        osc.connect(waveShaper);
        waveShaper.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 1.5);
    }

    stopAll() {
        if (this.baseOscillator) {
            this.baseOscillator.stop();
            this.baseOscillator = null;
        }
        if (this.distortionOsc) {
            this.distortionOsc.stop();
            this.distortionOsc = null;
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Don't stop bgMusic in stopAll unless we're completely resetting
    }

    reset() {
        this.stopAll();
        // Return to standard background music
        if (this.initialized && this.musicEnabled) {
            this.startBaseAmbience();
            this.pauseGameplayMusic();
            if (!this.isMusicPlaying) {
                this.playBackgroundMusic();
                this.setMusicVolume(0.6);
            }
        }
    }
}
