/**
 * LeadsEngine Frontend Configuration
 */

const Config = {
    // API Base URL - adjust this to your backend server
    BASE_URL: 'http://localhost:8002',

    // Local Storage Keys
    TOKEN_KEY: 'leadsengine_token',
    USER_KEY: 'leadsengine_user',

    // API Endpoints
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
            ASSIGN: '/api/v1/lead/{id}/assign'
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
        }
    },

    // Pagination defaults
    DEFAULT_PAGE_SIZE: 50,
    DEFAULT_PAGE: 1,

    // Request timeout (ms)
    REQUEST_TIMEOUT: 30000,

    // Auth token header name
    AUTH_HEADER: 'Authorization',
    AUTH_SCHEME: 'Bearer'
};

// Freeze config to prevent modifications
Object.freeze(Config);