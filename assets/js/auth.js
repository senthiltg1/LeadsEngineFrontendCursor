/**
 * LeadsEngine Authentication Module
 * Handles user authentication, token management, and session state
 */

const Auth = {
    /**
     * Login user with username and password
     * @param {string} username - User email/username
     * @param {string} password - User password
     * @returns {Promise<object>} Login response with access token
     */
    async login(username, password) {
        try {
            // Call auth endpoint with form-urlencoded data
            const response = await API.postForm(Config.ENDPOINTS.AUTH.TOKEN, {
                username: username,
                password: password
            });

            // Extract token from response
            // Backend returns: {access_token: "...", token_type: "bearer"}
            const tokenData = response.records[0] || response;
            const token = tokenData.access_token;

            if (!token) {
                throw new Error('No access token received from server');
            }

            // Store token
            this.setToken(token);

            // Store user info if available
            if (tokenData.user) {
                this.setUser(tokenData.user);
            }

            // Emit authentication event
            Bus.publish('auth:changed', {
                authenticated: true,
                user: tokenData.user
            });

            return tokenData;

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Logout user - clear token and redirect to login
     */
    logout() {
        // Clear stored data
        this.clearToken();
        this.clearUser();

        // Emit authentication event
        Bus.publish('auth:changed', { authenticated: false });

        // Redirect to login page
        window.location.href = 'login.html';
    },

    /**
     * Store authentication token
     * @param {string} token - JWT token
     */
    setToken(token) {
        localStorage.setItem(Config.TOKEN_KEY, token);
    },

    /**
     * Get stored authentication token
     * @returns {string|null} JWT token or null
     */
    getToken() {
        return localStorage.getItem(Config.TOKEN_KEY);
    },

    /**
     * Clear authentication token
     */
    clearToken() {
        localStorage.removeItem(Config.TOKEN_KEY);
    },

    /**
     * Store user information
     * @param {object} user - User data
     */
    setUser(user) {
        localStorage.setItem(Config.USER_KEY, JSON.stringify(user));
    },

    /**
     * Get stored user information
     * @returns {object|null} User data or null
     */
    getUser() {
        const userData = localStorage.getItem(Config.USER_KEY);
        return userData ? JSON.parse(userData) : null;
    },

    /**
     * Clear user information
     */
    clearUser() {
        localStorage.removeItem(Config.USER_KEY);
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} True if token exists
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Validate current token with backend
     * @returns {Promise<boolean>} True if token is valid
     */
    async validateToken() {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const response = await API.post(Config.ENDPOINTS.AUTH.VALIDATE);
            return response && response.records && response.records[0]?.valid === true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    },

    /**
     * Ensure user is authenticated, redirect to login if not
     * Call this on protected pages
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    /**
     * Initialize auth state on page load
     * Emits auth:changed event with current state
     */
    init() {
        const authenticated = this.isAuthenticated();
        const user = this.getUser();

        Bus.publish('auth:changed', {
            authenticated: authenticated,
            user: user
        });
    }
};