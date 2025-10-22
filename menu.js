// Common menu toggle logic for all pages
function toggleMenu() {
    var menu = document.getElementById('mainMenu');
    menu.classList.toggle('open');
}

// Handle mobile dropdown toggles
function toggleMobileDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    var dropdown = event.target.closest('.menu-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('mobile-open');
        
        // Close other dropdowns
        var otherDropdowns = document.querySelectorAll('.menu-dropdown.mobile-open');
        otherDropdowns.forEach(function(other) {
            if (other !== dropdown) {
                other.classList.remove('mobile-open');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Menu.js: DOM Content Loaded');
    
    var toggle = document.getElementById('menuToggle');
    if (toggle) {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });
        console.log('Menu.js: Mobile toggle attached');
    }
    
    // Handle dropdown clicks
    var dropdownToggles = document.querySelectorAll('.menu-dropdown-toggle');
    console.log('Menu.js: Found', dropdownToggles.length, 'dropdown toggles');
    
    dropdownToggles.forEach(function(toggle, index) {
        toggle.addEventListener('click', function(e) {
            console.log('Menu.js: Dropdown toggle', index, 'clicked');
            e.preventDefault();
            e.stopPropagation();
            
            // Only handle mobile behavior on mobile screens
            if (window.innerWidth <= 800) {
                toggleMobileDropdown(e);
            } else {
                console.log('Menu.js: Desktop mode - hover should handle dropdown');
            }
        });
        
        // Prevent any default link behavior
        toggle.addEventListener('mousedown', function(e) {
            if (e.target.tagName === 'A') {
                e.preventDefault();
            }
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        var menu = document.getElementById('mainMenu');
        if (menu && menu.classList.contains('open')) {
            var toggle = document.getElementById('menuToggle');
            if (!menu.contains(event.target) && event.target !== toggle) {
                menu.classList.remove('open');
                // Close all mobile dropdowns
                var openDropdowns = document.querySelectorAll('.menu-dropdown.mobile-open');
                openDropdowns.forEach(function(dropdown) {
                    dropdown.classList.remove('mobile-open');
                });
            }
        }
    });
    
    // Handle window resize to close mobile dropdowns on desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 800) {
            var openDropdowns = document.querySelectorAll('.menu-dropdown.mobile-open');
            openDropdowns.forEach(function(dropdown) {
                dropdown.classList.remove('mobile-open');
            });
        }
    });
    
    console.log('Menu.js: All event listeners attached');
});
