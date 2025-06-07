class SavingsPlanner {
    constructor() {
        this.userData = {
            savingsCapacity: 0,
            mainGoal: { amount: 0, months: 0, description: '' },
            selectedPlan: null,
            secondaryGoals: [],
            savingsHistory: [],
            totalSaved: 0
        };
        this.charts = {};
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setupTheme();
        this.initializeCharts();
        this.updateAllDisplays();
        this.setTodayDate();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Planificateur
        document.getElementById('generatePlan').addEventListener('click', () => this.generateSavingsPlans());
        document.getElementById('resetForm').addEventListener('click', () => this.resetForm());

        // Inputs principaux
        ['monthlySavingsCapacity', 'savingsGoal', 'timeframe', 'goalDescription'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.updateUserData();
                    this.updateAllDisplays();
                });
            }
        });

        // Suivi
        document.getElementById('addSavings').addEventListener('click', () => this.addSavings());

        // Objectifs secondaires
        document.getElementById('addObjective').addEventListener('click', () => this.addSecondaryObjective());

        // Thème
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    }

    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('savingsDate').value = today;
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        if (tabName === 'tracking') {
            setTimeout(() => this.updateCharts(), 100);
        }
    }

    updateUserData() {
        this.userData.savingsCapacity = parseFloat(document.getElementById('monthlySavingsCapacity').value) || 0;
        this.userData.mainGoal.amount = parseFloat(document.getElementById('savingsGoal').value) || 0;
        this.userData.mainGoal.months = parseFloat(document.getElementById('timeframe').value) || 0;
        this.userData.mainGoal.description = document.getElementById('goalDescription').value || '';
        this.saveData();
    }

    generateSavingsPlans() {
        const { savingsCapacity } = this.userData;
        const { amount: goalAmount, months: timeframe } = this.userData.mainGoal;

        if (!goalAmount || !timeframe) {
            this.showAlert('Veuillez définir un objectif avec un montant et une durée.', 'warning');
            return;
        }

        const totalDays = timeframe * 30;
        const totalWeeks = timeframe * 4.33;

        const dailyAmount = goalAmount / totalDays;
        const weeklyAmount = goalAmount / totalWeeks;
        const monthlyAmount = goalAmount / timeframe;

        const planResults = document.getElementById('planResults');

        planResults.innerHTML = `
            <div class="plans-container">
                <div class="plan-header">
                    <h3>📋 Plans d'épargne pour votre objectif</h3>
                    <p><strong>Objectif :</strong> ${this.formatCurrency(goalAmount)} en ${timeframe} mois</p>
                    <p><strong>Description :</strong> ${this.userData.mainGoal.description}</p>
                </div>

                <div class="savings-plans">
                    <div class="savings-plan-card ${monthlyAmount <= savingsCapacity ? 'feasible' : 'challenging'}">
                        <div class="plan-header-row">
                            <i class="fas fa-calendar-alt"></i>
                            <h4>Plan Mensuel</h4>
                            ${monthlyAmount <= savingsCapacity ? '<span class="badge success">Recommandé</span>' : '<span class="badge warning">Ambitieux</span>'}
                        </div>
                        <div class="plan-amount">${this.formatCurrency(monthlyAmount)}</div>
                        <div class="plan-frequency">par mois</div>
                        <div class="plan-status">
                            <i class="fas ${monthlyAmount <= savingsCapacity ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                            ${monthlyAmount <= savingsCapacity ? 
                                `Compatible avec votre capacité (${this.formatCurrency(savingsCapacity)}/mois)` : 
                                `Dépasse votre capacité de ${this.formatCurrency(monthlyAmount - savingsCapacity)}/mois`
                            }
                        </div>
                        <button class="btn-plan ${monthlyAmount <= savingsCapacity ? 'btn-primary' : 'btn-secondary'}" 
                                onclick="savingsApp.selectPlan('monthly', ${monthlyAmount})">
                            Choisir ce plan
                        </button>
                    </div>

                    <div class="savings-plan-card feasible">
                        <div class="plan-header-row">
                            <i class="fas fa-calendar-week"></i>
                            <h4>Plan Hebdomadaire</h4>
                        </div>
                        <div class="plan-amount">${this.formatCurrency(weeklyAmount)}</div>
                        <div class="plan-frequency">par semaine</div>
                        <div class="plan-status">
                            <i class="fas fa-info-circle"></i>
                            Plus flexible et régulier
                        </div>
                        <button class="btn-plan btn-primary" onclick="savingsApp.selectPlan('weekly', ${weeklyAmount})">
                            Choisir ce plan
                        </button>
                    </div>

                    <div class="savings-plan-card feasible">
                        <div class="plan-header-row">
                            <i class="fas fa-calendar-day"></i>
                            <h4>Plan Quotidien</h4>
                        </div>
                        <div class="plan-amount">${this.formatCurrency(dailyAmount)}</div>
                        <div class="plan-frequency">par jour</div>
                        <div class="plan-status">
                            <i class="fas fa-info-circle"></i>
                            Habitude quotidienne simple
                        </div>
                        <button class="btn-plan btn-primary" onclick="savingsApp.selectPlan('daily', ${dailyAmount})">
                            Choisir ce plan
                        </button>
                    </div>
                </div>

                ${monthlyAmount > savingsCapacity ? `
                    <div class="plan-advice">
                        <i class="fas fa-lightbulb"></i>
                        <div>
                            <strong>Conseil :</strong> Votre capacité actuelle est de ${this.formatCurrency(savingsCapacity)}/mois. 
                            Vous pourriez atteindre votre objectif en ${Math.ceil(goalAmount / savingsCapacity)} mois 
                            avec votre capacité actuelle.
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        this.showAlert('Plans d\'épargne générés ! Choisissez celui qui vous convient.', 'success');
    }

    selectPlan(type, amount) {
        this.userData.selectedPlan = {
            type: type,
            amount: amount,
            startDate: new Date().toISOString()
        };

        this.saveData();

        let frequency;
        switch(type) {
            case 'daily': frequency = 'quotidien'; break;
            case 'weekly': frequency = 'hebdomadaire'; break;
            case 'monthly': frequency = 'mensuel'; break;
        }

        this.showAlert(`Plan ${frequency} sélectionné : ${this.formatCurrency(amount)} !`, 'success');
        this.updateAllDisplays();
        this.switchTab('tracking');
    }

    addSavings() {
        const amount = parseFloat(document.getElementById('savingsAmount').value);
        const date = document.getElementById('savingsDate').value;

        if (!amount || amount <= 0) {
            this.showAlert('Veuillez entrer un montant valide.', 'warning');
            return;
        }

        if (!date) {
            this.showAlert('Veuillez sélectionner une date.', 'warning');
            return;
        }

        this.userData.savingsHistory.push({
            id: Date.now(),
            amount: amount,
            date: date,
            timestamp: new Date().toISOString()
        });

        this.userData.totalSaved += amount;

        this.saveData();
        this.updateAllDisplays();

        document.getElementById('savingsAmount').value = '';
        this.showAlert(`${this.formatCurrency(amount)} ajouté à votre épargne !`, 'success');
    }

    updateAllDisplays() {
        this.updateMainObjectiveCard();
        this.updatePrimaryObjective();
        this.updateSavingsHistory();
        this.renderSecondaryObjectives();
        this.updateCharts();
    }

    updateMainObjectiveCard() {
        const card = document.getElementById('mainObjectiveCard');
        const goal = this.userData.mainGoal;

        if (!goal.amount) {
            card.innerHTML = '<p class="no-objective">Définissez un objectif pour voir votre progression</p>';
            return;
        }

        const progress = Math.min((this.userData.totalSaved / goal.amount) * 100, 100);
        const remaining = Math.max(goal.amount - this.userData.totalSaved, 0);

        card.innerHTML = `
            <div class="objective-progress">
                <div class="objective-info">
                    <h4>${goal.description || 'Mon objectif d\'épargne'}</h4>
                    <div class="amounts">
                        <span class="saved">${this.formatCurrency(this.userData.totalSaved)}</span>
                        <span class="separator">/</span>
                        <span class="target">${this.formatCurrency(goal.amount)}</span>
                    </div>
                    <p class="remaining">Reste à épargner : <strong>${this.formatCurrency(remaining)}</strong></p>
                </div>

                <div class="progress-circle-container">
                    <div class="progress-circle" style="--progress: ${progress};">
                        <span class="progress-text">${Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>

            ${this.userData.selectedPlan ? `
                <div class="selected-plan-info">
                    <i class="fas fa-star"></i>
                    <span>Plan sélectionné : ${this.formatCurrency(this.userData.selectedPlan.amount)} 
                    ${this.userData.selectedPlan.type === 'daily' ? 'par jour' : 
                      this.userData.selectedPlan.type === 'weekly' ? 'par semaine' : 'par mois'}</span>
                </div>
            ` : ''}
        `;
    }

    updatePrimaryObjective() {
        const container = document.getElementById('primaryObjective');
        const goal = this.userData.mainGoal;

        if (!goal.amount) {
            container.innerHTML = '<p class="no-objective">Définissez un objectif dans le planificateur</p>';
            return;
        }

        const progress = Math.min((this.userData.totalSaved / goal.amount) * 100, 100);
        const monthlyNeeded = goal.amount / goal.months;

        container.innerHTML = `
            <div class="objective-details">
                <h4>${goal.description || 'Objectif principal'}</h4>
                <div class="objective-stats">
                    <div class="stat">
                        <span class="label">Montant total</span>
                        <span class="value">${this.formatCurrency(goal.amount)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Durée</span>
                        <span class="value">${goal.months} mois</span>
                    </div>
                    <div class="stat">
                        <span class="label">Épargne mensuelle nécessaire</span>
                        <span class="value">${this.formatCurrency(monthlyNeeded)}</span>
                    </div>
                </div>
                <div class="progress-bar" style="margin-top: 1rem;">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-info">
                    <span>${Math.round(progress)}% accompli</span>
                    <span>${this.formatCurrency(this.userData.totalSaved)} / ${this.formatCurrency(goal.amount)}</span>
                </div>
            </div>
        `;
    }

    updateSavingsHistory() {
        const container = document.getElementById('savingsHistory');
        const history = this.userData.savingsHistory.slice().reverse(); // Plus récent en premier

        if (history.length === 0) {
            container.innerHTML = '<p class="no-history">Aucune épargne enregistrée</p>';
            return;
        }

        container.innerHTML = `
            <div class="history-summary">
                <div class="total-saved">
                    <strong>Total épargné : ${this.formatCurrency(this.userData.totalSaved)}</strong>
                </div>
                <div class="entries-count">${history.length} entrée(s)</div>
            </div>
            <div class="history-list">
                ${history.slice(0, 10).map(entry => `
                    <div class="history-item">
                        <div class="history-date">${new Date(entry.date).toLocaleDateString('fr-FR')}</div>
                        <div class="history-amount">${this.formatCurrency(entry.amount)}</div>
                        <button class="btn-remove" onclick="savingsApp.removeSavingsEntry(${entry.id})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
            ${history.length > 10 ? `<p class="history-note">Affichage des 10 dernières entrées</p>` : ''}
        `;
    }

    removeSavingsEntry(id) {
        const entry = this.userData.savingsHistory.find(e => e.id === id);
        if (entry && confirm('Supprimer cette épargne ?')) {
            this.userData.savingsHistory = this.userData.savingsHistory.filter(e => e.id !== id);
            this.userData.totalSaved -= entry.amount;
            this.saveData();
            this.updateAllDisplays();
            this.showAlert('Épargne supprimée', 'success');
        }
    }

    addSecondaryObjective() {
        const title = document.getElementById('newObjectiveTitle').value;
        const amount = parseFloat(document.getElementById('newObjectiveAmount').value);
        const months = parseInt(document.getElementById('newObjectiveMonths').value);

        if (!title || !amount || !months) {
            this.showAlert('Veuillez remplir tous les champs.', 'warning');
            return;
        }

        const newObjective = {
            id: Date.now(),
            title,
            amount,
            months,
            currentSavings: 0
        };

        this.userData.secondaryGoals.push(newObjective);
        this.saveData();
        this.renderSecondaryObjectives();

        document.getElementById('newObjectiveTitle').value = '';
        document.getElementById('newObjectiveAmount').value = '';
        document.getElementById('newObjectiveMonths').value = '';

        this.showAlert('Objectif secondaire ajouté !', 'success');
    }

    renderSecondaryObjectives() {
        const container = document.getElementById('secondaryObjectives');

        if (this.userData.secondaryGoals.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.userData.secondaryGoals.map(goal => {
            const progress = goal.currentSavings / goal.amount * 100;
            const monthlyAmount = goal.amount / goal.months;

            return `
                <div class="secondary-objective">
                    <div class="objective-header">
                        <h4>${goal.title}</h4>
                        <button onclick="savingsApp.removeSecondaryObjective(${goal.id})" class="btn-danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="objective-info">
                        <p>Objectif : <strong>${this.formatCurrency(goal.amount)}</strong> en ${goal.months} mois</p>
                        <p>Épargne mensuelle nécessaire : <strong>${this.formatCurrency(monthlyAmount)}</strong></p>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="progress-info">
                        <span>${Math.round(progress)}%</span>
                        <span>${this.formatCurrency(goal.currentSavings)} / ${this.formatCurrency(goal.amount)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    removeSecondaryObjective(id) {
        if (confirm('Supprimer cet objectif ?')) {
            this.userData.secondaryGoals = this.userData.secondaryGoals.filter(goal => goal.id !== id);
            this.saveData();
            this.renderSecondaryObjectives();
            this.showAlert('Objectif supprimé.', 'success');
        }
    }

    initializeCharts() {
        this.initWeeklyChart();
    }

    initWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        this.charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Épargne quotidienne',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.updateCharts();
    }

    updateCharts() {
        if (!this.charts.weekly) return;

        const last30Days = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last30Days.push(date.toISOString().split('T')[0]);
        }

        const chartData = last30Days.map(date => {
            const entries = this.userData.savingsHistory.filter(entry => entry.date === date);
            return entries.reduce((sum, entry) => sum + entry.amount, 0);
        });

        const chartLabels = last30Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        });

        this.charts.weekly.data.labels = chartLabels;
        this.charts.weekly.data.datasets[0].data = chartData;
        this.charts.weekly.update();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('XOF', 'Fr');
    }

    showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `floating-alert ${type}`;
        alert.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            <span>${message}</span>
        `;

        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--warning-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    saveData() {
        localStorage.setItem('savingsPlannerData', JSON.stringify(this.userData));
    }

    loadData() {
        const saved = localStorage.getItem('savingsPlannerData');
        if (saved) {
            this.userData = { ...this.userData, ...JSON.parse(saved) };
            this.populateForm();
        }
    }

    populateForm() {
        document.getElementById('monthlySavingsCapacity').value = this.userData.savingsCapacity || '';
        document.getElementById('savingsGoal').value = this.userData.mainGoal.amount || '';
        document.getElementById('timeframe').value = this.userData.mainGoal.months || '';
        document.getElementById('goalDescription').value = this.userData.mainGoal.description || '';
    }

    resetForm() {
        if (confirm('Réinitialiser toutes vos données ?')) {
            localStorage.removeItem('savingsPlannerData');
            this.userData = {
                savingsCapacity: 0,
                mainGoal: { amount: 0, months: 0, description: '' },
                selectedPlan: null,
                secondaryGoals: [],
                savingsHistory: [],
                totalSaved: 0
            };

            document.querySelectorAll('input').forEach(input => {
                if (input.type !== 'date') input.value = '';
            });

            this.updateAllDisplays();
            this.showAlert('Données réinitialisées', 'success');
        }
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('savings-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('savings-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Styles pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialiser l'application
const savingsApp = new SavingsPlanner();
