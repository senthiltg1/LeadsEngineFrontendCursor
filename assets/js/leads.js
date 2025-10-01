/**
 * LeadsEngine Leads Page
 * Handles leads list display and management
 *
 * FEATURES:
 * - Lead list table with pagination
 * - Server-side filtering (status, source, search, date range)
 * - Lead detail modal with tabs (Overview, Edit, Notes, Timeline)
 * - Edit lead with dropdown components
 * - Create notes for leads
 * - Timeline with proper name resolution
 *
 * FILTERING:
 * All filters work together simultaneously:
 * - Search: Debounced text search (name, email, phone)
 * - Status: Dropdown filter by lead status
 * - Source: Dropdown filter by lead source
 * - Date Range: Filter by created date (from/to)
 * - Filter badges show active filters with remove icons
 * - Clear button resets all filters
 *
 * ============================================================================
 * API ENDPOINT VERIFICATION CHECKLIST
 * ============================================================================
 * Before implementing ANY API call:
 * 1. Check endpoints.md for exact path and method
 * 2. Check backend schema files for payload structure
 * 3. Document endpoint + payload in code comments
 * 4. Include curl test example in comments
 * 5. Log full request details (URL, payload, headers)
 *
 * VERIFIED ENDPOINTS USED IN THIS FILE:
 * ----------------------------------------------------------------------------
 * GET    /api/v1/lead/                       - List leads (with pagination)
 * GET    /api/v1/lead/with-relationships     - List leads with relationships + filters
 *                                              Params: skip, limit, search, status_id, source_id, date_from, date_to
 * GET    /api/v1/lead/{id}                   - Get single lead
 * POST   /api/v1/lead/                       - Create new lead
 * PUT    /api/v1/lead/{id}                   - Update lead
 * DELETE /api/v1/lead/{id}/hard-delete       - Delete lead (hard delete)
 * GET    /api/v1/lead/{id}/timeline          - Get lead timeline events
 * GET    /api/v1/leadnote/lead/{lead_id}     - List notes for lead
 * POST   /api/v1/leadnote/                   - Create new note (body, is_pinned, lead_id, user_id)
 * GET    /api/v1/leadstatus/                 - List all statuses (for filter dropdown)
 * GET    /api/v1/leadsource/                 - List all sources (for filter dropdown)
 * GET    /api/v1/user/                       - List all users
 * GET    /api/v1/user/{id}                   - Get single user
 * ============================================================================
 */

