class UIAnimationsManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.particlesContainer = document.getElementById('particles-overlay');
        this.particles = [];
        this.spawnTimer = null;

        if (this.particlesContainer) {
            this.startSpawning();
        }
    }

    startSpawning() {
        this.spawnTimer = setInterval(() => {
            if (this.gameManager.state === 'MENU' || this.gameManager.state === 'PLAYING') {
                this.spawnSpark();
            }
        }, 300); // 1 spark every 300ms
    }

    spawnSpark() {
        if (this.particles.length > 20) return; // limit sparks

        const spark = document.createElement('div');
        spark.className = 'spark-particle';

        // Random horizontal position, mostly near lanes
        const startX = 20 + Math.random() * 60; // 20% to 80%

        spark.style.left = `${startX}%`;
        spark.style.bottom = `-10px`;

        this.particlesContainer.appendChild(spark);

        const particleObj = {
            el: spark,
            x: startX,
            y: 0,
            speed: 5 + Math.random() * 10,
            drift: (Math.random() - 0.5) * 5,
            life: 1.0
        };

        this.particles.push(particleObj);
    }

    update(dt) {
        // Update particles
        const containerHeight = window.innerHeight;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.y += p.speed * dt * 60; // scale with framerate roughly
            p.x += p.drift * dt * 60;
            p.life -= dt * 0.5; // 2 second life

            p.el.style.bottom = `${p.y}px`;
            p.el.style.left = `${p.x}%`;
            p.el.style.opacity = p.life;

            if (p.life <= 0 || p.y > containerHeight) {
                p.el.remove();
                this.particles.splice(i, 1);
            }
        }
    }
}
