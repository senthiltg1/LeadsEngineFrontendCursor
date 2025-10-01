# Frontend API Reference

**Last Updated:** 2025-10-01

This document lists all verified API endpoints used by the LeadsEngine frontend with their exact payload structures, response formats, and usage notes.

**⚠️ IMPORTANT:** Always reference this file BEFORE implementing any API integration. Update this file when you verify a new endpoint.

---

## Table of Contents

- [Authentication](#authentication)
- [Leads](#leads)
- [Lead Notes](#lead-notes)
- [Lead Timeline](#lead-timeline)
- [Lead Status](#lead-status)
- [Lead Source](#lead-source)
- [Users](#users)

---

## Authentication

### Login
**Endpoint:** `POST /api/v1/auth/token`
**Reference:** `endpoints.md` line 23
**Used in:** `assets/js/auth.js`

**Request:**
```http
POST /api/v1/auth/token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=secret123
```

**Request Body (form-urlencoded):**
```javascript
{
  username: string,  // Email or username
  password: string   // Plain text password
}
```

**Response:**
```javascript
{
  access_token: string,    // JWT token
  token_type: "bearer"     // Always "bearer"
}
```

**JWT Token Payload (decoded):**
```javascript
{
  sub: string,        // Username
  user_id: number,    // User ID (extract this for API calls)
  roles: [
    {id: number, name: string}
  ],
  exp: number         // Expiration timestamp
}
```

**Usage Example:**
```javascript
const response = await API.postForm(Config.ENDPOINTS.AUTH.TOKEN, {
    username: username,
    password: password
});
const token = response.access_token;
Auth.setToken(token);
```

**Notes:**
- Use `API.postForm()` NOT `API.post()` for form-urlencoded data
- Token must be included in all subsequent requests as `Authorization: Bearer {token}`
- Extract user_id from JWT using `Auth.getUserId()` or `Auth.decodeJWT(token)`

---

### Validate Token
**Endpoint:** `POST /api/v1/auth/auth/validate-token`
**Reference:** `endpoints.md` line 24
**Used in:** `assets/js/auth.js`

**Request:**
```http
POST /api/v1/auth/auth/validate-token
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  records: [
    {valid: boolean}
  ]
}
```

---

## Leads

### List Leads (Basic)
**Endpoint:** `GET /api/v1/lead/`
**Reference:** `endpoints.md` line 57
**Used in:** `assets/js/leads.js`

**Request:**
```http
GET /api/v1/lead/?offset=0&limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
```javascript
{
  offset: number,  // Starting index (default: 0)
  limit: number,   // Number of records (default: 50)
  // Future filters:
  // status_id: number,
  // source_id: number,
  // assigned_to_user_id: number
}
```

**Response:**
```javascript
{
  total_count: number,
  records: [
    {
      id: number,
      first_name: string,
      last_name: string,
      email: string,
      phone: string,
      status_id: number,
      source_id: number,
      assigned_to_user_id: number,
      budget_band: "LOW" | "MID" | "HIGH" | "UNKNOWN",
      insurance: string,
      zip: string,
      notes: string,
      // UTM fields
      utm_source: string,
      utm_medium: string,
      utm_campaign: string,
      utm_term: string,
      utm_content: string,
      campaign_id: string,
      adgroup_id: string,
      ext_lead_ref: string,
      // Timestamps
      consent_ts: string,  // ISO 8601
      created_at: string,  // ISO 8601
      updated_at: string,  // ISO 8601
      // Audit fields
      created_by: number,
      updated_by: number
    }
  ]
}
```

---

### List Leads with Relationships
**Endpoint:** `GET /api/v1/lead/with-relationships`
**Reference:** `endpoints.md` line 59
**Used in:** `assets/js/leads.js`

**Request:**
```http
GET /api/v1/lead/with-relationships?offset=0&limit=50
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  total_count: number,
  records: [
    {
      // All fields from basic list, plus:
      status: {
        id: number,
        name: string,
        color: string,
        is_active: boolean
      },
      source: {
        id: number,
        name: string,
        is_active: boolean
      }
      // NOTE: assigned_user relationship NOT included (load separately)
    }
  ]
}
```

**Notes:**
- Currently does NOT include `assigned_user` relationship
- Use parallel call to `GET /api/v1/user/` to build user mapping

---

### Get Single Lead
**Endpoint:** `GET /api/v1/lead/{id}`
**Reference:** `endpoints.md` line 66
**Used in:** `assets/js/leads.js`

**Request:**
```http
GET /api/v1/lead/3
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  records: [
    {
      // All lead fields (same as list response)
      // May include relationships if backend populates them
    }
  ]
}
```

---

### Update Lead
**Endpoint:** `PUT /api/v1/lead/{id}`
**Reference:** `endpoints.md` line 67
**Used in:** `assets/js/leads.js`

**Request:**
```http
PUT /api/v1/lead/3
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  ...all other fields...
}
```

**Request Body:**
```javascript
{
  // Required fields
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  status_id: number,
  source_id: number,
  assigned_to_user_id: number,

  // Optional fields
  budget_band: "LOW" | "MID" | "HIGH" | "UNKNOWN",
  insurance: string,
  zip: string,
  notes: string,

  // UTM fields (optional)
  utm_source: string,
  utm_medium: string,
  utm_campaign: string,
  utm_term: string,
  utm_content: string,
  campaign_id: string,
  adgroup_id: string,
  ext_lead_ref: string,

  // Consent (optional)
  consent_ts: string  // ISO 8601 datetime
}
```

**Response:**
```javascript
{
  records: [
    {
      // Updated lead object with all fields
    }
  ]
}
```

**Usage Example:**
```javascript
const payload = {
    first_name: $('#edit-first-name').val().trim(),
    last_name: $('#edit-last-name').val().trim(),
    email: $('#edit-email').val().trim(),
    phone: $('#edit-phone').val().trim(),
    status_id: this.editDropdowns.status.getValue(),
    source_id: this.editDropdowns.source.getValue(),
    assigned_to_user_id: this.editDropdowns.user.getValue(),
    budget_band: $('#edit-budget-band').val(),
    insurance: $('#edit-insurance').val().trim(),
    zip: $('#edit-zip').val().trim(),
    notes: $('#edit-notes').val().trim()
};

await API.put(`${Config.ENDPOINTS.LEAD.UPDATE}${leadId}`, payload);
```

**Notes:**
- Send ALL fields in payload, not just changed ones
- Backend will validate required fields
- Triggers timeline events and status history updates automatically

---

### Get Lead Statistics
**Endpoint:** `GET /api/v1/lead/stats`
**Reference:** `endpoints.md` line 60
**Used in:** `assets/js/dashboard.js`

**Request:**
```http
GET /api/v1/lead/stats
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  records: [
    {
      total_leads: number,
      new_this_week: number,
      in_progress: number,
      converted: number
    }
  ]
}
```

---

## Lead Notes

### Create Note
**Endpoint:** `POST /api/v1/leadnote/`
**Reference:** `endpoints.md` line 117
**Schema:** `app/schemas/schema_leadnote.py` - `LeadNoteCreate`
**Used in:** `assets/js/leads.js`

**Request:**
```http
POST /api/v1/leadnote/
Authorization: Bearer {token}
Content-Type: application/json

{
  "body": "Called client, left voicemail",
  "is_pinned": false,
  "lead_id": 3,
  "user_id": 1
}
```

**Request Body:**
```javascript
{
  body: string,        // Required - Note text
  is_pinned: boolean,  // Required - Pin to top (default: false)
  lead_id: number,     // Required - Lead ID
  user_id: number      // Optional - Defaults to current user if omitted
}
```

**Response:**
```javascript
{
  records: [
    {
      id: number,
      body: string,
      is_pinned: boolean,
      lead_id: number,
      user_id: number,
      created_at: string,  // ISO 8601
      updated_at: string   // ISO 8601
    }
  ]
}
```

**Usage Example:**
```javascript
const userId = Auth.getUserId();  // Extract from JWT
const payload = {
    body: noteText,
    is_pinned: false,
    lead_id: parseInt(leadId),
    user_id: parseInt(userId)
};

await API.post(Config.ENDPOINTS.LEADNOTE.CREATE, payload);
```

**CURL Test:**
```bash
curl -X POST http://localhost:8002/api/v1/leadnote/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"Test note","is_pinned":false,"lead_id":3,"user_id":1}'
```

**Notes:**
- `user_id` is optional in schema but recommended to include
- Backend will default to current user if omitted
- Creates timeline event automatically

---

### List Notes for Lead
**Endpoint:** `GET /api/v1/leadnote/lead/{lead_id}`
**Reference:** `endpoints.md` line 122
**Used in:** `assets/js/leads.js`

**Request:**
```http
GET /api/v1/leadnote/lead/3
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  total_count: number,
  records: [
    {
      id: number,
      body: string,
      is_pinned: boolean,
      lead_id: number,
      user_id: number,
      created_at: string,  // ISO 8601
      updated_at: string,  // ISO 8601
      // May include user relationship:
      user: {
        id: number,
        username: string,
        email: string,
        first_name: string,
        last_name: string,
        full_name: string
      }
    }
  ]
}
```

**Usage Example:**
```javascript
const response = await API.get(`/api/v1/leadnote/lead/${leadId}`);
const notes = response.records || [];

// Sort by date (newest first)
notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
```

---

## Lead Timeline

### Get Lead Timeline
**Endpoint:** `GET /api/v1/lead/{id}/timeline`
**Reference:** `endpoints.md` line 68
**Used in:** `assets/js/leads.js`

**Request:**
```http
GET /api/v1/lead/3/timeline?offset=0&limit=50
Authorization: Bearer {token}
```

**Query Parameters:**
```javascript
{
  offset: number,  // Starting index (default: 0)
  limit: number    // Number of events (default: 50)
}
```

**Response:**
```javascript
{
  total_count: number,
  records: [
    {
      id: number,
      lead_id: number,
      kind: "status" | "field" | "event" | "note",
      type: string,  // "STATUS_CHANGED", "FIELD_CHANGED", etc.
      actor_user_id: number,
      created_at: string,  // ISO 8601
      payload: {
        // For status changes:
        old_status_id: number,
        new_status_id: number,
        old_name: string,      // Status name
        new_name: string,      // Status name

        // For field changes:
        field: string,         // Field name
        old: string,           // Old value
        new: string,           // New value
        old_name: string,      // Human-readable old value
        new_name: string,      // Human-readable new value

        // For events:
        message: string,
        details: object
      }
    }
  ]
}
```

**Usage Example:**
```javascript
const [timelineResponse, statusesResponse, usersResponse] = await Promise.all([
    API.get(`/api/v1/lead/${leadId}/timeline`, { offset: 0, limit: 50 }),
    API.get(Config.ENDPOINTS.LEADSTATUS.LIST),
    API.get(Config.ENDPOINTS.USER.LIST)
]);

const events = timelineResponse.records || [];
const statuses = statusesResponse.records || [];
const users = usersResponse.records || [];

// Build lookup maps
const statusMap = {};
statuses.forEach(s => { statusMap[s.id] = s.name; });

const userMap = {};
users.forEach(u => { userMap[u.id] = u.full_name || u.username; });
```

**Notes:**
- Timeline includes status changes, field changes, events, and notes
- Status changes appear twice: `kind: "status"` (keep) and `kind: "event"` (filter out)
- Field changes include `old_name` and `new_name` for foreign key fields
- Requires parallel loading of statuses and users for name resolution

---

## Lead Status

### List All Statuses
**Endpoint:** `GET /api/v1/leadstatus/`
**Reference:** `endpoints.md` line 150
**Used in:** `assets/js/components/status-dropdown.js`

**Request:**
```http
GET /api/v1/leadstatus/
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  total_count: number,
  records: [
    {
      id: number,
      name: string,
      color: string,      // Hex color code
      is_active: boolean,
      created_at: string,
      updated_at: string
    }
  ]
}
```

**Usage Example:**
```javascript
const response = await API.get(Config.ENDPOINTS.LEADSTATUS.LIST);
const statuses = response.records || [];

// Build status map for quick lookup
const statusMap = {};
statuses.forEach(status => {
    statusMap[status.id] = status.name;
});
```

---

## Lead Source

### List All Sources
**Endpoint:** `GET /api/v1/leadsource/`
**Reference:** `endpoints.md` line 140
**Used in:** `assets/js/components/source-dropdown.js`

**Request:**
```http
GET /api/v1/leadsource/
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  total_count: number,
  records: [
    {
      id: number,
      name: string,
      is_active: boolean,
      created_at: string,
      updated_at: string
    }
  ]
}
```

**Usage Example:**
```javascript
const response = await API.get(Config.ENDPOINTS.LEADSOURCE.LIST);
const sources = response.records || [];

