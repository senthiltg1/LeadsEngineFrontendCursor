/**
 * LeadsEngine Form Validation Module
 * Centralized validation utilities for forms across the application
 *
 * Features:
 * - Real-time validation on keyup/keydown
 * - Visual feedback with icons (checkmark/X)
 * - Error messages with format examples
 * - Field-level and form-level validation
 * - Reusable across multiple pages
 *
 * Usage:
 *   const validator = new FormValidator();
 *   validator.setupValidation('myFormId', {
 *     firstName: { required: true, minLength: 2 },
 *     email: { email: true },
 *     phone: { phone: true }
 *   });
 */

class FormValidator {
    constructor() {
        this.validationErrors = {};
        this.validators = {
            /**
             * Check if email format is valid
             */
            isValidEmail(email) {
                if (!email) return false;
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email.trim());
            },

            /**
             * Check if phone format is valid (flexible formats)
             */
            isValidPhone(phone) {
                if (!phone) return false;
                const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
                return phoneRegex.test(phone.trim());
            },

            /**
             * Check if name is valid (min length)
             */
            isValidName(name, minLength = 2) {
                if (!name) return false;
                return name.trim().length >= minLength;
            },

            /**
             * Check if dropdown has value selected
             */
            isValidDropdown(value) {
                return value && value.trim() !== '' && value !== '0';
            }
        };
    }

    /**
     * Validate a single field with live feedback
     * @param {HTMLElement} field - Input field element
     * @param {Object} rules - Validation rules for the field
     * @param {string} formId - Form identifier for error tracking
     * @param {boolean} showEmptyAsNeutral - Don't show error for empty optional fields
     * @returns {boolean} - Whether field is valid
     */
    validateField(field, rules, formId, showEmptyAsNeutral = false) {
        if (!field) return true;

        const value = field.value;
        const fieldName = field.name || field.id;
        let isValid = true;
        let errorMessage = '';
        const isEmpty = !value || !value.trim();

        // Initialize error tracking for this form
        if (!this.validationErrors[formId]) {
            this.validationErrors[formId] = {};
        }

        // Check required
        if (rules.required && isEmpty) {
            isValid = false;
            errorMessage = `${rules.label || fieldName} is required`;
        }
        // Check min length
        else if (rules.minLength && !isEmpty && value.trim().length < rules.minLength) {
            isValid = false;
            errorMessage = `${rules.label || fieldName} must be at least ${rules.minLength} characters`;
        }
        // Check email format
        else if (rules.email && !isEmpty && !this.validators.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Invalid email format (example: user@domain.com)';
        }
        // Check phone format
        else if (rules.phone && !isEmpty && !this.validators.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Invalid phone (example: +1-555-123-4567 or (555) 123-4567)';
        }

        // Handle empty optional fields
        if (isEmpty && showEmptyAsNeutral && !rules.required) {
            field.classList.remove('is-invalid', 'is-valid');
            this.hideFieldError(field);
            this.removeFieldIcon(field);
            delete this.validationErrors[formId][fieldName];
            return true;
        }

        // Update field visual state
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            this.hideFieldError(field);
            this.showFieldIcon(field, 'valid');
            delete this.validationErrors[formId][fieldName];
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            this.showFieldError(field, errorMessage);
            this.showFieldIcon(field, 'invalid');
            this.validationErrors[formId][fieldName] = errorMessage;
        }

        return isValid;
    }

    /**
     * Validate Email OR Phone requirement
     * @param {HTMLElement} emailField - Email input field
     * @param {HTMLElement} phoneField - Phone input field
     * @param {string} formId - Form identifier
     * @returns {boolean} - Whether at least one is provided
     */
    validateEmailOrPhone(emailField, phoneField, formId) {
        const hasEmail = emailField && emailField.value.trim();
        const hasPhone = phoneField && phoneField.value.trim();

        if (!this.validationErrors[formId]) {
            this.validationErrors[formId] = {};
        }

        if (!hasEmail && !hasPhone) {
            // Both empty - show error
            this.validationErrors[formId]['emailOrPhone'] = 'Either Email or Phone is required';
            return false;
        } else {
            // At least one provided - clear error
            delete this.validationErrors[formId]['emailOrPhone'];
            return true;
        }
    }

    /**
     * Show validation icon inside field
     */
    showFieldIcon(field, type) {
        this.removeFieldIcon(field);

        const icon = document.createElement('i');
        icon.className = type === 'valid'
            ? 'fas fa-check-circle text-success validation-icon'
            : 'fas fa-times-circle text-danger validation-icon';
        icon.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none;';
        icon.setAttribute('data-validation-icon', 'true');

        const parent = field.parentNode;
        if (parent && window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }

        parent.appendChild(icon);
    }

    /**
     * Remove validation icon from field
     */
    removeFieldIcon(field) {
        const parent = field.parentNode;
        if (parent) {
            const existingIcon = parent.querySelector('[data-validation-icon]');
            if (existingIcon) {
                existingIcon.remove();
            }
        }
    }

    /**
     * Show error message below field
     */
    showFieldError(field, message) {
        this.hideFieldError(field);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback d-block';
        errorDiv.textContent = message;
        errorDiv.setAttribute('data-validation-error', 'true');

        field.parentNode.appendChild(errorDiv);
    }

    /**
     * Hide error message below field
     */
    hideFieldError(field) {
        const parent = field.parentNode;
        if (parent) {
            const existingError = parent.querySelector('[data-validation-error]');
            if (existingError) {
                existingError.remove();
            }
        }
    }

    /**
     * Update error summary at top of form
     */
    updateErrorSummary(formId, summaryElementId) {
        const summaryDiv = document.getElementById(summaryElementId);
        if (!summaryDiv) return;

        const errors = this.validationErrors[formId] || {};
        const errorKeys = Object.keys(errors);

        if (errorKeys.length > 0) {
            const fieldNames = {
                'firstName': 'First Name',
                'lastName': 'Last Name',
                'email': 'Email format',
                'phone': 'Phone number',
                'status': 'Status',
                'source': 'Source',
                'emailOrPhone': 'Email or Phone'
            };
            const fieldList = errorKeys.map(key => fieldNames[key] || key).join(', ');
            summaryDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Please fix: ${fieldList}</strong>
            `;
            summaryDiv.style.display = 'block';
        } else {
            summaryDiv.innerHTML = '';
            summaryDiv.style.display = 'none';
        }
    }

    /**
     * Setup validation for a form with specified field rules
     * @param {string} formId - Form ID
     * @param {Object} fieldRules - Object mapping field names to validation rules
     * @param {Object} options - Additional options (errorSummaryId, emailOrPhone, onValidationChange)
     */
    setupValidation(formId, fieldRules, options = {}) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`FormValidator: Form not found: ${formId}`);
            return;
        }

        console.log(`FormValidator: Setting up validation for form: ${formId}`);

        // Initialize error tracking
        this.validationErrors[formId] = {};

        // Setup validation for each field
        Object.keys(fieldRules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (!field) {
                console.warn(`FormValidator: Field not found: ${fieldName} in form ${formId}`);
                console.log(`FormValidator: Available fields in form:`, Array.from(form.querySelectorAll('input, select, textarea')).map(f => f.name || f.id));
                return;
            }

            console.log(`FormValidator: Found field ${fieldName}:`, field.tagName, field.type, field.name, field.id);

            const rules = fieldRules[fieldName];

            // Add keyup event for live validation (as user types)
            field.addEventListener('keyup', () => {
                this.validateField(field, rules, formId, rules.optional);

                // Handle Email OR Phone logic
                if (options.emailOrPhone && (fieldName === 'email' || fieldName === 'phone')) {
                    const emailField = form.querySelector('[name="email"], #email');
                    const phoneField = form.querySelector('[name="phone"], #phone');

                    // If user types in either field, clear the emailOrPhone error
                    if (field.value.trim()) {
                        delete this.validationErrors[formId]['emailOrPhone'];
                    }
                }

                // Update error summary
                if (options.errorSummaryId) {
                    this.updateErrorSummary(formId, options.errorSummaryId);
                }

                // Callback for validation state change
                if (options.onValidationChange) {
                    const hasErrors = Object.keys(this.validationErrors[formId] || {}).length > 0;
                    options.onValidationChange(!hasErrors);
                }
            });

            // Add blur event for final validation when leaving field
            field.addEventListener('blur', () => {
                this.validateField(field, rules, formId, false);

                if (options.errorSummaryId) {
                    this.updateErrorSummary(formId, options.errorSummaryId);
                }

                if (options.onValidationChange) {
                    const hasErrors = Object.keys(this.validationErrors[formId] || {}).length > 0;
                    options.onValidationChange(!hasErrors);
                }
            });

            // Add change event for dropdowns
            field.addEventListener('change', () => {
                this.validateField(field, rules, formId, false);

                if (options.errorSummaryId) {
                    this.updateErrorSummary(formId, options.errorSummaryId);
                }

                if (options.onValidationChange) {
                    const hasErrors = Object.keys(this.validationErrors[formId] || {}).length > 0;
                    options.onValidationChange(!hasErrors);
                }
            });
        });
    }

    /**
     * Validate entire form (call before submit)
     * @param {string} formId - Form ID
     * @param {Object} fieldRules - Object mapping field names to validation rules
     * @param {Object} options - Additional options (emailOrPhone)
     * @returns {boolean} - Whether form is valid
     */
    validateForm(formId, fieldRules, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return false;

        this.validationErrors[formId] = {};
        let isValid = true;

        // Validate each field
        Object.keys(fieldRules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (!field) return;

            const rules = fieldRules[fieldName];
            const fieldValid = this.validateField(field, rules, formId, false);
            if (!fieldValid) {
                isValid = false;
            }
        });

        // Validate Email OR Phone if specified
        if (options.emailOrPhone) {
            const emailField = form.querySelector('[name="email"], #email');
            const phoneField = form.querySelector('[name="phone"], #phone');
            const emailOrPhoneValid = this.validateEmailOrPhone(emailField, phoneField, formId);
            if (!emailOrPhoneValid) {
                isValid = false;
            }
        }

        // Update error summary
        if (options.errorSummaryId) {
            this.updateErrorSummary(formId, options.errorSummaryId);
        }

        // Focus first invalid field
        if (!isValid) {
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
            }
        }

        return isValid;
    }

    /**
     * Clear all validation for a form
     */
    clearValidation(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Remove all validation classes and icons
        form.querySelectorAll('.is-valid, .is-invalid').forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
            this.removeFieldIcon(field);
            this.hideFieldError(field);
        });

        // Clear error tracking
        this.validationErrors[formId] = {};
    }
}
