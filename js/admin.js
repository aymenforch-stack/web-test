// لوحة تحكم المدير المعدلة
class AdminApp {
    constructor() {
        this.participants = [];
        this.notifications = [];
        this.init();
    }
    
    init() {
        this.checkLogin();
        this.setupEventListeners();
        this.startAutoRefresh();
    }
    
    // التحقق من تسجيل الدخول
    checkLogin() {
        const loggedIn = localStorage.getItem('admin_logged_in') === 'true';
        const loginTime = localStorage.getItem('admin_login_time');
        
        if (loggedIn && loginTime) {
            // التحقق من انتهاء الجلسة (30 دقيقة)
            const sessionTimeout = 30 * 60 * 1000;
            const currentTime = Date.now();
            const loginTimestamp = parseInt(loginTime);
            
            if (currentTime - loginTimestamp < sessionTimeout) {
                // تمديد الجلسة
                localStorage.setItem('admin_login_time', currentTime.toString());
                this.showDashboard();
                return;
            }
        }
        
        this.showLogin();
    }
    
    // تسجيل الدخول
    login(username, password) {
        if (username === CONFIG.ADMIN.USERNAME && password === CONFIG.ADMIN.PASSWORD) {
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('admin_login_time', Date.now().toString());
            
            this.showDashboard();
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
        this.showLogin();
        this.showNotification('تم تسجيل الخروج', 'info');
    }
    
    // عرض صفحة تسجيل الدخول
    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('dashboard-page').classList.remove('active');
    }
    
    // عرض لوحة التحكم
    showDashboard() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('dashboard-page').classList.add('active');
        this.loadData();
    }
    
    // تحميل البيانات
    loadData() {
        this.loadParticipants();
        this.loadNotifications();
        this.updateStats();
    }
    
    // تحميل المشاركين
    loadParticipants() {
        const data = localStorage.getItem('survey_participants');
        this.participants = data ? JSON.parse(data) : [];
        this.updateParticipantsTable();
    }
    
    // تحميل الإشعارات
    loadNotifications() {
        const data = localStorage.getItem('manager_notifications');
        this.notifications = data ? JSON.parse(data) : [];
        this.updateNotificationsBadge();
    }
    
    // تحديث الإحصائيات
    updateStats() {
        // إجمالي المشاركين
        const totalElement = document.getElementById('admin-total-participants');
        if (totalElement) {
            totalElement.textContent = this.participants.length;
        }
        
        // مشاركات اليوم
        const today = new Date().toDateString();
        const todayCount = this.participants.filter(p => {
            const date = new Date(p.completedAt).toDateString();
            return date === today;
        }).length;
        
        const todayElement = document.getElementById('today-participants');
        if (todayElement) {
            todayElement.textContent = todayCount;
        }
        
        // إشعارات غير مقروءة
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.updateNotificationsBadge(unreadCount);
    }
    
    // تحديث جدول المشاركين
    updateParticipantsTable() {
        const tableBody = document.getElementById('participants-table');
        if (!tableBody) return;
        
        // عرض آخر 10 مشاركات
        const recentParticipants = [...this.participants]
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 10);
        
        tableBody.innerHTML = '';
        
        if (recentParticipants.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>لا توجد مشاركات بعد</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        recentParticipants.forEach(participant => {
            const row = document.createElement('tr');
            
            // تنسيق التاريخ
            const date = new Date(participant.completedAt);
            const formattedDate = date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // عرض الاسم من الخطوة 1
            const name = participant.step1?.fullName || 'غير معروف';
            const phone = participant.step1?.phone || 'غير معروف';
            
            row.innerHTML = `
                <td>
                    <div class="participant-id">${participant.id}</div>
                    <small>${formattedDate}</small>
                </td>
                <td>
                    <div class="participant-name">${name}</div>
                    <small>${phone}</small>
                </td>
                <td>${formattedDate}</td>
                <td>
                    <span class="status-badge completed">مكتمل</span>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // تحديث عداد الإشعارات
    updateNotificationsBadge(count = null) {
        if (count === null) {
            count = this.notifications.filter(n => !n.read).length;
        }
        
        const badge = document.getElementById('notifications-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    // تحديث تلقائي
    startAutoRefresh() {
        // تحديث كل 3 ثوانٍ
        setInterval(() => {
            if (localStorage.getItem('admin_logged_in') === 'true') {
                this.loadData();
            }
        }, 3000);
        
        // الاستماع لتحديثات الاستبيانات
        window.addEventListener('storage', (event) => {
            if (localStorage.getItem('admin_logged_in') !== 'true') return;
            
            if (event.key === 'last_survey_update' || event.key === 'survey_broadcast') {
                this.loadData();
                
                // عرض إشعار عند مشاركة جديدة
                if (event.key === 'survey_broadcast') {
                    this.showNotification('🔔 هناك مشاركة جديدة', 'info');
                }
            }
            
            // تحديث عند استلام إشعارات جديدة
            if (event.key === 'manager_notifications') {
                this.loadNotifications();
            }
        });
    }
    
    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.getElementById('admin-notification');
        if (!notification) return;
        
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
        
        // تحديث البيانات يدوياً
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
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