// Build source map for quick lookup
const sourceMap = {};
sources.forEach(source => {
    sourceMap[source.id] = source.name;
});
```

---

## Users

### List All Users
**Endpoint:** `GET /api/v1/user/`
**Reference:** `endpoints.md` line 229
**Used in:** `assets/js/components/user-dropdown.js`, `assets/js/leads.js`

**Request:**
```http
GET /api/v1/user/
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  total_count: number,
  records: [
    {
      id: number,
      username: string,
      email: string,
      first_name: string,
      last_name: string,
      full_name: string,      // Computed field
      is_active: boolean,
      created_at: string,
      updated_at: string
    }
  ]
}
```

**Usage Example:**
```javascript
const response = await API.get(Config.ENDPOINTS.USER.LIST);
const users = response.records || [];

// Build user map for quick lookup
const userMap = {};
users.forEach(user => {
    const userName = user.full_name ||
                    `${user.first_name} ${user.last_name}` ||
                    user.username ||
                    user.email ||
                    `User #${user.id}`;
    userMap[user.id] = userName;
});
```

**Notes:**
- Use for populating user assignment dropdowns
- Create user map for ID-to-name lookups in timeline and notes
- `full_name` is computed from `first_name` + `last_name` if available

---

### Get Single User
**Endpoint:** `GET /api/v1/user/{id}`
**Reference:** `endpoints.md` line 232
**Used in:** `assets/js/leads.js`

**Request:**
```http
GET /api/v1/user/1
Authorization: Bearer {token}
```

**Response:**
```javascript
{
  records: [
    {
      id: number,
      username: string,
      email: string,
      first_name: string,
      last_name: string,
      full_name: string,
      is_active: boolean,
      created_at: string,
      updated_at: string
    }
  ]
}
```

---

## Common Response Patterns

### Standard List Response
All list endpoints return this structure:
```javascript
{
  total_count: number,    // Total records available
  records: Array          // Array of objects
}
```

### Standard Single Record Response
All single record endpoints return this structure:
```javascript
{
  records: [
    {/* single object */}
  ]
}
```

### Error Response
```javascript
{
  detail: string | Array<{
    loc: string[],
    msg: string,
    type: string
  }>
}
```

**HTTP Status Codes:**
- `200` - Success
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found
- `422` - Validation error (check `detail` field)
- `500` - Server error

---

## API Client Usage (API.js)

### Standard JSON Request
```javascript
const response = await API.get('/api/v1/lead/');
const response = await API.post('/api/v1/leadnote/', payload);
const response = await API.put('/api/v1/lead/3', payload);
const response = await API.delete('/api/v1/lead/3');
```

### Form-Encoded Request (Login Only)
```javascript
const response = await API.postForm('/api/v1/auth/token', {
    username: 'user@example.com',
    password: 'password123'
});
```

### With Query Parameters
```javascript
const response = await API.get('/api/v1/lead/', {
    offset: 0,
    limit: 50,
    status_id: 2
});
```

---

## Verification Checklist

Before implementing any API call:

- [ ] Check `endpoints.md` for exact path and HTTP method
- [ ] Check backend schema files for payload structure
- [ ] Check database models for constraints and relationships
- [ ] Document endpoint + payload in code comments
- [ ] Add curl test example in comments
- [ ] Log full request details (URL, payload, headers)
- [ ] Update this `FRONTEND_API_REFERENCE.md` file
- [ ] Test with curl if there's any ambiguity

---

## Files Referenced

- **Endpoints:** `endpoints.md`
- **Backend Schemas:** `LeadsEngineBackend/app/schemas/`
- **Database Models:** `LeadsEngineBackend/app/db/models.py`
- **Authentication:** `LeadsEngineBackend/app/api/_api_authentication.py`
- **JWT Handler:** `LeadsEngineBackend/app/auth/auth_handler.py`

---

**End of API Reference**
