/**
 * LeadsEngine User Assignment Dropdown Component
 * Factory function to create reusable user assignment dropdown instances
 *
 * Usage:
 *   const userDropdown = createUserDropdown('#assignedToContainer', {
 *     initialValue: 1,
 *     onChange: (id, name) => { ... }
 *   });
 *   await userDropdown.init();
 */

function createUserDropdown(selector, options = {}) {
    const container = $(selector);
    let users = null;
    let selectedId = options.initialValue || null;
    let selectElement = null;

    // Configuration
    const config = {
        initialValue: options.initialValue || null,
        onChange: options.onChange || null,
        includeEmpty: options.includeEmpty !== undefined ? options.includeEmpty : true,
        emptyText: options.emptyText || '-- Select User --',
        className: options.className || 'form-select',
        disabled: options.disabled || false
    };

    /**
     * Initialize the dropdown - fetch data and render
     */
    async function init() {
        try {
            // Fetch users from API
            const response = await API.get(Config.ENDPOINTS.USER.LIST);
            users = response.records || [];

            console.log('User dropdown: Fetched users:', users);

            // Render the dropdown
            render();

            // Set initial value if provided
            if (config.initialValue !== null) {
                setValue(config.initialValue);
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize user dropdown:', error);
            renderError('Failed to load users');
            return false;
        }
    }

    /**
     * Render the dropdown HTML
     */
    function render() {
        if (!users || users.length === 0) {
            renderEmpty();
            return;
        }

        // Create select element
        const selectId = `user-dropdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let html = `<select id="${selectId}" class="${config.className}" ${config.disabled ? 'disabled' : ''}>`;

        // Add empty option if configured
        if (config.includeEmpty) {
            html += `<option value="">${config.emptyText}</option>`;
        }

        // Add user options
        users.forEach(user => {
            const userId = user.id;
            const userName = getUserDisplayName(user);
            const selected = userId === selectedId ? 'selected' : '';
            html += `<option value="${userId}" ${selected}>${escapeHtml(userName)}</option>`;
        });

        html += '</select>';

        // Insert into container
        container.html(html);

        // Store reference to select element
        selectElement = $(`#${selectId}`);

        // Attach change event handler
        selectElement.on('change', function() {
            selectedId = $(this).val() ? parseInt($(this).val()) : null;

            // Trigger onChange callback if provided
            if (config.onChange && typeof config.onChange === 'function') {
                const name = getName();
                config.onChange(selectedId, name);
            }
        });
    }

    /**
     * Get user display name with fallback logic
     * @param {Object} user - User object
     * @returns {String} Display name
     */
    function getUserDisplayName(user) {
        if (user.full_name) {
            return user.full_name;
        }

        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`;
        }

        if (user.first_name) {
            return user.first_name;
        }

        if (user.username) {
            return user.username;
        }

        if (user.email) {
            return user.email;
        }

        return `User #${user.id}`;
    }

    /**
     * Render empty state
     */
    function renderEmpty() {
        container.html(`
            <select class="${config.className}" disabled>
                <option>No users available</option>
            </select>
        `);
    }

    /**
     * Render error state
     */
    function renderError(message) {
        container.html(`
            <select class="${config.className}" disabled>
                <option>${escapeHtml(message)}</option>
            </select>
        `);
    }

    /**
     * Get selected user ID
     * @returns {Number|null} Selected user ID
     */
    function getValue() {
        if (selectElement) {
            const val = selectElement.val();
            return val ? parseInt(val) : null;
        }
        return selectedId;
    }

    /**
     * Set selected user by ID
     * @param {Number} id - User ID to select
     */
    function setValue(id) {
        selectedId = id;
        if (selectElement) {
            selectElement.val(id);
        }
    }

    /**
     * Get selected user NAME (critical for audit trails)
     * @returns {String} Selected user name
     */
    function getName() {
        const id = getValue();
        if (id === null) {
            return null;
        }

        const user = getUserById(id);
        if (user) {
            return getUserDisplayName(user);
        }

        return null;
    }

    /**
     * Get full user object by ID
     * @param {Number} id - User ID
     * @returns {Object|null} User object
     */
    function getUserById(id) {
        if (!users) {
            return null;
        }

        return users.find(u => u.id === id) || null;
    }

    /**
     * Get all users
     * @returns {Array} Array of user objects
     */
    function getAllUsers() {
        return users || [];
    }

    /**
     * Refresh dropdown - re-fetch data and re-render
     */
    async function refresh() {
        return await init();
    }

    /**
     * Enable the dropdown
     */
    function enable() {
        if (selectElement) {
            selectElement.prop('disabled', false);
        }
        config.disabled = false;
    }

    /**
     * Disable the dropdown
     */
    function disable() {
        if (selectElement) {
            selectElement.prop('disabled', true);
        }
        config.disabled = true;
    }

    /**
     * Destroy the dropdown - clean up event handlers
     */
    function destroy() {
        if (selectElement) {
            selectElement.off('change');
            selectElement.remove();
        }
        container.empty();
        selectElement = null;
        users = null;
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    // Return public API
    return {
        init,
        getValue,
        setValue,
        getName,
        getUserById,
        getAllUsers,
        refresh,
        enable,
        disable,
        destroy
    };
}
