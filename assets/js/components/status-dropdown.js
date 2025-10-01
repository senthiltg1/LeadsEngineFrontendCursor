/**
 * LeadsEngine Status Dropdown Component
 * Factory function to create reusable status dropdown instances
 *
 * Usage:
 *   const statusDropdown = createStatusDropdown('#statusContainer', {
 *     initialValue: 1,
 *     onChange: (id, name) => { ... }
 *   });
 *   await statusDropdown.init();
 */

function createStatusDropdown(selector, options = {}) {
    const container = $(selector);
    let statuses = null;
    let selectedId = options.initialValue || null;
    let selectElement = null;

    // Configuration
    const config = {
        initialValue: options.initialValue || null,
        onChange: options.onChange || null,
        includeEmpty: options.includeEmpty !== undefined ? options.includeEmpty : true,
        emptyText: options.emptyText || '-- Select Status --',
        className: options.className || 'form-select',
        disabled: options.disabled || false
    };

    /**
     * Initialize the dropdown - fetch data and render
     */
    async function init() {
        try {
            // Fetch statuses from API
            const response = await API.get(Config.ENDPOINTS.LEADSTATUS.LIST);
            statuses = response.records || [];

            console.log('Status dropdown: Fetched statuses:', statuses);

            // Render the dropdown
            render();

            // Set initial value if provided
            if (config.initialValue !== null) {
                setValue(config.initialValue);
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize status dropdown:', error);
            renderError('Failed to load statuses');
            return false;
        }
    }

    /**
     * Render the dropdown HTML
     */
    function render() {
        if (!statuses || statuses.length === 0) {
            renderEmpty();
            return;
        }

        // Create select element with name attribute for form validation
        const selectId = `status-dropdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let html = `<select id="${selectId}" name="status_id" class="${config.className}" ${config.disabled ? 'disabled' : ''}>`;

        // Add empty option if configured
        if (config.includeEmpty) {
            html += `<option value="">${config.emptyText}</option>`;
        }

        // Add status options
        statuses.forEach(status => {
            const statusId = status.id;
            const statusName = status.name || status.slug || `Status ${statusId}`;
            const selected = statusId === selectedId ? 'selected' : '';
            html += `<option value="${statusId}" ${selected}>${escapeHtml(statusName)}</option>`;
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
     * Render empty state
     */
    function renderEmpty() {
        container.html(`
            <select class="${config.className}" disabled>
                <option>No statuses available</option>
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
     * Get selected status ID
     * @returns {Number|null} Selected status ID
     */
    function getValue() {
        if (selectElement) {
            const val = selectElement.val();
            return val ? parseInt(val) : null;
        }
        return selectedId;
    }

    /**
     * Set selected status by ID
     * @param {Number} id - Status ID to select
     */
    function setValue(id) {
        selectedId = id;
        if (selectElement) {
            selectElement.val(id);
        }
    }

    /**
     * Get selected status NAME (critical for audit trails)
     * @returns {String} Selected status name
     */
    function getName() {
        const id = getValue();
        if (id === null) {
            return null;
        }

        const status = getStatusById(id);
        if (status) {
            return status.name || status.slug || `Status ${id}`;
        }

        return null;
    }

    /**
     * Get full status object by ID
     * @param {Number} id - Status ID
     * @returns {Object|null} Status object
     */
    function getStatusById(id) {
        if (!statuses) {
            return null;
        }

        return statuses.find(s => s.id === id) || null;
    }

    /**
     * Get all statuses
     * @returns {Array} Array of status objects
     */
    function getAllStatuses() {
        return statuses || [];
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
        statuses = null;
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
        getStatusById,
        getAllStatuses,
        refresh,
        enable,
        disable,
        destroy
    };
}
