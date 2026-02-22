class CarSelectionManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.container = document.getElementById('car-select-screen');
        this.carousel = document.getElementById('car-carousel');

        this.selectedCarId = localStorage.getItem('magrun_selected_car') || 'night_striker';

        this.setupUI();
        this.setupListeners();
    }

    setupUI() {
        this.carousel.innerHTML = '';
        CarData.forEach(car => {
            const card = document.createElement('div');
            card.className = `char-card car-card ${car.id === this.selectedCarId ? 'selected' : ''}`;
            card.dataset.id = car.id;

            card.innerHTML = `
                <div class="car-image-wrapper">
                    <img src="${car.image}" alt="${car.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'150\\' height=\\'200\\' fill=\\'%23555\\'><rect width=\\'150\\' height=\\'200\\'/></svg>'">
                </div>
                <h3>${car.name}</h3>
                <p class="char-desc">${car.description}</p>
                <div class="perk-badge" style="color: ${car.glowColor}; border-color: ${car.glowColor};">TRAIT: ${car.trait}</div>
            `;

            card.addEventListener('click', () => this.selectCar(car.id));
            this.carousel.appendChild(card);
        });
    }

    setupListeners() {
        document.getElementById('btn-confirm-car').addEventListener('click', () => {
            this.hide();
        });
    }

    selectCar(id) {
        this.selectedCarId = id;
        localStorage.setItem('magrun_selected_car', id);

        document.querySelectorAll('.car-card').forEach(card => {
            if (card.dataset.id === id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Tell player controller to update if we're in game
        if (this.gameManager && this.gameManager.playerController) {
            this.gameManager.playerController.applyCar(this.getActiveCarData());
        }
    }

    getActiveCarData() {
        return CarData.find(c => c.id === this.selectedCarId) || CarData[0];
    }

    show() {
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
