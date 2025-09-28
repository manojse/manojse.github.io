// Common menu toggle logic for all pages
function toggleMenu() {
    var menu = document.getElementById('mainMenu');
    menu.classList.toggle('open');
}
document.addEventListener('DOMContentLoaded', function() {
    var toggle = document.getElementById('menuToggle');
    if (toggle) {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });
    }
    document.addEventListener('click', function(event) {
        var menu = document.getElementById('mainMenu');
        if (menu && menu.classList.contains('open')) {
            var toggle = document.getElementById('menuToggle');
            if (!menu.contains(event.target) && event.target !== toggle) {
                menu.classList.remove('open');
            }
        }
    });
});
