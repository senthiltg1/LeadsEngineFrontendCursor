/**
 * LeadsEngine Source Dropdown Component
 * Factory function to create reusable source dropdown instances
 *
 * Usage:
 *   const sourceDropdown = createSourceDropdown('#sourceContainer', {
 *     initialValue: 1,
 *     onChange: (id, name) => { ... }
 *   });
 *   await sourceDropdown.init();
 */

function createSourceDropdown(selector, options = {}) {
    const container = $(selector);
    let sources = null;
    let selectedId = options.initialValue || null;
    let selectElement = null;

    // Configuration
    const config = {
        initialValue: options.initialValue || null,
        onChange: options.onChange || null,
        includeEmpty: options.includeEmpty !== undefined ? options.includeEmpty : true,
        emptyText: options.emptyText || '-- Select Source --',
        className: options.className || 'form-select',
        disabled: options.disabled || false
    };

    /**
     * Initialize the dropdown - fetch data and render
     */
    async function init() {
        try {
            // Fetch sources from API
            const response = await API.get(Config.ENDPOINTS.LEADSOURCE.LIST);
            sources = response.records || [];

            console.log('Source dropdown: Fetched sources:', sources);

            // Render the dropdown
            render();

            // Set initial value if provided
            if (config.initialValue !== null) {
                setValue(config.initialValue);
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize source dropdown:', error);
            renderError('Failed to load sources');
            return false;
        }
    }

    /**
     * Render the dropdown HTML
     */
    function render() {
        if (!sources || sources.length === 0) {
            renderEmpty();
            return;
        }

        // Create select element with name attribute for form validation
        const selectId = `source-dropdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let html = `<select id="${selectId}" name="source_id" class="${config.className}" ${config.disabled ? 'disabled' : ''}>`;

        // Add empty option if configured
        if (config.includeEmpty) {
            html += `<option value="">${config.emptyText}</option>`;
        }

        // Add source options
        sources.forEach(source => {
            const sourceId = source.id;
            const sourceName = source.name || source.slug || `Source ${sourceId}`;
            const selected = sourceId === selectedId ? 'selected' : '';
            html += `<option value="${sourceId}" ${selected}>${escapeHtml(sourceName)}</option>`;
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
                <option>No sources available</option>
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
     * Get selected source ID
     * @returns {Number|null} Selected source ID
     */
    function getValue() {
        if (selectElement) {
            const val = selectElement.val();
            return val ? parseInt(val) : null;
        }
        return selectedId;
    }

    /**
     * Set selected source by ID
     * @param {Number} id - Source ID to select
     */
    function setValue(id) {
        selectedId = id;
        if (selectElement) {
            selectElement.val(id);
        }
    }

    /**
     * Get selected source NAME (critical for audit trails)
     * @returns {String} Selected source name
     */
    function getName() {
        const id = getValue();
        if (id === null) {
            return null;
        }

        const source = getSourceById(id);
        if (source) {
            return source.name || source.slug || `Source ${id}`;
        }

        return null;
    }

    /**
     * Get full source object by ID
     * @param {Number} id - Source ID
     * @returns {Object|null} Source object
     */
    function getSourceById(id) {
        if (!sources) {
            return null;
        }

        return sources.find(s => s.id === id) || null;
    }

    /**
     * Get all sources
     * @returns {Array} Array of source objects
     */
    function getAllSources() {
        return sources || [];
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
        sources = null;
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
        getSourceById,
        getAllSources,
        refresh,
        enable,
        disable,
        destroy
    };
}
