# LeadsEngine Components Guide

**Last Updated:** 2025-10-01

This document provides a comprehensive guide to all reusable components in the LeadsEngine frontend, including usage examples, API references, and implementation details.

---

## Table of Contents

- [Overview](#overview)
- [Component Pattern](#component-pattern)
- [Status Dropdown](#status-dropdown)
- [Source Dropdown](#source-dropdown)
- [User Dropdown](#user-dropdown)
- [Creating New Components](#creating-new-components)
- [Best Practices](#best-practices)

---

## Overview

LeadsEngine uses **factory function components** for reusable UI elements. These components:

- Fetch their own data from the API
- Manage their own state
- Provide a clean public API
- Support multiple instances on the same page
- Handle their own lifecycle (init/destroy)

All components follow the same pattern and conventions.

---

## Component Pattern

### Standard Component Structure

```javascript
/**
 * Component documentation
 * @param {string} selector - CSS selector for container
 * @param {object} options - Configuration options
 * @returns {object} Public API
 */
function createComponentName(selector, options = {}) {
    // 1. Private state
    const container = $(selector);
    let data = null;
    let selectedValue = options.initialValue || null;
    let selectElement = null;

    // 2. Configuration with defaults
    const config = {
        initialValue: options.initialValue || null,
        onChange: options.onChange || null,
        includeEmpty: options.includeEmpty !== undefined ? options.includeEmpty : true,
        emptyText: options.emptyText || '-- Select --',
        className: options.className || 'form-select',
        disabled: options.disabled || false
    };

    // 3. Private methods
    async function fetchData() { /* ... */ }
    function render() { /* ... */ }
    function escapeHtml(text) { /* ... */ }

    // 4. Public API
    return {
        async init() {
            await fetchData();
            render();
            if (config.initialValue) {
                setValue(config.initialValue);
            }
        },
        getValue() { return selectedValue; },
        setValue(value) { selectedValue = value; },
        refresh() { return init(); },
        enable() { /* ... */ },
        disable() { /* ... */ },
        destroy() { /* cleanup */ }
    };
}
```

### Lifecycle

```
1. Create instance:     const dropdown = createComponentName('#container', options);
2. Initialize:          await dropdown.init();
3. Use:                 const value = dropdown.getValue();
4. Update:              dropdown.setValue(newValue);
5. Refresh:             await dropdown.refresh();
6. Destroy:             dropdown.destroy();
```

---

## Status Dropdown

Select lead status (New, Contacted, Qualified, etc.)

### File Location
`assets/js/components/status-dropdown.js`

### API Endpoint
`GET /api/v1/leadstatus/`

### Usage

```javascript
// Basic usage
const statusDropdown = createStatusDropdown('#statusContainer');
await statusDropdown.init();

// With options
const statusDropdown = createStatusDropdown('#statusContainer', {
    initialValue: 2,                    // Pre-select status ID 2
    onChange: (id, name) => {           // Callback on change
        console.log('Status changed to:', name);
    },
    includeEmpty: true,                 // Include "-- Select --" option
    emptyText: '-- Choose Status --',   // Custom empty text
    className: 'form-select form-select-sm',  // Custom CSS classes
    disabled: false                     // Initial disabled state
});
await statusDropdown.init();

// Get selected value
const statusId = statusDropdown.getValue();  // Returns: number | null

// Get selected name
const statusName = statusDropdown.getName();  // Returns: string | null

// Set value programmatically
statusDropdown.setValue(3);

// Get full status object
const status = statusDropdown.getStatusById(2);
// Returns: {id: 2, name: "Contacted", color: "#4CAF50", is_active: true, ...}

// Get all statuses
const allStatuses = statusDropdown.getAllStatuses();
// Returns: [{id: 1, name: "New", ...}, {id: 2, name: "Contacted", ...}, ...]

// Refresh data from API
await statusDropdown.refresh();

// Enable/disable
statusDropdown.disable();
statusDropdown.enable();

// Clean up
statusDropdown.destroy();
```

### Public API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `init()` | - | `Promise<boolean>` | Fetch data and render dropdown |
| `getValue()` | - | `number \| null` | Get selected status ID |
| `setValue(id)` | `number` | `void` | Set selected status |
| `getName()` | - | `string \| null` | Get selected status name |
| `getStatusById(id)` | `number` | `object \| null` | Get full status object |
| `getAllStatuses()` | - | `array` | Get all status objects |
| `refresh()` | - | `Promise<boolean>` | Re-fetch and re-render |
| `enable()` | - | `void` | Enable dropdown |
| `disable()` | - | `void` | Disable dropdown |
| `destroy()` | - | `void` | Clean up event handlers |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialValue` | `number \| null` | `null` | Pre-selected status ID |
| `onChange` | `function \| null` | `null` | Callback: `(id, name) => {}` |
| `includeEmpty` | `boolean` | `true` | Show empty option |
| `emptyText` | `string` | `'-- Select Status --'` | Empty option text |
| `className` | `string` | `'form-select'` | CSS classes |
| `disabled` | `boolean` | `false` | Initial disabled state |

### Example: Lead Edit Form

```javascript
// In lead detail modal, Edit tab
async wireEditTab(leadData) {
    // Create dropdown
    const statusDropdown = createStatusDropdown('#edit-status-dropdown', {
        initialValue: leadData.status_id,
        onChange: (id, name) => {
            console.log(`Status changed to: ${name} (ID: ${id})`);
            // Mark form as dirty, enable save button, etc.
        }
    });

    // Initialize
    await statusDropdown.init();

    // Store reference for later use
    this.editDropdowns = {
        status: statusDropdown
    };

    // On save, get value
    const payload = {
        status_id: statusDropdown.getValue()
    };
}
```

### Data Structure

**API Response:**
```javascript
{
  total_count: 5,
  records: [
    {
      id: 1,
      name: "New",
      color: "#2196F3",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    // ...
  ]
}
```

**Internal State:**
```javascript
statuses = [
  {id: 1, name: "New", color: "#2196F3", is_active: true, ...},
  {id: 2, name: "Contacted", color: "#4CAF50", is_active: true, ...}
];
statusMap = {
  1: "New",
  2: "Contacted",
  3: "Qualified"
};
selectedId = 2;
```

---

## Source Dropdown

Select lead source (Website, Referral, Google Ads, etc.)

### File Location
`assets/js/components/source-dropdown.js`

### API Endpoint
`GET /api/v1/leadsource/`

### Usage

```javascript
// Basic usage
const sourceDropdown = createSourceDropdown('#sourceContainer');
await sourceDropdown.init();

// With options
const sourceDropdown = createSourceDropdown('#sourceContainer', {
    initialValue: 3,                    // Pre-select source ID 3
    onChange: (id, name) => {           // Callback on change
        console.log('Source changed to:', name);
    },
    includeEmpty: true,
    emptyText: '-- Choose Source --',
    className: 'form-select',
    disabled: false
});
await sourceDropdown.init();

// Get selected value
const sourceId = sourceDropdown.getValue();  // Returns: number | null

// Get selected name
const sourceName = sourceDropdown.getName();  // Returns: string | null

// Set value programmatically
sourceDropdown.setValue(1);

// Get full source object
const source = sourceDropdown.getSourceById(3);
// Returns: {id: 3, name: "Google Ads", is_active: true, ...}

// Get all sources
const allSources = sourceDropdown.getAllSources();

// Refresh, enable, disable, destroy
await sourceDropdown.refresh();
sourceDropdown.disable();
sourceDropdown.enable();
sourceDropdown.destroy();
```

### Public API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `init()` | - | `Promise<boolean>` | Fetch data and render dropdown |
| `getValue()` | - | `number \| null` | Get selected source ID |
| `setValue(id)` | `number` | `void` | Set selected source |
| `getName()` | - | `string \| null` | Get selected source name |
| `getSourceById(id)` | `number` | `object \| null` | Get full source object |
| `getAllSources()` | - | `array` | Get all source objects |
| `refresh()` | - | `Promise<boolean>` | Re-fetch and re-render |
| `enable()` | - | `void` | Enable dropdown |
| `disable()` | - | `void` | Disable dropdown |
| `destroy()` | - | `void` | Clean up event handlers |

### Options

Same as Status Dropdown, with adjusted defaults:

| Option | Type | Default |
|--------|------|---------|
| `emptyText` | `string` | `'-- Select Source --'` |

### Example: Lead Filter

```javascript
// In lead list page, filter bar
const sourceFilter = createSourceDropdown('#sourceFilter', {
    includeEmpty: true,
    emptyText: 'All Sources',
    onChange: async (id, name) => {
        // Reload leads with filter
        await LeadsPage.loadLeads(1, {
            source_id: id
        });
    }
});

await sourceFilter.init();
```

---

## User Dropdown

Select user for lead assignment

### File Location
`assets/js/components/user-dropdown.js`

### API Endpoint
`GET /api/v1/user/`

### Usage

```javascript
// Basic usage
const userDropdown = createUserDropdown('#userContainer');
await userDropdown.init();

// With options
const userDropdown = createUserDropdown('#userContainer', {
    initialValue: 1,                    // Pre-select user ID 1
    onChange: (id, name) => {           // Callback on change
        console.log('Assigned to:', name);
    },
    includeEmpty: true,
    emptyText: '-- Assign User --',
    className: 'form-select',
    disabled: false
});
await userDropdown.init();

// Get selected value
const userId = userDropdown.getValue();  // Returns: number | null

// Get selected name (critical for audit trails)
const userName = userDropdown.getName();  // Returns: string | null

// Set value programmatically
userDropdown.setValue(2);

// Get full user object
const user = userDropdown.getUserById(1);
// Returns: {id: 1, username: "jdoe", email: "john@example.com", full_name: "John Doe", ...}

// Get all users
const allUsers = userDropdown.getAllUsers();

// Refresh, enable, disable, destroy
await userDropdown.refresh();
userDropdown.disable();
userDropdown.enable();
userDropdown.destroy();
```

### Public API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `init()` | - | `Promise<boolean>` | Fetch data and render dropdown |
| `getValue()` | - | `number \| null` | Get selected user ID |
| `setValue(id)` | `number` | `void` | Set selected user |
| `getName()` | - | `string \| null` | Get selected user name (full_name, first+last, username, email, or ID) |
| `getUserById(id)` | `number` | `object \| null` | Get full user object |
| `getAllUsers()` | - | `array` | Get all user objects |
| `refresh()` | - | `Promise<boolean>` | Re-fetch and re-render |
| `enable()` | - | `void` | Enable dropdown |
| `disable()` | - | `void` | Disable dropdown |
| `destroy()` | - | `void` | Clean up event handlers |

### Options

Same as Status Dropdown, with adjusted defaults:

| Option | Type | Default |
|--------|------|---------|
| `emptyText` | `string` | `'-- Select User --'` |

### User Display Name Logic

The dropdown uses a fallback chain for display names:

```javascript
function getUserDisplayName(user) {
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.username) return user.username;
    if (user.email) return user.email;
    return `User #${user.id}`;
}
```

**Priority:**
1. `full_name` (computed field)
2. `first_name + last_name`
3. `first_name` only
4. `username`
5. `email`
6. `"User #" + id`

### Example: Lead Assignment

```javascript
// In lead edit form
const userDropdown = createUserDropdown('#edit-user-dropdown', {
    initialValue: leadData.assigned_to_user_id,
    onChange: (userId, userName) => {
        console.log(`Lead reassigned to: ${userName} (ID: ${userId})`);

        // Audit trail: Store both ID and name
        this.assignmentChange = {
            old_user_id: leadData.assigned_to_user_id,
            old_user_name: leadData.assigned_to_name,
            new_user_id: userId,
            new_user_name: userName,
            changed_at: new Date().toISOString()
        };
    }
});

await userDropdown.init();

// On save
const payload = {
    assigned_to_user_id: userDropdown.getValue()
};
```

---

## Creating New Components

### When to Create a Component

Create a reusable component when:
- ✅ Same UI pattern used in 2+ places
- ✅ Fetches its own data from API
- ✅ Has clear, well-defined public API
- ✅ Benefits from encapsulation

Don't create a component when:
- ❌ Used only once
- ❌ Tightly coupled to specific page
- ❌ No clear API boundary
- ❌ Simpler as inline code

### Component Template

```javascript
/**
 * ComponentName Component
 * Brief description of what this component does
 *
 * Usage:
 *   const component = createComponentName('#container', {
 *     option1: value1,
 *     onChange: (id, name) => { ... }
 *   });
 *   await component.init();
 *
 * @param {string} selector - CSS selector for container element
 * @param {object} options - Configuration options
 * @param {any} options.initialValue - Initial selected value
 * @param {function} options.onChange - Change callback (id, name) => {}
 * @param {boolean} options.includeEmpty - Include empty option
 * @param {string} options.emptyText - Text for empty option
 * @param {string} options.className - CSS classes
 * @param {boolean} options.disabled - Initial disabled state
 * @returns {object} Component public API
 */
function createComponentName(selector, options = {}) {
    // Private state
    const container = $(selector);
    let data = null;
    let selectedValue = options.initialValue || null;
    let selectElement = null;

    // Configuration with defaults
    const config = {
        initialValue: options.initialValue || null,
        onChange: options.onChange || null,
        includeEmpty: options.includeEmpty !== undefined ? options.includeEmpty : true,
        emptyText: options.emptyText || '-- Select --',
        className: options.className || 'form-select',
        disabled: options.disabled || false
    };

    /**
     * Initialize component - fetch data and render
     * @returns {Promise<boolean>} Success status
     */
    async function init() {
        try {
            // Fetch data from API
            const response = await API.get(Config.ENDPOINTS.YOUR_ENDPOINT);
            data = response.records || [];

            console.log('Component: Fetched data:', data);

            // Render UI
            render();

            // Set initial value
            if (config.initialValue !== null) {
                setValue(config.initialValue);
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize component:', error);
            renderError('Failed to load data');
            return false;
        }
    }

    /**
     * Render component HTML
     */
    function render() {
        if (!data || data.length === 0) {
            renderEmpty();
            return;
        }

        // Create select element with unique ID
        const selectId = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let html = `<select id="${selectId}" class="${config.className}" ${config.disabled ? 'disabled' : ''}>`;

        // Add empty option
        if (config.includeEmpty) {
            html += `<option value="">${config.emptyText}</option>`;
        }

        // Add data options
        data.forEach(item => {
            const selected = item.id === selectedValue ? 'selected' : '';
            html += `<option value="${item.id}" ${selected}>${escapeHtml(item.name)}</option>`;
        });

        html += '</select>';

        // Insert into container
        container.html(html);

        // Store reference
        selectElement = $(`#${selectId}`);

        // Attach change handler
        selectElement.on('change', function() {
            selectedValue = $(this).val() ? parseInt($(this).val()) : null;

            // Trigger onChange callback
            if (config.onChange && typeof config.onChange === 'function') {
                const name = getName();
                config.onChange(selectedValue, name);
            }
        });
    }

    /**
     * Render empty state
     */
    function renderEmpty() {
        container.html(`
            <select class="${config.className}" disabled>
                <option>No data available</option>
            </select>
        `);
    }

    /**
     * Render error state
     * @param {string} message - Error message
     */
    function renderError(message) {
        container.html(`
            <select class="${config.className}" disabled>
                <option>${escapeHtml(message)}</option>
            </select>
        `);
    }

    /**
     * Get selected value
     * @returns {number|null}
     */
    function getValue() {
        if (selectElement) {
            const val = selectElement.val();
            return val ? parseInt(val) : null;
        }
        return selectedValue;
    }

    /**
     * Set selected value
     * @param {number} id
     */
    function setValue(id) {
        selectedValue = id;
        if (selectElement) {
            selectElement.val(id);
        }
    }

    /**
     * Get selected name
     * @returns {string|null}
     */
    function getName() {
        const id = getValue();
        if (id === null) return null;

        const item = data.find(d => d.id === id);
        return item ? item.name : null;
    }

    /**
     * Refresh component - re-fetch and re-render
     * @returns {Promise<boolean>}
     */
    async function refresh() {
        return await init();
    }

    /**
     * Enable component
     */
    function enable() {
        if (selectElement) {
            selectElement.prop('disabled', false);
        }
        config.disabled = false;
    }

    /**
     * Disable component
     */
    function disable() {
        if (selectElement) {
            selectElement.prop('disabled', true);
        }
        config.disabled = true;
    }

    /**
     * Destroy component - clean up
     */
    function destroy() {
        if (selectElement) {
            selectElement.off('change');
            selectElement.remove();
        }
        container.empty();
        selectElement = null;
        data = null;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text
     * @returns {string}
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
        refresh,
        enable,
        disable,
        destroy
    };
}
```

### Testing New Components

```javascript
// Test in browser console
const testComponent = createComponentName('#test-container', {
    onChange: (id, name) => console.log('Changed:', id, name)
});

await testComponent.init();
console.log('Value:', testComponent.getValue());
console.log('Name:', testComponent.getName());

testComponent.setValue(2);
testComponent.disable();
testComponent.enable();
testComponent.destroy();
```

---

## Best Practices

### 1. Always Call init() After Creation

```javascript
// ❌ WRONG
const dropdown = createStatusDropdown('#container');
dropdown.setValue(1);  // No data loaded yet!

// ✅ CORRECT
const dropdown = createStatusDropdown('#container');
await dropdown.init();  // Load data first
dropdown.setValue(1);
```

### 2. Store References for Cleanup

```javascript
// Store references
this.editDropdowns = {
    status: statusDropdown,
    source: sourceDropdown,
    user: userDropdown
};

// Clean up when done
Object.values(this.editDropdowns).forEach(dropdown => {
    dropdown.destroy();
});
this.editDropdowns = {};
```

### 3. Use onChange for Side Effects

```javascript
const statusDropdown = createStatusDropdown('#status', {
    onChange: (id, name) => {
        // Mark form as dirty
        this.formDirty = true;

        // Enable save button
        $('#save-btn').prop('disabled', false);

        // Log change for audit
        this.changes.push({
            field: 'status',
            old_value: this.originalStatus,
            new_value: id,
            timestamp: new Date()
        });
    }
});
```

### 4. Parallel Initialization

```javascript
// ✅ GOOD: Initialize in parallel
const [status, source, user] = await Promise.all([
    statusDropdown.init(),
    sourceDropdown.init(),
    userDropdown.init()
]);

// ❌ SLOW: Sequential initialization
await statusDropdown.init();
await sourceDropdown.init();
await userDropdown.init();
```

### 5. Error Handling

```javascript
const dropdown = createStatusDropdown('#status');

try {
    const success = await dropdown.init();
    if (!success) {
        throw new Error('Failed to initialize dropdown');
    }
} catch (error) {
    console.error('Dropdown initialization failed:', error);
    showError('Failed to load statuses. Please refresh the page.');
}
```

### 6. Validation Before Save

```javascript
function validateForm() {
    const statusId = statusDropdown.getValue();
    const sourceId = sourceDropdown.getValue();
    const userId = userDropdown.getValue();

    if (!statusId) {
        showError('Please select a status');
        return false;
    }

    if (!sourceId) {
        showError('Please select a source');
        return false;
    }

    // User assignment is optional
    return true;
}
```

### 7. Preserve User Input on Error

```javascript
// Don't destroy dropdowns on save error
try {
    await saveLead(payload);
    // Success: clear form
    Object.values(editDropdowns).forEach(d => d.destroy());
} catch (error) {
    // Error: keep dropdowns, show error
    showError('Save failed. Please try again.');
    // User can fix and retry
}
```

---

## Common Patterns

### Pattern 1: Filter Dropdowns

```javascript
// Lead list page - filter by status and source
const statusFilter = createStatusDropdown('#filterStatus', {
    includeEmpty: true,
    emptyText: 'All Statuses',
    onChange: async () => await applyFilters()
});

const sourceFilter = createSourceDropdown('#filterSource', {
    includeEmpty: true,
    emptyText: 'All Sources',
    onChange: async () => await applyFilters()
});

await Promise.all([
    statusFilter.init(),
    sourceFilter.init()
]);

async function applyFilters() {
    const filters = {
        status_id: statusFilter.getValue(),
        source_id: sourceFilter.getValue()
    };
    await LeadsPage.loadLeads(1, filters);
}
```

### Pattern 2: Dependent Dropdowns

```javascript
// Source changes → reload campaigns for that source
const sourceDropdown = createSourceDropdown('#source', {
    onChange: async (sourceId) => {
        // Reload campaigns
        await campaignDropdown.refresh();
    }
});

const campaignDropdown = createCampaignDropdown('#campaign', {
    sourceId: () => sourceDropdown.getValue()  // Dynamic dependency
});
```

### Pattern 3: Bulk Edit

```javascript
// Apply same status to multiple leads
const bulkStatusDropdown = createStatusDropdown('#bulkStatus');
await bulkStatusDropdown.init();

$('#applyBulk').on('click', async () => {
    const statusId = bulkStatusDropdown.getValue();
    const selectedLeads = getSelectedLeads();

    for (const leadId of selectedLeads) {
        await API.put(`/api/v1/lead/${leadId}`, {
            status_id: statusId
        });
    }

    await reloadLeadList();
});
```

---

## Troubleshooting

### Dropdown Not Showing

**Symptom:** Container is empty after init()

**Causes:**
1. Container selector is wrong
2. API call failed
3. Response has no records
4. Container replaced after init

**Debug:**
```javascript
// Check container
console.log('Container:', $('#container').length);  // Should be 1

// Check API response
const dropdown = createStatusDropdown('#container');
await dropdown.init();
console.log('Data:', dropdown.getAllStatuses());  // Should be array

// Check for errors in console
```

### onChange Not Firing

**Symptom:** onChange callback not called when selection changes

**Causes:**
1. Callback not provided
2. Callback has syntax error
3. Select element replaced (listeners lost)

**Debug:**
```javascript
const dropdown = createStatusDropdown('#container', {
    onChange: (id, name) => {
        console.log('CHANGE FIRED:', id, name);
    }
});
```

### Value Not Persisting

**Symptom:** setValue() called but value resets

**Causes:**
1. setValue() called before init()
2. Component re-rendered
3. Form reset

**Debug:**
```javascript
await dropdown.init();
console.log('Before setValue:', dropdown.getValue());
dropdown.setValue(2);
console.log('After setValue:', dropdown.getValue());  // Should be 2
```

---

## Performance Considerations

### Caching Data

Components cache data after first fetch:

```javascript
// First call: Fetches from API
await dropdown.init();

// Subsequent calls: Uses cached data
await dropdown.refresh();  // Re-fetches from API
```

### Memory Management

Always destroy components when done:

```javascript
// Modal closes → destroy all dropdowns
$('#leadModal').on('hidden.bs.modal', () => {
    Object.values(editDropdowns).forEach(d => d.destroy());
    editDropdowns = {};
});
```

### Multiple Instances

Factory pattern allows multiple instances:

```javascript
// Filter bar
const filterStatus = createStatusDropdown('#filterStatus');

// Edit form
const editStatus = createStatusDropdown('#editStatus');

// Both work independently
await Promise.all([
    filterStatus.init(),
    editStatus.init()
]);
```

---

## Future Components

### Planned Components

1. **DatePicker** - Date selection with calendar
2. **TagInput** - Multi-tag input for lead tags
3. **PhoneInput** - Phone number with country code
4. **AddressInput** - Address with autocomplete
5. **FileUpload** - Drag-and-drop file upload

### Component Request Process

To request a new component:

1. Describe use case and frequency
2. Sketch API design
3. List similar existing components
4. Estimate reusability (how many places?)
5. Create ticket with "component" label

---

## Conclusion

LeadsEngine components follow a **consistent, predictable pattern** that makes them easy to use and maintain. The factory function approach provides **true encapsulation** and **multiple instance support** without the complexity of classes.

**Key takeaways:**
- Always call `init()` before using
- Store references for cleanup
- Use `onChange` for side effects
- Initialize in parallel for speed
- Destroy when done to prevent leaks

For questions or suggestions, see `DEVELOPMENT_WORKFLOW.md` for contribution guidelines.

---

**End of Components Guide**
