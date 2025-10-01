/**
 * LeadsEngine Frontend Configuration
 *
 * Centralized configuration for the LeadsEngine frontend application.
 * Contains API endpoints, base URL, storage keys, and default settings.
 *
 * Usage:
 *   const token = localStorage.getItem(Config.TOKEN_KEY);
 *   const response = await API.get(Config.ENDPOINTS.LEAD.LIST);
 *
 * Important:
 *   - Object is frozen to prevent accidental modifications
 *   - Update BASE_URL for different environments
 *   - All endpoints are verified against endpoints.md
 *
 * @module Config
 */

const Config = {
    /**
     * Base URL for backend API
     * Change this for different environments (dev, staging, production)
     * @type {string}
     */
    BASE_URL: 'http://localhost:8002',

    /**
     * LocalStorage key for JWT authentication token
     * @type {string}
     */
    TOKEN_KEY: 'leadsengine_token',

    /**
     * LocalStorage key for user data (optional, can use JWT instead)
     * @type {string}
     */
    USER_KEY: 'leadsengine_user',

    /**
     * API endpoint paths
     * All paths verified against endpoints.md
     * @type {Object}
     */
    ENDPOINTS: {
        AUTH: {
            TOKEN: '/api/v1/auth/token',
            VALIDATE: '/api/v1/auth/auth/validate-token'
        },
        LEAD: {
            LIST: '/api/v1/lead/',
            CREATE: '/api/v1/lead/',
            READ: '/api/v1/lead/',
            UPDATE: '/api/v1/lead/',
            DELETE: '/api/v1/lead/',
            WITH_RELATIONSHIPS: '/api/v1/lead/with-relationships',
            STATS: '/api/v1/lead/stats',
            TIMELINE: '/api/v1/lead/{id}/timeline',
            ASSIGN: '/api/v1/lead/{id}/assign',
            BATCH_SOFT_DELETE: '/api/v1/lead/soft-delete',
            BATCH_RESTORE: '/api/v1/lead/restore',
            BATCH_ACTIVATE: '/api/v1/lead/activate',
            BATCH_DEACTIVATE: '/api/v1/lead/deactivate',
            ARCHIVED: '/api/v1/lead/archived'
        },
        USER: {
            LIST: '/api/v1/user/',
            CREATE: '/api/v1/user/',
            READ: '/api/v1/user/',
            UPDATE: '/api/v1/user/',
            DELETE: '/api/v1/user/',
            WITH_RELATIONSHIPS: '/api/v1/user/with-relationships'
        },
        LEADSTATUS: {
            LIST: '/api/v1/leadstatus/',
            WITH_RELATIONSHIPS: '/api/v1/leadstatus/with-relationships'
        },
        LEADSOURCE: {
            LIST: '/api/v1/leadsource/',
            WITH_RELATIONSHIPS: '/api/v1/leadsource/with-relationships'
        },
        LEADNOTE: {
            LIST: '/api/v1/leadnote/',
            CREATE: '/api/v1/leadnote/',
            READ: '/api/v1/leadnote/',
            UPDATE: '/api/v1/leadnote/',
            DELETE: '/api/v1/leadnote/'
        },
        LEADEVENT: {
            LIST: '/api/v1/leadevent/',
            CREATE: '/api/v1/leadevent/',
            READ: '/api/v1/leadevent/',
            UPDATE: '/api/v1/leadevent/',
            DELETE: '/api/v1/leadevent/',
            WITH_RELATIONSHIPS: '/api/v1/leadevent/with-relationships'
        }
    },

    /**
     * Default page size for paginated API requests
     * @type {number}
     */
    DEFAULT_PAGE_SIZE: 50,

    /**
     * Default starting page for pagination
     * @type {number}
     */
    DEFAULT_PAGE: 1,

    /**
     * Request timeout in milliseconds
     * Requests longer than this will be aborted
     * @type {number}
     */
    REQUEST_TIMEOUT: 30000,

    /**
     * HTTP header name for authentication token
     * @type {string}
     */
    AUTH_HEADER: 'Authorization',

    /**
     * Authentication scheme for Bearer token
     * @type {string}
     */
    AUTH_SCHEME: 'Bearer'
};

/**
 * Freeze config object to prevent accidental modifications
 * This ensures configuration remains constant throughout the application
 */
Object.freeze(Config);