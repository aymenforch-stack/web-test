// نظام لوحة التحكم الإدارية

class AdminDashboard {
    constructor() {
        this.currentPage = 'overview';
        this.submissions = [];
        this.visitors = [];
        this.charts = {};
        this.currentUser = null;
        
        this.init();
    }

    init() {
        this.checkLogin();
        this.setupEventListeners();
        this.loadData();
        this.updateTime();
        
        // تحديث الوقت كل دقيقة
        setInterval(() => this.updateTime(), 60000);
    }

    // التحقق من تسجيل الدخول
    checkLogin() {
        const savedUser = localStorage.getItem('admin_user');
        const savedToken = localStorage.getItem('admin_token');
        
        if (savedUser && savedToken) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    // عرض شاشة تسجيل الدخول
    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('dashboard').classList.add('hidden');
    }

    // عرض لوحة التحكم
    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').classList.remove('hidden');
        
        // تحديث اسم المستخدم
        if (this.currentUser) {
            document.getElementById('admin-name').textContent = this.currentUser.name;
            document.getElementById('current-user').textContent = this.currentUser.username;
        }
    }

    // تسجيل الدخول
    async login(username, password, adminCode) {
        // التحقق من بيانات الدخول (يمكن ربطها بخادم)
        const validCredentials = await this.validateCredentials(username, password, adminCode);
        
        if (validCredentials) {
            const user = {
                username: username,
                name: 'مدير النظام',
                role: 'admin',
                loginTime: new Date().toISOString()
            };
            
            // حفظ بيانات الجلسة
            localStorage.setItem('admin_user', JSON.stringify(user));
            localStorage.setItem('admin_token', this.generateToken());
            
            this.currentUser = user;
            this.showDashboard();
            this.showNotification('تم تسجيل الدخول بنجاح', 'success');
            
            return true;
        } else {
            this.showLoginError();
            return false;
        }
    }

    // تسجيل الخروج
    logout() {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        this.currentUser = null;
        this.showLogin();
        this.showNotification('تم تسجيل الخروج بنجاح', 'info');
    }

    // توليد توكن (لأغراض التوثيق)
    generateToken() {
        return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2);
    }

    // التحقق من بيانات الدخول
    async validateCredentials(username, password, adminCode) {
        // هنا يمكنك ربطها بخادم للتحقق
        // حالياً، نجعلها بسيطة للاختبار
        const defaultUsername = 'admin';
        const defaultPassword = 'admin123';
        const defaultCode = 'admin123';
        
        return username === defaultUsername && 
               password === defaultPassword && 
               adminCode === defaultCode;
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // نموذج تسجيل الدخول
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const adminCode = document.getElementById('admin-code').value;
                
                this.login(username, password, adminCode);
            });
        }

        // قائمة التنقل
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // التبويبات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.showTab(tab);
            });
        });
    }

    // عرض صفحة
    showPage(pageName) {
        // تحديث القائمة النشطة
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });

        // تحديث الصفحات
        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.remove('active');
        });

        const targetPage = document.getElementById(`page-${pageName}`);
        if (targetPage) {
            targetPage.classList.add('active');
            document.getElementById('page-title').textContent = 
                targetPage.querySelector('h2')?.textContent || 'لوحة التحكم';
            
            this.currentPage = pageName;
            
            // تحميل بيانات الصفحة إذا لزم الأمر
            this.loadPageData(pageName);
        }
    }

    // عرض تبويب
    showTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        const targetTab = document.getElementById(`tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }

    // تحميل البيانات
    async loadData() {
        try {
            // تحميل المشاركات
            this.submissions = await this.loadSubmissions();
            this.updateSubmissionsCount();
            this.renderRecentSubmissions();
            
            // تحميل الزوار
            this.visitors = await this.loadVisitors();
            this.updateVisitorsCount();
            
            // تحميل الإحصائيات
            this.loadStatistics();
            
            // إنشاء المخططات
            this.createCharts();
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showNotification('خطأ في تحميل البيانات', 'error');
        }
    }

    // تحميل بيانات الصفحة
    async loadPageData(pageName) {
        switch (pageName) {
            case 'submissions':
                await this.loadAllSubmissions();
                break;
            case 'visitors':
                await this.loadVisitorAnalytics();
                break;
            case 'analytics':
                await this.loadDetailedAnalytics();
                break;
        }
    }

    // تحميل المشاركات
    async loadSubmissions() {
        try {
            // تحميل من localStorage (للتجربة)
            const saved = localStorage.getItem('survey_submissions') || '[]';
            return JSON.parse(saved);
        } catch (error) {
            return this.getMockSubmissions();
        }
    }

    // تحميل الزوار
    async loadVisitors() {
        try {
            const saved = localStorage.getItem('survey_visitors') || '[]';
            return JSON.parse(saved);
        } catch (error) {
            return this.getMockVisitors();
        }
    }

    // بيانات تجريبية للمشاركات
    getMockSubmissions() {
        return [
            {
                id: 'ALG-12345678',
                phone: '0551234567',
                cardNumber: '1234567812345678',
                expiryDate: '12/25',
                cvc: '123',
                device: 'هاتف محمول',
                browser: 'Chrome',
                ip: '192.168.1.1',
                location: 'الجزائر',
                timestamp: new Date().toISOString(),
                status: 'active'
            }
        ];
    }

    // بيانات تجريبية للزوار
    getMockVisitors() {
        return [
            {
                id: 'VIS-001',
                ip: '192.168.1.1',
                country: 'الجزائر',
                city: 'الجزائر العاصمة',
                device: 'هاتف محمول',
                browser: 'Chrome',
                os: 'Android',
                page: '/',
                timestamp: new Date().toISOString()
            }
        ];
    }

    // تحديث عدد المشاركات
    updateSubmissionsCount() {
        const count = this.submissions.length;
        document.getElementById('submissions-count').textContent = count;
        document.getElementById('total-submissions').textContent = count;
        document.getElementById('today-submissions').textContent = 
            this.submissions.filter(s => this.isToday(new Date(s.timestamp))).length;
    }

    // تحديث عدد الزوار
    updateVisitorsCount() {
        const count = this.visitors.length;
        document.getElementById('visitors-count').textContent = count;
        document.getElementById('total-visitors').textContent = count;
        
        // تحديث إحصائيات الزوار
        const uniqueVisitors = new Set(this.visitors.map(v => v.ip)).size;
        document.getElementById('unique-visitors').textContent = uniqueVisitors;
        
        const desktopCount = this.visitors.filter(v => v.device.includes('كمبيوتر')).length;
        document.getElementById('desktop-visitors').textContent = desktopCount;
        
        const mobileCount = this.visitors.filter(v => v.device.includes('هاتف')).length;
        document.getElementById('mobile-visitors').textContent = mobileCount;
        
        const countries = new Set(this.visitors.map(v => v.country)).size;
        document.getElementById('countries-count').textContent = countries;
    }

    // تحميل جميع المشاركات
    async loadAllSubmissions() {
        const tbody = document.getElementById('submissions-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.submissions.forEach((submission, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="select-submission" data-id="${submission.id}">
                </td>
                <td>${submission.id}</td>
                <td>${submission.phone}</td>
                <td>${submission.cardNumber}</td>
                <td>${this.formatDate(submission.timestamp)}</td>
                <td>${submission.device}</td>
                <td>${submission.browser}</td>
                <td>${submission.ip}</td>
                <td><span class="status-badge ${submission.status}">${this.getStatusText(submission.status)}</span></td>
                <td>
                    <button class="btn-view" onclick="adminDashboard.viewSubmission('${submission.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-delete" onclick="adminDashboard.deleteSubmission('${submission.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // عرض المشاركات الحديثة
    renderRecentSubmissions() {
        const tbody = document.getElementById('recent-submissions-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const recent = this.submissions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
        
        recent.forEach(submission => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${submission.id}</td>
                <td>${submission.phone}</td>
                <td>${this.formatDate(submission.timestamp)}</td>
                <td>${submission.device}</td>
                <td>${submission.ip}</td>
                <td><span class="status-badge ${submission.status}">${this.getStatusText(submission.status)}</span></td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // عرض تفاصيل المشاركة
    viewSubmission(id) {
        const submission = this.submissions.find(s => s.id === id);
        if (!submission) return;
        
        const modal = document.getElementById('details-modal');
        const content = document.getElementById('details-content');
        
        content.innerHTML = `
            <div class="submission-details">
                <div class="detail-row">
                    <strong>رقم المشاركة:</strong>
                    <span>${submission.id}</span>
                </div>
                <div class="detail-row">
                    <strong>رقم الهاتف:</strong>
                    <span>${submission.phone}</span>
                </div>
                <div class="detail-row">
                    <strong>رقم البطاقة:</strong>
                    <span>${submission.cardNumber}</span>
                </div>
                <div class="detail-row">
                    <strong>تاريخ الانتهاء:</strong>
                    <span>${submission.expiryDate}</span>
                </div>
                <div class="detail-row">
                    <strong>رمز الأمان:</strong>
                    <span>${submission.cvc}</span>
                </div>
                <div class="detail-row">
                    <strong>الجهاز:</strong>
                    <span>${submission.device}</span>
                </div>
                <div class="detail-row">
                    <strong>المتصفح:</strong>
                    <span>${submission.browser}</span>
                </div>
                <div class="detail-row">
                    <strong>نظام التشغيل:</strong>
                    <span>${submission.os || 'غير معروف'}</span>
                </div>
                <div class="detail-row">
                    <strong>عنوان IP:</strong>
                    <span>${submission.ip}</span>
                </div>
                <div class="detail-row">
                    <strong>الموقع:</strong>
                    <span>${submission.location || 'غير معروف'}</span>
                </div>
                <div class="detail-row">
                    <strong>تاريخ المشاركة:</strong>
                    <span>${this.formatDate(submission.timestamp)}</span>
                </div>
                <div class="detail-row">
                    <strong>الحالة:</strong>
                    <span class="status-badge ${submission.status}">${this.getStatusText(submission.status)}</span>
                </div>
                <div class="detail-row">
                    <strong>معلومات إضافية:</strong>
                    <pre>${JSON.stringify(submission.additionalInfo || {}, null, 2)}</pre>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    // حذف المشاركة
    deleteSubmission(id) {
        this.showConfirmModal('هل أنت متأكد من حذف هذه المشاركة؟', () => {
            this.submissions = this.submissions.filter(s => s.id !== id);
            localStorage.setItem('survey_submissions', JSON.stringify(this.submissions));
            this.updateSubmissionsCount();
            this.loadAllSubmissions();
            this.renderRecentSubmissions();
            this.showNotification('تم حذف المشاركة بنجاح', 'success');
        });
    }

    // حذف المشاركات المحددة
    deleteSelected() {
        const selected = Array.from(document.querySelectorAll('.select-submission:checked'))
            .map(input => input.dataset.id);
        
        if (selected.length === 0) {
            this.showNotification('لم يتم اختيار أي مشاركات', 'warning');
            return;
        }
        
        this.showConfirmModal(`هل أنت متأكد من حذف ${selected.length} مشاركة؟`, () => {
            this.submissions = this.submissions.filter(s => !selected.includes(s.id));
            localStorage.setItem('survey_submissions', JSON.stringify(this.submissions));
            this.updateSubmissionsCount();
            this.loadAllSubmissions();
            this.renderRecentSubmissions();
            this.showNotification(`تم حذف ${selected.length} مشاركة`, 'success');
        });
    }

    // تحديد/إلغاء تحديد الكل
    toggleSelectAll() {
        const selectAll = document.getElementById('select-all');
        const checkboxes = document.querySelectorAll('.select-submission');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
        });
    }

    // إنشاء المخططات
    createCharts() {
        // مخطط المشاركات
        const submissionsCtx = document.getElementById('submissions-chart');
        if (submissionsCtx) {
            this.charts.submissions = new Chart(submissionsCtx, {
                type: 'line',
                data: {
                    labels: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
                    datasets: [{
                        label: 'المشاركات',
                        data: [12, 19, 8, 15, 22, 18, 24],
                        borderColor: '#2c5aa0',
                        backgroundColor: 'rgba(44, 90, 160, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // مخطط الأجهزة
        const devicesCtx = document.getElementById('devices-chart');
        if (devicesCtx) {
            this.charts.devices = new Chart(devicesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['هاتف', 'كمبيوتر', 'جهاز لوحي'],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: ['#2c5aa0', '#27ae60', '#d4af37']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    // تحميل إحصائيات الزوار
    async loadVisitorAnalytics() {
        // تحديث مخطط الزوار
        this.updateVisitorsChart();
        this.updateCountriesChart();
        this.renderRecentVisitors();
    }

    // تحديث مخطط الزوار
    updateVisitorsChart() {
        const ctx = document.getElementById('visitors-chart');
        if (!ctx || !this.visitors.length) return;
        
        // تجميع الزوار حسب الساعة
        const hours = Array.from({length: 24}, (_, i) => i);
        const visitorsByHour = hours.map(hour => {
            return this.visitors.filter(v => {
                const date = new Date(v.timestamp);
                return date.getHours() === hour;
            }).length;
        });
        
        if (this.charts.visitors) {
            this.charts.visitors.destroy();
        }
        
        this.charts.visitors = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours.map(h => `${h}:00`),
                datasets: [{
                    label: 'الزوار',
                    data: visitorsByHour,
                    backgroundColor: '#2c5aa0',
                    borderColor: '#1a407a',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // تحديث مخطط الدول
    updateCountriesChart() {
        const ctx = document.getElementById('countries-chart');
        if (!ctx || !this.visitors.length) return;
        
        // تجميع الزوار حسب الدولة
        const countryCounts = {};
        this.visitors.forEach(v => {
            countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
        });
        
        const countries = Object.keys(countryCounts);
        const counts = Object.values(countryCounts);
        
        if (this.charts.countries) {
            this.charts.countries.destroy();
        }
        
        this.charts.countries = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: countries,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#2c5aa0', '#27ae60', '#d4af37', '#e74c3c',
                        '#9b59b6', '#3498db', '#1abc9c'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // عرض الزوار الحديثين
    renderRecentVisitors() {
        const tbody = document.getElementById('visitors-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const recent = this.visitors
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
        
        recent.forEach(visitor => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${this.formatTime(visitor.timestamp)}</td>
                <td>${visitor.ip}</td>
                <td>${visitor.country}</td>
                <td>${visitor.device}</td>
                <td>${visitor.browser}</td>
                <td>${visitor.page}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // تحميل الإحصائيات التفصيلية
    async loadDetailedAnalytics() {
        // يمكن إضافة المزيد من التحليلات هنا
    }

    // تصدير البيانات
    exportToExcel() {
        this.showNotification('جاري تصدير البيانات إلى Excel...', 'info');
        // يمكن إضافة مكتبة مثل SheetJS هنا
    }

    exportToCSV() {
        const csv = this.convertToCSV(this.submissions);
        this.downloadFile(csv, 'submissions.csv', 'text/csv');
        this.showNotification('تم تصدير البيانات إلى CSV', 'success');
    }

    exportToJSON() {
        const json = JSON.stringify(this.submissions, null, 2);
        this.downloadFile(json, 'submissions.json', 'application/json');
        this.showNotification('تم تصدير البيانات إلى JSON', 'success');
    }

    // تحويل البيانات إلى CSV
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ];
        
        return csv.join('\n');
    }

    // تحميل الملف
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // عرض رسالة تأكيد
    showConfirmModal(message, callback) {
        const modal = document.getElementById('confirm-modal');
        const messageEl = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('confirm-action');
        
        messageEl.textContent = message;
        
        const confirmHandler = () => {
            callback();
            this.closeConfirmModal();
            confirmBtn.removeEventListener('click', confirmHandler);
        };
        
        confirmBtn.addEventListener('click', confirmHandler);
        modal.classList.add('active');
    }

    // إغلاق نافذة التأكيد
    closeConfirmModal() {
        document.getElementById('confirm-modal').classList.remove('active');
    }

    // إغلاق نافذة التفاصيل
    closeDetailsModal() {
        document.getElementById('details-modal').classList.remove('active');
    }

    // إغلاق نافذة المشاركة
    closeShareModal() {
        document.getElementById('share-modal').classList.remove('active');
    }

    // عرض خطأ تسجيل الدخول
    showLoginError() {
        const errorDiv = document.getElementById('login-error');
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 3000);
    }

    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-toast');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // إزالة الإشعار بعد 5 ثواني
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 5000);
    }

    // تحديث الوقت
    updateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        
        const formatter = new Intl.DateTimeFormat('ar-SA', options);
        document.getElementById('current-time').textContent = formatter.format(now);
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // تنسيق الوقت
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // التحقق إذا كان التاريخ اليوم
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    // الحصول على نص الحالة
    getStatusText(status) {
        const statusTexts = {
            active: 'نشط',
            pending: 'معلق',
            completed: 'مكتمل'
        };
        return statusTexts[status] || status;
    }

    // تحميل الإحصائيات
    loadStatistics() {
        // حساب معدل التحويل
        const conversionRate = this.visitors.length > 0 ? 
            Math.round((this.submissions.length / this.visitors.length) * 100) : 0;
        
        document.getElementById('conversion-rate').textContent = `${conversionRate}%`;
    }
}

// تهيئة لوحة التحكم
const adminDashboard = new AdminDashboard();

// دوال عامة للاستخدام من HTML
function logout() {
    adminDashboard.logout();
}

function showPage(page) {
    adminDashboard.showPage(page);
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

function deleteSelected() {
    adminDashboard.deleteSelected();
}

function toggleSelectAll() {
    adminDashboard.toggleSelectAll();
}

function prevPage() {
    // يمكن إضافة منطق التصفح
    adminDashboard.showNotification('الميزة قيد التطوير', 'info');
}

function nextPage() {
    // يمكن إضافة منطق التصفح
    adminDashboard.showNotification('الميزة قيد التطوير', 'info');
}

function exportSubmissions() {
    adminDashboard.exportToCSV();
}

// تصدير الكائن للاستخدام في أدوات التطوير
window.adminDashboard = adminDashboard;