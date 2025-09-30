/**
 * LeadsEngine Dashboard
 * Handles dashboard statistics and data visualization
 */

const Dashboard = {
    /**
     * Load and display dashboard statistics
     */
    async loadDashboardStats() {
        try {
            // Show loading state
            this.showLoadingState();

            // Fetch all leads with relationships (includes status info)
            const response = await API.get(Config.ENDPOINTS.LEAD.WITH_RELATIONSHIPS);
            const leads = response.records || [];

            // Calculate statistics
            const stats = this.calculateStats(leads);

            // Update the UI with calculated stats
            this.updateStatCards(stats);

        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            this.showError('Failed to load dashboard statistics. Please refresh the page.');
        }
    },

    /**
     * Calculate statistics from leads data
     * @param {Array} leads - Array of lead objects
     * @returns {Object} Calculated statistics
     */
    calculateStats(leads) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

        const stats = {
            total: leads.length,
            newThisWeek: 0,
            inProgress: 0,
            converted: 0
        };

        leads.forEach(lead => {
            // Count new leads (created in last 7 days)
            if (lead.created_at) {
                const createdDate = new Date(lead.created_at);
                if (createdDate >= oneWeekAgo) {
                    stats.newThisWeek++;
                }
            }

            // Count by status
            // Check for status name or slug (case-insensitive)
            const statusName = lead.status_name?.toLowerCase() ||
                             lead.status?.name?.toLowerCase() ||
                             lead.status?.slug?.toLowerCase() || '';

            // In Progress: new, contacted, qualified, follow-up, etc.
            if (statusName.includes('new') ||
                statusName.includes('contact') ||
                statusName.includes('qualified') ||
                statusName.includes('follow') ||
                statusName.includes('progress') ||
                statusName.includes('nurture')) {
                stats.inProgress++;
            }

            // Converted: converted, won, customer, etc.
            if (statusName.includes('convert') ||
                statusName.includes('won') ||
                statusName.includes('customer') ||
                statusName.includes('closed-won')) {
                stats.converted++;
            }
        });

        return stats;
    },

    /**
     * Update stat cards with calculated values
     * @param {Object} stats - Statistics object
     */
    updateStatCards(stats) {
        // Get all stat cards
        const statCards = document.querySelectorAll('.stat-card');

        if (statCards.length >= 4) {
            // Update Total Leads (first card - blue)
            statCards[0].querySelector('.stat-number').textContent = stats.total;

            // Update New This Week (second card - green)
            statCards[1].querySelector('.stat-number').textContent = stats.newThisWeek;

            // Update In Progress (third card - orange)
            statCards[2].querySelector('.stat-number').textContent = stats.inProgress;

            // Update Converted (fourth card - cyan)
            statCards[3].querySelector('.stat-number').textContent = stats.converted;
        }

        // Remove loading class
        this.hideLoadingState();
    },

    /**
     * Show loading state on stat cards
     */
    showLoadingState() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(el => {
            el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            el.classList.add('loading');
        });
    },

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(el => {
            el.classList.remove('loading');
        });
    },

    /**
     * Show error message
     * @param {String} message - Error message to display
     */
    showError(message) {
        // Remove loading state
        this.hideLoadingState();

        // Show error in stat cards
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(el => {
            el.textContent = '--';
        });

        // You can also show a toast notification or alert if you implement that
        console.error(message);

        // Optional: Show error message on page
        const container = document.querySelector('.container-fluid');
        if (container) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            container.insertBefore(alertDiv, container.firstChild);
        }
    }
};

// Initialize dashboard stats when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    Dashboard.loadDashboardStats();
});