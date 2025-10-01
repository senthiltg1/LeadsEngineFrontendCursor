# COMPREHENSIVE AUDIT REPORT - LeadsEngine Frontend
**Date:** 2025-01-30
**Purpose:** Complete field and feature inventory before building Messages/Email/Attachments

---

## STEP 1: LEAD MODEL FIELD AUDIT

### Core Identity Fields
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `id` | Integer (PK) | ✅ Yes | ❌ No | ❌ No | Read-only, shown in "Additional Information" |
| `first_name` | String(60) | ✅ Yes | ✅ Yes | ✅ Yes | **IMPLEMENTED** |
| `last_name` | String(60) | ✅ Yes | ✅ Yes | ✅ Yes | **IMPLEMENTED** |
| `email` | String(254) | ✅ Yes | ✅ Yes | ✅ Yes | **IMPLEMENTED** |
| `phone` | String(32) | ✅ Yes | ✅ Yes | ✅ Yes | **IMPLEMENTED** |

### Relationship Fields
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `source_id` | Integer (FK) | ✅ Yes | ✅ Yes | ✅ Yes | **IMPLEMENTED** - Dropdown component |
| `status_id` | Integer (FK) | ✅ Yes | ✅ Yes | ✅ Yes | **IMPLEMENTED** - Dropdown component |
| `assigned_to_user_id` | Integer (FK) | ✅ Yes | ✅ Yes | ✅ Yes | **IMPLEMENTED** - Dropdown component |

### Scoring Fields
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `intent_score` | Integer | ✅ Yes | ❌ No | ⚠️ Maybe | Shown in Overview, might be auto-calculated |
| `fit_score` | Float | ✅ Yes | ❌ No | ⚠️ Maybe | Shown in Overview, might be auto-calculated |
| `no_show_risk` | Float | ❌ No | ❌ No | ❌ No | Not shown anywhere - ML feature |
| `lead_value_est` | Float | ❌ No | ❌ No | ⚠️ Maybe | Could be useful for high-value leads |

### **⚠️ CRITICAL MISSING FIELDS**

#### Notes Field - HIGH PRIORITY
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `notes` | Text | ❌ **NO** | ❌ **NO** | ✅ **YES** | **MISSING FROM UI ENTIRELY** - Separate LeadNote table exists for multi-note support |

**Issue:** The Lead model has a `notes` field (Text), but we're using the separate `LeadNote` table instead. The `notes` field is shown nowhere in UI.

**Recommendation:**
- Option A: Show `lead.notes` as "Quick Notes" in Overview tab (read-only summary)
- Option B: Add textarea in Edit tab for `lead.notes` field (internal notes vs. formal LeadNotes)
- Option C: Deprecate `lead.notes` field entirely and only use LeadNote table

#### Budget & Financial Fields
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `budget_band` | Enum | ❌ No | ❌ No | ✅ **YES** | Enum: LOW/MID/HIGH/UNKNOWN - Important for qualification |
| `insurance` | String | ❌ No | ❌ No | ✅ **YES** | Insurance provider name - Critical for dental leads |

#### Location & Demographic
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `zip` | String | ❌ No | ❌ No | ✅ **YES** | Postal code - useful for territory assignment |

#### **⚠️ UTM TRACKING FIELDS - ALL MISSING**
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `utm_source` | String | ❌ No | ❌ No | ❌ No | Marketing attribution - Should display in Overview |
| `utm_medium` | String | ❌ No | ❌ No | ❌ No | Marketing attribution - Should display in Overview |
| `utm_campaign` | String | ❌ No | ❌ No | ❌ No | Marketing attribution - Should display in Overview |
| `utm_term` | String | ❌ No | ❌ No | ❌ No | Marketing attribution - Should display in Overview |
| `utm_content` | String | ❌ No | ❌ No | ❌ No | Marketing attribution - Should display in Overview |

**Recommendation:** Create "Marketing Attribution" section in Overview tab (read-only) showing all UTM parameters.

#### Campaign Tracking
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `campaign_id` | Integer | ❌ No | ❌ No | ❌ No | Platform-specific campaign ID |
| `adgroup_id` | Integer | ❌ No | ❌ No | ❌ No | Platform-specific ad group ID |
| `ext_lead_ref` | String | ❌ No | ❌ No | ❌ No | External reference (e.g., "FB:123", "GOOG:abc") |

