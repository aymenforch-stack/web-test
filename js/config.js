// إعدادات التطبيق
const CONFIG = {
    APP_NAME: "استبيان الخدمات المالية",
    VERSION: "1.0.0",
    
    // إعدادات التخزين
    STORAGE_KEYS: {
        PARTICIPANTS: "fs_participants_v2",
        SETTINGS: "fs_settings",
        NOTIFICATIONS: "fs_notifications"
    },
    
    // إعدادات المدير
    ADMIN: {
        USERNAME: "admin",
        PASSWORD: "admin123"
    },
    
    // إعدادات التليجرام (اختياري)
    TELEGRAM: {
        ENABLED: false,
        BOT_TOKEN: "",
        CHAT_ID: ""
    }
};

// جعل الإعدادات متاحة عالمياً
window.CONFIG = CONFIG;