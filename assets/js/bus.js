/**
 * LeadsEngine Event Bus
 *
 * Simple publish/subscribe event system for decoupled component communication.
 * Enables loose coupling between modules without direct dependencies.
 *
 * Usage:
 *   // Subscribe to event
 *   const unsubscribe = Bus.subscribe('auth:changed', (data) => {
 *       console.log('Auth changed:', data.authenticated);
 *   });
 *
 *   // Publish event
 *   Bus.publish('auth:changed', {authenticated: true, user: {...}});
 *
 *   // Unsubscribe
 *   unsubscribe();
 *
 * Common Events:
 *   - 'auth:changed' - Authentication state changed {authenticated, user}
 *   - 'lead:created' - New lead created {lead}
 *   - 'lead:updated' - Lead updated {lead}
 *   - 'lead:deleted' - Lead deleted {id}
 *   - 'notification:show' - Show notification {type, message}
 *
 * @module Bus
 */

const Bus = {
    /**
     * Storage for event listeners
     * Structure: {eventName: [callback1, callback2, ...]}
     * @private
     * @type {Object.<string, Function[]>}
     */
    events: {},

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {function} callback - Callback function to execute when event is published
     * @returns {function} Unsubscribe function
     */
    subscribe(event, callback) {
        // Initialize event array if it doesn't exist
        if (!this.events[event]) {
            this.events[event] = [];
        }

        // Add callback to event listeners
        this.events[event].push(callback);

        // Return unsubscribe function
        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    },

    /**
     * Publish an event with optional data
     * @param {string} event - Event name
     * @param {*} data - Data to pass to subscribers
     */
    publish(event, data) {
        // Check if event has subscribers
        if (!this.events[event] || this.events[event].length === 0) {
            return;
        }

        // Call all subscribers with data
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    },

    /**
     * Unsubscribe all listeners for an event
     * @param {string} event - Event name
     */
    unsubscribeAll(event) {
        if (this.events[event]) {
            delete this.events[event];
        }
    },

    /**
     * Clear all event subscriptions
     */
    clear() {
        this.events = {};
    },

    /**
     * Get count of subscribers for an event
     * @param {string} event - Event name
     * @returns {number} Number of subscribers
     */
    getSubscriberCount(event) {
        return this.events[event]?.length || 0;
    },

    /**
     * Check if an event has any subscribers
     * @param {string} event - Event name
     * @returns {boolean} True if event has subscribers
     */
    hasSubscribers(event) {
        return this.getSubscriberCount(event) > 0;
    }
};

/**
 * Common Events:
 * - 'auth:changed' - Authentication state changed {authenticated, user}
 * - 'lead:created' - New lead created {lead}
 * - 'lead:updated' - Lead updated {lead}
 * - 'lead:deleted' - Lead deleted {id}
 * - 'notification:show' - Show notification {type, message}
 * - 'modal:open' - Open modal {modalId, data}
 * - 'modal:close' - Close modal {modalId}
 */