**Recommendation:** Show in Overview tab "Campaign Details" section (read-only).

#### Compliance & Consent
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `consent_ts` | DateTime | ❌ No | ❌ No | ❌ No | GDPR/compliance - Should show in Overview |

**Recommendation:** Show consent status in Overview tab. API endpoints exist for consent management.

#### Audit Trail Fields
| Field Name | Type | In Overview? | In Edit? | Should Edit? | Notes |
|------------|------|--------------|----------|--------------|-------|
| `created_at` | DateTime | ✅ Yes | ❌ No | ❌ No | **IMPLEMENTED** |
| `updated_at` | DateTime | ✅ Yes | ❌ No | ❌ No | **IMPLEMENTED** |
| `created_by_id` | Integer (FK) | ❌ No | ❌ No | ❌ No | Should show in Overview |
| `updated_by_id` | Integer (FK) | ❌ No | ❌ No | ❌ No | Should show in Overview |
| `deleted` | Boolean | ❌ No | ❌ No | ❌ No | Soft delete flag |

---

## STEP 2: MISSING FIELDS LIST

### ❌ NOT SHOWN ANYWHERE IN UI
1. **`notes`** (Text) - Lead-level notes field
2. **`budget_band`** (Enum: LOW/MID/HIGH/UNKNOWN)
3. **`insurance`** (String) - Insurance provider
4. **`zip`** (String) - Postal code
5. **All UTM fields** (5 fields) - Marketing attribution
6. **`campaign_id`** (Integer) - Campaign tracking
7. **`adgroup_id`** (Integer) - Ad group tracking
8. **`ext_lead_ref`** (String) - External reference
9. **`consent_ts`** (DateTime) - Consent timestamp
10. **`no_show_risk`** (Float) - ML-based risk score
11. **`lead_value_est`** (Float) - Estimated value
12. **`created_by_id`** (Integer) - Who created the lead
13. **`updated_by_id`** (Integer) - Who last updated
14. **`deleted`** (Boolean) - Soft delete flag

### ✅ SHOWN IN OVERVIEW, ❌ NOT IN EDIT TAB
1. **`intent_score`** (Integer) - Should it be editable?
2. **`fit_score`** (Float) - Should it be editable?

### Priority Classification

#### 🔴 HIGH PRIORITY - Should Add to Edit Tab
1. `budget_band` - Critical for lead qualification
2. `insurance` - Critical for dental practice leads
3. `zip` - Useful for territory/location filtering

