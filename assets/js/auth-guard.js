/**
 * LeadsEngine Authentication Guard
 * Protects pages from unauthenticated access
 *
 * Usage: Include this script as the FIRST script in the <head> of protected pages
 * <script src="assets/js/auth-guard.js"></script>
 */

(function() {
    // Check if token exists in localStorage
    const token = localStorage.getItem('leadsengine_token');

    // If no token, redirect to login immediately
    if (!token) {
        window.location.href = 'login.html';
    }
})();