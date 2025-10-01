# LeadsEngine Frontend Architecture

**Last Updated:** 2025-10-01

This document describes the design decisions, architectural patterns, and rationale behind the LeadsEngine frontend implementation.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [Module Organization](#module-organization)
- [Design Decisions](#design-decisions)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Security](#security)

---

## Overview

LeadsEngine frontend is a **lightweight, vanilla JavaScript application** built with Bootstrap 5 and jQuery. It follows a modular architecture with clear separation of concerns.

### Key Principles

1. **Simplicity over complexity** - No heavy frameworks, just core web technologies
2. **Modularity** - Self-contained, reusable components
3. **Progressive enhancement** - Works without JavaScript, enhanced with it
4. **API-first** - All data operations through RESTful API
5. **Stateless frontend** - JWT-based authentication, no session state
6. **Explicit over implicit** - Clear, verbose code over clever abstractions

---

## Technology Stack

### Core Technologies

- **HTML5** - Semantic markup
- **CSS3** - Custom styles on top of Bootstrap
- **JavaScript (ES6+)** - Vanilla JS, no transpilation
- **Bootstrap 5.3** - UI framework and components
- **jQuery 3.7** - DOM manipulation and AJAX
- **Font Awesome 6.4** - Icon library

### Why These Choices?

**Bootstrap 5:**
- Rapid prototyping with pre-built components
- Responsive grid system
- Modal and dropdown components work out-of-the-box
- Well-documented and widely supported

**jQuery:**
- Simplifies DOM manipulation
- Cross-browser AJAX compatibility
- Familiar API for form handling
- Not for new projects, but acceptable for rapid prototyping

**Vanilla JavaScript:**
- No build step required
- Fast development iteration
- Easy to debug
- No framework lock-in
- Suitable for application size

---

## Architecture Patterns

### 1. Module Pattern

Each JavaScript file exports a single module object with public API:

```javascript
const Auth = {
    login(username, password) { /* ... */ },
    logout() { /* ... */ },
    isAuthenticated() { /* ... */ }
};
```

**Benefits:**
- Clear public API
- Encapsulation of private functions
- Easy to test and mock
- No global namespace pollution

**Usage:**
```javascript
// config.js - Configuration
// bus.js - Event bus
// api.js - API client
// auth.js - Authentication
// leads.js - Page-specific logic
```

---

### 2. Factory Function Pattern (Components)

Reusable components use factory functions, not classes:

```javascript
function createStatusDropdown(selector, options = {}) {
    // Private state
    let statuses = null;
    let selectedId = options.initialValue || null;

    // Public API
    return {
        init() { /* ... */ },
        getValue() { /* ... */ },
        setValue(id) { /* ... */ },
        destroy() { /* ... */ }
    };
}
```

**Benefits:**
- Multiple instances on same page
- Private state encapsulation
- Clean lifecycle management
- No `this` binding issues
- Memory efficient

**Used in:**
- `status-dropdown.js` - Status selection
- `source-dropdown.js` - Source selection
- `user-dropdown.js` - User assignment

---

### 3. Event-Driven Communication

Pub/sub pattern for decoupled module communication:

```javascript
// Publisher
Bus.publish('auth:changed', { authenticated: true });

// Subscriber
Bus.subscribe('auth:changed', (data) => {
    console.log('Auth state:', data.authenticated);
});
```

**Benefits:**
- Loose coupling between modules
- Easy to add new subscribers
- Clear event contracts
- Supports multiple subscribers

**Currently used minimally** - Ready for future expansion when needed.

---

### 4. API Client Abstraction

Single API module handles all HTTP communication:

```javascript
const API = {
    get(endpoint, params) { /* ... */ },
    post(endpoint, data) { /* ... */ },
    put(endpoint, data) { /* ... */ },
    delete(endpoint) { /* ... */ },
    postForm(endpoint, data) { /* ... */ }
};
```

**Benefits:**
- Centralized error handling
- Automatic token injection
- Consistent response normalization
- Easy to add interceptors
- Single place to change base URL

---

## Module Organization

### Directory Structure

```
leadsengine-frontend-cursor/
├── assets/
│   ├── css/
│   │   └── custom.css              # Custom styles
│   └── js/
│       ├── config.js               # Configuration & endpoints
│       ├── bus.js                  # Event bus
│       ├── api.js                  # API client
│       ├── auth.js                 # Authentication
│       ├── auth-guard.js           # Route protection
│       ├── dashboard.js            # Dashboard page logic
│       ├── leads.js                # Leads page logic
│       └── components/
│           ├── status-dropdown.js  # Status selector
│           ├── source-dropdown.js  # Source selector
│           └── user-dropdown.js    # User selector
├── login.html                      # Login page
├── index.html                      # Dashboard
├── leads.html                      # Leads list & detail
├── endpoints.md                    # API reference (backend)
├── FRONTEND_API_REFERENCE.md       # API usage guide
├── ARCHITECTURE.md                 # This file
├── COMPONENTS.md                   # Component guide
└── DEVELOPMENT_WORKFLOW.md         # Dev process
```

### Module Dependencies

```
auth-guard.js (first)
    ↓
config.js
    ↓
bus.js
    ↓
api.js → auth.js
    ↓
dashboard.js | leads.js
    ↓
components/*.js
```

**Load order matters!** Scripts must be loaded in dependency order.

---

## Design Decisions

### 1. JWT-Based Authentication

**Decision:** Use JWT tokens stored in localStorage, decode client-side for user_id.

**Rationale:**
- Stateless authentication (no server-side sessions)
- Token includes user_id, username, roles
- Can decode client-side for UI decisions
- Standard OAuth2/JWT pattern
- Works with FastAPI backend defaults

**Implementation:**
```javascript
// Store token
localStorage.setItem('leadsengine_token', token);

// Decode to extract user_id
const payload = JSON.parse(atob(token.split('.')[1]));
const userId = payload.user_id;

// Include in all API requests
headers: {
    'Authorization': `Bearer ${token}`
}
```

**Trade-offs:**
- ✅ Simple to implement
- ✅ Works across domains
- ✅ Scales horizontally
- ⚠️ Token in localStorage (XSS risk - mitigated by CSP)
- ⚠️ No server-side revocation (until expiry)

**Security considerations:**
- Use HTTPS in production
- Set short token expiry (e.g., 24 hours)
- Implement token refresh flow (future)
- Add CSP headers to prevent XSS

---

### 2. Modal-Based Lead Detail

**Decision:** Single modal for lead details with tabs (Overview, Edit, Notes, Timeline).

**Rationale:**
- Keeps user on same page (no navigation)
- Fast loading (no page refresh)
- Bootstrap modal handles overlay, focus trap, ESC key
- Easy to implement with tabs
- Common UX pattern (Gmail, Trello, etc.)

**Implementation:**
```html
<div class="modal fade" id="leadDetailModal" data-bs-backdrop="static">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <ul class="nav nav-tabs">
                <li><a data-bs-toggle="tab" href="#overview">Overview</a></li>
                <li><a data-bs-toggle="tab" href="#edit">Edit</a></li>
                <li><a data-bs-toggle="tab" href="#notes">Notes</a></li>
                <li><a data-bs-toggle="tab" href="#timeline">Timeline</a></li>
            </ul>
            <div class="tab-content">
                <!-- Tab panels -->
            </div>
        </div>
    </div>
</div>
```

**Enhancements:**
- `data-bs-backdrop="static"` - Prevents accidental close
- `data-bs-keyboard="false"` - Disables ESC key
- `modal-xl` - Extra large for comfortable editing

**Trade-offs:**
- ✅ Fast, no page load
- ✅ Context preserved
- ✅ Can load data in background
- ⚠️ SEO unfriendly (not applicable for authenticated app)
- ⚠️ Deep linking harder (can add hash routing later)

---

### 3. Parallel Data Loading

**Decision:** Load independent data sources in parallel with Promise.all().

**Rationale:**
- Reduces total loading time
- Better user experience
- Simple with Promise.all()
- Safe when requests are independent

**Example:**
```javascript
const [leadsResponse, usersResponse] = await Promise.all([
    API.get('/api/v1/lead/with-relationships'),
    API.get('/api/v1/user/')
]);
```

**When NOT to use:**
- Requests depend on each other (load sequentially)
- Want to show partial data (load independently, update as ready)
- Rate limiting concerns (rarely an issue)

---

### 4. Client-Side ID-to-Name Mapping

**Decision:** Fetch lookup tables (users, statuses, sources) once and build maps.

**Rationale:**
- Backend doesn't always include relationships
- Avoids N+1 queries
- Fast client-side lookup
- Works even when backend omits data

**Implementation:**
```javascript
// Fetch once
const users = await API.get('/api/v1/user/');

// Build map
const userMap = {};
users.records.forEach(user => {
    userMap[user.id] = user.full_name || user.username;
});

// Use for lookup
const userName = userMap[userId] || `User #${userId}`;
```

**Used in:**
- Lead list "Assigned To" column
- Timeline actor attribution
- Notes author display
- Edit form population

**Trade-offs:**
- ✅ Fast lookups
- ✅ No repeated API calls
- ✅ Works with partial backend data
- ⚠️ Stale if data changes (acceptable for short sessions)
- ⚠️ Memory usage (negligible for <1000 records)

---

### 5. Factory Functions Over Classes

**Decision:** Use factory functions for reusable components, not ES6 classes.

**Rationale:**
- Simpler syntax
- No `this` binding issues
- True private variables (closures)
- Composition over inheritance
- Multiple instances easy

**Comparison:**

```javascript
// Class approach (NOT used)
class StatusDropdown {
    constructor(selector) {
        this.selector = selector;
        this.statuses = null;
    }

    async init() {
        this.statuses = await fetchStatuses();
    }
}

// Factory approach (USED)
function createStatusDropdown(selector) {
    let statuses = null;  // Truly private

    return {
        async init() {
            statuses = await fetchStatuses();
        }
    };
}
```

**Benefits:**
- No accidental `this` bugs
- Can't forget `new` keyword
- Memory efficient (shared methods in closure)
- Clearer lifecycle (init/destroy)

---

### 6. Explicit Over Clever

**Decision:** Write verbose, explicit code rather than clever abstractions.

**Examples:**

```javascript
// GOOD: Explicit field mapping
const payload = {
    first_name: $('#edit-first-name').val().trim(),
    last_name: $('#edit-last-name').val().trim(),
    email: $('#edit-email').val().trim(),
    phone: $('#edit-phone').val().trim(),
    status_id: this.editDropdowns.status.getValue(),
    source_id: this.editDropdowns.source.getValue(),
    assigned_to_user_id: this.editDropdowns.user.getValue()
};

// AVOID: Generic form serializer
// const payload = serializeForm('#editForm');
```

**Rationale:**
- Easy to debug
- Clear what's being sent
- No magic
- Easy for junior devs
- Self-documenting

**Trade-offs:**
- ⚠️ More code to write
- ⚠️ More to maintain
- ✅ But: easier to understand, modify, and debug

---

## Data Flow

### Authentication Flow

```
1. User enters credentials
   ↓
2. POST /api/v1/auth/token (form-urlencoded)
   ↓
3. Receive {access_token, token_type}
   ↓
4. Store token in localStorage
   ↓
5. Decode JWT to extract user_id, username, roles
   ↓
6. Redirect to dashboard
   ↓
7. All subsequent requests include:
   Authorization: Bearer {token}
```

### Lead List Loading Flow

```
1. Page loads, auth-guard checks token
   ↓
2. Parallel load:
   - GET /api/v1/lead/with-relationships
   - GET /api/v1/user/ (for user map)
   ↓
3. Build user ID→name mapping
   ↓
4. Render table with data
   ↓
5. Attach click handlers to rows
```

### Lead Detail Modal Flow

```
1. User clicks lead row
   ↓
2. Show modal with loading state
   ↓
3. Parallel load:
   - GET /api/v1/lead/{id}
   - GET /api/v1/leadnote/lead/{id}
   - GET /api/v1/lead/{id}/timeline
   ↓
4. Populate Overview tab
   ↓
5. Initialize Edit tab (wire dropdowns)
   ↓
6. Setup Notes tab (creation form)
   ↓
7. Process Timeline tab (build name maps, filter duplicates)
   ↓
8. User can switch tabs freely
```

### Lead Update Flow

```
1. User clicks "Save Changes" on Edit tab
   ↓
2. Disable button, show spinner
   ↓
3. Collect all form data
   ↓
4. Log payload to console
   ↓
5. PUT /api/v1/lead/{id} with full payload
   ↓
6. On success:
   - Re-enable button
   - Show success message
   - Close modal
   - Reload lead list
   ↓
7. On error:
   - Re-enable button
   - Show error message
   - Keep modal open
   - User can retry
```

### Note Creation Flow

```
1. User types note, clicks "Add Note"
   ↓
2. Validate input (not empty)
   ↓
3. Extract user_id from JWT token
   ↓
4. POST /api/v1/leadnote/ with:
   {body, is_pinned, lead_id, user_id}
   ↓
5. On success:
   - Clear textarea
   - Show success message (auto-hide 3s)
   - Reload notes list
   ↓
6. On error:
   - Show error message
   - Keep textarea content
   - User can retry
```

---

## State Management

### Current Approach: Page-Level State

Each page has its own state object:

```javascript
const LeadsPage = {
    currentPage: 1,
    pageSize: 50,
    allLeads: [],
    userMap: {},
    editDropdowns: {},
    currentLeadId: null
};
```

**Benefits:**
- Simple to understand
- State tied to page lifecycle
- No global state conflicts
- Easy to debug (check LeadsPage object)

**Limitations:**
- State lost on page refresh
- Can't share state across pages
- No undo/redo
- No state persistence

**Future considerations:**
- Add URL query params for filters (bookmarkable)
- Add localStorage for preferences
- Consider Vuex/Redux only if app grows significantly

---

### What Gets Stored Where

| Data | Storage | Lifetime | Reason |
|------|---------|----------|--------|
| JWT Token | localStorage | Until logout | Needed for all API calls |
| User data | localStorage | Until logout | Optional, can decode from JWT |
| Lead list | Page state | Until page refresh | Temporary, reload from API |
| User map | Page state | Until page refresh | Temporary, rebuild on load |
| Dropdown state | Component state | Until destroy | Scoped to component instance |
| Form inputs | DOM | Until submit/clear | Standard HTML behavior |

---

## Error Handling

### Strategy: Fail Loudly, Recover Gracefully

1. **Log everything to console**
   - Full error objects
   - Request details
   - Response data

2. **Show user-friendly messages**
   - Generic error text
   - Actionable guidance ("Please try again")
   - No stack traces or technical details

3. **Keep user in control**
   - Don't auto-close forms on error
   - Re-enable buttons
   - Preserve user input
   - Allow retry

### Error Handling Pattern

```javascript
try {
    // Show loading state
    button.disabled = true;
    button.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

    // Attempt operation
    const response = await API.post('/endpoint', data);

    // Success path
    showSuccess('Saved successfully!');
    clearForm();

} catch (error) {
    // Log everything for debugging
    console.error('Operation failed:', error);
    console.error('Error response:', error.response?.data);

    // Show user-friendly message
    showError('Failed to save. Please try again.');

} finally {
    // Always re-enable button
    button.disabled = false;
    button.innerHTML = 'Save';
}
```

### Error Message Hierarchy

1. **API error detail** - If backend provides specific message
2. **HTTP status message** - Generic message for status code
3. **Generic fallback** - "Something went wrong. Please try again."

```javascript
let errorMsg = 'Failed to save. ';
if (error.response?.data?.detail) {
    errorMsg += error.response.data.detail;
} else if (error.response?.status === 422) {
    errorMsg += 'Validation error. Check your input.';
} else {
    errorMsg += 'Please try again.';
}
```

---

## Security

### Authentication & Authorization

**Current implementation:**
- JWT tokens in localStorage
- Token sent in Authorization header
- Backend validates token on every request
- No role-based UI restrictions yet

**Security measures:**
- Auth guard on all protected pages
- Token expiry (backend enforced)
- HTTPS required in production
- No sensitive data in localStorage (only token)

**Future improvements:**
- Token refresh flow
- Role-based UI rendering
- CSP headers
- SameSite cookies as alternative to localStorage

---

### Input Validation

**Client-side:**
- Trim whitespace
- Check required fields
- Basic format validation (email, phone)
- XSS protection via escapeHtml()

**Server-side:**
- Pydantic validation (FastAPI)
- SQL injection protection (SQLAlchemy)
- Authentication required
- Authorization checks

**Never trust client-side validation!** Always validate on backend.

---

### XSS Prevention

All user-generated content is escaped:

```javascript
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

// Usage
const userName = escapeHtml(user.name);
html += `<div>${userName}</div>`;
```

**Applied to:**
- Lead names, emails, phones
- Note bodies
- Timeline descriptions
- All user input displayed in UI

---

### API Security

**CORS:**
- Backend configured with allowed origins
- Credentials included in requests
- Preflight handled by browser

**Rate Limiting:**
- Not implemented yet
- Should be added to backend
- 429 status code handling prepared

**Token Security:**
- Short-lived tokens (24 hours recommended)
- No token in URL query params
- No token in logs (sanitized)

---

## Performance Considerations

### Current Optimizations

1. **Parallel API calls** - Load independent data simultaneously
2. **Client-side caching** - User map, status map built once
3. **Lazy loading** - Modal data loaded on demand
4. **Debouncing** - Search/filter inputs (future)
5. **Pagination** - Backend pagination, limit 50 records

### Not Yet Optimized

- No image lazy loading (no images yet)
- No code splitting (acceptable for app size)
- No service worker (future: offline support)
- No virtual scrolling (not needed for <1000 rows)

### When to Optimize Further

- Lead list >1000 records: Add virtual scrolling
- API response >500ms: Add loading skeletons
- Bundle size >500KB: Consider code splitting
- User complaints: Profile and measure first

**Premature optimization is the root of all evil!** Optimize when needed, based on real metrics.

---

## Testing Strategy

### Current State: Manual Testing

- No automated tests yet
- Manual testing in Chrome DevTools
- Console logging for debugging

### Future Testing Approach

**Unit Tests (Jest or Vitest):**
- Auth module functions
- API client methods
- Data transformation utilities
- Component factory functions

**Integration Tests (Playwright or Cypress):**
- Login flow
- Lead CRUD operations
- Note creation
- Timeline loading

**E2E Tests (Playwright):**
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness

**Start with:** Most critical user flows (auth, lead update, note creation)

---

## Future Architecture Considerations

### When App Grows

**Consider migrating to:**
- **Vue.js** or **React** for reactive UI
- **TypeScript** for type safety
- **Vite** for build tooling and HMR
- **Vitest** for testing
- **Pinia** or **Redux** for state management

**Signals to migrate:**
- 10+ pages
- Complex state management needs
- Multiple developers
- Need for component library
- Build step beneficial (minification, tree-shaking)

### When to Stay Vanilla

- Single developer
- Simple CRUD app
- Fast prototyping
- No complex state
- Performance not critical

**Current verdict: Vanilla is fine for now.** Reevaluate at 10 pages or when state management becomes painful.

---

## Lessons Learned

### What Worked Well

1. **Module pattern** - Clean, simple, no framework overhead
2. **Factory functions** - Better than classes for components
3. **Parallel loading** - Significant UX improvement
4. **Comprehensive logging** - Fast debugging
5. **API verification process** - Prevents 422 errors

### What Could Be Better

1. **More JSDoc comments** - Added retrospectively
2. **Earlier documentation** - Should document during development
3. **Automated tests** - Would catch regressions
4. **Error boundaries** - Global error handler needed
5. **Loading states** - More consistent spinners/skeletons

### Design Decisions to Revisit

1. **jQuery dependency** - Consider removing, use Fetch API
2. **localStorage for token** - Evaluate httpOnly cookies
3. **No TypeScript** - Would catch bugs earlier
4. **Bootstrap modals** - Consider custom implementation for more control
5. **Event bus** - Underutilized, remove or expand usage

---

## Conclusion

The LeadsEngine frontend follows a **pragmatic, no-framework approach** optimized for rapid development and easy debugging. The architecture prioritizes **simplicity, explicitness, and modularity** over clever abstractions.

This approach is **suitable for the current app size** (3-5 pages, 1-2 developers) but should be **reevaluated as the app grows**.

Key takeaways:
- Vanilla JavaScript is viable for CRUD apps
- Module pattern + factory functions work well
- Parallel loading + client-side caching improve UX
- Comprehensive logging + error handling essential
- Documentation should be written during development

**Next steps:**
- Add automated tests
- Implement token refresh
- Consider Vue.js migration at 10+ pages
- Profile performance with real data

---

**End of Architecture Document**
