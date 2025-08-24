
// Comprehensive hardcoded language mapping
const languageMap = {
    'zh_hans': 'Chinese (Simplified)',
    'zh_hant': 'Chinese (Traditional)',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'id': 'Indonesian',
    'ms': 'Malay',
    'tr': 'Turkish',
    'fa': 'Persian',
    'he': 'Hebrew',
    'el': 'Greek',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'uk': 'Ukrainian',
    '': 'Unknown' // Handle empty string case
};

function getToday(format) {
    if (format==='YYYY-MM-DD') {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
    return null;
}

function getLanguageFullName(code) {
    return languageMap[code.toLowerCase()] || 'Unknown';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.getHours().toString().padStart(2, '0') + ':00:00';
}

function formatTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
