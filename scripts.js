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
// Add more shared JS as needed