#### 🟡 MEDIUM PRIORITY - Should Show in Overview (Read-Only)
1. All UTM fields (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`)
2. `campaign_id`, `adgroup_id` - Campaign attribution
3. `ext_lead_ref` - External system reference
4. `consent_ts` - Compliance tracking
5. `created_by_id`, `updated_by_id` - Audit trail

#### 🟢 LOW PRIORITY - Future Enhancement
1. `notes` field - Decision needed (use LeadNote table vs. this field)
2. `no_show_risk` - ML feature, not ready yet
3. `lead_value_est` - Manual override for auto-calculated value

---

## STEP 3: API ENDPOINTS REVIEW

### ✅ CURRENTLY USED ENDPOINTS

#### Lead Management
- `GET /api/v1/lead/` - List leads ✅ USED
- `GET /api/v1/lead/with-relationships` - List with relations ✅ USED
- `GET /api/v1/lead/{id}` - Read single lead ✅ USED
- `PUT /api/v1/lead/{id}` - Update lead ✅ USED
- `GET /api/v1/lead/{id}/timeline` - Lead timeline ✅ USED

#### Reference Data
- `GET /api/v1/leadstatus/` - Status list ✅ USED (dropdown)
- `GET /api/v1/leadsource/` - Source list ✅ USED (dropdown)
- `GET /api/v1/user/` - User list ✅ USED (dropdown)

#### Notes
- `GET /api/v1/leadnote/lead/{lead_id}` - Notes for lead ✅ USED
- `POST /api/v1/leadnote/lead/{lead_id}` - Create note ⏳ TODO

#### Authentication
- `POST /api/v1/auth/token` - Login ✅ USED

### ❌ AVAILABLE BUT NOT USED YET

#### Lead Operations
- `POST /api/v1/lead/` - Create new lead
- `DELETE /api/v1/lead/{id}/hard-delete` - Delete lead
- `PATCH /api/v1/lead/{id}/assign` - Assign lead (dedicated endpoint)
- `GET /api/v1/lead/stats` - Dashboard statistics
- `POST /api/v1/lead/{lead_id}/score` - Score/re-score lead
- `POST /api/v1/lead/score/bulk` - Bulk scoring
- `POST /api/v1/lead/{id}/touch` - Update last touch timestamp
- `POST /api/v1/lead/{id}/sla/check` - SLA compliance check

#### Consent Management
- `POST /api/v1/lead/{lead_id}/consent` - Give consent
- `DELETE /api/v1/lead/{lead_id}/consent` - Revoke consent

#### Nurture/Automation
- `POST /api/v1/lead/{id}/nurture` - Queue for nurture sequence
- `POST /api/v1/lead/{id}/nurture/pause` - Pause nurture
- `POST /api/v1/lead/{id}/nurture/resume` - Resume nurture
- `POST /api/v1/lead/{id}/nurture/cancel` - Cancel nurture
- `GET /api/v1/lead/{lead_id}/nurture/pending` - Pending nurture items

#### Email Communication
- `GET /api/v1/leademailthread/` - List email threads
- `GET /api/v1/leademailthread/with-relationships` - With details
- `GET /api/v1/leademailmessage/` - List email messages
- `POST /api/v1/leademailmessage/` - Create email (send)

#### SMS Communication
- `GET /api/v1/leadsmsmessage/` - List SMS messages
- `POST /api/v1/leadsmsmessage/` - Create SMS (send)
- `POST /api/v1/send/sms` - Send SMS endpoint

#### Events/History
- `GET /api/v1/leadevent/` - List lead events
- `POST /api/v1/leadevent/` - Create event
- `GET /api/v1/leadstatushistory/` - Status history (alternative to timeline)

---

## STEP 4: RECOMMENDATIONS

### Before Building Messages/Email/Attachments

#### 1️⃣ MUST ADD TO EDIT TAB (High Priority)
Add these fields to the Edit form with proper validation:

```javascript
// In leads.html Edit tab:
<div class="row mb-3">
  <div class="col-md-4">
    <label class="form-label">Budget Band</label>
    <select class="form-control" id="edit-budget-band">
      <option value="UNKNOWN">Unknown</option>
      <option value="LOW">Low ($0-$5K)</option>
      <option value="MID">Mid ($5K-$15K)</option>
      <option value="HIGH">High ($15K+)</option>
    </select>
  </div>
  <div class="col-md-4">
    <label class="form-label">Insurance Provider</label>
    <input type="text" class="form-control" id="edit-insurance" placeholder="e.g., Delta Dental">
  </div>
  <div class="col-md-4">
    <label class="form-label">Zip Code</label>
    <input type="text" class="form-control" id="edit-zip" maxlength="10">
  </div>
</div>
```

**Payload update needed:**
```javascript
const payload = {
    first_name: ...,
    last_name: ...,
    email: ...,
    phone: ...,
    status_id: ...,
    source_id: ...,
    assigned_to_user_id: ...,
    budget_band: $('#edit-budget-band').val(),  // NEW
    insurance: $('#edit-insurance').val(),       // NEW
    zip: $('#edit-zip').val()                    // NEW
};
```

#### 2️⃣ SHOULD ADD TO OVERVIEW TAB (Read-Only Display)

**Marketing Attribution Section:**
```html
<div class="card mb-4">
  <div class="card-header">
    <h6 class="card-title mb-0">Marketing Attribution</h6>
  </div>
  <div class="card-body">
    <div class="row mb-2">
      <div class="col-sm-4"><strong>UTM Source:</strong></div>
      <div class="col-sm-8">${lead.utm_source || 'N/A'}</div>
    </div>
    <!-- ... other UTM fields -->
    <div class="row mb-2">
      <div class="col-sm-4"><strong>External Ref:</strong></div>
      <div class="col-sm-8">${lead.ext_lead_ref || 'N/A'}</div>
    </div>
  </div>
</div>
```

**Compliance Section:**
```html
<div class="row mb-3">
  <div class="col-sm-4"><strong>Consent Given:</strong></div>
  <div class="col-sm-8">
    ${lead.consent_ts ? formatDate(lead.consent_ts) : 'No consent recorded'}
  </div>
</div>
```

#### 3️⃣ NOTES FIELD DECISION
**Decision Required:** How to handle `lead.notes` field?

**Option A:** Add to Edit tab as "Quick Notes" textarea
```html
<div class="mb-3">
  <label class="form-label">Quick Notes (Internal)</label>
  <textarea class="form-control" id="edit-notes" rows="3">${lead.notes || ''}</textarea>
  <small class="text-muted">Use Notes tab for detailed, timestamped notes.</small>
</div>
```

**Option B:** Show in Overview as read-only "Internal Notes" section

**Option C:** Ignore it entirely (use LeadNote table only)

**Recommendation:** Option A - Useful for quick internal comments that don't need full note history.

#### 4️⃣ SCORE FIELDS DECISION
Should `intent_score` and `fit_score` be editable?

**Current:** Shown in Overview (read-only)
**Options:**
- **Keep read-only** if auto-calculated by ML/rules
- **Make editable** if manual override is needed

**Recommendation:** Keep read-only for now. Add dedicated "Re-score" button that calls `POST /api/v1/lead/{lead_id}/score`.

---

## SUMMARY

### Current Implementation Status
- ✅ **7 fields** fully implemented (name, email, phone, status, source, assignment)
- ❌ **14 fields** missing from UI entirely
- ⚠️ **2 fields** shown but not editable (scores)

### Immediate Action Items (Before Messages/Email)
1. ✅ Add `budget_band`, `insurance`, `zip` to Edit tab
2. ✅ Add UTM/marketing attribution to Overview tab
3. ✅ Add compliance/consent info to Overview tab
4. ⚠️ Decide on `lead.notes` field handling
5. ⏳ Consider adding "Re-score" button for score fields

### Post-Messages/Email Enhancements
1. Lead creation form (`POST /api/v1/lead/`)
2. Lead deletion with confirmation
3. Bulk operations (assign, status change)
4. SLA tracking and alerts
5. Nurture sequence enrollment UI

---

## DATABASE SCHEMA REFERENCE

### Lead Model (Full Schema)
```python
class Lead(Base):
    # Identity
    id: Integer (PK)
    first_name: String(60)         ✅ IN UI
    last_name: String(60)          ✅ IN UI
    email: String(254)             ✅ IN UI
    phone: String(32)              ✅ IN UI

    # Relationships
    source_id: Integer (FK)        ✅ IN UI
    status_id: Integer (FK)        ✅ IN UI
    assigned_to_user_id: Integer   ✅ IN UI

    # Scoring
    intent_score: Integer          ✅ OVERVIEW ONLY
    fit_score: Float               ✅ OVERVIEW ONLY
    no_show_risk: Float            ❌ MISSING
    lead_value_est: Float          ❌ MISSING

    # Business
    budget_band: Enum              ❌ MISSING - HIGH PRIORITY
    insurance: String              ❌ MISSING - HIGH PRIORITY
    zip: String                    ❌ MISSING - HIGH PRIORITY
    notes: Text                    ❌ MISSING - DECISION NEEDED

    # Marketing
    utm_source: String             ❌ MISSING
    utm_medium: String             ❌ MISSING
    utm_campaign: String           ❌ MISSING
    utm_term: String               ❌ MISSING
    utm_content: String            ❌ MISSING
    campaign_id: Integer           ❌ MISSING
    adgroup_id: Integer            ❌ MISSING
    ext_lead_ref: String           ❌ MISSING

    # Compliance
    consent_ts: DateTime           ❌ MISSING

    # Audit
    created_at: DateTime           ✅ IN UI
    updated_at: DateTime           ✅ IN UI
    created_by_id: Integer         ❌ MISSING
    updated_by_id: Integer         ❌ MISSING
    deleted: Boolean               ❌ MISSING
```

---

**END OF AUDIT REPORT**
