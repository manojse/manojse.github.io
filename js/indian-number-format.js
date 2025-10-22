/**
 * Indian Number Formatting Utilities
 * Common functions for formatting numbers in Indian locale with rupee symbol
 */

// Format amount with Indian rupee symbol and comma separation
function formatIndianRupee(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return '₹0';
    }
    return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// Format amount without rupee symbol, just comma separation
function formatIndianNumber(number) {
    if (isNaN(number) || number === null || number === undefined) {
        return '0';
    }
    return Math.round(number).toLocaleString('en-IN');
}

// Format input fields with commas (for user input)
function formatNumberInput(input) {
    if (!input || !input.value) return;
    
    let value = input.value.replace(/[^\d]/g, '');
    if (value) {
        input.value = parseInt(value).toLocaleString('en-IN');
    }
}

// Parse Indian formatted number string to actual number
function parseIndianNumber(str) {
    if (!str) return 0;
    return parseFloat(str.toString().replace(/[₹,\s]/g, '')) || 0;
}

// Format decimal numbers with Indian formatting
function formatIndianDecimal(amount, decimals = 2) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return '0';
    }
    return amount.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format rupee with decimal places
function formatIndianRupeeDecimal(amount, decimals = 2) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return '₹0.00';
    }
    return '₹' + amount.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format large numbers with K, L, Cr suffixes (Indian style)
function formatIndianShort(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return '₹0';
    }
    
    const absAmount = Math.abs(amount);
    let formatted;
    
    if (absAmount >= 10000000) { // 1 Crore
        formatted = '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    } else if (absAmount >= 100000) { // 1 Lakh
        formatted = '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (absAmount >= 1000) { // 1 Thousand
        formatted = '₹' + (amount / 1000).toFixed(1) + 'K';
    } else {
        formatted = '₹' + Math.round(amount).toLocaleString('en-IN');
    }
    
    return formatted;
}

// Add event listeners for automatic formatting of input fields
function setupIndianNumberFormatting(inputIds) {
    document.addEventListener('DOMContentLoaded', function() {
        inputIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                // Format on input
                input.addEventListener('input', function() {
                    formatNumberInput(this);
                });
                
                // Format on blur
                input.addEventListener('blur', function() {
                    formatNumberInput(this);
                });
                
                // Initial formatting if value exists
                if (input.value) {
                    formatNumberInput(input);
                }
            }
        });
    });
}

// Validate Indian number input
function validateIndianNumber(input, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const value = parseIndianNumber(input.value);
    
    if (value < min) {
        input.value = min.toLocaleString('en-IN');
        return min;
    }
    
    if (value > max) {
        input.value = max.toLocaleString('en-IN');
        return max;
    }
    
    return value;
}

// Format percentage with Indian locale
function formatIndianPercentage(percentage, decimals = 1) {
    if (isNaN(percentage) || percentage === null || percentage === undefined) {
        return '0.0%';
    }
    return percentage.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }) + '%';
}

// Convert number to words in Indian style (for amounts)
function numberToWordsIndian(amount) {
    if (amount === 0) return 'Zero Rupees';
    
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertGroup(num) {
        let result = '';
        
        if (num >= 100) {
            result += units[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }
        
        if (num >= 20) {
            result += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        } else if (num >= 10) {
            result += teens[num - 10] + ' ';
            return result;
        }
        
        if (num > 0) {
            result += units[num] + ' ';
        }
        
        return result;
    }
    
    let crores = Math.floor(amount / 10000000);
    amount %= 10000000;
    
    let lakhs = Math.floor(amount / 100000);
    amount %= 100000;
    
    let thousands = Math.floor(amount / 1000);
    amount %= 1000;
    
    let hundreds = amount;
    
    let result = '';
    
    if (crores > 0) {
        result += convertGroup(crores) + 'Crore ';
    }
    
    if (lakhs > 0) {
        result += convertGroup(lakhs) + 'Lakh ';
    }
    
    if (thousands > 0) {
        result += convertGroup(thousands) + 'Thousand ';
    }
    
    if (hundreds > 0) {
        result += convertGroup(hundreds);
    }
    
    return result.trim() + ' Rupees';
}

// Export functions for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatIndianRupee,
        formatIndianNumber,
        formatNumberInput,
        parseIndianNumber,
        formatIndianDecimal,
        formatIndianRupeeDecimal,
        formatIndianShort,
        setupIndianNumberFormatting,
        validateIndianNumber,
        formatIndianPercentage,
        numberToWordsIndian
    };
}