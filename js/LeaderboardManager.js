class LeaderboardManager {
    constructor() {
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.closeBtn = document.getElementById('close-leaderboard-btn');

        // Array of { username, score, mag }
        this.scores = [];
        this.currentSort = 'score'; // Default sort

        // Wait for Firebase to initialize
        setTimeout(() => this.fetchScores(), 500);
        this.setupListeners();
    }

    setupListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Sorting Buttons
        const sortBtns = document.querySelectorAll('.lb-sort-btn');
        sortBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                sortBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentSort = e.target.dataset.sort;
                this.renderLeaderboard();
            });
        });
    }

    async fetchScores() {
        if (!window.magrunDB) {
            console.warn("Firestore not initialized. Retrying in 2 seconds...");
            setTimeout(() => this.fetchScores(), 2000);
            return;
        }

        try {
            const snapshot = await window.magrunDB.collection('leaderboard').get();
            this.scores = [];
            snapshot.forEach(doc => {
                this.scores.push(doc.data());
            });
            console.log("🔥 Loaded scores from Firestore:", this.scores.length);
        } catch (error) {
            console.error("Error fetching leaderboard from Firestore:", error);
        }
    }

    async updateLeaderboard(username, score, maxMag) {
        console.log(`[Leaderboard] Attempting Global Sync for: ${username}, Score: ${score}`);

        if (!username || score <= 0) return false;
        if (!window.magrunDB) {
            console.error("Cannot save to Leaderboard. Firestore is missing.");
            return false;
        }

        let isNewRecord = false;

        try {
            const userRef = window.magrunDB.collection('leaderboard').doc(username);
            const doc = await userRef.get();

            if (doc.exists) {
                const data = doc.data();
                if (score > data.score) {
                    await userRef.update({ score: score, mag: maxMag, date: Date.now() });
                    isNewRecord = true;
                } else if (score === data.score && maxMag > data.mag) {
                    await userRef.update({ mag: maxMag, date: Date.now() });
                    isNewRecord = true;
                }
            } else {
                // New user
                await userRef.set({
                    username: username,
                    score: score,
                    mag: maxMag,
                    date: Date.now()
                });
                isNewRecord = true;
            }

            // Sync local cache with new database truth
            await this.fetchScores();

            // Force UI Refresh
            this.renderLeaderboard(isNewRecord ? username : null);
            return isNewRecord;

        } catch (error) {
            console.error("Failed to sync score to Firestore:", error);
            return false;
        }
    }

    getSortedScores() {
        // Return a fresh sorted copy based on the current filter
        let sorted = [...this.scores];

        switch (this.currentSort) {
            case 'mag':
                sorted.sort((a, b) => b.mag - a.mag || b.score - a.score);
                break;
            case 'recent':
                sorted.sort((a, b) => {
                    const dateA = a.date || 0;
                    const dateB = b.date || 0;
                    return dateB - dateA; // Newest first
                });
                break;
            case 'score':
            default:
                sorted.sort((a, b) => b.score - a.score || b.mag - a.mag);
                break;
        }
        return sorted;
    }

    updateStatsSummary() {
        const username = localStorage.getItem('magrun_username');

        // Find bests
        let maxScore = 0;
        let maxMag = 0;
        let pBestScore = '--';

        this.scores.forEach(s => {
            if (s.score > maxScore) maxScore = s.score;
            if (s.mag > maxMag) maxMag = s.mag;
            if (s.username === username) pBestScore = s.score;
        });

        document.getElementById('stat-total-players').innerText = this.scores.length;
        this.animateValue(document.getElementById('stat-max-score'), 0, maxScore, 1000);
        document.getElementById('stat-max-mag').innerText = maxMag.toFixed(1);

        const yourBestEl = document.getElementById('stat-your-best');
        if (pBestScore !== '--') {
            this.animateValue(yourBestEl, 0, pBestScore, 1000);
        } else {
            yourBestEl.innerText = '--';
        }
    }

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    renderLeaderboard(highlightUsername = null) {
        if (!this.leaderboardList) return;
        this.leaderboardList.innerHTML = ''; // Force clear old list

        this.updateStatsSummary();

        if (this.scores.length === 0) {
            this.leaderboardList.innerHTML = '<li><span class="lb-name" style="width:100%;text-align:center;">No scores yet. Be the first!</span></li>';
            return;
        }

        const username = localStorage.getItem('magrun_username');
        const sortedData = this.getSortedScores();

        // Find true rank
        let playerTrueRank = -1;
        let playerTrueData = null;
        for (let i = 0; i < sortedData.length; i++) {
            if (sortedData[i].username === username) {
                playerTrueRank = i + 1;
                playerTrueData = sortedData[i];
                break;
            }
        }

        // Display True Rank footer if not in top 10
        const footer = document.getElementById('lb-true-rank-footer');
        if (footer) { // Added null check for footer
            if (playerTrueRank > 10 && playerTrueData) {
                footer.classList.remove('hidden');
                document.getElementById('true-rank-val').innerText = `#${playerTrueRank}`;
                document.getElementById('true-rank-score').innerText = `${playerTrueData.score} pts`;
            } else {
                footer.classList.add('hidden');
            }
        }


        // Slice for render
        const top10 = sortedData.slice(0, 10);

        top10.forEach((entry, index) => {
            const li = document.createElement('li');
            li.classList.add('leaderboard-item');

            // Staggered animation delay
            li.style.animationDelay = `${index * 0.05}s`;

            if (index === 0) li.classList.add('rank-1');
            else if (index === 1) li.classList.add('rank-2');
            else if (index === 2) li.classList.add('rank-3');

            if (entry.username === username) {
                li.classList.add('current-player-row');
            }

            if (highlightUsername === entry.username) {
                li.classList.add('record-highlight');
            }

            const rankSpan = document.createElement('span');
            rankSpan.className = 'lb-rank';

            // Dynamic rank display
            if (index === 0) rankSpan.innerHTML = `👑 #1`;
            else rankSpan.innerHTML = `#${index + 1}`;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'lb-name';
            nameSpan.textContent = entry.username;
            if (entry.username === username) {
                const badge = document.createElement('span');
                badge.className = 'you-badge';
                badge.innerText = 'YOU';
                nameSpan.appendChild(badge);
            }

            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'lb-score';
            // Start counter at 0
            scoreSpan.textContent = "0";

            const magSpan = document.createElement('span');
            magSpan.className = 'lb-mag';
            magSpan.textContent = `MAG ${entry.mag.toFixed(1)}`;

            li.appendChild(rankSpan);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            li.appendChild(magSpan);

            this.leaderboardList.appendChild(li);

            // Animate score value
            this.animateValue(scoreSpan, 0, entry.score, 1000 + (index * 100));
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
