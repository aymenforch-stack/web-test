// نظام قاعدة البيانات المحلية
class Database {
    constructor() {
        this.init();
    }
    
    // تهيئة التخزين
    init() {
        // تهيئة المشاركين إذا لم يكن موجوداً
        if (!this.getParticipants().length) {
            this.saveParticipants([]);
        }
    }
    
    // إدارة المشاركين
    addParticipant(participantData) {
        try {
            const participants = this.getParticipants();
            
            // توليد ID فريد
            const participantId = 'ALG-' + Date.now().toString().slice(-6) + 
                Math.random().toString(36).substr(2, 4).toUpperCase();
            
            const participant = {
                id: participantId,
                ...participantData,
                createdAt: new Date().toISOString(),
                status: 'new',
                deviceInfo: this.getDeviceInfo()
            };
            
            participants.push(participant);
            this.saveParticipants(participants);
            
            // إرسال إشعار للمدير
            this.notifyAdmin('new_participant', participant);
            
            // تحديث العدادات
            this.updateCounters();
            
            return { success: true, id: participantId, participant };
            
        } catch (error) {
            console.error('خطأ في حفظ المشارك:', error);
            return { success: false, error: error.message };
        }
    }
    
    getParticipants() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.PARTICIPANTS);
        return data ? JSON.parse(data) : [];
    }
    
    saveParticipants(participants) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
        
        // تحديث تاريخ آخر تعديل
        localStorage.setItem('fs_last_update', Date.now().toString());
    }
    
    // إشعارات المدير
    notifyAdmin(type, data) {
        const notifications = this.getNotifications();
        
        notifications.push({
            id: 'notif_' + Date.now(),
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
        
        // بث الحدث للصفحات الأخرى
        this.broadcastUpdate();
    }
    
    getNotifications() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS);
        return data ? JSON.parse(data) : [];
    }
    
    // تحديثات تلقائية
    broadcastUpdate() {
        // استخدام localStorage كوسيلة للبث
        localStorage.setItem('fs_broadcast', Date.now().toString());
    }
    
    // أدوات مساعدة
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
    
    updateCounters() {
        const participants = this.getParticipants();
        document.getElementById('total-participants').textContent = participants.length;
    }
}

// إنشاء نسخة عامة من قاعدة البيانات
window.DB = new Database();