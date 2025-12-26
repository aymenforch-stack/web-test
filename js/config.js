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
        BOT_TOKEN: "8431861072:AAH1pbgKEiVTTKOLKjfmf_7F_jSaAw9GR2o",
        CHAT_ID: "8421252546"
    }
};

// جعل الإعدادات متاحة عالمياً
window.CONFIG = CONFIG;