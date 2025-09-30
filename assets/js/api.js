/**
 * LeadsEngine API Client
 * Centralized fetch wrapper with automatic token injection and response normalization
 */

const API = {
    /**
     * Core fetch wrapper with authentication and error handling
     * @param {string} endpoint - API endpoint path
     * @param {object} options - Fetch options
     * @returns {Promise<object>} Normalized response
     */
    async request(endpoint, options = {}) {
        const url = `${Config.BASE_URL}${endpoint}`;

        // Get token from storage
        const token = localStorage.getItem(Config.TOKEN_KEY);

        // Setup default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Inject token if available
        if (token) {
            headers[Config.AUTH_HEADER] = `${Config.AUTH_SCHEME} ${token}`;
        }

        // Merge options
        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Handle authentication errors
            if (response.status === 401 || response.status === 403) {
                // Clear token and redirect to login
                localStorage.removeItem(Config.TOKEN_KEY);
                localStorage.removeItem(Config.USER_KEY);
                Bus.publish('auth:changed', { authenticated: false });

                // Only redirect if not already on login page
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }

                throw new Error('Unauthorized');
            }

            // Handle other HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse response
            const data = await response.json();

            // Normalize response format
            return this.normalizeResponse(data);

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    /**
     * Normalize API responses to consistent format: {total_count, records}
     * @param {*} data - Raw API response
     * @returns {object} Normalized response
     */
    normalizeResponse(data) {
        // If already normalized format
        if (data && typeof data === 'object' && 'records' in data) {
            return {
                total_count: data.total_count || data.records?.length || 0,
                records: data.records || []
            };
        }

        // If it's an array response (list endpoints)
        if (Array.isArray(data)) {
            return {
                total_count: data.length,
                records: data
            };
        }

        // If it's a single object (get/create/update endpoints)
        if (data && typeof data === 'object') {
            // Check if it has pagination metadata
            if ('items' in data) {
                return {
                    total_count: data.total || data.items?.length || 0,
                    records: data.items || []
                };
            }

            // Single record response
            return {
                total_count: 1,
                records: [data]
            };
        }

        // Default fallback
        return {
            total_count: 0,
            records: []
        };
    },

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {object} params - Query parameters
     * @returns {Promise<object>}
     */
    async get(endpoint, params = {}) {
        // Build query string
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, {
            method: 'GET'
        });
    },

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise<object>}
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * POST request with form-urlencoded data
     * @param {string} endpoint - API endpoint
     * @param {object} data - Form data
     * @returns {Promise<object>}
     */
    async postForm(endpoint, data = {}) {
        const formData = new URLSearchParams();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        return this.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });
    },

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise<object>}
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * PATCH request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body
     * @returns {Promise<object>}
     */
    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<object>}
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};