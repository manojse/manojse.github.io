// Skrollmates.com Common JS
// Add any shared JS functions here
function startWhatsAppChatTop() {
    const input = document.getElementById('phoneInputTop').value.trim();
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(input)) {
        alert("Please enter a valid phone number with country code (e.g. 919876543210)");
        return;
    }
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const whatsappURL = isMobile
        ? `https://wa.me/${input}`
        : `https://web.whatsapp.com/send/?phone=${input}&text&type=phone_number&app_absent=0`;
    if (isMobile) {
        window.open(whatsappURL, '');
    } else {
        window.open(whatsappURL, '_blank');
    }
}
// FAQ accordion initializer for loan pages
function initLoanFaq() {
    document.querySelectorAll('.loan-faq').forEach(function(container) {
        container.querySelectorAll('.faq-question').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const item = btn.closest('.faq-item');
                const answer = item.querySelector('.faq-answer');
                const open = item.classList.toggle('open');
                // set accessibility attributes
                try { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); } catch (e) {}
                if (answer) answer.hidden = !open;
                // collapse others in same container and update their attributes
                if (open) {
                    container.querySelectorAll('.faq-item.open').forEach(function(other){ 
                        if (other !== item) {
                            other.classList.remove('open');
                            const otherBtn = other.querySelector('.faq-question');
                            const otherAns = other.querySelector('.faq-answer');
                            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                            if (otherAns) otherAns.hidden = true;
                        }
                    });
                }
            });
        });
    });
}
document.addEventListener('DOMContentLoaded', function(){ initLoanFaq(); });
// Add more shared JS as needed