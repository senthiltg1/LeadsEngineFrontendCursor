# LeadsEngine Development Workflow

**Last Updated:** 2025-10-01

This document describes the development process, best practices, and workflows for working on the LeadsEngine frontend.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [API Integration Workflow](#api-integration-workflow)
- [Feature Development](#feature-development)
- [Testing Workflow](#testing-workflow)
- [Code Review Checklist](#code-review-checklist)
- [Documentation Requirements](#documentation-requirements)
- [Git Workflow](#git-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Modern web browser (Chrome/Firefox recommended)
- Text editor (VS Code, Sublime, Vim, etc.)
- Backend API running on `http://localhost:8002`
- Git for version control

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd leadsengine-frontend-cursor

# No npm install needed - vanilla JavaScript!

# Open in browser
open index.html

# Or use a local server
python3 -m http.server 8080
# Then visit: http://localhost:8080
```

### File Structure

```
leadsengine-frontend-cursor/
├── assets/
│   ├── css/custom.css           # Custom styles
│   └── js/
│       ├── config.js            # Configuration
│       ├── bus.js               # Event bus
│       ├── api.js               # API client
│       ├── auth.js              # Authentication
│       ├── auth-guard.js        # Route protection
│       ├── dashboard.js         # Dashboard logic
│       ├── leads.js             # Leads page logic
│       └── components/          # Reusable components
├── *.html                       # Pages
├── *.md                         # Documentation
└── README.md                    # Project overview
```

---

## Development Process

### 1. Plan Before Coding

**Before writing any code:**

1. Read feature requirements carefully
2. Check `FRONTEND_API_REFERENCE.md` for endpoints
3. Sketch data flow on paper
4. Break down into tasks
5. Estimate time
6. Get approval if needed

**Example task breakdown:**

```
Feature: Lead creation form

Tasks:
1. Create modal HTML structure (30 min)
2. Wire form validation (20 min)
3. Integrate dropdown components (15 min)
4. Implement API call (20 min)
5. Add success/error handling (15 min)
6. Test with various inputs (30 min)
7. Document in COMPONENTS.md (15 min)

Total: ~2.5 hours
```

---

### 2. Document During Development

**Create documentation AS YOU CODE:**

- Add JSDoc comments to functions
- Add HTML comments to sections
- Update FRONTEND_API_REFERENCE.md for new endpoints
- Update COMPONENTS.md for new components
- Document design decisions in ARCHITECTURE.md

**Don't wait until the end!** It's harder and you'll forget details.

---

### 3. Test Continuously

**Test after each small change:**

```javascript
// 1. Write function
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// 2. Test in console immediately
console.log('Test:', calculateTotal([{price: 10}, {price: 20}]));
// Expected: 30

// 3. Test edge cases
console.log('Empty:', calculateTotal([]));  // Expected: 0
console.log('Null:', calculateTotal(null)); // Should handle gracefully
```

**Testing checklist:**
- ✅ Happy path (normal usage)
- ✅ Empty inputs
- ✅ Null/undefined
- ✅ Extreme values
- ✅ Error conditions
- ✅ Browser console for errors

---

### 4. Commit Frequently

**Small, focused commits:**

```bash
# Good commits
git commit -m "Add status dropdown component"
git commit -m "Wire Edit tab with dropdowns"
git commit -m "Fix note creation API endpoint"

# Bad commits
git commit -m "Various changes"
git commit -m "Update stuff"
git commit -m "Fix bugs"
```

**Commit message format:**

```
<type>: <short description>

<optional longer description>

<optional references>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, no code change
- `refactor:` - Code restructuring, no behavior change
- `test:` - Add tests
- `chore:` - Build, config, etc.

**Examples:**

```bash
git commit -m "feat: add note creation to Notes tab"

git commit -m "fix: correct note creation API endpoint

Changed from POST /api/v1/leadnote/lead/{id} to POST /api/v1/leadnote/
with proper payload structure including lead_id and user_id.

Ref: NOTE_CREATION_FIX.md"

git commit -m "docs: add API verification checklist"
```

---

## API Integration Workflow

**This is CRITICAL.** Follow this process for EVERY new API integration.

### Step 1: Verify Endpoint

```bash
# 1. Check endpoints.md
grep -A 2 "leadnote" endpoints.md

# Output:
# POST | /api/v1/leadnote/ | create_leadnote_api_v1_leadnote__post
```

### Step 2: Check Backend Schema

```bash
# Find schema file
find ../LeadsEngineBackend -name "*leadnote*.py" | grep schema

# Read schema
cat ../LeadsEngineBackend/app/schemas/schema_leadnote.py
```

### Step 3: Check Database Model

```bash
# Check model constraints
grep -A 15 "class LeadNote" ../LeadsEngineBackend/app/db/models.py
```

### Step 4: Test with curl

```bash
# Get token first
TOKEN=$(curl -X POST http://localhost:8002/api/v1/auth/token \
  -d "username=user@example.com&password=password" \
  | jq -r '.access_token')

# Test endpoint
curl -X POST http://localhost:8002/api/v1/leadnote/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Test note",
    "is_pinned": false,
    "lead_id": 3,
    "user_id": 1
  }' | jq
```

### Step 5: Document in Code

```javascript
/**
 * Create note for lead
 *
 * ENDPOINT VERIFICATION (from endpoints.md line 117):
 * POST /api/v1/leadnote/ - create_leadnote_api_v1_leadnote__post
 *
 * PAYLOAD SCHEMA (from schema_leadnote.py):
 * {
 *   body: string (required),
 *   is_pinned: boolean (default: false),
 *   lead_id: integer (required),
 *   user_id: integer (optional)
 * }
 *
 * CURL TEST:
 * curl -X POST http://localhost:8002/api/v1/leadnote/ \
 *   -H "Authorization: Bearer $TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"body":"Test","is_pinned":false,"lead_id":3,"user_id":1}'
 */
async function createNote(leadId, noteText) {
    const userId = Auth.getUserId();
    const payload = {
        body: noteText,
        is_pinned: false,
        lead_id: parseInt(leadId),
        user_id: parseInt(userId)
    };

    console.log('=== CREATE NOTE REQUEST ===');
    console.log('Endpoint:', '/api/v1/leadnote/');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const response = await API.post('/api/v1/leadnote/', payload);

    console.log('=== CREATE NOTE SUCCESS ===');
    console.log('Response:', response);

    return response;
}
```

### Step 6: Update FRONTEND_API_REFERENCE.md

Add the new endpoint with complete documentation.

### API Integration Checklist

- [ ] Checked `endpoints.md` for exact path and method
- [ ] Checked backend schema for payload structure
- [ ] Checked database model for constraints
- [ ] Tested with curl
- [ ] Documented in code with curl example
- [ ] Added comprehensive logging
- [ ] Updated `FRONTEND_API_REFERENCE.md`
- [ ] Tested in browser
- [ ] Tested error cases (401, 404, 422, 500)

---

## Feature Development

### Feature Development Process

1. **Requirements** - Understand what needs to be built
2. **Design** - Plan data flow and UI
3. **API Verification** - Verify all endpoints needed
4. **Implementation** - Write code incrementally
5. **Testing** - Test happy path and edge cases
6. **Documentation** - Update all relevant docs
7. **Review** - Self-review before committing

### Example: Implementing Note Creation

**1. Requirements**

```
Feature: Note Creation
- User can add notes to leads
- Notes have: body (required), is_pinned (optional)
- Notes auto-populate author and timestamp
- Notes appear in timeline
```

**2. Design**

```
UI: Textarea + "Add Note" button at top of Notes tab
Data: POST /api/v1/leadnote/ with {body, is_pinned, lead_id, user_id}
Flow:
  1. User types note
  2. Clicks "Add Note"
  3. Validate input
  4. Extract user_id from JWT
  5. Call API
  6. On success: clear textarea, refresh notes list, show success
  7. On error: show error, keep textarea content
```

**3. API Verification**

Follow [API Integration Workflow](#api-integration-workflow)

**4. Implementation**

```javascript
// Step 1: Add HTML
// Step 2: Wire button click
// Step 3: Validate input
// Step 4: Call API
// Step 5: Handle success
// Step 6: Handle errors
// Step 7: Test

// Test after each step!
```

**5. Testing**

```
Test Cases:
- [ ] Create note with valid input
- [ ] Try to submit empty note (should show error)
- [ ] Create note with very long text (500+ chars)
- [ ] Network error (disconnect WiFi)
- [ ] 401 error (expired token)
- [ ] 422 error (invalid payload)
- [ ] Create multiple notes rapidly
- [ ] Check timeline for new note
```

**6. Documentation**

```
Update:
- [ ] JSDoc comments on functions
- [ ] HTML comments on sections
- [ ] FRONTEND_API_REFERENCE.md
- [ ] NOTE_CREATION_FIX.md (if complex)
```

**7. Review**

```
Self-Review Checklist:
- [ ] Code follows established patterns
- [ ] No console.log() left in (except intentional logging)
- [ ] No commented-out code
- [ ] Error handling complete
- [ ] XSS protection (escapeHtml)
- [ ] Follows code style guide
- [ ] Documentation complete
```

---

## Testing Workflow

### Manual Testing Process

**1. Browser DevTools**

```javascript
// Open Console (Cmd+Option+J)

// Test authentication
console.log('Token:', Auth.getToken());
console.log('User ID:', Auth.getUserId());
console.log('User:', Auth.getUser());

// Test component
const dropdown = createStatusDropdown('#test-container');
await dropdown.init();
console.log('Statuses:', dropdown.getAllStatuses());
console.log('Selected:', dropdown.getValue());

// Test API directly
const response = await API.get('/api/v1/lead/');
console.log('Leads:', response);
```

**2. Network Tab**

- Check all API calls
- Verify request payloads
- Check response status codes
- Inspect response bodies
- Monitor timing

**3. Console Errors**

- Check for JavaScript errors
- Check for 404s (missing assets)
- Check for CORS errors
- Check for API errors

### Testing Checklist

**Before committing:**

- [ ] Happy path works
- [ ] Empty inputs handled
- [ ] Null/undefined handled
- [ ] Error states handled
- [ ] Loading states shown
- [ ] Success messages shown
- [ ] Error messages shown
- [ ] Button states correct
- [ ] No console errors
- [ ] No 404s
- [ ] Network tab clean

**Edge cases:**

- [ ] Rapid clicking (double submit)
- [ ] Very long inputs
- [ ] Special characters in inputs
- [ ] Network offline
- [ ] Slow network (throttle to 3G)
- [ ] Expired token
- [ ] Invalid data from API

**Cross-browser:**

- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (if on Mac)

**Responsive:**

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Code Review Checklist

### Self-Review (Before Committing)

**Code Quality:**

- [ ] Follows established patterns
- [ ] No code duplication
- [ ] Functions are single-purpose
- [ ] Meaningful variable names
- [ ] No magic numbers
- [ ] No commented-out code
- [ ] No debug console.log() (except intentional)

**Security:**

- [ ] User input escaped (escapeHtml)
- [ ] No SQL injection risk (ORM handles it)
- [ ] No XSS vulnerabilities
- [ ] No secrets in code
- [ ] Auth token not logged

**Error Handling:**

- [ ] Try-catch around async operations
- [ ] User-friendly error messages
- [ ] Errors logged to console
- [ ] Failed operations allow retry
- [ ] Loading states shown

**Documentation:**

- [ ] JSDoc comments on functions
- [ ] HTML comments on sections
- [ ] Inline comments for complex logic
- [ ] README updated if needed
- [ ] FRONTEND_API_REFERENCE.md updated

**Testing:**

- [ ] Tested happy path
- [ ] Tested edge cases
- [ ] Tested error conditions
- [ ] No console errors
- [ ] Works in Chrome

---

## Documentation Requirements

### Required Documentation

**For every new feature:**

1. **JSDoc comments** on all functions
2. **HTML comments** on major sections
3. **API documentation** in FRONTEND_API_REFERENCE.md
4. **Component guide** in COMPONENTS.md (if component)
5. **Inline comments** for complex logic

### JSDoc Template

```javascript
/**
 * Brief description of function
 *
 * Longer description if needed, explaining:
 * - What the function does
 * - Why it's needed
 * - Any important side effects
 *
 * @param {string} param1 - Description of param1
 * @param {number} param2 - Description of param2
 * @param {object} options - Optional configuration
 * @param {boolean} options.flag - Description of flag
 * @returns {Promise<object>} Description of return value
 * @throws {Error} When something goes wrong
 *
 * @example
 * const result = await myFunction('test', 123, {flag: true});
 * console.log(result);  // Output: {...}
 */
async function myFunction(param1, param2, options = {}) {
    // Implementation
}
```

### HTML Comment Template

```html
<!-- ============================================
     Section Name
     ============================================
     Purpose: Brief description of this section
     Dependencies: jQuery, Bootstrap
     Notes: Any special considerations
     ============================================ -->
<div class="section">
    <!-- Section content -->
</div>
```

### When to Add Comments

**DO comment:**
- Complex algorithms
- Non-obvious business logic
- Workarounds or hacks
- Performance optimizations
- Security-sensitive code

**DON'T comment:**
- Obvious code (`i++; // increment i`)
- Good variable names (`const userName = user.name;`)
- Standard patterns (self-explanatory)

---

## Git Workflow

### Branch Strategy

```bash
main          # Production-ready code
  ├── develop # Integration branch
      ├── feature/lead-creation    # Feature branch
      ├── feature/note-filters     # Feature branch
      └── fix/modal-backdrop       # Bugfix branch
```

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/lead-filters

# 2. Work on feature
# ... make changes ...

# 3. Commit incrementally
git add assets/js/leads.js
git commit -m "feat: add status filter dropdown"

git add assets/js/leads.js
git commit -m "feat: wire status filter to API call"

# 4. Push to remote
git push origin feature/lead-filters

# 5. Create pull request (GitHub/GitLab)

# 6. After approval, merge to develop
git checkout develop
git merge feature/lead-filters

# 7. Delete feature branch
git branch -d feature/lead-filters
```

### Bugfix Workflow

```bash
# 1. Create bugfix branch
git checkout -b fix/note-creation-endpoint

# 2. Fix bug
# ... make changes ...

# 3. Commit with explanation
git commit -m "fix: correct note creation API endpoint

Changed from POST /leadnote/lead/{id} to POST /leadnote/
Includes lead_id and user_id in payload

Fixes #123"

# 4. Push and create PR
git push origin fix/note-creation-endpoint

# 5. Merge to develop (and main if urgent)
```

### Commit Best Practices

**Good commits:**
- Small and focused
- One logical change per commit
- Clear commit message
- Tested before committing

**Bad commits:**
- Multiple unrelated changes
- Vague commit messages
- Broken/untested code
- Commented-out code

---

## Common Tasks

### Task 1: Add New Page

```bash
# 1. Create HTML file
cp index.html reports.html

# 2. Update title and content
# ... edit reports.html ...

# 3. Create JS file
touch assets/js/reports.js

# 4. Add auth guard
# <script src="assets/js/auth-guard.js"></script>

# 5. Load dependencies
# <script src="assets/js/config.js"></script>
# <script src="assets/js/bus.js"></script>
# <script src="assets/js/api.js"></script>
# <script src="assets/js/auth.js"></script>
# <script src="assets/js/reports.js"></script>

# 6. Implement page logic
# ... edit assets/js/reports.js ...

# 7. Add navigation link
# ... update nav in all pages ...

# 8. Test
# ... open reports.html ...

# 9. Document
# ... update docs ...

# 10. Commit
git add reports.html assets/js/reports.js
git commit -m "feat: add reports page"
```

### Task 2: Add New Component

```bash
# 1. Create component file
touch assets/js/components/tag-input.js

# 2. Implement using factory pattern
# ... see COMPONENTS.md template ...

# 3. Test in console
# const test = createTagInput('#test');
# await test.init();

# 4. Document in COMPONENTS.md
# ... add usage guide ...

# 5. Use in page
# <script src="assets/js/components/tag-input.js"></script>

# 6. Commit
git add assets/js/components/tag-input.js
git commit -m "feat: add tag input component"
```

### Task 3: Fix Bug

```bash
# 1. Reproduce bug
# ... open page, follow steps ...

# 2. Check console for errors
# ... console tab ...

# 3. Add debugging
console.log('Debug:', variable);

# 4. Find root cause
# ... trace through code ...

# 5. Fix issue
# ... edit code ...

# 6. Remove debug logging
# ... clean up console.log() ...

# 7. Test fix
# ... verify bug is gone ...

# 8. Test for regressions
# ... check related functionality ...

# 9. Document in commit
git commit -m "fix: modal closing on background click

Added data-bs-backdrop='static' to prevent accidental modal close.

Fixes #456"
```

### Task 4: Refactor Code

```bash
# 1. Identify duplication
# ... find repeated code ...

# 2. Extract to function
function buildUserMap(users) {
    const map = {};
    users.forEach(u => {
        map[u.id] = u.full_name || u.username;
    });
    return map;
}

# 3. Replace duplicates with function call
const userMap = buildUserMap(users);

# 4. Test thoroughly
# ... ensure no behavior change ...

# 5. Commit
git commit -m "refactor: extract buildUserMap utility

No behavior change, just code organization."
```

---

## Troubleshooting

### Problem: API Call Returns 401

**Cause:** Token expired or missing

**Solution:**
```javascript
// Check token
console.log('Token:', Auth.getToken());

// Check if expired
const payload = Auth.decodeJWT(Auth.getToken());
console.log('Expires:', new Date(payload.exp * 1000));

// Re-login
Auth.logout();  // Clears token, redirects to login
```

### Problem: API Call Returns 422

**Cause:** Validation error in payload

**Solution:**
```javascript
// Log full error
catch (error) {
    console.error('Error response:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('Payload sent:', payload);
}

// Check backend schema
// Check database constraints
// Verify payload structure
```

### Problem: Dropdown Not Populating

**Cause:** API call failed or no data

**Solution:**
```javascript
// Check API response
const response = await API.get('/api/v1/leadstatus/');
console.log('Response:', response);
console.log('Records:', response.records);

// Check dropdown initialization
const dropdown = createStatusDropdown('#status');
const success = await dropdown.init();
console.log('Init success:', success);
console.log('Data:', dropdown.getAllStatuses());
```

### Problem: Modal Not Showing

**Cause:** Bootstrap not loaded or modal ID wrong

**Solution:**
```javascript
// Check Bootstrap loaded
console.log('Bootstrap:', typeof bootstrap);  // Should be 'object'

// Check modal element
console.log('Modal:', $('#myModal').length);  // Should be 1

// Check modal instantiation
const modal = new bootstrap.Modal(document.getElementById('myModal'));
modal.show();
```

### Problem: Changes Not Reflecting

**Cause:** Browser cache

**Solution:**
```bash
# Hard refresh
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Or clear cache
# DevTools → Network tab → Disable cache (checkbox)

# Or add cache buster
<script src="assets/js/leads.js?v=2"></script>
```

---

## Performance Tips

### 1. Parallel Loading

```javascript
// ❌ SLOW: Sequential
const leads = await API.get('/api/v1/lead/');
const users = await API.get('/api/v1/user/');
const statuses = await API.get('/api/v1/leadstatus/');

// ✅ FAST: Parallel
const [leads, users, statuses] = await Promise.all([
    API.get('/api/v1/lead/'),
    API.get('/api/v1/user/'),
    API.get('/api/v1/leadstatus/')
]);
```

### 2. Debouncing

```javascript
// Debounce search input
let searchTimeout;
$('#search').on('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const query = $(this).val();
        performSearch(query);
    }, 300);  // Wait 300ms after typing stops
});
```

### 3. Caching

```javascript
// Cache static data
let statusCache = null;

async function getStatuses() {
    if (!statusCache) {
        const response = await API.get('/api/v1/leadstatus/');
        statusCache = response.records;
    }
    return statusCache;
}
```

---

## Conclusion

Following this workflow ensures:
- ✅ Consistent code quality
- ✅ Comprehensive documentation
- ✅ Thorough testing
- ✅ Easy maintenance
- ✅ Fast onboarding

**Key principles:**
1. Plan before coding
2. Document during development
3. Test continuously
4. Commit frequently
5. Review before pushing

For questions, see other documentation files or ask the team.

---

**End of Development Workflow**
