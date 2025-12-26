// تطبيق لوحة تحكم المدير
class AdminApp {
    constructor() {
        this.participants = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        
        // التحقق من تحديثات البيانات
        this.startAutoRefresh();
    }
    
    // تسجيل الدخول
    login(username, password) {
        if (username === CONFIG.ADMIN.USERNAME && password === CONFIG.ADMIN.PASSWORD) {
            // حفظ حالة تسجيل الدخول
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_login_time', Date.now().toString());
            
            // الانتقال للوحة التحكم
            document.getElementById('login-page').classList.remove('active');
            document.getElementById('dashboard-page').classList.add('active');
            
            // تحميل البيانات
            this.loadData();
            
            this.showNotification('تم تسجيل الدخول بنجاح', 'success');
            return true;
        } else {
            this.showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            return false;
        }
    }
    
    // تسجيل الخروج
    logout() {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_login_time');
        
        document.getElementById('dashboard-page').classList.remove('active');
        document.getElementById('login-page').classList.add('active');
        
        this.showNotification('تم تسجيل الخروج', 'info');
    }
    
    // تحميل البيانات
    loadData() {
        // جلب المشاركين من قاعدة البيانات
        this.participants = DB.getParticipants();
        
        // تحديث الإحصائيات
        this.updateStats();
        
        // تحديث الجدول
        this.updateTable();
    }
    
    // تحديث الإحصائيات
    updateStats() {
        const totalParticipants = this.participants.length;
        
        // مشاركات اليوم
        const today = new Date().toDateString();
        const todayParticipants = this.participants.filter(p => {
            const participantDate = new Date(p.createdAt).toDateString();
            return participantDate === today;
        }).length;
        
        // تحديث العناصر
        document.getElementById('admin-total-participants').textContent = totalParticipants;
        document.getElementById('today-participants').textContent = todayParticipants;
    }
    
    // تحديث جدول المشاركين
    updateTable() {
        const tableBody = document.getElementById('participants-table');
        const recentParticipants = this.participants.slice(-10).reverse(); // آخر 10 مشاركات
        
        tableBody.innerHTML = '';
        
        if (recentParticipants.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #64748b;">
                        لا توجد مشاركات بعد
                    </td>
                </tr>
            `;
            return;
        }
        
        recentParticipants.forEach(participant => {
            const row = document.createElement('tr');
            
            // تنسيق التاريخ
            const date = new Date(participant.createdAt);
            const formattedDate = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            row.innerHTML = `
                <td>${participant.id}</td>
                <td>${participant.phone}</td>
                <td>${formattedDate}</td>
                <td>
                    <span class="status-badge status-new">جديد</span>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // تحديث تلقائي
    startAutoRefresh() {
        // تحديث كل 3 ثوانٍ
        setInterval(() => {
            if (localStorage.getItem('admin_logged_in') === 'true') {
                this.loadData();
            }
        }, 3000);
        
        // الاستماع لتحديثات قاعدة البيانات
        window.addEventListener('storage', (event) => {
            if (event.key === 'fs_last_update' || event.key === 'fs_broadcast') {
                if (localStorage.getItem('admin_logged_in') === 'true') {
                    this.loadData();
                    
                    // عرض إشعار عند مشاركة جديدة
                    if (event.key === 'fs_broadcast') {
                        this.showNotification('تمت إضافة مشاركة جديدة', 'info');
                    }
                }
            }
        });
    }
    
    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.getElementById('admin-notification');
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تسجيل الدخول
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                this.login(username, password);
            });
        }
        
        // التحقق من تسجيل الدخول السابق
        this.checkLoginStatus();
    }
    
    // التحقق من حالة تسجيل الدخول
    checkLoginStatus() {
        const loggedIn = localStorage.getItem('admin_logged_in');
        const loginTime = localStorage.getItem('admin_login_time');
        
        if (loggedIn === 'true' && loginTime) {
            // التحقق من انتهاء الجلسة (30 دقيقة)
            const sessionTimeout = 30 * 60 * 1000; // 30 دقيقة بالميلي ثانية
            const currentTime = Date.now();
            const loginTimestamp = parseInt(loginTime);
            
            if (currentTime - loginTimestamp < sessionTimeout) {
                // تمديد الجلسة
                localStorage.setItem('admin_login_time', currentTime.toString());
                
                // تسجيل الدخول التلقائي
                document.getElementById('login-page').classList.remove('active');
                document.getElementById('dashboard-page').classList.add('active');
                this.loadData();
            } else {
                // انتهت الجلسة
                localStorage.removeItem('admin_logged_in');
                localStorage.removeItem('admin_login_time');
            }
        }
    }
}

// بدء تطبيق المدير
let Admin;
document.addEventListener('DOMContentLoaded', () => {
    Admin = new AdminApp();
    
    // جعل الدوال متاحة عالمياً
    window.logout = () => Admin.logout();
    window.refreshData = () => Admin.loadData();
});