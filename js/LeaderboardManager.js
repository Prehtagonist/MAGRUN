class LeaderboardManager {
    constructor() {
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.closeBtn = document.getElementById('close-leaderboard-btn');

        // Array of { username, score, mag }
        this.scores = [];
        this.loadScores();
        this.setupListeners();
    }

    setupListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }

    loadScores() {
        const savedScores = localStorage.getItem('magrun_leaderboard');
        if (savedScores) {
            try {
                this.scores = JSON.parse(savedScores);
            } catch (e) {
                console.warn("Failed to parse leaderboard data", e);
                this.scores = [];
            }
        }
    }

    updateLeaderboard(username, score, maxMag) {
        console.log(`[Leaderboard] Username received: ${username}, Score received: ${score}`);

        // 1. Get existing leaderboard data from storage
        this.loadScores();
        console.log(`[Leaderboard] Existing leaderboard before update:`, JSON.parse(JSON.stringify(this.scores)));

        if (!username || score <= 0) return false;

        let isNewRecord = false;
        // Check if user exists
        const existingIndex = this.scores.findIndex(s => s.username === username);

        if (existingIndex !== -1) {
            // Update if strictly higher
            if (score > this.scores[existingIndex].score) {
                this.scores[existingIndex].score = score;
                this.scores[existingIndex].mag = maxMag;
                isNewRecord = true;
            } else if (score === this.scores[existingIndex].score && maxMag > this.scores[existingIndex].mag) {
                this.scores[existingIndex].mag = maxMag;
                isNewRecord = true;
            }
        } else {
            // New user
            this.scores.push({
                username: username,
                score: score,
                mag: maxMag
            });
            isNewRecord = true;
        }

        // Sort descending by score, then mag
        this.scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.mag - a.mag;
        });

        // Keep only top 10
        if (this.scores.length > 10) {
            this.scores = this.scores.slice(0, 10);
        }

        // Save using consistent storage key
        localStorage.setItem('magrun_leaderboard', JSON.stringify(this.scores));
        console.log(`[Leaderboard] Updated leaderboard after save:`, this.scores);

        // Force UI Refresh
        this.renderLeaderboard(isNewRecord ? username : null);
        return isNewRecord;
    }

    renderLeaderboard(highlightUsername = null) {
        if (!this.leaderboardList) return;
        this.leaderboardList.innerHTML = ''; // Force clear old list

        if (this.scores.length === 0) {
            this.leaderboardList.innerHTML = '<li>No scores yet. Be the first!</li>';
            return;
        }

        this.scores.forEach((entry, index) => {
            const li = document.createElement('li');
            li.classList.add('leaderboard-item');
            if (index === 0) {
                li.classList.add('rank-1');
            }

            // Apply highlight animation if this is a new record
            if (highlightUsername === entry.username) {
                li.classList.add('record-highlight');
            }

            const rankSpan = document.createElement('span');
            rankSpan.className = 'lb-rank';
            rankSpan.textContent = `#${index + 1}`;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'lb-name';
            nameSpan.textContent = entry.username;

            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'lb-score';
            scoreSpan.textContent = entry.score;

            const magSpan = document.createElement('span');
            magSpan.className = 'lb-mag';
            magSpan.textContent = `MAG ${entry.mag.toFixed(1)}`;

            li.appendChild(rankSpan);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            li.appendChild(magSpan);

            this.leaderboardList.appendChild(li);
        });
    }

    show() {
        this.renderLeaderboard();
        if (this.leaderboardScreen) {
            this.leaderboardScreen.classList.remove('hidden');
            this.leaderboardScreen.classList.add('fade-in');
            setTimeout(() => this.leaderboardScreen.classList.remove('fade-in'), 500);
        }
    }

    hide() {
        if (this.leaderboardScreen) {
            this.leaderboardScreen.classList.add('fade-out');
            setTimeout(() => {
                this.leaderboardScreen.classList.add('hidden');
                this.leaderboardScreen.classList.remove('fade-out');
            }, 500);
        }
    }
}
