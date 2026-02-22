class CharacterSelectionManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.container = document.getElementById('character-select-screen');
        this.carousel = document.getElementById('character-carousel');

        this.selectedCharacterId = localStorage.getItem('magrun_selected_char') || 'heathcliff';

        this.setupUI();
        this.setupListeners();
    }

    setupUI() {
        this.carousel.innerHTML = '';
        CharacterData.forEach(char => {
            const card = document.createElement('div');
            card.className = `char-card ${char.id === this.selectedCharacterId ? 'selected' : ''}`;
            card.dataset.id = char.id;

            card.innerHTML = `
                <div class="char-image-wrapper">
                    <img src="${char.image}" alt="${char.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' fill=\\'%23555\\'><rect width=\\'100\\' height=\\'100\\'/></svg>'">
                </div>
                <h3>${char.name}</h3>
                <p class="char-desc">${char.description}</p>
                <p class="char-perk">${char.perk}</p>
            `;

            card.addEventListener('click', () => this.selectCharacter(char.id));
            this.carousel.appendChild(card);
        });
    }

    setupListeners() {
        document.getElementById('btn-confirm-char').addEventListener('click', () => {
            this.hide();
        });
    }

    selectCharacter(id) {
        this.selectedCharacterId = id;
        localStorage.setItem('magrun_selected_char', id);
        this.updatePlayerAvatar();

        document.querySelectorAll('.char-card').forEach(card => {
            if (card.dataset.id === id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    updatePlayerAvatar() {
        const char = CharacterData.find(c => c.id === this.selectedCharacterId) || CharacterData[0];

        // Update menu top right avatar
        const menuAvatar = document.querySelector('.player-avatar');
        const menuName = document.querySelector('.player-name');
        if (menuAvatar) menuAvatar.style.backgroundImage = `url('${char.image}')`;

        // Use player name instead of character name
        const savedName = localStorage.getItem('magrun_username') || "GUEST_404";
        if (menuName) menuName.innerText = savedName.toUpperCase();

        // Tell player controller to update
        if (this.gameManager && this.gameManager.playerController) {
            this.gameManager.playerController.applyCharacter(char);
        }
    }

    show() {
        this.updatePlayerAvatar(); // sync before showing
        this.setupUI();

        this.gameManager.menuManager.menuElement.classList.add('hidden'); // hide main menu
        this.container.classList.remove('hidden');
        this.container.classList.add('fade-in');
    }

    hide() {
        this.container.classList.add('fade-out');
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.container.classList.remove('fade-out');

            if (this.gameManager.menuManager) {
                this.gameManager.menuManager.menuElement.classList.remove('hidden');
            }
        }, 300);
    }
}
