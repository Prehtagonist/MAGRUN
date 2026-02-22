class LoginManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.loginScreen = document.getElementById('login-screen');
        this.usernameInput = document.getElementById('username-input');
        this.loginBtn = document.getElementById('btn-login-start');

        this.username = localStorage.getItem('magrun_username');

        this.setupListeners();
    }

    init() {
        if (this.username) {
            // Already logged in, skip straight to menu
            this.hide();
            if (this.gameManager && this.gameManager.menuManager) {
                this.gameManager.menuManager.showMenu();
            }
        } else {
            // Need to login, show login screen
            this.show();
        }
    }

    setupListeners() {
        if (!this.loginBtn || !this.usernameInput) return;

        this.loginBtn.addEventListener('click', () => {
            this.handleLogin();
        });

        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        // Input validation to only allow alphanumeric and underscores
        this.usernameInput.addEventListener('input', (e) => {
            let val = e.target.value;
            val = val.replace(/[^a-zA-Z0-9_]/g, ''); // filter invalid chars
            if (val.length > 15) val = val.substring(0, 15);
            e.target.value = val;
        });
    }

    handleLogin() {
        let rawName = this.usernameInput.value.trim();
        if (rawName.length > 0) {
            this.username = rawName;
            localStorage.setItem('magrun_username', this.username);

            // Initialization of audio is handled by the global click listener in MenuManager
            if (this.gameManager && this.gameManager.audioManager && !this.gameManager.audioManager.initialized) {
                this.gameManager.audioManager.init();
            }

            this.hide();

            if (this.gameManager && this.gameManager.menuManager) {
                this.gameManager.menuManager.showMenu();
            }
        } else {
            // Visual shake feedback on empty input
            this.usernameInput.classList.add('error-shake');
            setTimeout(() => this.usernameInput.classList.remove('error-shake'), 400);
            this.usernameInput.focus();
        }
    }

    show() {
        if (this.loginScreen) {
            this.loginScreen.classList.remove('hidden');
            this.loginScreen.classList.add('fade-in');
            setTimeout(() => this.loginScreen.classList.remove('fade-in'), 500);
            // Auto focus
            setTimeout(() => this.usernameInput.focus(), 100);
        }
    }

    hide() {
        if (this.loginScreen) {
            this.loginScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loginScreen.classList.add('hidden');
                this.loginScreen.classList.remove('fade-out');
            }, 500);
        }
    }
}