const LeadsPage = {
    currentPage: 1,
    pageSize: Config.DEFAULT_PAGE_SIZE || 50,
    allLeads: [],
    displayedLeads: [],
    userMap: {},

    // Sorting state
    sortColumn: null,
    sortDirection: 'asc', // 'asc' or 'desc'

    // Filter state
    filters: {
        search: '',
        status_id: null,
        source_id: null,
        date_from: '',
        date_to: '',
        deleted: false  // Show archived leads when true
    },

    // Filter dropdown instances
    filterDropdowns: {
        status: null,
        source: null
    },

    // Add Lead modal dropdown instances
    addLeadDropdowns: {
        status: null,
        source: null,
        user: null
    },

    // Delete confirmation modal state
    deleteModal: null,
    leadToDelete: null,

    // Form validator instance (centralized validation module)
    formValidator: null,

    // Bulk actions state
    selectedLeadIds: new Set(),
    bulkStatusDropdown: null,
    bulkAssignDropdown: null,

    // Archived leads state
    showingArchived: false,
    restoreModal: null,
    leadToRestore: null,

    /**
     * Legacy validators object - kept for backward compatibility
     * New code should use this.formValidator instead
     */
    validators: {
        /**
         * Validate email format
         * @param {string} email - Email to validate
         * @returns {boolean} True if valid
         */
        isValidEmail(email) {
            if (!email) return false;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email.trim());
        },

        /**
         * Validate phone format
         * Allows +, -, spaces, parentheses, numbers
         * @param {string} phone - Phone to validate
         * @returns {boolean} True if valid
         */
        isValidPhone(phone) {
            if (!phone) return false;
            const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            return phoneRegex.test(phone.trim());
        },

        /**
         * Validate required field with min length
         * @param {string} value - Value to validate
         * @param {number} minLength - Minimum length
         * @returns {boolean} True if valid
         */
        isValidName(value, minLength = 2) {
            if (!value) return false;
            return value.trim().length >= minLength;
        },

        /**
         * Validate required dropdown selection
         * @param {string|number} value - Selected value
         * @returns {boolean} True if valid
         */
        isValidDropdown(value) {
            return value !== null && value !== undefined && value !== '';
        }
    },

    /**
     * Validate a single field and show/hide error message with real-time feedback
     * @param {HTMLElement} field - Input field to validate
     * @param {string} fieldName - Name of field for error tracking
     * @param {string} formType - 'createLead' or 'editLead'
     * @param {boolean} showEmptyAsNeutral - If true, empty fields show no validation state
     * @returns {boolean} True if valid
     */
    validateField(field, fieldName, formType, showEmptyAsNeutral = false) {
        if (!field) return true;

        const value = field.value;
        let isValid = true;
        let errorMessage = '';
        let isEmpty = !value || !value.trim();

        // Validation rules based on field name
        switch(fieldName) {
            case 'firstName':
                if (isEmpty) {
                    isValid = false;
                    errorMessage = 'First name is required (minimum 2 characters)';
                } else {
                    isValid = this.validators.isValidName(value, 2);
                    errorMessage = 'First name must be at least 2 characters';
                }
                break;

            case 'lastName':
                if (isEmpty) {
                    isValid = false;
                    errorMessage = 'Last name is required (minimum 2 characters)';
                } else {
                    isValid = this.validators.isValidName(value, 2);
                    errorMessage = 'Last name must be at least 2 characters';
                }
                break;

            case 'email':
                // Email is optional BUT if provided, must be valid
                if (isEmpty) {
                    // Don't mark as invalid if empty (might use phone instead)
                    if (showEmptyAsNeutral) {
                        field.classList.remove('is-invalid', 'is-valid');
                        this.hideFieldError(field);
                        this.removeFieldIcon(field);
                        delete this.validationErrors[formType][fieldName];
                        return true;
                    }
                } else {
                    isValid = this.validators.isValidEmail(value);
                    errorMessage = 'Invalid email format (example: user@domain.com)';
                }
                break;

            case 'phone':
                // Phone is optional BUT if provided, must be valid
                if (isEmpty) {
                    // Don't mark as invalid if empty (might use email instead)
                    if (showEmptyAsNeutral) {
                        field.classList.remove('is-invalid', 'is-valid');
                        this.hideFieldError(field);
                        this.removeFieldIcon(field);
                        delete this.validationErrors[formType][fieldName];
                        return true;
                    }
                } else {
                    isValid = this.validators.isValidPhone(value);
                    errorMessage = 'Invalid phone (example: +1-555-123-4567 or (555) 123-4567)';
                }
                break;

            case 'status':
            case 'source':
                isValid = this.validators.isValidDropdown(value);
                errorMessage = `${fieldName === 'status' ? 'Status' : 'Source'} is required`;
                break;
        }

        // Update field visual state with icons
        if (isEmpty && showEmptyAsNeutral) {
            // Empty field in real-time mode: neutral state
            field.classList.remove('is-invalid', 'is-valid');
            this.hideFieldError(field);
            this.removeFieldIcon(field);
            delete this.validationErrors[formType][fieldName];
        } else if (isValid) {
            // Valid field: green border + checkmark
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            this.hideFieldError(field);
            this.showFieldIcon(field, 'valid');
            delete this.validationErrors[formType][fieldName];
        } else {
            // Invalid field: red border + X icon + error message
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            this.showFieldError(field, errorMessage);
            this.showFieldIcon(field, 'invalid');
            this.validationErrors[formType][fieldName] = errorMessage;
        }

        return isValid;
    },

    /**
     * Show validation icon inside field (checkmark or X)
     * @param {HTMLElement} field - Input field
     * @param {string} type - 'valid' or 'invalid'
     */
    showFieldIcon(field, type) {
        // Remove existing icon
        this.removeFieldIcon(field);

        // Create icon element
        const icon = document.createElement('i');
        icon.className = type === 'valid'
            ? 'fas fa-check-circle text-success validation-icon'
            : 'fas fa-times-circle text-danger validation-icon';
        icon.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none;';
        icon.setAttribute('data-validation-icon', 'true');

        // Make parent position relative if not already
        const parent = field.parentNode;
        if (parent && window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }

        // Insert icon
        parent.appendChild(icon);
    },

    /**
     * Remove validation icon from field
     * @param {HTMLElement} field - Input field
     */
    removeFieldIcon(field) {
        const parent = field.parentNode;
        if (parent) {
            const existingIcon = parent.querySelector('[data-validation-icon]');
            if (existingIcon) {
                existingIcon.remove();
            }
        }
    },

    /**
     * Show error message below field
     * @param {HTMLElement} field - Input field
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        // Remove existing error message
        this.hideFieldError(field);

        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback d-block';
        errorDiv.textContent = message;
        errorDiv.setAttribute('data-error-for', field.id || field.name);

        // Insert after field
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    },

    /**
     * Hide error message for field
     * @param {HTMLElement} field - Input field
     */
    hideFieldError(field) {
        const errorDiv = field.parentNode.querySelector(`.invalid-feedback[data-error-for="${field.id || field.name}"]`);
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    /**
     * Validate entire form and update error summary
     * @param {string} formType - 'createLead' or 'editLead'
     * @returns {boolean} True if all fields valid
     */
    validateForm(formType) {
        const formId = formType === 'createLead' ? 'add-lead-form' : 'edit-lead-form';
        const form = document.getElementById(formId);
        if (!form) return false;

        // Reset validation errors for this form
        this.validationErrors[formType] = {};

        // Get all fields to validate
        const firstName = form.querySelector('[name="first_name"]');
        const lastName = form.querySelector('[name="last_name"]');
        const email = form.querySelector('[name="email"]');
        const phone = form.querySelector('[name="phone"]');
        const status = form.querySelector('[name="status_id"]');
        const source = form.querySelector('[name="source_id"]');

        // Validate all required fields
        const validations = [
            this.validateField(firstName, 'firstName', formType),
            this.validateField(lastName, 'lastName', formType),
            this.validateField(status, 'status', formType),
            this.validateField(source, 'source', formType)
        ];

        // Validate email if provided
        if (email && email.value.trim()) {
            validations.push(this.validateField(email, 'email', formType));
        }

        // Validate phone if provided
        if (phone && phone.value.trim()) {
            validations.push(this.validateField(phone, 'phone', formType));
        }

        // Special rule: Email OR Phone required
        const hasEmail = email && email.value.trim();
        const hasPhone = phone && phone.value.trim();
        if (!hasEmail && !hasPhone) {
            // Show error on both fields
            if (email) {
                email.classList.add('is-invalid');
                this.showFieldError(email, 'Email or Phone is required');
            }
            if (phone) {
                phone.classList.add('is-invalid');
                this.showFieldError(phone, 'Email or Phone is required');
            }
            this.validationErrors[formType]['emailOrPhone'] = 'Email or Phone is required';
            validations.push(false);
        }

        // Check if all validations passed
        const allValid = validations.every(v => v === true);

        // Update error summary
        this.updateErrorSummary(formType);

        // Update save button state
        this.updateSaveButtonState(formType, allValid);

        return allValid;
    },

    /**
     * Update error summary at top of form
     * Lists specific fields with errors instead of generic count
     * @param {string} formType - 'createLead' or 'editLead'
     */
    updateErrorSummary(formType) {
        const formId = formType === 'createLead' ? 'add-lead-form' : 'edit-lead-form';
        const form = document.getElementById(formId);
        if (!form) return;

        // Find or create error summary container
        let summaryDiv = form.querySelector('.validation-summary');
        if (!summaryDiv) {
            summaryDiv = document.createElement('div');
            summaryDiv.className = 'validation-summary alert alert-danger';
            summaryDiv.style.display = 'none';
            form.insertBefore(summaryDiv, form.firstChild);
        }

        const errors = this.validationErrors[formType];
        const errorKeys = Object.keys(errors);

        if (errorKeys.length > 0) {
            // Map field keys to user-friendly names
            const fieldNames = {
                'firstName': 'First Name',
                'lastName': 'Last Name',
                'email': 'Email format',
                'phone': 'Phone number',
                'status': 'Status',
                'source': 'Source',
                'emailOrPhone': 'Email or Phone'
            };

            // Build list of field names with errors
            const fieldList = errorKeys.map(key => fieldNames[key] || key).join(', ');

            summaryDiv.style.display = 'block';
            summaryDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Please fix: ${fieldList}</strong>
            `;
        } else {
            summaryDiv.style.display = 'none';
        }
    },

    /**
     * Update save button state based on validation
     * @param {string} formType - 'createLead' or 'editLead'
     * @param {boolean} isValid - Whether form is valid
     */
    updateSaveButtonState(formType, isValid) {
        const buttonId = formType === 'createLead' ? 'create-lead-btn' : 'save-edit-btn';
        const button = document.getElementById(buttonId);

        if (button) {
            button.disabled = !isValid;
            if (!isValid) {
                button.classList.add('disabled');
                button.title = 'Please fix validation errors';
            } else {
                button.classList.remove('disabled');
                button.title = '';
            }
        }
    },

    /**
     * Load and display leads with optional filters
     * @param {number} page - Page number (1-indexed)
     * @param {object} filterOverrides - Optional filter overrides
     */
    async loadLeads(page = 1, filterOverrides = null) {
        try {
            // Show loading state
            this.showLoadingState();

            // Use provided filters or current filter state
            const activeFilters = filterOverrides || this.filters;

            // Build query parameters
            const params = {
                skip: (page - 1) * this.pageSize,
                limit: this.pageSize
            };

            // Add filters to params (only if they have values)
            if (activeFilters.search) {
                params.search = activeFilters.search;
            }
            if (activeFilters.status_id) {
                params.status_id = activeFilters.status_id;
            }
            if (activeFilters.source_id) {
                params.source_id = activeFilters.source_id;
            }
            if (activeFilters.date_from) {
                params.date_from = activeFilters.date_from;
            }
            if (activeFilters.date_to) {
                params.date_to = activeFilters.date_to;
            }
            if (activeFilters.deleted) {
                params.deleted = true;
            }

            console.log('=== LOADING LEADS WITH FILTERS ===');
            console.log('Page:', page);
            console.log('Filters:', activeFilters);
            console.log('Params:', params);

            // Fetch leads and users in parallel
            const [leadsResponse, usersResponse] = await Promise.all([
                API.get(Config.ENDPOINTS.LEAD.WITH_RELATIONSHIPS, params),
                API.get(Config.ENDPOINTS.USER.LIST)
            ]);

            this.allLeads = leadsResponse.records || [];
            const users = usersResponse.records || [];

            console.log('Loaded users for lead list:', users);

            // Create user mapping
            this.userMap = {};
            users.forEach(user => {
                let userName = 'Unknown User';
                if (user.full_name) {
                    userName = user.full_name;
                } else if (user.first_name && user.last_name) {
                    userName = `${user.first_name} ${user.last_name}`;
                } else if (user.first_name) {
                    userName = user.first_name;
                } else if (user.username) {
                    userName = user.username;
                } else if (user.email) {
                    userName = user.email;
                }
                this.userMap[user.id] = userName;
            });

            console.log('User mapping created:', this.userMap);

            // Clear existing table rows
            this.clearTable();

            // Populate table with leads
            if (this.allLeads.length === 0) {
                this.showEmptyState();
            } else {
                this.populateTable(this.allLeads);
            }

            // Update filter display
            this.updateFilterDisplay(leadsResponse.total_count || 0);

            // Hide loading state
            this.hideLoadingState();

        } catch (error) {
            console.error('Failed to load leads:', error);
            this.showError('Failed to load leads. Please refresh the page.');
            this.hideLoadingState();
        }
    },

    /**
     * Initialize filter dropdowns and wire filter events
     *
     * Sets up the filter bar with:
     * - Status dropdown component (fetches from /api/v1/leadstatus/)
     * - Source dropdown component (fetches from /api/v1/leadsource/)
     * - Search input with 500ms debounce
     * - Date range inputs (from/to)
     * - Clear filters button
     *
     * All filters work together - when ANY filter changes, all active
     * filters are applied simultaneously via server-side filtering.
     *
     * Filter changes trigger applyFilters() which reloads leads from page 1.
     *
     * @returns {Promise<void>}
     */
    async initializeFilters() {
        try {
            // Initialize status filter dropdown
            this.filterDropdowns.status = createStatusDropdown('#statusFilterContainer', {
                includeEmpty: true,
                emptyText: 'All Statuses',
                onChange: (statusId, statusName) => {
                    console.log('Status filter changed:', statusId, statusName);
                    this.filters.status_id = statusId;
                    this.applyFilters();
                }
            });

            // Initialize source filter dropdown
            this.filterDropdowns.source = createSourceDropdown('#sourceFilterContainer', {
                includeEmpty: true,
                emptyText: 'All Sources',
                onChange: (sourceId, sourceName) => {
                    console.log('Source filter changed:', sourceId, sourceName);
                    this.filters.source_id = sourceId;
                    this.applyFilters();
                }
            });

            // Initialize both dropdowns in parallel
            await Promise.all([
                this.filterDropdowns.status.init(),
                this.filterDropdowns.source.init()
            ]);

            console.log('Filter dropdowns initialized');

            // Wire search input (debounced)
            let searchTimeout;
            $('#searchInput').on('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = $('#searchInput').val().trim();
                    console.log('Search filter changed:', this.filters.search);
                    this.applyFilters();
                }, 500); // 500ms debounce
            });

            // Wire date filters
            $('#dateFromFilter').on('change', () => {
                this.filters.date_from = $('#dateFromFilter').val();
                console.log('Date from filter changed:', this.filters.date_from);
                this.applyFilters();
            });

            $('#dateToFilter').on('change', () => {
                this.filters.date_to = $('#dateToFilter').val();
                console.log('Date to filter changed:', this.filters.date_to);
                this.applyFilters();
            });

            // Wire clear filters button
            $('#clearFilters').on('click', () => {
                this.clearFilters();
            });

        } catch (error) {
            console.error('Failed to initialize filters:', error);
        }
    },

    /**
     * Apply current filters - reload leads with filter parameters
     *
     * Called whenever any filter changes (status, source, search, dates).
     * Resets to page 1 and reloads leads with all active filter parameters.
     *
     * Filters are sent to backend as query parameters:
     * - search: string - searches name, email, phone
     * - status_id: number - filters by lead status
     * - source_id: number - filters by lead source
     * - date_from: string - ISO date format (YYYY-MM-DD)
     * - date_to: string - ISO date format (YYYY-MM-DD)
     *
     * @returns {Promise<void>}
     */
    async applyFilters() {
        console.log('=== APPLYING FILTERS ===');
        console.log('Current filters:', this.filters);
        await this.loadLeads(1); // Reset to page 1 when filtering
    },

    /**
     * Clear all filters and reload leads
     *
     * Resets all filter state to defaults and clears UI inputs:
     * - Empties search input
     * - Clears date range inputs
     * - Resets status dropdown to "All Statuses"
     * - Resets source dropdown to "All Sources"
     *
     * Then reloads leads without any filters applied.
     */
    clearFilters() {
        console.log('=== CLEARING FILTERS ===');

        // Reset filter state
        this.filters = {
            search: '',
            status_id: null,
            source_id: null,
            date_from: '',
            date_to: ''
        };

        // Reset UI elements
        $('#searchInput').val('');
        $('#dateFromFilter').val('');
        $('#dateToFilter').val('');

        // Reset dropdowns
        if (this.filterDropdowns.status) {
            this.filterDropdowns.status.setValue(null);
        }
        if (this.filterDropdowns.source) {
            this.filterDropdowns.source.setValue(null);
        }

        // Reload leads without filters
        this.loadLeads(1);
    },

    /**
     * Update filter display showing results count and active filters
     *
     * Updates the UI to show:
     * - Results count: "Showing X of Y leads (N filters active)"
     * - Active filter badges with remove icons
     * - Hides filter row when no filters or no results
     *
     * Each filter badge:
     * - Shows filter name and value (e.g., "Status: Contacted")
     * - Has × icon that calls removeFilter() to remove that filter
     * - Color-coded: blue (search), info (status), green (source), yellow (dates)
     *
     * @param {number} totalCount - Total number of matching results from backend
     */
    updateFilterDisplay(totalCount) {
        const filterStatusRow = document.getElementById('filterStatusRow');
        const resultsCount = document.getElementById('resultsCount');
        const activeFilterTags = document.getElementById('activeFilterTags');

        if (!filterStatusRow || !resultsCount || !activeFilterTags) return;

        // Count active filters
        let activeFilterCount = 0;
        const tags = [];

        if (this.filters.search) {
            activeFilterCount++;
            tags.push(`
                <span class="badge bg-primary">
                    Search: "${this.escapeHtml(this.filters.search)}"
                    <i class="fas fa-times ms-1" style="cursor: pointer;" onclick="LeadsPage.removeFilter('search')"></i>
                </span>
            `);
        }

        if (this.filters.status_id) {
            activeFilterCount++;
            const statusName = this.filterDropdowns.status?.getName() || 'Status';
            tags.push(`
                <span class="badge bg-info">
                    Status: ${this.escapeHtml(statusName)}
                    <i class="fas fa-times ms-1" style="cursor: pointer;" onclick="LeadsPage.removeFilter('status')"></i>
                </span>
            `);
        }

        if (this.filters.source_id) {
            activeFilterCount++;
            const sourceName = this.filterDropdowns.source?.getName() || 'Source';
            tags.push(`
                <span class="badge bg-success">
                    Source: ${this.escapeHtml(sourceName)}
                    <i class="fas fa-times ms-1" style="cursor: pointer;" onclick="LeadsPage.removeFilter('source')"></i>
                </span>
            `);
        }

        if (this.filters.date_from) {
            activeFilterCount++;
            tags.push(`
                <span class="badge bg-warning text-dark">
                    From: ${this.escapeHtml(this.filters.date_from)}
                    <i class="fas fa-times ms-1" style="cursor: pointer;" onclick="LeadsPage.removeFilter('date_from')"></i>
                </span>
            `);
        }

        if (this.filters.date_to) {
            activeFilterCount++;
            tags.push(`
                <span class="badge bg-warning text-dark">
                    To: ${this.escapeHtml(this.filters.date_to)}
                    <i class="fas fa-times ms-1" style="cursor: pointer;" onclick="LeadsPage.removeFilter('date_to')"></i>
                </span>
            `);
        }

        // Update results count
        if (activeFilterCount > 0) {
            resultsCount.textContent = `Showing ${this.allLeads.length} of ${totalCount} leads (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active)`;
            filterStatusRow.style.display = 'block';
        } else {
            resultsCount.textContent = `Showing ${this.allLeads.length} of ${totalCount} leads`;
            filterStatusRow.style.display = totalCount > 0 ? 'block' : 'none';
        }

        // Update filter tags
        activeFilterTags.innerHTML = tags.join('');
    },

    /**
     * Remove a specific filter
     *
     * Called when user clicks × icon on a filter badge.
     * Removes only the specified filter and keeps other filters active.
     * Automatically reapplies remaining filters.
     *
     * Filter names:
     * - 'search' - Clears search input
     * - 'status' - Resets status dropdown
     * - 'source' - Resets source dropdown
     * - 'date_from' - Clears from date
     * - 'date_to' - Clears to date
     *
     * @param {string} filterName - Name of filter to remove
     */
    removeFilter(filterName) {
        console.log('=== REMOVING FILTER ===', filterName);

        switch (filterName) {
            case 'search':
                this.filters.search = '';
                $('#searchInput').val('');
                break;
            case 'status':
                this.filters.status_id = null;
                if (this.filterDropdowns.status) {
                    this.filterDropdowns.status.setValue(null);
                }
                break;
            case 'source':
                this.filters.source_id = null;
                if (this.filterDropdowns.source) {
                    this.filterDropdowns.source.setValue(null);
                }
                break;
            case 'date_from':
                this.filters.date_from = '';
                $('#dateFromFilter').val('');
                break;
            case 'date_to':
                this.filters.date_to = '';
                $('#dateToFilter').val('');
                break;
        }

        this.applyFilters();
    },

    /**
     * Clear the leads table
     */
    clearTable() {
        const tbody = document.querySelector('#leadsTable tbody');
        if (tbody) {
            tbody.innerHTML = '';
        }
    },

    /**
     * Populate table with lead data
     * @param {Array} leads - Array of lead objects
     */
    populateTable(leads) {
        const tbody = document.querySelector('#leadsTable tbody');
        if (!tbody) return;

        // Clear existing rows first
        tbody.innerHTML = '';

        // Apply pagination
        this.displayedLeads = this.applyPagination(leads);

        // Append new rows
        this.displayedLeads.forEach(lead => {
            const row = this.createLeadRow(lead);
            tbody.appendChild(row);
        });

        // Populate inline status dropdowns
        this.populateInlineStatusDropdowns();

        // Populate inline assigned-to dropdowns
        this.populateInlineAssignedDropdowns();

        // Setup phone/email click handlers
        this.setupContactActionHandlers();

        // Setup checkbox change handlers for bulk actions
        this.setupCheckboxHandlers();

        // Update records counter
        this.updateRecordsCounter(this.displayedLeads.length, leads.length);

        // Update pagination controls
        this.updatePaginationControls(leads.length);
    },

    /**
     * Load statuses for inline editing (called once at initialization)
     * This method is called during page load (before rendering leads table)
     * to cache all available statuses for use in inline status dropdowns.
     *
     * Why: Prevents async issues where dropdowns would be empty on first click,
     * causing them to default to the first option instead of current status.
     */
    async loadStatusesForInlineEdit() {
        try {
            // Fetch all available lead statuses from API
            const response = await API.get(Config.ENDPOINTS.LEADSTATUS.LIST);

            // Cache statuses at class level for synchronous access during table rendering
            this.availableStatuses = response.records || [];

            console.log('Loaded statuses for inline editing:', this.availableStatuses.length);
        } catch (error) {
            console.error('Failed to load statuses for inline editing:', error);
            // Set empty array as fallback to prevent errors
            this.availableStatuses = [];
        }
    },

    /**
     * Load users for inline assignment editing (called once at initialization)
     * This method is called during page load (before rendering leads table)
     * to cache all available users for use in inline assigned-to dropdowns.
     *
     * Why: Same reason as statuses - prevents async dropdown population issues
     */
    async loadUsersForInlineEdit() {
        try {
            // Fetch all users from API
            const response = await API.get(Config.ENDPOINTS.USER.LIST);

            // Cache users at class level for synchronous access during table rendering
            this.availableUsers = response.records || [];

            console.log('Loaded users for inline editing:', this.availableUsers.length);
        } catch (error) {
            console.error('Failed to load users for inline editing:', error);
            // Set empty array as fallback to prevent errors
            this.availableUsers = [];
        }
    },

    /**
     * Setup inline status editing functionality for all containers in the table
     * This method is called after each table render (populateTable) to:
     * 1. Populate dropdowns with all available statuses (from cached data)
     * 2. Pre-select the current status for each lead
     * 3. Wire up click handlers for view/edit mode switching
     * 4. Wire up save/cancel button handlers
     *
     * The inline editing pattern:
     * - View mode: Shows colored status badge with pencil icon
     * - Click anywhere on badge: Switches to edit mode
     * - Edit mode: Shows dropdown + save/cancel buttons
     * - Save: Updates status via API, returns to view mode
     * - Cancel: Reverts dropdown, returns to view mode
     */
    populateInlineStatusDropdowns() {
        // Find all inline status containers in the current table
        const containers = document.querySelectorAll('.inline-status-container');

        containers.forEach(container => {
            // Extract data attributes set during row creation
            const currentStatusId = parseInt(container.getAttribute('data-current-status'));
            const leadId = container.getAttribute('data-lead-id');

            // Get DOM elements for view/edit modes
            const viewMode = container.querySelector('.status-view-mode');
            const editMode = container.querySelector('.status-edit-mode');
            const dropdown = container.querySelector('.inline-status-dropdown');
            const saveBtn = container.querySelector('.save-status-btn');
            const cancelBtn = container.querySelector('.cancel-status-btn');

            // === POPULATE DROPDOWN WITH ALL STATUSES ===
            // Clear placeholder "Loading..." option
            dropdown.innerHTML = '';

            if (this.availableStatuses && this.availableStatuses.length > 0) {
                // Populate with cached statuses (loaded at page init)
                this.availableStatuses.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status.id;
                    option.textContent = status.name;

                    // CRITICAL: Pre-select the current status
                    // This ensures dropdown shows correct value on first click
                    if (status.id === currentStatusId) {
                        option.selected = true;
                    }

                    dropdown.appendChild(option);
                });
            } else {
                // Fallback if statuses haven't loaded yet (shouldn't happen)
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Loading...';
                dropdown.appendChild(option);
            }

            // === CLICK HANDLER: VIEW MODE → EDIT MODE ===
            // Clicking badge or pencil icon switches to edit mode
            viewMode.addEventListener('click', () => {
                viewMode.style.display = 'none';
                editMode.style.display = 'block';
                dropdown.focus(); // Auto-focus dropdown for better UX
            });

            // === SAVE BUTTON: UPDATE STATUS ===
            saveBtn.addEventListener('click', () => {
                const newStatusId = parseInt(dropdown.value);

                if (newStatusId !== currentStatusId) {
                    // Status changed: call API to update
                    this.handleInlineStatusChange(leadId, currentStatusId, newStatusId, container);
                } else {
                    // No change: just exit edit mode without API call
                    viewMode.style.display = 'block';
                    editMode.style.display = 'none';
                }
            });

            // === CANCEL BUTTON: REVERT AND EXIT ===
            cancelBtn.addEventListener('click', () => {
                // Revert dropdown to original value
                dropdown.value = currentStatusId;

                // Return to view mode without saving
                viewMode.style.display = 'block';
                editMode.style.display = 'none';
            });
        });
    },

    /**
     * Setup inline assigned-to editing functionality for all containers in the table
     * This method is called after each table render (populateTable) to:
     * 1. Populate dropdowns with all available users (from cached data)
     * 2. Pre-select the current assigned user for each lead
     * 3. Wire up click handlers for view/edit mode switching
     * 4. Wire up save/cancel button handlers
     *
     * Same pattern as status inline editing - see populateInlineStatusDropdowns for detailed comments
     */
    populateInlineAssignedDropdowns() {
        // Find all inline assigned-to containers in the current table
        const containers = document.querySelectorAll('.inline-assigned-container');

        containers.forEach(container => {
            // Extract data attributes set during row creation
            const currentUserId = parseInt(container.getAttribute('data-current-user')) || null;
            const leadId = container.getAttribute('data-lead-id');

            // Get DOM elements for view/edit modes
            const viewMode = container.querySelector('.assigned-view-mode');
            const editMode = container.querySelector('.assigned-edit-mode');
            const dropdown = container.querySelector('.inline-assigned-dropdown');
            const saveBtn = container.querySelector('.save-assigned-btn');
            const cancelBtn = container.querySelector('.cancel-assigned-btn');

            // === POPULATE DROPDOWN WITH ALL USERS ===
            dropdown.innerHTML = '';

            // Add "Unassigned" option
            const unassignedOption = document.createElement('option');
            unassignedOption.value = '';
            unassignedOption.textContent = 'Unassigned';
            if (!currentUserId) {
                unassignedOption.selected = true;
            }
            dropdown.appendChild(unassignedOption);

            if (this.availableUsers && this.availableUsers.length > 0) {
                // Populate with cached users (loaded at page init)
                this.availableUsers.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    // Display user's full name or fallback to username/email
                    option.textContent = user.full_name || user.username || user.email || `User ${user.id}`;

                    // CRITICAL: Pre-select the current assigned user
                    if (user.id === currentUserId) {
                        option.selected = true;
                    }

                    dropdown.appendChild(option);
                });
            }

            // === CLICK HANDLER: VIEW MODE → EDIT MODE ===
            viewMode.addEventListener('click', () => {
                viewMode.style.display = 'none';
                editMode.style.display = 'block';
                dropdown.focus();
            });

            // === SAVE BUTTON: UPDATE ASSIGNED USER ===
            saveBtn.addEventListener('click', () => {
                const newUserId = dropdown.value ? parseInt(dropdown.value) : null;

                if (newUserId !== currentUserId) {
                    // Assignment changed: call API to update
                    this.handleInlineAssignedChange(leadId, currentUserId, newUserId, container);
                } else {
                    // No change: just exit edit mode without API call
                    viewMode.style.display = 'block';
                    editMode.style.display = 'none';
                }
            });

            // === CANCEL BUTTON: REVERT AND EXIT ===
            cancelBtn.addEventListener('click', () => {
                // Revert dropdown to original value
                dropdown.value = currentUserId || '';

                // Return to view mode without saving
                viewMode.style.display = 'block';
                editMode.style.display = 'none';
            });
        });
    },

    /**
     * Apply pagination to leads array
     * Uses currentPage and pageSize to slice the array
     * @param {Array} leads - Full array of leads
     * @returns {Array} Paginated leads for current page
     */
    applyPagination(leads) {
        const pageSize = this.pageSize;

        // If pageSize is 'all' or larger than total, return all leads
        if (pageSize === 'all' || pageSize >= leads.length) {
            this.currentPage = 1; // Reset to page 1
            return leads;
        }

        // Calculate start and end indices for current page
        const startIndex = (this.currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        // Return slice for current page
        return leads.slice(startIndex, endIndex);
    },

    /**
     * Update records counter display
     * Shows current page range: "Showing 1-10 of 12 leads" or "Showing 11-12 of 12 leads"
     * @param {number} displayed - Number of displayed records on current page
     * @param {number} total - Total number of records
     */
    updateRecordsCounter(displayed, total) {
        const counterElement = document.getElementById('records-counter');
        if (!counterElement) return;

        if (total === 0) {
            counterElement.textContent = 'No leads found';
            return;
        }

        // Calculate start and end indices for current page
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(startIndex + displayed - 1, total);

        if (total === displayed && this.currentPage === 1) {
            // All records fit on one page
            counterElement.textContent = `Showing 1-${total} of ${total} leads`;
        } else {
            // Multiple pages: show current range
            counterElement.textContent = `Showing ${startIndex}-${endIndex} of ${total} leads`;
        }
    },

    /**
     * Update pagination controls (prev/next buttons, page info)
     * Shows/hides pagination based on whether multiple pages exist
     * @param {number} totalRecords - Total number of records
     */
    updatePaginationControls(totalRecords) {
        const paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) return;

        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / this.pageSize);

        // Hide pagination if only one page or pageSize is 'all'
        if (totalPages <= 1 || this.pageSize === 'all') {
            paginationContainer.style.display = 'none';
            return;
        }

        // Show pagination
        paginationContainer.style.display = 'flex';

        // Build pagination HTML
        paginationContainer.innerHTML = `
            <div class="d-flex justify-content-between align-items-center w-100">
                <button class="btn btn-outline-primary btn-sm pagination-prev"
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left me-1"></i> Previous
                </button>
                <span class="text-muted">
                    Page ${this.currentPage} of ${totalPages}
                </span>
                <button class="btn btn-outline-primary btn-sm pagination-next"
                        ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right ms-1"></i>
                </button>
            </div>
        `;

        // Wire up button handlers
        const prevBtn = paginationContainer.querySelector('.pagination-prev');
        const nextBtn = paginationContainer.querySelector('.pagination-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPreviousPage());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToNextPage());
        }
    },

    /**
     * Navigate to previous page
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.populateTable(this.allLeads);
        }
    },

    /**
     * Navigate to next page
     */
    goToNextPage() {
        const totalPages = Math.ceil(this.allLeads.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.populateTable(this.allLeads);
        }
    },

    /**
     * Create a table row for a lead
     * @param {Object} lead - Lead object
     * @returns {HTMLElement} Table row element
     */
    createLeadRow(lead) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-lead-id', lead.id || '');

        // Get lead data with fallbacks
        const name = this.getLeadName(lead);
        const email = lead.email || lead.primary_email || 'N/A';
        const phone = lead.phone || lead.primary_phone || 'N/A';
        const status = this.getStatus(lead); // Returns {name, slug} object
        // CRITICAL: Get the actual status ID (not from getStatus which returns {name,slug})
        // Check lead.status.id first (nested), then lead.status_id (flat)
        const statusId = lead.status?.id || lead.status_id || '';
        const source = this.getSource(lead);
        const score = lead.score !== null && lead.score !== undefined ? lead.score : 0;
        const assignedTo = this.getAssignedUser(lead);
        // Get assigned user ID for inline editing
        const assignedUserId = lead.assigned_user?.id || lead.assigned_to?.id || lead.assigned_to_user_id || '';
        const leadId = lead.id || 'N/A';

        // Build row HTML
        tr.innerHTML = `
            <td><input type="checkbox" class="form-check-input lead-checkbox" data-lead-id="${lead.id}"></td>
            <td>
                <span class="badge bg-secondary">#${leadId}</span>
                ${lead.deleted_at ? '<span class="badge bg-warning text-dark ms-1">ARCHIVED</span>' : ''}
            </td>
            <td>
                <div class="fw-semibold">${this.escapeHtml(name)}</div>
            </td>
            <td>
                <!-- Email: Clickable to open modal on Email tab -->
                <span class="email-link" data-lead-id="${lead.id || ''}" style="cursor: pointer; color: var(--primary-blue);" title="Open email">
                    ${this.escapeHtml(email)}
                </span>
            </td>
            <td>
                <!-- Phone: Clickable tel: link + action icons -->
                <div class="d-flex align-items-center gap-1">
                    <a href="tel:${this.escapeHtml(phone)}" class="text-decoration-none text-dark">${this.escapeHtml(phone)}</a>
                    ${phone !== 'N/A' ? `
                        <i class="fas fa-phone phone-call-icon" data-lead-id="${lead.id || ''}"
                           style="font-size: 14px; cursor: pointer; color: var(--success-green);"
                           title="Log call"></i>
                        <i class="fas fa-comment-dots phone-sms-icon" data-lead-id="${lead.id || ''}"
                           style="font-size: 14px; cursor: pointer; color: var(--info-cyan);"
                           title="Send SMS"></i>
                    ` : ''}
                </div>
            </td>
            <td>
                <!-- Inline status editing container: stores lead ID and current status ID -->
                <div class="inline-status-container" data-lead-id="${lead.id || ''}" data-current-status="${statusId}">
                    <!-- View Mode: Badge with pencil icon (default visible) -->
                    <div class="status-view-mode">
                        ${this.createStatusBadge(status)}
                        <i class="fas fa-pencil-alt ms-1 text-muted" style="font-size: 0.7rem; cursor: pointer;"></i>
                    </div>
                    <!-- Edit Mode: Dropdown + Save/Cancel buttons (hidden by default) -->
                    <div class="status-edit-mode" style="display: none;">
                        <div class="d-flex align-items-center gap-1">
                            <select class="form-select form-select-sm inline-status-dropdown" style="width: auto; min-width: 130px; font-size: 0.8rem;">
                                <option value="">Loading...</option>
                            </select>
                            <button class="btn btn-success save-status-btn" title="Save">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-secondary cancel-status-btn" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </td>
            <td>${this.escapeHtml(source)}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="progress me-2" style="width: 60px; height: 6px;">
                        <div class="progress-bar ${this.getScoreColor(score)}" style="width: ${score}%"></div>
                    </div>
                    <span class="fw-semibold">${score}</span>
                </div>
            </td>
            <td>
                <!-- Inline assigned-to editing container: stores lead ID and current user ID -->
                <div class="inline-assigned-container" data-lead-id="${lead.id || ''}" data-current-user="${assignedUserId}">
                    <!-- View Mode: User name with pencil icon (default visible) -->
                    <div class="assigned-view-mode">
                        <span class="assigned-user-name">${this.escapeHtml(assignedTo)}</span>
                        <i class="fas fa-pencil-alt ms-1 text-muted" style="font-size: 0.7rem; cursor: pointer;"></i>
                    </div>
                    <!-- Edit Mode: Dropdown + Save/Cancel buttons (hidden by default) -->
                    <div class="assigned-edit-mode" style="display: none;">
                        <div class="d-flex align-items-center gap-1">
                            <select class="form-select form-select-sm inline-assigned-dropdown" style="width: auto; min-width: 140px; font-size: 0.8rem;">
                                <option value="">Loading...</option>
                            </select>
                            <button class="btn btn-success save-assigned-btn" title="Save">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-secondary cancel-assigned-btn" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary view-lead-btn"
                            data-lead-id="${lead.id || ''}"
                            title="View Lead">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${this.showingArchived ? `
                        <!-- Archived lead actions: only restore button -->
                        <button class="btn btn-sm btn-outline-success restore-lead-btn"
                                data-lead-id="${lead.id || ''}"
                                title="Restore Lead">
                            <i class="fas fa-undo"></i>
                        </button>
                    ` : `
                        <!-- Active lead actions: view, edit, archive -->
                        <button class="btn btn-sm btn-outline-secondary edit-lead-btn"
                                data-lead-id="${lead.id || ''}"
                                title="Edit Lead">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning archive-lead-btn"
                                data-lead-id="${lead.id || ''}"
                                title="Archive Lead">
                            <i class="fas fa-archive"></i>
                        </button>
                    `}
                </div>
            </td>
        `;

        // Apply muted styling for archived leads (grayed out)
        if (lead.deleted_at) {
            tr.style.opacity = '0.6';
            tr.style.backgroundColor = '#f8f9fa';
        }

        return tr;
    },

    /**
     * Get lead name
     * @param {Object} lead - Lead object
     * @returns {String} Lead name
     */
    getLeadName(lead) {
        if (lead.full_name) return lead.full_name;
        if (lead.first_name && lead.last_name) {
            return `${lead.first_name} ${lead.last_name}`;
        }
        if (lead.first_name) return lead.first_name;
        if (lead.last_name) return lead.last_name;
        if (lead.name) return lead.name;
        return 'Unknown';
    },

    /**
     * Get initials from name
     * @param {String} name - Full name
     * @returns {String} Initials
     */
    getInitials(name) {
        if (!name || name === 'Unknown') return '??';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    },

    /**
     * Get status information for display purposes
     * NOTE: This returns {name, slug} for DISPLAY only - it does NOT include the status ID
     * For the actual status ID, use lead.status.id or lead.status_id directly
     *
     * @param {Object} lead - Lead object
     * @returns {Object} Status object {name, slug} - NO ID field
     */
    getStatus(lead) {
        if (lead.status) {
            return {
                name: lead.status.name || lead.status.slug || 'Unknown',
                slug: lead.status.slug || ''
            };
        }
        if (lead.status_name) {
            return { name: lead.status_name, slug: '' };
        }
        return { name: 'Unknown', slug: '' };
    },

    /**
     * Get source information
     * @param {Object} lead - Lead object
     * @returns {String} Source name
     */
    getSource(lead) {
        if (lead.source && lead.source.name) return lead.source.name;
        if (lead.source_name) return lead.source_name;
        return 'Unknown';
    },

    /**
     * Get assigned user name
     * @param {Object} lead - Lead object
     * @returns {String} User name
     */
    getAssignedUser(lead) {
        // Try various possible structures from with-relationships endpoint

        // Option 1: assigned_user object (relationship loaded)
        if (lead.assigned_user) {
            const user = lead.assigned_user;
            if (user.full_name) return user.full_name;
            if (user.first_name && user.last_name) {
                return `${user.first_name} ${user.last_name}`;
            }
            if (user.first_name) return user.first_name;
            if (user.username) return user.username;
            if (user.email) return user.email;
        }

        // Option 2: assigned_to object (alternative relationship name)
        if (lead.assigned_to) {
            const user = lead.assigned_to;
            if (user.full_name) return user.full_name;
            if (user.first_name && user.last_name) {
                return `${user.first_name} ${user.last_name}`;
            }
            if (user.first_name) return user.first_name;
            if (user.username) return user.username;
            if (user.email) return user.email;
        }

        // Option 3: Direct name field (if backend includes it)
        if (lead.assigned_to_name) return lead.assigned_to_name;
        if (lead.assigned_user_name) return lead.assigned_user_name;

        // Option 4: Look up in user mapping by ID
        if (lead.assigned_to_user_id && this.userMap && this.userMap[lead.assigned_to_user_id]) {
            return this.userMap[lead.assigned_to_user_id];
        }

        // Option 5: If we have an ID but no mapping entry, show the ID
        if (lead.assigned_to_user_id) {
            return `User #${lead.assigned_to_user_id}`;
        }

        // No assignment
        return 'Unassigned';
    },

    /**
     * Create status badge HTML with improved color mapping
     * @param {Object} status - Status object
     * @returns {String} Badge HTML
     */
    createStatusBadge(status) {
        const statusName = status.name.toLowerCase();
        let badgeClass = 'badge-secondary';

        // Determine badge color based on status
        // New leads (green)
        if (statusName.includes('new') || statusName.includes('inquiry')) {
            badgeClass = 'badge-new';
        }
        // In progress / active / contacted (orange)
        else if (statusName.includes('progress') || statusName.includes('contact') ||
                 statusName.includes('follow') || statusName.includes('consult') ||
                 statusName.includes('booked') || statusName.includes('scheduled')) {
            badgeClass = 'badge-progress';
        }
        // Qualified / accepted (purple)
        else if (statusName.includes('qualified') || statusName.includes('accepted')) {
            badgeClass = 'badge-qualified';
        }
        // Converted / won / customer (blue)
        else if (statusName.includes('convert') || statusName.includes('won') ||
                 statusName.includes('customer') || statusName.includes('success')) {
            badgeClass = 'badge-converted';
        }
        // Lost / rejected / closed (red)
        else if (statusName.includes('lost') || statusName.includes('closed') ||
                 statusName.includes('reject') || statusName.includes('cancel') ||
                 statusName.includes('dead')) {
            badgeClass = 'badge-lost';
        }

        return `<span class="badge ${badgeClass}">${this.escapeHtml(status.name)}</span>`;
    },

    /**
     * Get progress bar color based on score
     * @param {Number} score - Lead score
     * @returns {String} Bootstrap color class
     */
    getScoreColor(score) {
        if (score >= 80) return 'bg-success';
        if (score >= 60) return 'bg-info';
        if (score >= 40) return 'bg-warning';
        return 'bg-danger';
    },

    /**
     * Escape HTML to prevent XSS
     * @param {String} text - Text to escape
     * @returns {String} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Format budget band for display
     * @param {String} budgetBand - Budget band value
     * @returns {String} Formatted budget band
     */
    formatBudgetBand(budgetBand) {
        const bands = {
            'LOW': '<span class="badge bg-info">Low ($0-$5K)</span>',
            'MID': '<span class="badge bg-primary">Mid ($5K-$15K)</span>',
            'HIGH': '<span class="badge bg-success">High ($15K+)</span>',
            'UNKNOWN': '<span class="badge bg-secondary">Unknown</span>'
        };
        return bands[budgetBand] || bands['UNKNOWN'];
    },

    /**
     * Get user name from user object
     * @param {Object} user - User object
     * @returns {String} User name
     */
    getUserName(user) {
        if (!user) return null;

        if (user.full_name) {
            return this.escapeHtml(user.full_name);
        }

        if (user.first_name && user.last_name) {
            return this.escapeHtml(`${user.first_name} ${user.last_name}`);
        }

        if (user.first_name) {
            return this.escapeHtml(user.first_name);
        }

        if (user.username) {
            return this.escapeHtml(user.username);
        }

        if (user.email) {
            return this.escapeHtml(user.email);
        }

        return null;
    },

    /**
     * Show loading state
     */
    showLoadingState() {
        const tbody = document.querySelector('#leadsTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-5">
                        <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                        <div>Loading leads...</div>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Hide loading state
     */
    hideLoadingState() {
        // Loading state is replaced by actual data or empty state
    },

    /**
     * Show empty state when no leads
     */
    showEmptyState() {
        const tbody = document.querySelector('#leadsTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-5">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <div class="text-muted">No leads found</div>
                        <button class="btn btn-primary mt-3">
                            <i class="fas fa-plus me-2"></i>Add New Lead
                        </button>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Show error message
     * @param {String} message - Error message
     */
    showError(message) {
        const tbody = document.querySelector('#leadsTable tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                        <div class="text-danger">${this.escapeHtml(message)}</div>
                        <button class="btn btn-primary mt-3" onclick="LeadsPage.loadLeads()">
                            <i class="fas fa-sync me-2"></i>Retry
                        </button>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Show lead detail modal
     * @param {String|Number} leadId - Lead ID
     * @param {String} activeTab - Tab to activate (overview, edit, notes, timeline)
     */
    async showLeadModal(leadId, activeTab = 'overview') {
        if (!leadId) {
            console.error('No lead ID provided');
            return;
        }

        try {
            // Get modal element
            const modalElement = document.getElementById('leadDetailModal');
            if (!modalElement) {
                console.error('Lead detail modal not found');
                return;
            }

            // Show modal
            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            // Activate requested tab
            const tabToActivate = document.querySelector(`#${activeTab}-tab`);
            if (tabToActivate) {
                const tab = new bootstrap.Tab(tabToActivate);
                tab.show();
            }

            // Show loading state in modal
            this.showModalLoadingState();

            // Fetch lead details, notes, and timeline in parallel
            const [leadResponse] = await Promise.all([
                API.get(`${Config.ENDPOINTS.LEAD.READ}${leadId}`),
                this.loadLeadNotes(leadId),
                this.loadLeadTimeline(leadId)
            ]);

            const lead = leadResponse.records && leadResponse.records[0] ? leadResponse.records[0] : leadResponse;

            // Populate modal with lead data
            this.populateModalOverview(lead);

            // Wire the Edit tab with dropdowns
            await this.wireEditTab(lead);

            // Setup real-time validation for Edit tab
            this.setupEditLeadValidation();

            // Setup note creation functionality
            this.setupNoteCreation(leadId);

        } catch (error) {
            console.error('Failed to load lead details:', error);
            this.showModalError('Failed to load lead details. Please try again.');
        }
    },

    /**
     * Show loading state in modal
     */
    showModalLoadingState() {
        // Update modal title
        const modalTitle = document.querySelector('#leadDetailModalLabel');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
        }

        // Show loading in overview tab
        const overviewTab = document.getElementById('overview');
        if (overviewTab) {
            overviewTab.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
                    <div>Loading lead details...</div>
                </div>
            `;
        }
    },

    /**
     * Show error in modal
     * @param {String} message - Error message
     */
    showModalError(message) {
        const overviewTab = document.getElementById('overview');
        if (overviewTab) {
            overviewTab.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <div class="text-danger">${this.escapeHtml(message)}</div>
                </div>
            `;
        }
    },

    /**
     * Populate modal Overview tab with lead data
     * @param {Object} lead - Lead object
     */
    populateModalOverview(lead) {
        // Update modal title with name and status
        const modalTitle = document.querySelector('#leadDetailModalLabel');
        if (modalTitle) {
            const name = this.getLeadName(lead);
            const status = this.getStatus(lead);
            const statusBadge = this.createStatusBadge(status);
            modalTitle.innerHTML = `<span class="me-3">${this.escapeHtml(name)}</span>${statusBadge}`;
        }

        // Populate Overview tab
        const overviewTab = document.getElementById('overview');
        if (!overviewTab) return;

        const name = this.getLeadName(lead);
        const email = lead.email || lead.primary_email || 'N/A';
        const phone = lead.phone || lead.primary_phone || 'N/A';
        const source = this.getSource(lead);
        const score = lead.score !== null && lead.score !== undefined ? lead.score : 0;
        const fitScore = lead.fit_score !== null && lead.fit_score !== undefined ? lead.fit_score : 0;
        const intentScore = lead.intent_score !== null && lead.intent_score !== undefined ? lead.intent_score : 0;
        const status = this.getStatus(lead);
        const assignedTo = this.getAssignedUser(lead);
        const createdAt = this.formatDate(lead.created_at);
        const updatedAt = this.formatDate(lead.updated_at);

        // Calculate days in status
        const daysInStatus = this.calculateDaysInStatus(lead.status_changed_at || lead.updated_at);

        overviewTab.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Lead Information</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Name:</strong></div>
                                <div class="col-sm-8">${this.escapeHtml(name)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Email:</strong></div>
                                <div class="col-sm-8">
                                    <a href="mailto:${this.escapeHtml(email)}">${this.escapeHtml(email)}</a>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Phone:</strong></div>
                                <div class="col-sm-8">
                                    <a href="tel:${this.escapeHtml(phone)}">${this.escapeHtml(phone)}</a>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Source:</strong></div>
                                <div class="col-sm-8">${this.escapeHtml(source)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Overall Score:</strong></div>
                                <div class="col-sm-8">
                                    <div class="d-flex align-items-center">
                                        <div class="progress me-2" style="width: 100px; height: 8px;">
                                            <div class="progress-bar ${this.getScoreColor(score)}" style="width: ${score}%"></div>
                                        </div>
                                        <span class="fw-semibold">${score}/100</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Fit Score:</strong></div>
                                <div class="col-sm-8">
                                    <div class="d-flex align-items-center">
                                        <div class="progress me-2" style="width: 100px; height: 8px;">
                                            <div class="progress-bar ${this.getScoreColor(fitScore)}" style="width: ${fitScore}%"></div>
                                        </div>
                                        <span class="fw-semibold">${fitScore}/100</span>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Intent Score:</strong></div>
                                <div class="col-sm-8">
                                    <div class="d-flex align-items-center">
                                        <div class="progress me-2" style="width: 100px; height: 8px;">
                                            <div class="progress-bar ${this.getScoreColor(intentScore)}" style="width: ${intentScore}%"></div>
                                        </div>
                                        <span class="fw-semibold">${intentScore}/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Status & Assignment</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Status:</strong></div>
                                <div class="col-sm-8">${this.createStatusBadge(status)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Assigned To:</strong></div>
                                <div class="col-sm-8">${this.escapeHtml(assignedTo)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Days in Status:</strong></div>
                                <div class="col-sm-8">${daysInStatus} days</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Created:</strong></div>
                                <div class="col-sm-8">${createdAt}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-4"><strong>Last Updated:</strong></div>
                                <div class="col-sm-8">${updatedAt}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Business Details</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-sm-5"><strong>Budget Band:</strong></div>
                                <div class="col-sm-7">${this.formatBudgetBand(lead.budget_band)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-5"><strong>Insurance:</strong></div>
                                <div class="col-sm-7">${this.escapeHtml(lead.insurance || 'N/A')}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-sm-5"><strong>Zip Code:</strong></div>
                                <div class="col-sm-7">${this.escapeHtml(lead.zip || 'N/A')}</div>
                            </div>
                        </div>
                    </div>

                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Compliance</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-sm-5"><strong>Consent Given:</strong></div>
                                <div class="col-sm-7">
                                    ${lead.consent_ts ? `
                                        <i class="fas fa-check-circle text-success me-1"></i>
                                        ${this.formatDate(lead.consent_ts)}
                                    ` : '<span class="text-muted">No consent recorded</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h6 class="card-title mb-0">Marketing Attribution</h6>
                        </div>
                        <div class="card-body">
                            ${lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_term || lead.utm_content ? `
                                ${lead.utm_source ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>UTM Source:</strong></div>
                                    <div class="col-sm-7"><code class="text-primary">${this.escapeHtml(lead.utm_source)}</code></div>
                                </div>` : ''}
                                ${lead.utm_medium ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>UTM Medium:</strong></div>
                                    <div class="col-sm-7"><code class="text-primary">${this.escapeHtml(lead.utm_medium)}</code></div>
                                </div>` : ''}
                                ${lead.utm_campaign ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>UTM Campaign:</strong></div>
                                    <div class="col-sm-7"><code class="text-primary">${this.escapeHtml(lead.utm_campaign)}</code></div>
                                </div>` : ''}
                                ${lead.utm_term ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>UTM Term:</strong></div>
                                    <div class="col-sm-7"><code class="text-primary">${this.escapeHtml(lead.utm_term)}</code></div>
                                </div>` : ''}
                                ${lead.utm_content ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>UTM Content:</strong></div>
                                    <div class="col-sm-7"><code class="text-primary">${this.escapeHtml(lead.utm_content)}</code></div>
                                </div>` : ''}
                                ${lead.campaign_id ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>Campaign ID:</strong></div>
                                    <div class="col-sm-7">${lead.campaign_id}</div>
                                </div>` : ''}
                                ${lead.adgroup_id ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>Ad Group ID:</strong></div>
                                    <div class="col-sm-7">${lead.adgroup_id}</div>
                                </div>` : ''}
                                ${lead.ext_lead_ref ? `
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>External Ref:</strong></div>
                                    <div class="col-sm-7"><code class="text-info">${this.escapeHtml(lead.ext_lead_ref)}</code></div>
                                </div>` : ''}
                            ` : '<p class="text-muted mb-0">No marketing attribution data</p>'}
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h6 class="card-title mb-0">Additional Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <strong>Lead ID:</strong> ${lead.id || 'N/A'}
                        </div>
                        <div class="col-md-4 mb-3">
                            <strong>Created By:</strong> ${this.getUserName(lead.created_by) || 'System'}
                        </div>
                        <div class="col-md-4 mb-3">
                            <strong>Updated By:</strong> ${this.getUserName(lead.updated_by) || 'System'}
                        </div>
                        ${lead.notes ? `
                        <div class="col-12 mb-3">
                            <strong>Quick Notes:</strong>
                            <div class="mt-2 p-2 bg-light rounded">${this.escapeHtml(lead.notes)}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Format date to readable string
     * @param {String} dateString - ISO date string
     * @returns {String} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // If less than 7 days, show relative time
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;

            // Otherwise show formatted date
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    },

    /**
     * Calculate days in status
     * @param {String} statusChangedDate - Date status was changed
     * @returns {Number} Number of days
     */
    calculateDaysInStatus(statusChangedDate) {
        if (!statusChangedDate) return 0;

        try {
            const changed = new Date(statusChangedDate);
            const now = new Date();
            const diffTime = Math.abs(now - changed);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (error) {
            return 0;
        }
    },

    /**
     * Load and display lead notes
     * @param {String|Number} leadId - Lead ID
     */
    async loadLeadNotes(leadId) {
        try {
            // Debug: Log the lead ID being passed
            console.log('Loading notes for lead ID:', leadId);

            // Show loading state in notes tab
            this.showNotesLoadingState();

            // Construct the correct URL with lead_id path parameter
            const url = `/api/v1/leadnote/lead/${leadId}`;
            console.log('API URL being called:', url);

            // Fetch notes for this specific lead
            const response = await API.get(url);
            let notes = response.records || [];

            // Debug: Log the response to see structure
            console.log('Lead notes API response:', response);
            console.log('Notes data (count):', notes.length);
            console.log('Notes data (full):', notes);

            // Sort notes by created date (newest first)
            notes = notes.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });

            // Populate notes tab
            this.populateNotesTab(notes);

        } catch (error) {
            console.error('Failed to load lead notes:', error);
            this.showNotesError('Failed to load notes.');
        }
    },

    /**
     * Show loading state in notes tab
     */
    showNotesLoadingState() {
        const notesHistory = document.getElementById('notesHistory');
        if (notesHistory) {
            notesHistory.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                    <div>Loading notes...</div>
                </div>
            `;
        }
    },

    /**
     * Show error in notes tab
     * @param {String} message - Error message
     */
    showNotesError(message) {
        const notesHistory = document.getElementById('notesHistory');
        if (notesHistory) {
            notesHistory.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                    <div class="text-danger">${this.escapeHtml(message)}</div>
                </div>
            `;
        }
    },

    /**
     * Populate notes tab with notes data
     * @param {Array} notes - Array of note objects
     */
    async populateNotesTab(notes) {
        const notesHistory = document.getElementById('notesHistory');
        if (!notesHistory) return;

        // If no notes, show empty state
        if (!notes || notes.length === 0) {
            notesHistory.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-sticky-note fa-3x text-muted mb-3"></i>
                    <div class="text-muted">No notes yet</div>
                    <p class="text-muted small mt-2">Notes will appear here once they are added.</p>
                </div>
            `;
            return;
        }

        // Collect unique user IDs that need to be fetched
        const userIds = [...new Set(notes
            .filter(note => note.user_id && !note.user)
            .map(note => note.user_id))];

        // Fetch user data for all user IDs
        const usersMap = {};
        if (userIds.length > 0) {
            console.log('Fetching user data for user IDs:', userIds);
            try {
                // Fetch users in parallel
                const userPromises = userIds.map(userId =>
                    API.get(`${Config.ENDPOINTS.USER.READ}${userId}`)
                        .then(response => {
                            const user = response.records && response.records[0] ? response.records[0] : response;
                            usersMap[userId] = user;
                        })
                        .catch(err => {
                            console.error(`Failed to fetch user ${userId}:`, err);
                        })
                );
                await Promise.all(userPromises);
                console.log('Users map:', usersMap);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        }

        // Build notes HTML
        let notesHTML = '';
        notes.forEach(note => {
            // Attach user data from usersMap if available
            if (note.user_id && !note.user && usersMap[note.user_id]) {
                note.user = usersMap[note.user_id];
            }

            const author = this.getNoteAuthor(note);
            const timestamp = this.formatDate(note.created_at);
            // Use the correct 'body' field from API response
            const noteText = note.body || 'No content';

            notesHTML += `
                <div class="mb-3 p-3 bg-light rounded">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <strong>${this.escapeHtml(author)}</strong>
                        <small class="text-muted">${timestamp}</small>
                    </div>
                    <p class="mb-0">${this.escapeHtml(noteText)}</p>
                </div>
            `;
        });

        notesHistory.innerHTML = notesHTML;
    },

    /**
     * Get note author name
     * @param {Object} note - Note object
     * @returns {String} Author name
     */
    getNoteAuthor(note) {
        // Debug: Log note object to see structure
        console.log('Note object for author extraction:', note);

        // Check for user relationship (from with-relationships endpoint)
        if (note.user) {
            const user = note.user;
            console.log('User object found:', user);
            if (user.full_name) return user.full_name;
            if (user.first_name && user.last_name) {
                return `${user.first_name} ${user.last_name}`;
            }
            if (user.first_name) return user.first_name;
            if (user.username) return user.username;
            if (user.email) return user.email;
        }

        // Check for author relationship (alternative field name)
        if (note.author) {
            const author = note.author;
            if (author.full_name) return author.full_name;
            if (author.first_name && author.last_name) {
                return `${author.first_name} ${author.last_name}`;
            }
            if (author.first_name) return author.first_name;
            if (author.username) return author.username;
            if (author.email) return author.email;
        }

        // Check for direct name fields
        if (note.author_name) return note.author_name;
        if (note.created_by_name) return note.created_by_name;
        if (note.user_name) return note.user_name;

        // If we have user_id but no user object, show the ID
        if (note.user_id) return `User #${note.user_id}`;

        // Default
        return 'Unknown User';
    },

    /**
     * Setup note creation functionality
     *
     * ENDPOINT VERIFICATION (from endpoints.md):
     * POST /api/v1/leadnote/ - create_leadnote_api_v1_leadnote__post
     *
     * PAYLOAD SCHEMA (from schema_leadnote.py):
     * {
     *   body: string (required),
     *   is_pinned: boolean (default: false),
     *   lead_id: integer (required),
     *   user_id: integer (optional, defaults to current user if omitted)
     * }
     *
     * CURL TEST EXAMPLE:
     * curl -X POST http://localhost:8002/api/v1/leadnote/ \
     *   -H "Authorization: Bearer $TOKEN" \
     *   -H "Content-Type: application/json" \
     *   -d '{"body":"Test note","is_pinned":false,"lead_id":3,"user_id":1}'
     *
     * @param {String|Number} leadId - Lead ID
     */
    setupNoteCreation(leadId) {
        const addNoteBtn = document.getElementById('add-note-btn');
        const noteTextarea = document.getElementById('new-note-text');
        const errorDiv = document.getElementById('note-creation-error');
        const successDiv = document.getElementById('note-creation-success');

        if (!addNoteBtn || !noteTextarea) {
            console.error('Note creation elements not found');
            return;
        }

        // Remove any existing listeners
        const newBtn = addNoteBtn.cloneNode(true);
        addNoteBtn.parentNode.replaceChild(newBtn, addNoteBtn);

        // Add click handler
        newBtn.addEventListener('click', async () => {
            // Hide previous messages
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'none';

            // Get note text and validate
            const noteText = noteTextarea.value.trim();
            if (!noteText) {
                if (errorDiv) {
                    errorDiv.textContent = 'Please enter a note before saving.';
                    errorDiv.style.display = 'block';
                }
                return;
            }

            try {
                // Show loading state
                newBtn.disabled = true;
                newBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Adding...';

                // Get current user ID from JWT token
                const userId = Auth.getUserId();
                console.log('=== AUTH DEBUG ===');
                console.log('User ID from Auth.getUserId():', userId);
                console.log('Token exists:', !!Auth.getToken());
                console.log('User data:', Auth.getUser());

                if (!userId) {
                    throw new Error('User ID not found. Please log in again.');
                }

                // VERIFIED ENDPOINT: POST /api/v1/leadnote/
                // Reference: endpoints.md line 117
                const payload = {
                    body: noteText,
                    is_pinned: false,
                    lead_id: parseInt(leadId),
                    user_id: parseInt(userId)
                };

                console.log('=== CREATE NOTE REQUEST ===');
                console.log('Endpoint:', Config.ENDPOINTS.LEADNOTE.CREATE);
                console.log('Lead ID:', leadId);
                console.log('User ID:', userId);
                console.log('Payload:', JSON.stringify(payload, null, 2));

                const response = await API.post(Config.ENDPOINTS.LEADNOTE.CREATE, payload);
                console.log('=== CREATE NOTE SUCCESS ===');
                console.log('Response:', response);

                // Success: clear textarea
                noteTextarea.value = '';

                // Show success message
                if (successDiv) {
                    successDiv.textContent = 'Note added successfully!';
                    successDiv.style.display = 'block';
                    // Auto-hide after 3 seconds
                    setTimeout(() => {
                        successDiv.style.display = 'none';
                    }, 3000);
                }

                // Refresh notes list
                await this.loadLeadNotes(leadId);

            } catch (error) {
                console.error('=== CREATE NOTE FAILED ===');
                console.error('Error object:', error);
                console.error('Error message:', error.message);
                console.error('Error response:', error.response);
                console.error('Error response data:', error.response?.data);
                console.error('Error response status:', error.response?.status);
                console.error('Full error details:', JSON.stringify(error, null, 2));

                // Show detailed error message
                if (errorDiv) {
                    let errorMsg = 'Failed to add note. ';
                    if (error.response?.data?.detail) {
                        errorMsg += error.response.data.detail;
                    } else if (error.response?.status === 422) {
                        errorMsg += 'Validation error. Check console for details.';
                    } else {
                        errorMsg += 'Please try again.';
                    }
                    errorDiv.textContent = errorMsg;
                    errorDiv.style.display = 'block';
                }
            } finally {
                // Re-enable button
                newBtn.disabled = false;
                newBtn.innerHTML = '<i class="fas fa-plus me-1"></i>Add Note';
            }
        });
    },

    /**
     * Load and display lead timeline/activity history
     * @param {String|Number} leadId - Lead ID
     */
    async loadLeadTimeline(leadId) {
        try {
            // Debug: Log the lead ID
            console.log('Loading timeline for lead ID:', leadId);

            // Show loading state in timeline tab
            this.showTimelineLoadingState();

            // Construct the correct timeline URL
            const url = `/api/v1/lead/${leadId}/timeline`;
            console.log('Timeline API URL being called:', url);

            // Fetch timeline events, status list, and user list in parallel
            const [timelineResponse, statusesResponse, usersResponse] = await Promise.all([
                API.get(url, { offset: 0, limit: 50 }),
                API.get(Config.ENDPOINTS.LEADSTATUS.LIST),
                API.get(Config.ENDPOINTS.USER.LIST)
            ]);

            let events = timelineResponse.records || [];
            const statuses = statusesResponse.records || [];
            const users = usersResponse.records || [];

            // Debug: Log the responses
            console.log('Lead timeline API response:', timelineResponse);
            console.log('Timeline events (count):', events.length);
            console.log('Timeline events (full):', events);
            console.log('Lead statuses:', statuses);
            console.log('========== DEBUG: USER LIST FETCH ==========');
            console.log('Users response:', usersResponse);
            console.log('Users array:', users);
            console.log('Users array length:', users.length);
            console.log('First user (if exists):', users[0]);

            // Create status ID to name mapping
            this.statusMap = {};
            statuses.forEach(status => {
                this.statusMap[status.id] = status.name || status.slug || `Status ${status.id}`;
            });
            console.log('Status mapping:', this.statusMap);

            // Create user ID to name mapping
            this.userMap = {};
            console.log('========== DEBUG: USER MAPPING CREATION ==========');
            users.forEach(user => {
                console.log('Processing user:', user);
                let userName = 'Unknown User';
                if (user.full_name) {
                    userName = user.full_name;
                } else if (user.first_name && user.last_name) {
                    userName = `${user.first_name} ${user.last_name}`;
                } else if (user.first_name) {
                    userName = user.first_name;
                } else if (user.username) {
                    userName = user.username;
                } else if (user.email) {
                    userName = user.email;
                }
                console.log(`Mapping user ID ${user.id} => "${userName}"`);
                this.userMap[user.id] = userName;
            });
            console.log('Final user mapping:', this.userMap);

            // Sort by timestamp (newest first - reverse chronological)
            events = events.sort((a, b) => {
                const dateA = new Date(a.ts || 0);
                const dateB = new Date(b.ts || 0);
                return dateB - dateA;
            });

            // Deduplicate status changes with same timestamp
            events = this.deduplicateStatusChanges(events);
            console.log('After deduplication, events count:', events.length);

            // Populate timeline tab
            await this.populateTimelineTab(events);

        } catch (error) {
            console.error('Failed to load lead timeline:', error);
            this.showTimelineError('Failed to load activity history.');
        }
    },

    /**
     * Deduplicate status change events with same timestamp
     * @param {Array} events - Array of timeline events
     * @returns {Array} Deduplicated events
     */
    deduplicateStatusChanges(events) {
        const seen = new Map(); // Key: timestamp, Value: event
        const result = [];

        events.forEach(event => {
            const isStatusChange =
                event.kind === 'status' ||
                event.kind === 'STATUS_CHANGED' ||
                event.type === 'STATUS_CHANGED';

            if (isStatusChange) {
                const timestamp = event.ts;

                if (seen.has(timestamp)) {
                    // Already have a status change at this timestamp
                    const existing = seen.get(timestamp);

                    // Prefer events with kind: "status" and "by" field (has user info)
                    const currentHasUserInfo = event.kind === 'status' && event.by !== undefined;
                    const existingHasUserInfo = existing.kind === 'status' && existing.by !== undefined;

                    if (currentHasUserInfo && !existingHasUserInfo) {
                        // Replace existing with current (has better info)
                        console.log('Replacing duplicate status change - preferring one with user info', {existing, current: event});
                        const index = result.indexOf(existing);
                        if (index !== -1) {
                            result[index] = event;
                        }
                        seen.set(timestamp, event);
                    } else {
                        console.log('Skipping duplicate status change at same timestamp', event);
                    }
                } else {
                    // First status change at this timestamp
                    seen.set(timestamp, event);
                    result.push(event);
                }
            } else {
                // Not a status change, keep it
                result.push(event);
            }
        });

        return result;
    },

    /**
     * Show loading state in timeline tab
     */
    showTimelineLoadingState() {
        const timeline = document.querySelector('#timeline .timeline');
        if (timeline) {
            timeline.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                    <div>Loading activity history...</div>
                </div>
            `;
        }
    },

    /**
     * Show error in timeline tab
     * @param {String} message - Error message
     */
    showTimelineError(message) {
        const timeline = document.querySelector('#timeline .timeline');
        if (timeline) {
            timeline.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                    <div class="text-danger">${this.escapeHtml(message)}</div>
                </div>
            `;
        }
    },

    /**
     * Populate timeline tab with event data
     * @param {Array} events - Array of timeline event objects
     */
    async populateTimelineTab(events) {
        const timeline = document.querySelector('#timeline .timeline');
        if (!timeline) return;

        // If no events, show empty state
        if (!events || events.length === 0) {
            timeline.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-clock fa-3x text-muted mb-3"></i>
                    <div class="text-muted">No activity yet</div>
                    <p class="text-muted small mt-2">Activity events will appear here.</p>
                </div>
            `;
            return;
        }

        // Build timeline HTML
        let timelineHTML = '';
        console.log('========== DEBUG: PROCESSING TIMELINE EVENTS ==========');
        console.log('Total events to process:', events.length);
        events.forEach((event, index) => {
            console.log(`\n--- Event ${index + 1} ---`);
            console.log('Full event object:', JSON.stringify(event, null, 2));
            console.log('Event actor_user_id:', event.actor_user_id);
            console.log('Event kind:', event.kind, 'type:', event.type);

            // Filter out duplicate STATUS_CHANGED events
            // Skip events where kind === "event" AND type === "STATUS_CHANGED"
            // Only show STATUS_CHANGED events where kind === "status" (these have proper "by" field)
            if (event.kind === 'event' && event.type === 'STATUS_CHANGED') {
                console.log('Skipping duplicate STATUS_CHANGED event (kind === "event")');
                return; // Skip this event
            }

            const eventInfo = this.formatTimelineEvent(event);

            timelineHTML += `
                <div class="timeline-item">
                    <div class="timeline-marker ${eventInfo.markerClass}">
                        <i class="fas ${eventInfo.icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <h6 class="timeline-title">${eventInfo.title}</h6>
                        <p class="timeline-text">${eventInfo.description}</p>
                        <small class="text-muted">${eventInfo.timestamp}</small>
                    </div>
                </div>
            `;
        });

        timeline.innerHTML = timelineHTML;
    },

    /**
     * Get actor attribution text
     * @param {Object} event - Timeline event object
     * @returns {String} Attribution text (e.g., "by John Doe" or "by System")
     */
    getActorAttribution(event) {
        const actorId = event.actor_user_id;

        console.log('========== DEBUG: USER LOOKUP ==========');
        console.log('Looking up actor_user_id:', actorId);
        console.log('actorId type:', typeof actorId);
        console.log('actorId is null?', actorId === null);
        console.log('actorId is undefined?', actorId === undefined);
        console.log('this.userMap exists?', !!this.userMap);
        console.log('this.userMap:', this.userMap);

        if (actorId === null || actorId === undefined) {
            console.log('=> Returning "by System" (null/undefined actorId)');
            return 'by System';
        }

        if (this.userMap && this.userMap[actorId]) {
            const userName = this.userMap[actorId];
            console.log(`=> Found user in map: actorId ${actorId} => "${userName}"`);
            return `by ${userName}`;
        }

        console.log(`=> User not found in map, returning "by User #${actorId}"`);
        return `by User #${actorId}`;
    },

    /**
     * Format timeline event for display
     * @param {Object} event - Timeline event object
     * @returns {Object} Formatted event info
     */
    formatTimelineEvent(event) {
        const timestamp = this.formatDate(event.ts);
        const payload = event.payload || {};
        const kind = event.kind || '';
        const type = event.type || '';
        const channel = event.channel || '';
        const actorAttribution = this.getActorAttribution(event);

        // Debug: Log the event structure
        console.log('Formatting timeline event:', event);
        console.log('Actor attribution:', actorAttribution);

        let title = 'Event';
        let description = '';
        let markerClass = 'bg-secondary';
        let icon = 'fa-circle';

        // Format based on event kind/type
        if (kind === 'LEAD_CREATED' || type === 'LEAD_CREATED') {
            title = 'Lead Created';
            description = `Lead created ${actorAttribution}`;
            if (payload.source) {
                description += ` from ${this.escapeHtml(payload.source)}`;
            }
            markerClass = 'bg-success';
            icon = 'fa-star';

        } else if (kind === 'ASSIGNED' || type === 'ASSIGNED') {
            title = 'Lead Assigned';

            // payload.user_id is who it was assigned TO
            let assignedToName = 'Unknown';
            if (payload.user_id && this.userMap && this.userMap[payload.user_id]) {
                assignedToName = this.userMap[payload.user_id];
            } else if (payload.assigned_to) {
                assignedToName = payload.assigned_to;
            } else if (payload.user_id) {
                assignedToName = `User #${payload.user_id}`;
            }

            description = `Assigned to ${this.escapeHtml(assignedToName)} ${actorAttribution}`;
            markerClass = 'bg-primary';
            icon = 'fa-user';

        } else if (kind === 'status' || kind === 'STATUS_CHANGED' || type === 'STATUS_CHANGED') {
            title = 'Status Changed';

            // Handle TWO different event structures:
            // Structure 1: {"kind": "status", "from": 1, "to": 2}
            // Structure 2: {"payload": {"from": 1, "to": 2}}

            let oldStatusId, newStatusId;

            // Check if status IDs are at the root level (Structure 1)
            if (event.from !== undefined || event.to !== undefined) {
                oldStatusId = event.from;
                newStatusId = event.to;
            } else {
                // Otherwise check payload (Structure 2)
                oldStatusId = payload.from || payload.old_status_id || payload.from_status_id;
                newStatusId = payload.to || payload.new_status_id || payload.to_status_id;
            }

            // Look up status names from the mapping
            let oldStatus = 'Unknown';
            let newStatus = 'Unknown';

            if (oldStatusId !== undefined && this.statusMap && this.statusMap[oldStatusId]) {
                oldStatus = this.statusMap[oldStatusId];
            } else if (payload.old_status || payload.from_status) {
                oldStatus = payload.old_status || payload.from_status;
            }

            if (newStatusId !== undefined && this.statusMap && this.statusMap[newStatusId]) {
                newStatus = this.statusMap[newStatusId];
            } else if (payload.new_status || payload.to_status) {
                newStatus = payload.new_status || payload.to_status;
            }

            console.log(`Status change: from ID ${oldStatusId} (${oldStatus}) to ID ${newStatusId} (${newStatus})`);

            description = `Status changed from <strong>${this.escapeHtml(oldStatus)}</strong> to <strong>${this.escapeHtml(newStatus)}</strong> ${actorAttribution}`;

            if (payload.reason) {
                description += `<br><em>Reason: ${this.escapeHtml(payload.reason)}</em>`;
            }
            markerClass = 'bg-info';
            icon = 'fa-exchange-alt';

        } else if (kind === 'field' || type === 'FIELD_CHANGED') {
            title = 'Field Changed';
            const fieldName = payload.field || payload.field_name || 'Unknown field';
            const oldValue = payload.old || payload.old_value || '';
            const newValue = payload.new || payload.new_value || '';

            // Check if this is a special field that needs name display instead of ID
            let displayOldValue = oldValue;
            let displayNewValue = newValue;
            let displayFieldName = fieldName;

            // Handle source_id changes
            if (fieldName === 'source_id') {
                displayFieldName = 'Source';
                // Use provided names from backend
                displayOldValue = payload.old_name || oldValue;
                displayNewValue = payload.new_name || newValue;
            }
            // Handle status_id changes
            else if (fieldName === 'status_id') {
                displayFieldName = 'Status';
                // Use provided names from backend
                displayOldValue = payload.old_name || oldValue;
                displayNewValue = payload.new_name || newValue;
            }
            // Handle assigned_to_user_id changes
            else if (fieldName === 'assigned_to_user_id') {
                displayFieldName = 'Assigned To';
                // Use provided names from backend
                displayOldValue = payload.old_name || oldValue;
                displayNewValue = payload.new_name || newValue;
            }

            description = `<strong>${this.escapeHtml(displayFieldName)}</strong> changed from "${this.escapeHtml(displayOldValue)}" to "${this.escapeHtml(displayNewValue)}" ${actorAttribution}`;
            markerClass = 'bg-warning';
            icon = 'fa-edit';

        } else if (kind === 'NOTE_ADDED' || type === 'NOTE_ADDED') {
            title = 'Note Added';
            description = `Note added ${actorAttribution}`;
            if (payload.note || payload.body) {
                const noteText = payload.note || payload.body;
                description += `<br><em>"${this.escapeHtml(noteText.substring(0, 100))}${noteText.length > 100 ? '...' : ''}"</em>`;
            }
            markerClass = 'bg-warning';
            icon = 'fa-sticky-note';

        } else if (kind === 'EMAIL_SENT' || type === 'EMAIL_SENT' || channel === 'EMAIL') {
            title = 'Email Sent';
            description = `Email sent ${actorAttribution}`;
            if (payload.subject) {
                description += `<br><strong>Subject:</strong> ${this.escapeHtml(payload.subject)}`;
            }
            markerClass = 'bg-info';
            icon = 'fa-envelope';

        } else if (kind === 'SMS_SENT' || type === 'SMS_SENT' || channel === 'SMS') {
            title = 'SMS Sent';
            description = `SMS sent ${actorAttribution}`;
            if (payload.message) {
                description += `<br><em>"${this.escapeHtml(payload.message.substring(0, 100))}${payload.message.length > 100 ? '...' : ''}"</em>`;
            }
            markerClass = 'bg-success';
            icon = 'fa-sms';

        } else if (kind === 'CALL_LOGGED' || type === 'CALL_LOGGED' || channel === 'PHONE') {
            title = 'Call Logged';
            description = `Phone call logged ${actorAttribution}`;
            if (payload.duration) {
                description += `<br><strong>Duration:</strong> ${payload.duration}`;
            }
            if (payload.outcome) {
                description += `<br><strong>Outcome:</strong> ${this.escapeHtml(payload.outcome)}`;
            }
            markerClass = 'bg-primary';
            icon = 'fa-phone';

        } else if (kind === 'SCORE_UPDATED' || type === 'SCORE_UPDATED') {
            title = 'Score Updated';
            const oldScore = payload.old_score || 0;
            const newScore = payload.new_score || payload.score || 0;
            description = `Lead score updated from ${oldScore} to ${newScore} ${actorAttribution}`;
            markerClass = 'bg-warning';
            icon = 'fa-chart-line';

        } else {
            // Generic event display
            title = kind || type || 'Activity';
            description = 'An activity occurred';
            if (payload.description) {
                description = this.escapeHtml(payload.description);
            }
            // Try to display any useful payload data
            const payloadKeys = Object.keys(payload);
            if (payloadKeys.length > 0) {
                description += '<br><small>';
                payloadKeys.slice(0, 3).forEach(key => {
                    description += `${key}: ${this.escapeHtml(String(payload[key]).substring(0, 50))}<br>`;
                });
                description += '</small>';
            }
        }

        return {
            title: this.escapeHtml(title),
            description: description, // Already escaped in parts above
            timestamp: timestamp,
            markerClass: markerClass,
            icon: icon
        };
    },

    /**
     * Wire the Edit tab with dropdowns and populate with lead data
     * @param {Object} leadData - Lead object
     */
    async wireEditTab(leadData) {
        try {
            console.log('Wiring Edit tab with lead data:', leadData);

            // Initialize all three dropdowns
            const statusDropdown = createStatusDropdown('#edit-status-dropdown');
            const sourceDropdown = createSourceDropdown('#edit-source-dropdown');
            const userDropdown = createUserDropdown('#edit-user-dropdown');

            // Initialize dropdowns in parallel
            await Promise.all([
                statusDropdown.init(),
                sourceDropdown.init(),
                userDropdown.init()
            ]);

            // Populate form fields with current lead data
            $('#edit-first-name').val(leadData.first_name || '');
            $('#edit-last-name').val(leadData.last_name || '');
            $('#edit-email').val(leadData.email || leadData.primary_email || '');
            $('#edit-phone').val(leadData.phone || leadData.primary_phone || '');

            // Populate new fields
            $('#edit-budget-band').val(leadData.budget_band || 'UNKNOWN');
            $('#edit-insurance').val(leadData.insurance || '');
            $('#edit-zip').val(leadData.zip || '');
            $('#edit-notes').val(leadData.notes || '');

            // Set dropdown values
            if (leadData.status_id) {
                statusDropdown.setValue(leadData.status_id);
            }

            if (leadData.source_id) {
                sourceDropdown.setValue(leadData.source_id);
            }

            if (leadData.assigned_to_user_id) {
                userDropdown.setValue(leadData.assigned_to_user_id);
            }

            // Store dropdown instances for later use (e.g., in save functionality)
            this.editDropdowns = {
                status: statusDropdown,
                source: sourceDropdown,
                user: userDropdown
            };

            // Store lead ID for save functionality
            this.currentLeadId = leadData.id;

            // Wire the Save Changes button
            this.wireSaveButton();

            console.log('Edit tab wired successfully');

        } catch (error) {
            console.error('Failed to wire Edit tab:', error);

            // Show error in Edit tab
            const editTab = document.getElementById('edit');
            if (editTab) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger';
                errorDiv.innerHTML = `
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load edit form. Please try again.
                `;
                editTab.insertBefore(errorDiv, editTab.firstChild);
            }
        }
    },

    /**
     * Wire the Save Changes button in Edit tab
     */
    wireSaveButton() {
        const saveButton = document.getElementById('save-lead-btn');
        if (!saveButton) {
            console.error('Save button not found');
            return;
        }

        // Remove any existing click handlers
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);

        // Add click handler
        newSaveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleSaveLead();
        });
    },

    /**
     * Handle save lead changes
     */
    async handleSaveLead() {
        // Validate form before proceeding using centralized FormValidator
        const fieldRules = {
            first_name: { required: true, minLength: 2, label: 'First Name' },
            last_name: { required: true, minLength: 2, label: 'Last Name' },
            email: { email: true, optional: true, label: 'Email' },
            phone: { phone: true, optional: true, label: 'Phone' },
            status_id: { required: true, label: 'Status' },
            source_id: { required: true, label: 'Source' }
        };

        const isValid = this.formValidator.validateForm('edit-lead-form', fieldRules, {
            emailOrPhone: true,
            errorSummaryId: 'edit-lead-error-summary'
        });

        if (!isValid) {
            console.log('Edit form validation failed');
            return;
        }

        const saveButton = document.getElementById('save-lead-btn');

        try {
            console.log('Save lead changes initiated');

            // Disable save button and show loading state
            if (saveButton) {
                saveButton.disabled = true;
                saveButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
            }

            // Collect all form data
            const firstName = $('#edit-first-name').val().trim();
            const lastName = $('#edit-last-name').val().trim();
            const email = $('#edit-email').val().trim();
            const phone = $('#edit-phone').val().trim();

            // Get new fields
            const budgetBand = $('#edit-budget-band').val();
            const insurance = $('#edit-insurance').val().trim();
            const zip = $('#edit-zip').val().trim();
            const notes = $('#edit-notes').val().trim();

            // Get IDs from dropdowns
            const statusId = this.editDropdowns.status.getValue();
            const sourceId = this.editDropdowns.source.getValue();
            const assignedToUserId = this.editDropdowns.user.getValue();

            // Build the payload object with ALL lead fields
            const payload = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                status_id: statusId,
                source_id: sourceId,
                assigned_to_user_id: assignedToUserId,
                budget_band: budgetBand,
                insurance: insurance,
                zip: zip,
                notes: notes
            };

            // Log payload for verification
            console.log('=== PAYLOAD TO SEND ===', payload);

            // Call API to update lead
            const response = await API.put(`${Config.ENDPOINTS.LEAD.UPDATE}${this.currentLeadId}`, payload);

            console.log('Lead updated successfully:', response);

            // Re-enable save button (SUCCESS case)
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = 'Save Changes';
            }

            // Show success message
            this.showSuccessMessage('Lead updated successfully!');

            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('leadDetailModal'));
            if (modal) {
                modal.hide();
            }

            // Reload the leads list to reflect changes
            await this.loadLeads();

        } catch (error) {
            console.error('Failed to save lead:', error);

            // Re-enable save button (ERROR case)
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.innerHTML = 'Save Changes';
            }

            // Show error message in Edit tab
            this.showEditTabError('Failed to save changes. Please try again.');
        }
    },

    /**
     * Show success message
     * @param {String} message - Success message
     */
    showSuccessMessage(message) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${this.escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to body
        document.body.appendChild(alertDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    },

    /**
     * Show error message in Edit tab
     * @param {String} message - Error message
     */
    showEditTabError(message) {
        // Remove any existing error alerts
        const existingAlerts = document.querySelectorAll('#edit .alert-danger');
        existingAlerts.forEach(alert => alert.remove());

        // Create error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${this.escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert at top of Edit tab
        const editTab = document.getElementById('edit');
        if (editTab) {
            editTab.insertBefore(alertDiv, editTab.firstChild);
        }
    },

    async initializeAddLeadModal() {
        try {
            this.addLeadDropdowns.status = createStatusDropdown('#add-status-dropdown', {
                includeEmpty: false,
                onChange: (statusId, statusName) => {
                    console.log('Status selected:', statusId, statusName);
                }
            });

            this.addLeadDropdowns.source = createSourceDropdown('#add-source-dropdown', {
                includeEmpty: false,
                onChange: (sourceId, sourceName) => {
                    console.log('Source selected:', sourceId, sourceName);
                }
            });

            this.addLeadDropdowns.user = createUserDropdown('#add-user-dropdown', {
                includeEmpty: true,
                emptyText: 'Unassigned',
                onChange: (userId, userName) => {
                    console.log('User selected:', userId, userName);
                }
            });

            await Promise.all([
                this.addLeadDropdowns.status.init(),
                this.addLeadDropdowns.source.init(),
                this.addLeadDropdowns.user.init()
            ]);

            console.log('Add Lead modal dropdowns initialized');
        } catch (error) {
            console.error('Failed to initialize Add Lead modal dropdowns:', error);
        }
    },

    /**
     * Setup real-time validation for Create Lead modal using centralized FormValidator
     * Validates on keyup for live feedback as user types
     */
    setupCreateLeadValidation() {
        const form = document.getElementById('add-lead-form');
        if (!form) return;

        console.log('Setting up Create Lead validation with FormValidator');

        // Define field validation rules
        const fieldRules = {
            first_name: {
                required: true,
                minLength: 2,
                label: 'First Name'
            },
            last_name: {
                required: true,
                minLength: 2,
                label: 'Last Name'
            },
            email: {
                email: true,
                optional: true,
                label: 'Email'
            },
            phone: {
                phone: true,
                optional: true,
                label: 'Phone'
            },
            status_id: {
                required: true,
                label: 'Status'
            },
            source_id: {
                required: true,
                label: 'Source'
            }
        };

        // Setup validation with centralized FormValidator
        this.formValidator.setupValidation('add-lead-form', fieldRules, {
            errorSummaryId: 'create-lead-error-summary',
            emailOrPhone: true  // Require at least one of email or phone
        });
    },

    /**
     * Setup real-time validation for Edit tab using centralized FormValidator
     * Validates on keyup for live feedback as user types
     */
    setupEditLeadValidation() {
        const form = document.getElementById('edit-lead-form');
        if (!form) return;

        console.log('Setting up Edit Lead validation with FormValidator');

        // Define field validation rules (same as create form)
        const fieldRules = {
            first_name: {
                required: true,
                minLength: 2,
                label: 'First Name'
            },
            last_name: {
                required: true,
                minLength: 2,
                label: 'Last Name'
            },
            email: {
                email: true,
                optional: true,
                label: 'Email'
            },
            phone: {
                phone: true,
                optional: true,
                label: 'Phone'
            },
            status_id: {
                required: true,
                label: 'Status'
            },
            source_id: {
                required: true,
                label: 'Source'
            }
        };

        // Setup validation with centralized FormValidator
        this.formValidator.setupValidation('edit-lead-form', fieldRules, {
            errorSummaryId: 'edit-lead-error-summary',
            emailOrPhone: true  // Require at least one of email or phone
        });
    },

    async createLead() {
        console.log('=== CREATE LEAD STARTED ===');

        const createButton = document.getElementById('create-lead-btn');
        const errorDiv = document.getElementById('add-lead-error');
        const successDiv = document.getElementById('add-lead-success');

        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        // Validate form before proceeding using centralized FormValidator
        const fieldRules = {
            first_name: { required: true, minLength: 2, label: 'First Name' },
            last_name: { required: true, minLength: 2, label: 'Last Name' },
            email: { email: true, optional: true, label: 'Email' },
            phone: { phone: true, optional: true, label: 'Phone' },
            status_id: { required: true, label: 'Status' },
            source_id: { required: true, label: 'Source' }
        };

        const isValid = this.formValidator.validateForm('add-lead-form', fieldRules, {
            emailOrPhone: true,
            errorSummaryId: 'create-lead-error-summary'
        });

        if (!isValid) {
            console.log('Form validation failed');
            return;
        }

        if (createButton) {
            createButton.disabled = true;
            createButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Creating...';
        }

        try {
            const firstName = $('#add-first-name').val().trim();
            const lastName = $('#add-last-name').val().trim();
            const email = $('#add-email').val().trim();
            const phone = $('#add-phone').val().trim();
            const budgetBand = $('#add-budget-band').val();
            const insurance = $('#add-insurance').val().trim();
            const zip = $('#add-zip').val().trim();
            const utmSource = $('#add-utm-source').val().trim();
            const utmCampaign = $('#add-utm-campaign').val().trim();
            const notes = $('#add-notes').val().trim();

            const statusId = this.addLeadDropdowns.status.getValue();
            const sourceId = this.addLeadDropdowns.source.getValue();
            const assignedToUserId = this.addLeadDropdowns.user.getValue();

            // Note: Validation already checked these, but keep for defensive programming
            if (!firstName) {
                throw new Error('First name is required');
            }
            if (!lastName) {
                throw new Error('Last name is required');
            }
            if (!email && !phone) {
                throw new Error('Either email or phone is required');
            }
            if (!statusId) {
                throw new Error('Status is required');
            }
            if (!sourceId) {
                throw new Error('Source is required');
            }

            const payload = {
                first_name: firstName,
                last_name: lastName,
                email: email || '',
                phone: phone || '',
                source_id: sourceId,
                status_id: statusId,
                notes: notes || '',
                utm_source: utmSource || '',
                utm_campaign: utmCampaign || '',
                budget_band: budgetBand || 'UNKNOWN',
                insurance: insurance || '',
                zip: zip || ''
            };

            if (assignedToUserId) {
                payload.assigned_to_user_id = assignedToUserId;
            }

            console.log('=== PAYLOAD TO SEND ===', payload);
            console.log('Endpoint:', Config.ENDPOINTS.LEAD.CREATE);

            const response = await API.post(Config.ENDPOINTS.LEAD.CREATE, payload);

            console.log('Lead created successfully:', response);

            if (createButton) {
                createButton.disabled = false;
                createButton.innerHTML = '<i class="fas fa-plus me-1"></i>Create Lead';
            }

            successDiv.textContent = 'Lead created successfully!';
            successDiv.style.display = 'block';

            $('#add-lead-form')[0].reset();
            this.addLeadDropdowns.status.setValue(null);
            this.addLeadDropdowns.source.setValue(null);
            this.addLeadDropdowns.user.setValue(null);

            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addLeadModal'));
                if (modal) {
                    modal.hide();
                }
                successDiv.style.display = 'none';
            }, 1500);

            await this.loadLeads();

        } catch (error) {
            console.error('Failed to create lead:', error);

            if (createButton) {
                createButton.disabled = false;
                createButton.innerHTML = '<i class="fas fa-plus me-1"></i>Create Lead';
            }

            errorDiv.textContent = error.message || 'Failed to create lead. Please try again.';
            errorDiv.style.display = 'block';
        }
    },

    /**
     * ============================================================================
     * BULK ACTIONS
     * ============================================================================
     */

    /**
     * Update selection counter and bulk actions visibility
     */
    updateBulkActionsUI() {
        const count = this.selectedLeadIds.size;
        const counter = document.getElementById('selection-counter');
        const container = document.getElementById('bulk-actions-container');

        if (count > 0) {
            counter.textContent = `${count} selected`;
            counter.style.display = 'inline-block';
            container.style.display = 'inline-block';
        } else {
            counter.style.display = 'none';
            container.style.display = 'none';
        }
    },

    /**
     * Handle checkbox change for lead selection
     */
    handleLeadCheckboxChange(leadId, isChecked) {
        if (isChecked) {
            this.selectedLeadIds.add(parseInt(leadId));
        } else {
            this.selectedLeadIds.delete(parseInt(leadId));
        }
        this.updateBulkActionsUI();
    },

    /**
     * Handle select all checkbox
     */
    handleSelectAllChange(isChecked) {
        const checkboxes = document.querySelectorAll('tbody input[type="checkbox"][data-lead-id]');

        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const leadId = parseInt(checkbox.getAttribute('data-lead-id'));
            if (isChecked) {
                this.selectedLeadIds.add(leadId);
            } else {
                this.selectedLeadIds.delete(leadId);
            }
        });

        this.updateBulkActionsUI();
    },

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedLeadIds.clear();
        document.getElementById('selectAll').checked = false;
        document.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        this.updateBulkActionsUI();
    },

    /**
     * Initialize bulk status change modal dropdown
     */
    async initializeBulkStatusDropdown() {
        try {
            this.bulkStatusDropdown = createStatusDropdown('#bulk-status-dropdown', {
                includeEmpty: false,
                onChange: (statusId, statusName) => {
                    console.log('Bulk status selected:', statusId, statusName);
                }
            });

            await this.bulkStatusDropdown.init();
            console.log('Bulk status dropdown initialized');
        } catch (error) {
            console.error('Failed to initialize bulk status dropdown:', error);
        }
    },

    /**
     * Show bulk status change modal
     */
    showBulkStatusModal() {
        const count = this.selectedLeadIds.size;
        if (count === 0) {
            alert('Please select at least one lead');
            return;
        }

        // Update count in modal
        document.getElementById('bulk-status-count').textContent = count;

        // Reset modal state
        document.getElementById('bulk-status-error').style.display = 'none';
        document.getElementById('bulk-status-progress').style.display = 'none';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkStatusModal'));
        modal.show();
    },

    /**
     * Execute bulk status change
     */
    async executeBulkStatusChange() {
        const statusId = this.bulkStatusDropdown.getValue();

        if (!statusId) {
            const errorDiv = document.getElementById('bulk-status-error');
            errorDiv.textContent = 'Please select a status';
            errorDiv.style.display = 'block';
            return;
        }

        const confirmBtn = document.getElementById('bulk-status-confirm-btn');
        const errorDiv = document.getElementById('bulk-status-error');
        const progressDiv = document.getElementById('bulk-status-progress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = document.getElementById('bulk-status-progress-text');

        // Hide error, show progress
        errorDiv.style.display = 'none';
        progressDiv.style.display = 'block';
        confirmBtn.disabled = true;

        const leadIds = Array.from(this.selectedLeadIds);
        const total = leadIds.length;
        let completed = 0;
        let failed = 0;

        console.log(`Starting bulk status change for ${total} leads to status ${statusId}`);

        // Process each lead
        for (const leadId of leadIds) {
            try {
                // Fetch full lead data first (required for PUT)
                const leadResponse = await API.get(`${Config.ENDPOINTS.LEAD.READ}${leadId}`);
                const lead = leadResponse.records && leadResponse.records[0] ? leadResponse.records[0] : leadResponse;

                if (!lead) {
                    console.error(`Lead ${leadId} not found`);
                    failed++;
                    continue;
                }

                // Update with new status_id
                const updatePayload = {
                    ...lead,
                    status_id: parseInt(statusId)
                };

                // Remove computed fields that shouldn't be in PUT
                delete updatePayload.status;
                delete updatePayload.source;
                delete updatePayload.assigned_user;
                delete updatePayload.created_at;
                delete updatePayload.updated_at;

                console.log(`Updating lead ${leadId} with status ${statusId}`, updatePayload);

                // Execute update
                await API.put(`${Config.ENDPOINTS.LEAD.UPDATE}${leadId}`, updatePayload);

                completed++;
                console.log(`Successfully updated lead ${leadId}`);

            } catch (error) {
                console.error(`Failed to update lead ${leadId}:`, error);
                failed++;
            }

            // Update progress
            const progress = Math.round((completed + failed) / total * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${completed + failed}/${total}`;
        }

        // Show results
        progressDiv.style.display = 'none';
        confirmBtn.disabled = false;

        if (failed > 0) {
            errorDiv.textContent = `Updated ${completed} lead(s). Failed to update ${failed} lead(s).`;
            errorDiv.style.display = 'block';
        } else {
            // Success - close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('bulkStatusModal'));
            modal.hide();

            // Clear selection
            this.clearSelection();

            // Reload leads
            await this.loadLeads();

            // Show success message
            this.showToast('Success', `Successfully updated ${completed} lead(s)`, 'success');
        }
    },

    /**
     * Initialize bulk assign user modal dropdown
     */
    async initializeBulkAssignDropdown() {
        try {
            this.bulkAssignDropdown = createUserDropdown('#bulk-assign-dropdown', {
                includeEmpty: true,
                emptyText: 'Unassigned',
                onChange: (userId, userName) => {
                    console.log('Bulk assign user selected:', userId, userName);
                }
            });

            await this.bulkAssignDropdown.init();
            console.log('Bulk assign dropdown initialized');
        } catch (error) {
            console.error('Failed to initialize bulk assign dropdown:', error);
        }
    },

    /**
     * Show bulk assign modal
     */
    showBulkAssignModal() {
        const count = this.selectedLeadIds.size;
        if (count === 0) {
            alert('Please select at least one lead');
            return;
        }

        // Update count in modal
        document.getElementById('bulk-assign-count').textContent = count;

        // Reset modal state
        document.getElementById('bulk-assign-error').style.display = 'none';
        document.getElementById('bulk-assign-progress').style.display = 'none';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkAssignModal'));
        modal.show();
    },

    /**
     * Execute bulk assign
     */
    async executeBulkAssign() {
        const userId = this.bulkAssignDropdown.getValue();

        // Note: userId can be empty string for "Unassigned"
        // Empty string is valid - it means unassign

        const confirmBtn = document.getElementById('bulk-assign-confirm-btn');
        const errorDiv = document.getElementById('bulk-assign-error');
        const progressDiv = document.getElementById('bulk-assign-progress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = document.getElementById('bulk-assign-progress-text');

        // Hide error, show progress
        errorDiv.style.display = 'none';
        progressDiv.style.display = 'block';
        confirmBtn.disabled = true;

        const leadIds = Array.from(this.selectedLeadIds);
        const total = leadIds.length;
        let completed = 0;
        let failed = 0;

        const assignedToUserId = userId ? parseInt(userId) : null;
        console.log(`Starting bulk assign for ${total} leads to user ${assignedToUserId || 'Unassigned'}`);

        // Process each lead
        for (const leadId of leadIds) {
            try {
                // Fetch full lead data first (required for PUT)
                const leadResponse = await API.get(`${Config.ENDPOINTS.LEAD.READ}${leadId}`);
                const lead = leadResponse.records && leadResponse.records[0] ? leadResponse.records[0] : leadResponse;

                if (!lead) {
                    console.error(`Lead ${leadId} not found`);
                    failed++;
                    continue;
                }

                // Update with new assigned_to_user_id
                const updatePayload = {
                    ...lead,
                    assigned_to_user_id: assignedToUserId
                };

                // Remove computed fields that shouldn't be in PUT
                delete updatePayload.status;
                delete updatePayload.source;
                delete updatePayload.assigned_user;
                delete updatePayload.created_at;
                delete updatePayload.updated_at;

                console.log(`Updating lead ${leadId} with user ${assignedToUserId}`, updatePayload);

                // Execute update
                await API.put(`${Config.ENDPOINTS.LEAD.UPDATE}${leadId}`, updatePayload);

                completed++;
                console.log(`Successfully assigned lead ${leadId}`);

            } catch (error) {
                console.error(`Failed to assign lead ${leadId}:`, error);
                failed++;
            }

            // Update progress
            const progress = Math.round((completed + failed) / total * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${completed + failed}/${total}`;
        }

        // Show results
        progressDiv.style.display = 'none';
        confirmBtn.disabled = false;

        if (failed > 0) {
            errorDiv.textContent = `Assigned ${completed} lead(s). Failed to assign ${failed} lead(s).`;
            errorDiv.style.display = 'block';
        } else {
            // Success - close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('bulkAssignModal'));
            modal.hide();

            // Clear selection
            this.clearSelection();

            // Reload leads
            await this.loadLeads();

            // Show success message
            this.showToast('Success', `Successfully assigned ${completed} lead(s)`, 'success');
        }
    },

    /**
     * Show bulk archive confirmation modal
     */
    showBulkArchiveModal() {
        const count = this.selectedLeadIds.size;
        if (count === 0) {
            alert('Please select at least one lead');
            return;
        }

        // Update count in modal
        document.getElementById('bulk-archive-count').textContent = count;

        // Reset modal state
        document.getElementById('bulk-archive-error').style.display = 'none';
        document.getElementById('bulk-archive-progress').style.display = 'none';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkArchiveModal'));
        modal.show();
    },

    /**
     * Execute bulk archive (soft delete)
     * Uses batch endpoint: DELETE /api/v1/lead/soft-delete with {leads_ids: [array]}
     * Archives leads by setting deleted_at timestamp and is_active=false
     *
     * TODO: Add 'View Archived Leads' and restore functionality in admin section
     * - Admin can view archived leads
     * - Admin can restore using POST /api/v1/lead/restore with {leads_ids: [array]}
     */
    async executeBulkArchive() {
        const confirmBtn = document.getElementById('bulk-archive-confirm-btn');
        const errorDiv = document.getElementById('bulk-archive-error');
        const progressDiv = document.getElementById('bulk-archive-progress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = document.getElementById('bulk-archive-progress-text');

        // Hide error, show progress
        errorDiv.style.display = 'none';
        progressDiv.style.display = 'block';
        confirmBtn.disabled = true;

        const leadIds = Array.from(this.selectedLeadIds);
        const total = leadIds.length;

        console.log(`Starting bulk archive for ${total} leads`);

        try {
            // Call batch soft delete endpoint
            // Backend expects: [1, 2, 3] (plain array, not object)
            // FastAPI parameter: leads_ids: list[int] = Body(...)
            const response = await API.delete(Config.ENDPOINTS.LEAD.BATCH_SOFT_DELETE, leadIds);

            console.log('Bulk archive response:', response);

            // Update progress to 100%
            progressBar.style.width = '100%';
            progressText.textContent = `${total}/${total}`;

            // Success - close modal and refresh
            setTimeout(() => {
                progressDiv.style.display = 'none';
                confirmBtn.disabled = false;

                const modal = bootstrap.Modal.getInstance(document.getElementById('bulkArchiveModal'));
                modal.hide();

                // Clear selection
                this.clearSelection();

                // Reload leads (archived leads won't show in main list)
                this.loadLeads();

                // Show success message
                this.showToast('Success', `Successfully archived ${total} lead(s)`, 'success');
            }, 500);

        } catch (error) {
            console.error('Failed to archive leads:', error);

            progressDiv.style.display = 'none';
            confirmBtn.disabled = false;

            errorDiv.textContent = `Failed to archive leads: ${error.message || 'Unknown error'}`;
            errorDiv.style.display = 'block';
        }
    },

    /**
     * ============================================================================
     * ARCHIVED LEADS & RESTORE
     * ============================================================================
     * TODO: Add role-based permission check - only SuperAdmin/Admin (roles 1,2)
     * should be able to access archived leads view and restore functionality
     */

    /**
     * Toggle between showing all leads (including archived) vs active only
     */
    async toggleArchivedView() {
        const toggleCheckbox = document.getElementById('show-archived-toggle');

        // Update filters based on checkbox state
        this.filters.deleted = toggleCheckbox.checked;
        this.showingArchived = toggleCheckbox.checked;

        // Update bulk actions visibility
        if (this.showingArchived) {
            // Show archived actions, hide active actions
            document.querySelectorAll('.active-only-action').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.archived-only-action').forEach(el => el.style.display = 'block');
        } else {
            // Show active actions, hide archived actions
            document.querySelectorAll('.active-only-action').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.archived-only-action').forEach(el => el.style.display = 'none');
        }

        // Reload leads with updated filter
        await this.loadLeads();

        // Clear selection when switching views
        this.clearSelection();
    },

    /**
     * Load archived leads from API
     * Endpoint: GET /api/v1/lead/archived
     */
    async loadArchivedLeads() {
        try {
            console.log('Loading archived leads...');

            const response = await API.get(Config.ENDPOINTS.LEAD.ARCHIVED);
            const archivedLeads = response.records || [];

            console.log(`Loaded ${archivedLeads.length} archived leads`);

            // Store in allLeads for table rendering
            this.allLeads = archivedLeads;

            // Reset to first page
            this.currentPage = 1;

            // Populate table with archived leads
            if (archivedLeads.length === 0) {
                this.showEmptyState('No archived leads found');
            } else {
                this.populateTable(archivedLeads);
            }

        } catch (error) {
            console.error('Failed to load archived leads:', error);
            this.showToast('Error', 'Failed to load archived leads', 'error');
        }
    },

    /**
     * Show restore confirmation modal for single lead
     */
    showRestoreConfirmation(leadId) {
        console.log('=== SHOW RESTORE CONFIRMATION ===');
        console.log('Lead ID:', leadId);

        // Find lead in allLeads array
        const lead = this.allLeads.find(l => l.id === leadId);
        if (!lead) {
            console.error('Lead not found:', leadId);
            return;
        }

        // Store lead info for restoration
        this.leadToRestore = {
            id: leadId,
            name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown Lead'
        };

        console.log('Lead to restore:', this.leadToRestore);

        // Update modal content
        document.getElementById('restore-lead-name').textContent = this.leadToRestore.name;
        document.getElementById('restore-lead-error').style.display = 'none';

        // Initialize and show modal
        if (!this.restoreModal) {
            this.restoreModal = new bootstrap.Modal(document.getElementById('restoreLeadModal'));
        }
        this.restoreModal.show();
    },

    /**
     * Restore single lead
     * Endpoint: POST /api/v1/lead/restore with [leadId]
     */
    async restoreLead() {
        if (!this.leadToRestore) {
            console.error('No lead selected for restoration');
            return;
        }

        console.log('=== RESTORE LEAD STARTED ===');
        console.log('Restoring lead:', this.leadToRestore);

        const confirmBtn = document.getElementById('restore-confirm-btn');
        const cancelBtn = document.getElementById('restore-cancel-btn');
        const errorDiv = document.getElementById('restore-lead-error');

        // Hide error message
        errorDiv.style.display = 'none';

        // Show loading state
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Restoring...';
        }
        if (cancelBtn) {
            cancelBtn.disabled = true;
        }

        try {
            // Use restore endpoint with single lead ID
            // Backend expects: [leadId] (plain array)
            const response = await API.post(Config.ENDPOINTS.LEAD.BATCH_RESTORE, [this.leadToRestore.id]);
            console.log('Lead restored successfully:', response);

            // Close modal
            this.restoreModal.hide();

            // Show success toast
            this.showSuccessToast(`Lead "${this.leadToRestore.name}" restored successfully`);

            // Clear leadToRestore
            this.leadToRestore = null;

            // Reload leads to update counter and table
            await this.loadLeads();

            console.log('=== RESTORE LEAD COMPLETED ===');

        } catch (error) {
            console.error('Failed to restore lead:', error);

            // Show error in modal
            errorDiv.textContent = error.message || 'Failed to restore lead. Please try again.';
            errorDiv.style.display = 'block';

        } finally {
            // Reset button states
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-undo me-1"></i>Restore';
            }
            if (cancelBtn) {
                cancelBtn.disabled = false;
            }
        }
    },

    /**
     * Show bulk restore confirmation modal
     */
    showBulkRestoreModal() {
        const count = this.selectedLeadIds.size;
        if (count === 0) {
            alert('Please select at least one lead to restore');
            return;
        }

        // Update count in modal
        document.getElementById('bulk-restore-count').textContent = count;

        // Reset modal state
        document.getElementById('bulk-restore-error').style.display = 'none';
        document.getElementById('bulk-restore-progress').style.display = 'none';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkRestoreModal'));
        modal.show();
    },

    /**
     * Execute bulk restore
     * Endpoint: POST /api/v1/lead/restore with [leadId1, leadId2, ...]
     */
    async executeBulkRestore() {
        const confirmBtn = document.getElementById('bulk-restore-confirm-btn');
        const errorDiv = document.getElementById('bulk-restore-error');
        const progressDiv = document.getElementById('bulk-restore-progress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const progressText = document.getElementById('bulk-restore-progress-text');

        // Hide error, show progress
        errorDiv.style.display = 'none';
        progressDiv.style.display = 'block';
        confirmBtn.disabled = true;

        const leadIds = Array.from(this.selectedLeadIds);
        const total = leadIds.length;

        console.log(`Starting bulk restore for ${total} leads`);

        try {
            // Call batch restore endpoint
            // Backend expects: [1, 2, 3] (plain array)
            const response = await API.post(Config.ENDPOINTS.LEAD.BATCH_RESTORE, leadIds);

            console.log('Bulk restore response:', response);

            // Update progress to 100%
            progressBar.style.width = '100%';
            progressText.textContent = `${total}/${total}`;

            // Success - close modal and refresh
            setTimeout(() => {
                progressDiv.style.display = 'none';
                confirmBtn.disabled = false;

                const modal = bootstrap.Modal.getInstance(document.getElementById('bulkRestoreModal'));
                modal.hide();

                // Clear selection
                this.clearSelection();

                // Reload archived leads (restored leads won't show)
                this.loadArchivedLeads();

                // Show success message
                this.showToast('Success', `Successfully restored ${total} lead(s)`, 'success');
            }, 500);

        } catch (error) {
            console.error('Failed to restore leads:', error);

            progressDiv.style.display = 'none';
            confirmBtn.disabled = false;

            errorDiv.textContent = `Failed to restore leads: ${error.message || 'Unknown error'}`;
            errorDiv.style.display = 'block';
        }
    },

    /**
     * Setup event listeners for lead actions
     */
    setupEventListeners() {
        // Delegate click events for dynamically created buttons
        document.addEventListener('click', (e) => {
            // View button
            if (e.target.closest('.view-lead-btn')) {
                const button = e.target.closest('.view-lead-btn');
                const leadId = button.getAttribute('data-lead-id');
                if (leadId) {
                    this.showLeadModal(leadId);
                }
            }

            // Edit button - opens modal on Edit tab
            if (e.target.closest('.edit-lead-btn')) {
                const button = e.target.closest('.edit-lead-btn');
                const leadId = button.getAttribute('data-lead-id');
                if (leadId) {
                    this.showLeadModal(leadId, 'edit');
                }
            }

            // Archive button (replaces delete)
            // Archives lead using soft delete - can be restored by admin
            if (e.target.closest('.archive-lead-btn')) {
                const button = e.target.closest('.archive-lead-btn');
                const leadId = parseInt(button.getAttribute('data-lead-id'));
                console.log('Archive lead clicked:', leadId);
                this.showArchiveConfirmation(leadId);
            }

            // Restore button (for archived leads)
            if (e.target.closest('.restore-lead-btn')) {
                const button = e.target.closest('.restore-lead-btn');
                const leadId = parseInt(button.getAttribute('data-lead-id'));
                console.log('Restore lead clicked:', leadId);
                this.showRestoreConfirmation(leadId);
            }
        });

        // Table header sorting
        document.querySelectorAll('#leadsTable thead th').forEach((th, index) => {
            // Skip checkbox and actions columns
            if (index === 0 || index === 9) return;

            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                const columnMap = {
                    1: 'id',
                    2: 'name',
                    3: 'email',
                    4: 'phone',
                    5: 'status',
                    6: 'source',
                    7: 'score',
                    8: 'assigned_to'
                };

                const column = columnMap[index];
                if (column) {
                    this.sortTable(column);
                }
            });
        });
    },

    /**
     * Sort table by column
     * @param {string} column - Column name to sort by
     */
    sortTable(column) {
        // Toggle direction if same column, otherwise default to asc
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        console.log(`Sorting by ${column} ${this.sortDirection}`);

        // Sort allLeads array
        this.allLeads.sort((a, b) => {
            let aVal, bVal;

            switch (column) {
                case 'id':
                    aVal = a.id || 0;
                    bVal = b.id || 0;
                    break;
                case 'name':
                    aVal = this.getLeadName(a).toLowerCase();
                    bVal = this.getLeadName(b).toLowerCase();
                    break;
                case 'email':
                    aVal = (a.email || '').toLowerCase();
                    bVal = (b.email || '').toLowerCase();
                    break;
                case 'phone':
                    aVal = (a.phone || '').toLowerCase();
                    bVal = (b.phone || '').toLowerCase();
                    break;
                case 'status':
                    // getStatus returns an object {name, slug}, we need the name property
                    aVal = (this.getStatus(a).name || '').toLowerCase();
                    bVal = (this.getStatus(b).name || '').toLowerCase();
                    break;
                case 'source':
                    aVal = this.getSource(a).toLowerCase();
                    bVal = this.getSource(b).toLowerCase();
                    break;
                case 'score':
                    aVal = a.score || 0;
                    bVal = b.score || 0;
                    break;
                case 'assigned_to':
                    aVal = this.getAssignedUser(a).toLowerCase();
                    bVal = this.getAssignedUser(b).toLowerCase();
                    break;
                default:
                    return 0;
            }

            // Compare values
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Re-render table
        this.populateTable(this.allLeads);

        // Update sort indicators
        this.updateSortIndicators();
    },

    /**
     * Update sort indicators in table headers
     */
    updateSortIndicators() {
        // Remove all existing sort indicators
        document.querySelectorAll('#leadsTable thead th i.fa-sort, #leadsTable thead th i.fa-sort-up, #leadsTable thead th i.fa-sort-down').forEach(icon => {
            icon.className = 'fas fa-sort ms-1';
        });

        // Add indicator to active column
        if (this.sortColumn) {
            const columnMap = {
                'id': 1,
                'name': 2,
                'email': 3,
                'phone': 4,
                'status': 5,
                'source': 6,
                'score': 7,
                'assigned_to': 8
            };

            const columnIndex = columnMap[this.sortColumn];
            if (columnIndex) {
                const th = document.querySelector(`#leadsTable thead th:nth-child(${columnIndex + 1})`);
                if (th) {
                    const icon = th.querySelector('i.fa-sort');
                    if (icon) {
                        icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} ms-1`;
                    }
                }
            }
        }
    },

    /**
     * Handle inline status change from table
     * Called when user clicks Save button after selecting a new status
     *
     * Process:
     * 1. Show loading state (disable controls, reduce opacity)
     * 2. Fetch full lead data (CRITICAL: PUT endpoint requires ALL fields)
     * 3. Update only status_id field, keeping all other data intact
     * 4. Send complete lead object to PUT endpoint
     * 5. Update local data (allLeads array) with new status
     * 6. Update badge in view mode with new status color/text
     * 7. Show success feedback (green row flash) and return to view mode
     * 8. On error: Show red flash, revert dropdown, show alert
     *
     * @param {string|number} leadId - Lead ID
     * @param {number} oldStatusId - Previous status ID (for revert on error)
     * @param {number} newStatusId - New status ID selected by user
     * @param {HTMLElement} container - Status container element
     */
    async handleInlineStatusChange(leadId, oldStatusId, newStatusId, container) {
        // Validation: ensure we have required data
        if (!leadId || !newStatusId || oldStatusId === newStatusId) {
            return;
        }

        console.log('=== INLINE STATUS CHANGE ===');
        console.log('Lead ID:', leadId);
        console.log('Old Status:', oldStatusId);
        console.log('New Status:', newStatusId);

        // Get DOM elements from container
        const viewMode = container.querySelector('.status-view-mode');
        const editMode = container.querySelector('.status-edit-mode');
        const dropdown = container.querySelector('.inline-status-dropdown');
        const saveBtn = container.querySelector('.save-status-btn');
        const cancelBtn = container.querySelector('.cancel-status-btn');

        // Find the table row for visual feedback
        const row = container.closest('tr');
        if (!row) {
            console.error('Could not find table row');
            return;
        }

        try {
            // === SHOW LOADING STATE ===
            // Disable all controls to prevent double-clicks
            dropdown.disabled = true;
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            // Reduce opacity to indicate loading
            editMode.style.opacity = '0.6';
            row.style.opacity = '0.7';

            // === FETCH CURRENT LEAD DATA ===
            // CRITICAL: The PUT /lead/{id} endpoint requires ALL lead fields
            // We can't just send {status_id: X}, we must send the complete lead object
            console.log('Fetching current lead data...');
            const leadResponse = await API.get(`${Config.ENDPOINTS.LEAD.READ}${leadId}`);
            const currentLead = leadResponse.records && leadResponse.records[0] ? leadResponse.records[0] : leadResponse;

            if (!currentLead) {
                throw new Error('Lead not found');
            }

            console.log('Current lead data:', currentLead);

            // === UPDATE ONLY STATUS_ID ===
            // Spread all existing fields, then override only status_id
            const updatedLead = {
                ...currentLead,
                status_id: newStatusId
            };

            console.log('Sending updated lead:', updatedLead);

            // === CALL API TO UPDATE LEAD ===
            const response = await API.put(`${Config.ENDPOINTS.LEAD.UPDATE}${leadId}`, updatedLead);
            console.log('Status updated successfully:', response);

            // === UPDATE LOCAL DATA ===
            // Get the new status object from cached statuses
            const newStatus = this.availableStatuses.find(s => s.id === newStatusId) || { id: newStatusId, name: 'Unknown' };

            // Update the lead in allLeads array (for consistency)
            const leadIndex = this.allLeads.findIndex(l => l.id == leadId);
            if (leadIndex !== -1) {
                this.allLeads[leadIndex] = {
                    ...this.allLeads[leadIndex],
                    status_id: newStatusId,
                    status: newStatus
                };
            }

            // === UPDATE VIEW MODE BADGE ===
            // Replace badge classes and text with new status
            const statusBadge = viewMode.querySelector('.badge');
            if (statusBadge) {
                const newBadgeHTML = this.createStatusBadge(newStatus);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newBadgeHTML;
                const newBadge = tempDiv.querySelector('.badge');
                if (newBadge) {
                    // Update badge class (for color) and text
                    statusBadge.className = newBadge.className;
                    statusBadge.textContent = newBadge.textContent;
                }
            }

            // Update data attribute for future edits
            container.setAttribute('data-current-status', newStatusId);

            // === SHOW SUCCESS FEEDBACK ===
            // Flash row background green to indicate success
            row.style.transition = 'background-color 0.3s';
            row.style.backgroundColor = '#d4edda'; // Light green
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 1000);

            // Exit edit mode and return to view mode
            editMode.style.display = 'none';
            viewMode.style.display = 'block';

            console.log('Status change completed successfully');

        } catch (error) {
            console.error('Failed to update status:', error);

            // === REVERT ON ERROR ===
            // Revert dropdown to original status
            dropdown.value = oldStatusId;

            // === SHOW ERROR FEEDBACK ===
            // Flash row background red to indicate error
            row.style.transition = 'background-color 0.3s';
            row.style.backgroundColor = '#f8d7da'; // Light red
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 2000);

            // Show error message to user
            alert(`Failed to update status: ${error.message || 'Unknown error'}`);

        } finally {
            // === RESTORE UI STATE ===
            // Re-enable all controls
            dropdown.disabled = false;
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            // Restore full opacity
            editMode.style.opacity = '1';
            row.style.opacity = '1';
        }
    },

    /**
     * Handle inline assigned-to change from table
     * Called when user clicks Save button after selecting a new assigned user
     *
     * Process: Same as handleInlineStatusChange but for assigned_to_user_id field
     *
     * @param {string|number} leadId - Lead ID
     * @param {number|null} oldUserId - Previous assigned user ID (null if unassigned)
     * @param {number|null} newUserId - New assigned user ID (null if unassigning)
     * @param {HTMLElement} container - Assigned container element
     */
    async handleInlineAssignedChange(leadId, oldUserId, newUserId, container) {
        // Validation: ensure we have required data
        if (!leadId || oldUserId === newUserId) {
            return;
        }

        console.log('=== INLINE ASSIGNED CHANGE ===');
        console.log('Lead ID:', leadId);
        console.log('Old User:', oldUserId);
        console.log('New User:', newUserId);

        // Get DOM elements from container
        const viewMode = container.querySelector('.assigned-view-mode');
        const editMode = container.querySelector('.assigned-edit-mode');
        const dropdown = container.querySelector('.inline-assigned-dropdown');
        const saveBtn = container.querySelector('.save-assigned-btn');
        const cancelBtn = container.querySelector('.cancel-assigned-btn');
        const userNameSpan = viewMode.querySelector('.assigned-user-name');

        // Find the table row for visual feedback
        const row = container.closest('tr');
        if (!row) {
            console.error('Could not find table row');
            return;
        }

        try {
            // === SHOW LOADING STATE ===
            dropdown.disabled = true;
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            editMode.style.opacity = '0.6';
            row.style.opacity = '0.7';

            // === FETCH CURRENT LEAD DATA ===
            // CRITICAL: The PUT /lead/{id} endpoint requires ALL lead fields
            console.log('Fetching current lead data...');
            const leadResponse = await API.get(`${Config.ENDPOINTS.LEAD.READ}${leadId}`);
            const currentLead = leadResponse.records && leadResponse.records[0] ? leadResponse.records[0] : leadResponse;

            if (!currentLead) {
                throw new Error('Lead not found');
            }

            console.log('Current lead data:', currentLead);

            // === UPDATE ONLY ASSIGNED_TO_USER_ID ===
            const updatedLead = {
                ...currentLead,
                assigned_to_user_id: newUserId
            };

            console.log('Sending updated lead:', updatedLead);

            // === CALL API TO UPDATE LEAD ===
            const response = await API.put(`${Config.ENDPOINTS.LEAD.UPDATE}${leadId}`, updatedLead);
            console.log('Assignment updated successfully:', response);

            // === UPDATE LOCAL DATA ===
            // Get the new user object from cached users
            let newUserName = 'Unassigned';
            if (newUserId) {
                const newUser = this.availableUsers.find(u => u.id === newUserId);
                if (newUser) {
                    newUserName = newUser.full_name || newUser.username || newUser.email || `User ${newUser.id}`;
                }
            }

            // Update the lead in allLeads array
            const leadIndex = this.allLeads.findIndex(l => l.id == leadId);
            if (leadIndex !== -1) {
                this.allLeads[leadIndex] = {
                    ...this.allLeads[leadIndex],
                    assigned_to_user_id: newUserId,
                    assigned_user: newUserId ? { id: newUserId } : null
                };
            }

            // === UPDATE VIEW MODE NAME ===
            userNameSpan.textContent = newUserName;

            // Update data attribute for future edits
            container.setAttribute('data-current-user', newUserId || '');

            // === SHOW SUCCESS FEEDBACK ===
            row.style.transition = 'background-color 0.3s';
            row.style.backgroundColor = '#d4edda'; // Light green
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 1000);

            // Exit edit mode and return to view mode
            editMode.style.display = 'none';
            viewMode.style.display = 'block';

            console.log('Assignment change completed successfully');

        } catch (error) {
            console.error('Failed to update assignment:', error);

            // === REVERT ON ERROR ===
            dropdown.value = oldUserId || '';

            // === SHOW ERROR FEEDBACK ===
            row.style.transition = 'background-color 0.3s';
            row.style.backgroundColor = '#f8d7da'; // Light red
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 2000);

            alert(`Failed to update assignment: ${error.message || 'Unknown error'}`);

        } finally {
            // === RESTORE UI STATE ===
            dropdown.disabled = false;
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            editMode.style.opacity = '1';
            row.style.opacity = '1';
        }
    },

    /**
     * Setup checkbox change handlers for bulk actions
     * Called after each table render to wire up checkbox selection
     */
    setupCheckboxHandlers() {
        document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const leadId = e.target.getAttribute('data-lead-id');
                const isChecked = e.target.checked;
                this.handleLeadCheckboxChange(leadId, isChecked);
            });
        });
    },

    /**
     * Setup contact action handlers (phone icons, email links)
     * Called after each table render to wire up click handlers for:
     * - Phone call icon → opens modal to Messages tab
     * - SMS icon → opens modal to Messages tab
     * - Email link → opens modal to Email tab
     */
    setupContactActionHandlers() {
        // === PHONE CALL ICONS ===
        document.querySelectorAll('.phone-call-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                const leadId = icon.getAttribute('data-lead-id');
                if (leadId) {
                    console.log('Opening modal for call logging, Lead ID:', leadId);
                    this.showLeadModal(leadId, 'messages'); // Open to Messages tab
                }
            });
        });

        // === SMS ICONS ===
        document.querySelectorAll('.phone-sms-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                const leadId = icon.getAttribute('data-lead-id');
                if (leadId) {
                    console.log('Opening modal for SMS, Lead ID:', leadId);
                    this.showLeadModal(leadId, 'messages'); // Open to Messages tab
                }
            });
        });

        // === EMAIL LINKS ===
        document.querySelectorAll('.email-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const leadId = link.getAttribute('data-lead-id');
                if (leadId) {
                    console.log('Opening modal for email, Lead ID:', leadId);
                    this.showLeadModal(leadId, 'email'); // Open to Email tab
                }
            });
        });
    },

    /**
     * Show archive confirmation modal for a lead
     * @param {number} leadId - ID of lead to archive
     */
    showArchiveConfirmation(leadId) {
        console.log('=== SHOW ARCHIVE CONFIRMATION ===');
        console.log('Lead ID:', leadId);

        // Find lead in allLeads array
        const lead = this.allLeads.find(l => l.id === leadId);
        if (!lead) {
            console.error('Lead not found:', leadId);
            return;
        }

        // Store lead info for archiving
        this.leadToDelete = {
            id: leadId,
            name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown Lead'
        };

        console.log('Lead to archive:', this.leadToDelete);

        // Update modal content
        document.getElementById('delete-lead-name').textContent = this.leadToDelete.name;
        document.getElementById('delete-lead-error').style.display = 'none';

        // Initialize and show modal
        if (!this.deleteModal) {
            this.deleteModal = new bootstrap.Modal(document.getElementById('deleteLeadModal'));
        }
        this.deleteModal.show();
    },

    /**
     * Archive lead (soft delete)
     * Called when user confirms archiving
     *
     * ENDPOINT: DELETE /api/v1/lead/soft-delete with {leads_ids: [id]}
     * Sets deleted_at timestamp and is_active=false
     * Can be restored by admin using POST /api/v1/lead/restore
     *
     * TODO: Add 'View Archived Leads' and restore functionality in admin section
     */
    async deleteLead() {
        if (!this.leadToDelete) {
            console.error('No lead selected for archiving');
            return;
        }

        console.log('=== ARCHIVE LEAD STARTED ===');
        console.log('Archiving lead:', this.leadToDelete);

        const confirmBtn = document.getElementById('delete-confirm-btn');
        const cancelBtn = document.getElementById('delete-cancel-btn');
        const errorDiv = document.getElementById('delete-lead-error');

        // Hide error message
        errorDiv.style.display = 'none';

        // Show loading state
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Archiving...';
        }
        if (cancelBtn) {
            cancelBtn.disabled = true;
        }

        try {
            // Use batch soft delete endpoint with single lead ID
            // Backend expects: [leadId] (plain array, not object)
            // FastAPI parameter: leads_ids: list[int] = Body(...)
            const response = await API.delete(Config.ENDPOINTS.LEAD.BATCH_SOFT_DELETE, [this.leadToDelete.id]);
            console.log('Lead archived successfully:', response);

            // Close modal
            this.deleteModal.hide();

            // Show success toast
            this.showSuccessToast(`Lead "${this.leadToDelete.name}" archived successfully`);

            // Clear leadToDelete
            this.leadToDelete = null;

            // Reload leads to update counter and table
            await this.loadLeads();

            console.log('=== ARCHIVE LEAD COMPLETED ===');

        } catch (error) {
            console.error('Failed to archive lead:', error);

            // Show error in modal
            errorDiv.textContent = error.message || 'Failed to archive lead. Please try again.';
            errorDiv.style.display = 'block';

            // Keep modal open for retry

        } finally {
            // Reset button states
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '<i class="fas fa-archive me-1"></i>Archive';
            }
            if (cancelBtn) {
                cancelBtn.disabled = false;
            }
        }
    },

    /**
     * Show success toast notification
     * @param {string} message - Success message to display
     */
    showSuccessToast(message) {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-check-circle me-2"></i>${this.escapeHtml(message)}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // Show toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 3000
        });
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
};

// Initialize leads when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Display logged-in user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        // Try stored user first
        let user = Auth.getUser();
        let displayName = null;

        if (user && user.full_name) {
            displayName = user.full_name;
        } else if (user && user.username) {
            displayName = user.username;
        }

        // If no stored user, decode JWT token
        if (!displayName) {
            const token = Auth.getToken();
            if (token) {
                const payload = Auth.decodeJWT(token);
                if (payload) {
                    // JWT may have: sub (subject/username), email, user_id, name, etc.
                    displayName = payload.name || payload.username || payload.sub || payload.email;
                }
            }
        }

        userNameElement.textContent = displayName || 'User';
    }

    // Initialize centralized form validator
    LeadsPage.formValidator = new FormValidator();

    // Initialize filters first
    await LeadsPage.initializeFilters();

    // Initialize Add Lead modal dropdowns (must be before validation setup)
    await LeadsPage.initializeAddLeadModal();

    // Setup real-time validation for Create Lead modal (AFTER dropdowns are initialized)
    // Wait a bit for dropdowns to fully render in DOM
    setTimeout(() => {
        LeadsPage.setupCreateLeadValidation();
    }, 100);

    // Clear validation when Add Lead modal is opened
    const addLeadModal = document.getElementById('addLeadModal');
    if (addLeadModal) {
        addLeadModal.addEventListener('shown.bs.modal', () => {
            // Clear validation state when modal opens
            if (LeadsPage.formValidator) {
                LeadsPage.formValidator.clearValidation('add-lead-form');
            }
        });
    }

    // Load statuses and users for inline editing (before loading leads)
    await LeadsPage.loadStatusesForInlineEdit();
    await LeadsPage.loadUsersForInlineEdit();

    // Then load leads
    await LeadsPage.loadLeads();

    // Setup event listeners
    LeadsPage.setupEventListeners();

    // Wire up Create Lead button
    const createLeadBtn = document.getElementById('create-lead-btn');
    if (createLeadBtn) {
        createLeadBtn.addEventListener('click', () => {
            LeadsPage.createLead();
        });
    }

    // Wire up Delete Confirm button
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', () => {
            LeadsPage.deleteLead();
        });
    }

    // Wire up records per page selector
    const recordsPerPageSelect = document.getElementById('records-per-page');
    if (recordsPerPageSelect) {
        recordsPerPageSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            LeadsPage.pageSize = value === 'all' ? 'all' : parseInt(value);

            // Reset to page 1 when changing page size
            LeadsPage.currentPage = 1;

            // Re-populate table with new page size (populateTable clears automatically)
            LeadsPage.populateTable(LeadsPage.allLeads);
        });
    }

    // Initialize bulk action dropdowns
    LeadsPage.initializeBulkStatusDropdown();
    LeadsPage.initializeBulkAssignDropdown();
});