// نظام لوحة التحكم الإدارية المتكاملة

class AdminDashboard {
    constructor() {
        this.currentPage = 'overview';
        this.submissions = [];
        this.visitors = [];
        this.charts = {};
        this.currentUser = null;
        this.currentPageNumber = 1;
        this.itemsPerPage = 10;
        this.filteredSubmissions = [];
        this.filteredVisitors = [];
        
        this.init();
    }

    // تهيئة النظام
    init() {
        this.checkLogin();
        this.setupEventListeners();
        this.loadData();
        this.updateTime();
        this.setupRealTimeUpdates();
        
        // تحديث الوقت كل دقيقة
        setInterval(() => this.updateTime(), 60000);
        
        // تحديث الإحصائيات كل 30 ثانية
        setInterval(() => this.refreshStatistics(), 30000);
    }

    // التحقق من تسجيل الدخول
    checkLogin() {
        const savedUser = localStorage.getItem('admin_user');
        const savedToken = localStorage.getItem('admin_token');
        
        if (savedUser && savedToken && this.validateToken(savedToken)) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    // التحقق من صحة التوكن
    validateToken(token) {
        // يمكن إضافة منطق أكثر تعقيداً للتحقق
        return token && token.startsWith('admin_');
    }

    // عرض شاشة تسجيل الدخول
    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('dashboard').classList.add('hidden');
        
        // تفريغ الحقول
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('admin-code').value = '';
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
        
        // تحميل بيانات الصفحة الحالية
        this.loadPageData(this.currentPage);
    }

    // تسجيل الدخول
    async login(username, password, adminCode) {
        this.showLoading('جاري تسجيل الدخول...');
        
        try {
            const validCredentials = await this.validateCredentials(username, password, adminCode);
            
            if (validCredentials) {
                const user = {
                    username: username,
                    name: 'مدير النظام',
                    role: 'admin',
                    loginTime: new Date().toISOString(),
                    lastActive: new Date().toISOString()
                };
                
                // حفظ بيانات الجلسة
                const token = this.generateToken();
                localStorage.setItem('admin_user', JSON.stringify(user));
                localStorage.setItem('admin_token', token);
                
                this.currentUser = user;
                this.showDashboard();
                this.showNotification('تم تسجيل الدخول بنجاح', 'success');
                
                // تسجيل نشاط الدخول
                this.logActivity('login', 'تسجيل دخول ناجح');
                
                return true;
            } else {
                this.showLoginError();
                this.logActivity('login_failed', 'فشل محاولة تسجيل دخول');
                return false;
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.showNotification('حدث خطأ أثناء تسجيل الدخول', 'error');
            return false;
        } finally {
            this.hideLoading();
        }
    }

    // تسجيل الخروج
    logout() {
        this.showConfirmModal('هل أنت متأكد من تسجيل الخروج؟', () => {
            // تسجيل نشاط الخروج
            this.logActivity('logout', 'تسجيل خروج');
            
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_token');
            this.currentUser = null;
            this.showLogin();
            this.showNotification('تم تسجيل الخروج بنجاح', 'info');
        });
    }

    // توليد توكن
    generateToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `admin_${timestamp}_${random}`;
    }

    // التحقق من بيانات الدخول
    async validateCredentials(username, password, adminCode) {
        // هنا يمكنك ربطها بخادم للتحقق
        // حالياً، نجعلها بسيطة للاختبار
        const defaultUsername = 'admin';
        const defaultPassword = 'admin123';
        const defaultCode = 'admin123';
        
        // محاكاة التأخير لتبدو كطلب حقيقي
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const adminCode = document.getElementById('admin-code').value;
                
                if (!username || !password || !adminCode) {
                    this.showLoginError('يرجى ملء جميع الحقول');
                    return;
                }
                
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

        // البحث في المشاركات
        const searchInput = document.getElementById('search-submissions');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterSubmissions(e.target.value);
            });
        }

        // التصفية حسب التاريخ
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        if (dateFrom && dateTo) {
            dateFrom.addEventListener('change', () => this.applyFilters());
            dateTo.addEventListener('change', () => this.applyFilters());
        }

        // التصفية حسب الحالة
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // التصفية حسب الجهاز
        const deviceFilter = document.getElementById('device-filter');
        if (deviceFilter) {
            deviceFilter.addEventListener('change', () => this.applyFilters());
        }

        // نطاق وقت الزوار
        const visitorsTimeRange = document.getElementById('visitors-time-range');
        if (visitorsTimeRange) {
            visitorsTimeRange.addEventListener('change', () => this.filterVisitorsByTime());
        }

        // حفظ الإعدادات
        const settingsForms = document.querySelectorAll('.settings-form');
        settingsForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings(form.id);
            });
        });
    }

    // إعداد التحديثات في الوقت الحقيقي
    setupRealTimeUpdates() {
        // التحقق من المشاركات الجديدة كل 10 ثواني
        setInterval(() => {
            if (this.currentUser) {
                this.checkForNewSubmissions();
                this.checkForNewVisitors();
            }
        }, 10000);
    }

    // التحقق من المشاركات الجديدة
    async checkForNewSubmissions() {
        const oldCount = this.submissions.length;
        await this.loadSubmissions();
        
        if (this.submissions.length > oldCount) {
            const newCount = this.submissions.length - oldCount;
            this.showNotification(`يوجد ${newCount} مشاركة جديدة`, 'info');
            
            // تحديث العدادات
            this.updateSubmissionsCount();
            
            // إذا كانت الصفحة الحالية هي المشاركات، قم بتحديثها
            if (this.currentPage === 'submissions') {
                this.loadAllSubmissions();
            }
            
            // تحديث المشاركات الحديثة
            this.renderRecentSubmissions();
        }
    }

    // التحقق من الزوار الجدد
    async checkForNewVisitors() {
        const oldCount = this.visitors.length;
        await this.loadVisitors();
        
        if (this.visitors.length > oldCount) {
            const newCount = this.visitors.length - oldCount;
            
            // تحديث العدادات
            this.updateVisitorsCount();
            
            // إذا كانت الصفحة الحالية هي الزوار، قم بتحديثها
            if (this.currentPage === 'visitors') {
                this.loadVisitorAnalytics();
            }
        }
    }

    // تحديث الإحصائيات
    refreshStatistics() {
        if (this.currentUser) {
            this.updateSubmissionsCount();
            this.updateVisitorsCount();
            this.loadStatistics();
        }
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
            
            // تحديث عنوان الصفحة
            const pageTitle = targetPage.querySelector('h2')?.textContent || 'لوحة التحكم';
            document.getElementById('page-title').textContent = pageTitle;
            
            this.currentPage = pageName;
            this.currentPageNumber = 1;
            
            // تحميل بيانات الصفحة
            this.loadPageData(pageName);
        }
    }

    // تحميل بيانات الصفحة
    async loadPageData(pageName) {
        this.showLoading('جاري تحميل البيانات...');
        
        try {
            switch (pageName) {
                case 'overview':
                    await this.loadOverviewData();
                    break;
                case 'submissions':
                    await this.loadAllSubmissions();
                    break;
                case 'visitors':
                    await this.loadVisitorAnalytics();
                    break;
                case 'analytics':
                    await this.loadDetailedAnalytics();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                case 'export':
                    await this.loadExportData();
                    break;
            }
        } catch (error) {
            console.error(`خطأ في تحميل صفحة ${pageName}:`, error);
            this.showNotification('حدث خطأ في تحميل البيانات', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // تحميل بيانات النظرة العامة
    async loadOverviewData() {
        await this.loadSubmissions();
        await this.loadVisitors();
        this.updateSubmissionsCount();
        this.updateVisitorsCount();
        this.loadStatistics();
        this.renderRecentSubmissions();
        
        // إنشاء المخططات إذا لم تكن موجودة
        if (!this.charts.submissions) {
            this.createCharts();
        }
    }

    // تحميل جميع المشاركات
    async loadAllSubmissions() {
        await this.loadSubmissions();
        this.filteredSubmissions = [...this.submissions];
        this.renderSubmissionsTable();
        this.updatePagination();
    }

    // تحميل تحليلات الزوار
    async loadVisitorAnalytics() {
        await this.loadVisitors();
        this.filteredVisitors = [...this.visitors];
        this.updateVisitorsCount();
        this.updateVisitorsChart();
        this.updateCountriesChart();
        this.renderRecentVisitors();
    }

    // تحميل الإحصائيات التفصيلية
    async loadDetailedAnalytics() {
        // يمكن إضافة تحليلات أكثر تعقيداً هنا
        this.createDetailedCharts();
    }

    // تحميل الإعدادات
    async loadSettings() {
        // تحميل الإعدادات المحفوظة
        const settings = this.getSavedSettings();
        
        // تعبئة الحقول
        this.populateSettingsForm(settings);
    }

    // تحميل بيانات التصدير
    async loadExportData() {
        // تحميل أحدث البيانات
        await this.loadSubmissions();
        await this.loadVisitors();
    }

    // تحميل المشاركات
    async loadSubmissions() {
        try {
            // تحميل من localStorage
            const saved = localStorage.getItem('survey_submissions') || '[]';
            this.submissions = JSON.parse(saved);
            
            // ترتيب حسب التاريخ (الأحدث أولاً)
            this.submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return this.submissions;
        } catch (error) {
            console.error('خطأ في تحميل المشاركات:', error);
            this.submissions = this.getMockSubmissions();
            return this.submissions;
        }
    }

    // تحميل الزوار
    async loadVisitors() {
        try {
            const saved = localStorage.getItem('survey_visitors') || '[]';
            this.visitors = JSON.parse(saved);
            
            // ترتيب حسب التاريخ (الأحدث أولاً)
            this.visitors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return this.visitors;
        } catch (error) {
            console.error('خطأ في تحميل الزوار:', error);
            this.visitors = this.getMockVisitors();
            return this.visitors;
        }
    }

    // بيانات تجريبية للمشاركات
    getMockSubmissions() {
        const mockData = [];
        const devices = ['هاتف محمول', 'كمبيوتر مكتبي', 'جهاز لوحي'];
        const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
        const statuses = ['active', 'pending', 'completed'];
        const cities = ['الجزائر العاصمة', 'وهران', 'قسنطينة', 'عنابة', 'باتنة'];
        
        for (let i = 1; i <= 20; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            mockData.push({
                id: `ALG-${10000000 + i}`,
                phone: `05${Math.floor(Math.random() * 90000000 + 10000000)}`,
                cardNumber: '1234'.repeat(4),
                expiryDate: '12/25',
                cvc: '123',
                device: devices[Math.floor(Math.random() * devices.length)],
                browser: browsers[Math.floor(Math.random() * browsers.length)],
                os: Math.random() > 0.5 ? 'Android' : 'iOS',
                ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
                location: cities[Math.floor(Math.random() * cities.length)],
                timestamp: date.toISOString(),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                additionalInfo: {
                    screenResolution: '1920x1080',
                    language: 'ar',
                    timezone: 'Africa/Algiers'
                }
            });
        }
        
        return mockData;
    }

    // بيانات تجريبية للزوار
    getMockVisitors() {
        const mockData = [];
        const countries = ['الجزائر', 'المغرب', 'تونس', 'مصر', 'السعودية'];
        const devices = ['هاتف محمول', 'كمبيوتر مكتبي', 'جهاز لوحي'];
        const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
        
        for (let i = 1; i <= 50; i++) {
            const date = new Date();
            date.setHours(date.getHours() - Math.floor(Math.random() * 24));
            date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 60));
            
            mockData.push({
                id: `VIS-${1000 + i}`,
                ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                country: countries[Math.floor(Math.random() * countries.length)],
                city: 'الجزائر العاصمة',
                device: devices[Math.floor(Math.random() * devices.length)],
                browser: browsers[Math.floor(Math.random() * browsers.length)],
                os: Math.random() > 0.5 ? 'Android' : 'Windows',
                page: '/',
                timestamp: date.toISOString(),
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            });
        }
        
        return mockData;
    }

    // تصفية المشاركات
    filterSubmissions(searchTerm) {
        if (!searchTerm) {
            this.filteredSubmissions = [...this.submissions];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredSubmissions = this.submissions.filter(submission => 
                submission.id.toLowerCase().includes(term) ||
                submission.phone.includes(term) ||
                submission.cardNumber.includes(term) ||
                submission.device.toLowerCase().includes(term) ||
                submission.ip.includes(term)
            );
        }
        
        this.currentPageNumber = 1;
        this.renderSubmissionsTable();
        this.updatePagination();
    }

    // تطبيق الفلاتر
    applyFilters() {
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        const status = document.getElementById('status-filter').value;
        const device = document.getElementById('device-filter').value;
        const searchTerm = document.getElementById('search-submissions').value;
        
        let filtered = [...this.submissions];
        
        // البحث النصي
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(submission => 
                submission.id.toLowerCase().includes(term) ||
                submission.phone.includes(term) ||
                submission.cardNumber.includes(term)
            );
        }
        
        // التصفية حسب التاريخ
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filtered = filtered.filter(submission => new Date(submission.timestamp) >= fromDate);
        }
        
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(submission => new Date(submission.timestamp) <= toDate);
        }
        
        // التصفية حسب الحالة
        if (status !== 'all') {
            filtered = filtered.filter(submission => submission.status === status);
        }
        
        // التصفية حسب الجهاز
        if (device !== 'all') {
            filtered = filtered.filter(submission => {
                if (device === 'mobile') return submission.device.includes('هاتف');
                if (device === 'desktop') return submission.device.includes('كمبيوتر');
                if (device === 'tablet') return submission.device.includes('لوحي');
                return true;
            });
        }
        
        this.filteredSubmissions = filtered;
        this.currentPageNumber = 1;
        this.renderSubmissionsTable();
        this.updatePagination();
    }

    // تصفية الزوار حسب الوقت
    filterVisitorsByTime() {
        const range = document.getElementById('visitors-time-range').value;
        const now = new Date();
        let startDate;
        
        switch (range) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = new Date(0); // بداية الزمن
        }
        
        this.filteredVisitors = this.visitors.filter(visitor => 
            new Date(visitor.timestamp) >= startDate
        );
        
        this.updateVisitorsChart();
        this.updateCountriesChart();
        this.renderRecentVisitors();
    }

    // تحديث عدد المشاركات
    updateSubmissionsCount() {
        const total = this.submissions.length;
        const today = new Date().toDateString();
        const todayCount = this.submissions.filter(s => 
            new Date(s.timestamp).toDateString() === today
        ).length;
        
        document.getElementById('submissions-count').textContent = total;
        document.getElementById('total-submissions').textContent = total.toLocaleString();
        document.getElementById('today-submissions').textContent = todayCount.toLocaleString();
    }

    // تحديث عدد الزوار
    updateVisitorsCount() {
        const total = this.visitors.length;
        const today = new Date().toDateString();
        const todayCount = this.visitors.filter(v => 
            new Date(v.timestamp).toDateString() === today
        ).length;
        
        document.getElementById('visitors-count').textContent = total;
        document.getElementById('total-visitors').textContent = total.toLocaleString();
        
        // تحديث إحصائيات الزوار
        const uniqueVisitors = new Set(this.visitors.map(v => v.ip)).size;
        document.getElementById('unique-visitors').textContent = uniqueVisitors.toLocaleString();
        
        const desktopCount = this.visitors.filter(v => v.device.includes('كمبيوتر')).length;
        document.getElementById('desktop-visitors').textContent = desktopCount.toLocaleString();
        
        const mobileCount = this.visitors.filter(v => v.device.includes('هاتف')).length;
        document.getElementById('mobile-visitors').textContent = mobileCount.toLocaleString();
        
        const countries = new Set(this.visitors.map(v => v.country)).size;
        document.getElementById('countries-count').textContent = countries;
    }

    // عرض جدول المشاركات
    renderSubmissionsTable() {
        const tbody = document.getElementById('submissions-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.filteredSubmissions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="10" class="empty-state-cell">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h4>لا توجد مشاركات</h4>
                        <p>لم يتم العثور على مشاركات تطابق معايير البحث</p>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        // حساب بداية ونهاية الصفحة
        const start = (this.currentPageNumber - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageItems = this.filteredSubmissions.slice(start, end);
        
        pageItems.forEach((submission, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="select-submission" data-id="${submission.id}">
                </td>
                <td>
                    <span class="submission-id">${submission.id}</span>
                    ${submission.status === 'active' ? '<i class="fas fa-circle text-success" style="font-size: 8px; margin-right: 5px;"></i>' : ''}
                </td>
                <td>
                    <div class="phone-number">${submission.phone}</div>
                    <small class="text-muted">${this.formatDate(submission.timestamp, 'time')}</small>
                </td>
                <td>
                    <code class="card-number">${this.maskCardNumber(submission.cardNumber)}</code>
                </td>
                <td>${this.formatDate(submission.timestamp)}</td>
                <td>
                    <div class="device-info">
                        <i class="fas ${submission.device.includes('هاتف') ? 'fa-mobile-alt' : 'fa-desktop'}"></i>
                        <span>${submission.device}</span>
                    </div>
                </td>
                <td>
                    <div class="browser-info">
                        <i class="fab fa-${submission.browser.toLowerCase()}"></i>
                        <span>${submission.browser}</span>
                    </div>
                </td>
                <td>
                    <code class="ip-address">${submission.ip}</code>
                    <br>
                    <small class="text-muted">${submission.location || 'غير معروف'}</small>
                </td>
                <td>
                    <span class="status-badge ${submission.status}">
                        ${this.getStatusText(submission.status)}
                        ${submission.status === 'pending' ? '<i class="fas fa-clock ml-1"></i>' : ''}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-view" onclick="adminDashboard.viewSubmission('${submission.id}')" title="عرض التفاصيل">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-edit" onclick="adminDashboard.editSubmission('${submission.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="adminDashboard.deleteSubmission('${submission.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // تحديث التصفح
    updatePagination() {
        const totalPages = Math.ceil(this.filteredSubmissions.length / this.itemsPerPage);
        const pageInfo = document.getElementById('page-info');
        
        if (pageInfo) {
            pageInfo.textContent = `الصفحة ${this.currentPageNumber} من ${totalPages || 1}`;
        }
        
        // تحديث حالة أزرار التصفح
        const prevBtn = document.querySelector('.page-btn:nth-child(1)');
        const nextBtn = document.querySelector('.page-btn:nth-child(3)');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPageNumber === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPageNumber === totalPages || totalPages === 0;
        }
    }

    // الصفحة التالية
    nextPage() {
        const totalPages = Math.ceil(this.filteredSubmissions.length / this.itemsPerPage);
        if (this.currentPageNumber < totalPages) {
            this.currentPageNumber++;
            this.renderSubmissionsTable();
            this.updatePagination();
        }
    }

    // الصفحة السابقة
    prevPage() {
        if (this.currentPageNumber > 1) {
            this.currentPageNumber--;
            this.renderSubmissionsTable();
            this.updatePagination();
        }
    }

    // عرض المشاركات الحديثة
    renderRecentSubmissions() {
        const tbody = document.getElementById('recent-submissions-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const recent = this.submissions.slice(0, 5);
        
        recent.forEach(submission => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <strong>${submission.id}</strong>
                </td>
                <td>${submission.phone}</td>
                <td>
                    ${this.formatDate(submission.timestamp)}
                    <br>
                    <small class="text-muted">${this.formatDate(submission.timestamp, 'time')}</small>
                </td>
                <td>
                    <div class="device-info-small">
                        <i class="fas ${submission.device.includes('هاتف') ? 'fa-mobile-alt' : 'fa-desktop'}"></i>
                        ${submission.device}
                    </div>
                </td>
                <td>
                    <code>${submission.ip}</code>
                </td>
                <td>
                    <span class="status-badge ${submission.status}">
                        ${this.getStatusText(submission.status)}
                    </span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // عرض تفاصيل المشاركة
    viewSubmission(id) {
        const submission = this.submissions.find(s => s.id === id);
        if (!submission) {
            this.showNotification('لم يتم العثور على المشاركة', 'error');
            return;
        }
        
        const modal = document.getElementById('details-modal');
        const content = document.getElementById('details-content');
        
        content.innerHTML = `
            <div class="submission-details">
                <div class="detail-header">
                    <h4>${submission.id}</h4>
                    <span class="status-badge ${submission.status}">${this.getStatusText(submission.status)}</span>
                </div>
                
                <div class="detail-section">
                    <h5><i class="fas fa-user-circle"></i> معلومات الاتصال</h5>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>رقم الهاتف:</strong>
                            <span>${submission.phone}</span>
                        </div>
                        <div class="detail-item">
                            <strong>رقم البطاقة:</strong>
                            <span>${submission.cardNumber}</span>
                        </div>
                        <div class="detail-item">
                            <strong>تاريخ الانتهاء:</strong>
                            <span>${submission.expiryDate}</span>
                        </div>
                        <div class="detail-item">
                            <strong>رمز الأمان:</strong>
                            <span>${submission.cvc}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h5><i class="fas fa-laptop"></i> معلومات الجهاز</h5>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>نوع الجهاز:</strong>
                            <span>${submission.device}</span>
                        </div>
                        <div class="detail-item">
                            <strong>المتصفح:</strong>
                            <span>${submission.browser}</span>
                        </div>
                        <div class="detail-item">
                            <strong>نظام التشغيل:</strong>
                            <span>${submission.os || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>عنوان IP:</strong>
                            <span>${submission.ip}</span>
                        </div>
                        <div class="detail-item">
                            <strong>الموقع:</strong>
                            <span>${submission.location || 'غير معروف'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>وقت المشاركة:</strong>
                            <span>${this.formatDate(submission.timestamp, 'full')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h5><i class="fas fa-info-circle"></i> معلومات إضافية</h5>
                    <div class="detail-item-full">
                        <pre>${JSON.stringify(submission.additionalInfo || {}, null, 2)}</pre>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn-primary" onclick="adminDashboard.changeStatus('${submission.id}', 'active')">
                        <i class="fas fa-check"></i> تفعيل
                    </button>
                    <button class="btn-secondary" onclick="adminDashboard.changeStatus('${submission.id}', 'pending')">
                        <i class="fas fa-clock"></i> تعليق
                    </button>
                    <button class="btn-danger" onclick="adminDashboard.deleteSubmission('${submission.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
    }

    // تعديل المشاركة
    editSubmission(id) {
        this.showNotification('ميزة التعديل قيد التطوير', 'info');
    }

    // حذف المشاركة
    deleteSubmission(id) {
        this.showConfirmModal('هل أنت متأكد من حذف هذه المشاركة؟', () => {
            const index = this.submissions.findIndex(s => s.id === id);
            if (index !== -1) {
                this.submissions.splice(index, 1);
                localStorage.setItem('survey_submissions', JSON.stringify(this.submissions));
                
                this.updateSubmissionsCount();
                this.loadAllSubmissions();
                this.renderRecentSubmissions();
                
                this.showNotification('تم حذف المشاركة بنجاح', 'success');
                this.logActivity('delete_submission', `حذف المشاركة ${id}`);
            }
        });
    }

    // تغيير حالة المشاركة
    changeStatus(id, newStatus) {
        const submission = this.submissions.find(s => s.id === id);
        if (submission) {
            submission.status = newStatus;
            localStorage.setItem('survey_submissions', JSON.stringify(this.submissions));
            
            this.loadAllSubmissions();
            this.renderRecentSubmissions();
            
            this.showNotification(`تم تغيير حالة المشاركة إلى ${this.getStatusText(newStatus)}`, 'success');
            this.logActivity('change_status', `تغيير حالة ${id} إلى ${newStatus}`);
        }
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
            this.logActivity('bulk_delete', `حذف ${selected.length} مشاركة`);
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
                    labels: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
                    datasets: [{
                        label: 'المشاركات',
                        data: [12, 19, 8, 15, 22, 18, 24],
                        borderColor: '#2c5aa0',
                        backgroundColor: 'rgba(44, 90, 160, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
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
                    labels: ['هاتف محمول', 'كمبيوتر مكتبي', 'جهاز لوحي'],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: ['#2c5aa0', '#27ae60', '#d4af37'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
    }

    // تحديث مخطط الزوار
    updateVisitorsChart() {
        const ctx = document.getElementById('visitors-chart');
        if (!ctx || !this.filteredVisitors.length) return;
        
        // تجميع الزوار حسب الساعة
        const hours = Array.from({length: 24}, (_, i) => i);
        const visitorsByHour = hours.map(hour => {
            return this.filteredVisitors.filter(v => {
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
                    label: 'عدد الزوار',
                    data: visitorsByHour,
                    backgroundColor: 'rgba(44, 90, 160, 0.7)',
                    borderColor: '#2c5aa0',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // تحديث مخطط الدول
    updateCountriesChart() {
        const ctx = document.getElementById('countries-chart');
        if (!ctx || !this.filteredVisitors.length) return;
        
        // تجميع الزوار حسب الدولة
        const countryCounts = {};
        this.filteredVisitors.forEach(v => {
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
                        '#9b59b6', '#3498db', '#1abc9c', '#e67e22',
                        '#34495e', '#16a085'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
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
        
        const recent = this.filteredVisitors.slice(0, 10);
        
        if (recent.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" class="empty-state-cell">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h4>لا توجد زيارات</h4>
                        <p>لم يتم العثور على زيارات تطابق معايير البحث</p>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        recent.forEach(visitor => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    ${this.formatDate(visitor.timestamp, 'time')}
                    <br>
                    <small class="text-muted">${this.formatDate(visitor.timestamp, 'date')}</small>
                </td>
                <td>
                    <code>${visitor.ip}</code>
                    <br>
                    <small class="text-muted">${visitor.city || ''}</small>
                </td>
                <td>
                    <span class="country-flag">🇩🇿</span>
                    ${visitor.country}
                </td>
                <td>
                    <div class="device-info-small">
                        <i class="fas ${visitor.device.includes('هاتف') ? 'fa-mobile-alt' : 'fa-desktop'}"></i>
                        ${visitor.device}
                    </div>
                </td>
                <td>
                    <div class="browser-info-small">
                        <i class="fab fa-${visitor.browser.toLowerCase()}"></i>
                        ${visitor.browser}
                    </div>
                </td>
                <td>
                    ${visitor.page}
                    <br>
                    <small class="text-muted">${this.truncateText(visitor.userAgent, 30)}</small>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // إنشاء مخططات تفصيلية
    createDetailedCharts() {
        const ctx = document.getElementById('detailed-analytics-chart');
        if (!ctx) return;
        
        if (this.charts.detailed) {
            this.charts.detailed.destroy();
        }
        
        // بيانات تجريبية للتحليلات التفصيلية
        const labels = Array.from({length: 30}, (_, i) => `اليوم ${i + 1}`);
        const submissionsData = Array.from({length: 30}, () => Math.floor(Math.random() * 50) + 20);
        const visitorsData = submissionsData.map(val => Math.floor(val * (Math.random() * 0.5 + 1.2)));
        
        this.charts.detailed = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'المشاركات',
                        data: submissionsData,
                        borderColor: '#2c5aa0',
                        backgroundColor: 'rgba(44, 90, 160, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    },
                    {
                        label: 'الزوار',
                        data: visitorsData,
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }

    // تحميل الإحصائيات
    loadStatistics() {
        // حساب معدل التحويل
        const conversionRate = this.visitors.length > 0 ? 
            Math.round((this.submissions.length / this.visitors.length) * 100) : 0;
        
        document.getElementById('conversion-rate').textContent = `${conversionRate}%`;
        
        // تحديث اتجاهات الإحصائيات
        this.updateTrendIndicators();
    }

    // تحديث مؤشرات الاتجاه
    updateTrendIndicators() {
        // يمكن إضافة منطق لحساب الاتجاهات بناءً على البيانات السابقة
        const trends = document.querySelectorAll('.stat-trend');
        trends.forEach(trend => {
            const isUp = Math.random() > 0.3;
            const value = Math.floor(Math.random() * 20) + 1;
            
            trend.innerHTML = `
                <i class="fas fa-arrow-${isUp ? 'up' : 'down'}"></i>
                <span>${value}%</span>
            `;
            
            trend.className = `stat-trend ${isUp ? 'up' : 'down'}`;
        });
    }

    // تصدير البيانات
    exportToExcel() {
        this.showNotification('جاري تحضير ملف Excel...', 'info');
        
        // محاكاة عملية التصدير
        setTimeout(() => {
            const data = this.prepareExportData('excel');
            this.downloadFile(data, 'submissions.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            this.showNotification('تم تصدير البيانات إلى Excel بنجاح', 'success');
            this.logActivity('export', 'تصدير إلى Excel');
        }, 1500);
    }

    exportToCSV() {
        const csv = this.convertToCSV(this.submissions);
        this.downloadFile(csv, 'submissions.csv', 'text/csv');
        this.showNotification('تم تصدير البيانات إلى CSV بنجاح', 'success');
        this.logActivity('export', 'تصدير إلى CSV');
    }

    exportToPDF() {
        this.showNotification('جاري إنشاء ملف PDF...', 'info');
        
        setTimeout(() => {
            const data = this.prepareExportData('pdf');
            this.downloadFile(data, 'report.pdf', 'application/pdf');
            this.showNotification('تم تصدير التقرير إلى PDF بنجاح', 'success');
            this.logActivity('export', 'تصدير إلى PDF');
        }, 2000);
    }

    exportToJSON() {
        const json = JSON.stringify(this.submissions, null, 2);
        this.downloadFile(json, 'submissions.json', 'application/json');
        this.showNotification('تم تصدير البيانات إلى JSON بنجاح', 'success');
        this.logActivity('export', 'تصدير إلى JSON');
    }

    // تحضير بيانات التصدير
    prepareExportData(format) {
        const data = this.submissions.map(sub => ({
            'رقم المشاركة': sub.id,
            'رقم الهاتف': sub.phone,
            'رقم البطاقة': sub.cardNumber,
            'تاريخ الانتهاء': sub.expiryDate,
            'الجهاز': sub.device,
            'المتصفح': sub.browser,
            'نظام التشغيل': sub.os || 'غير معروف',
            'عنوان IP': sub.ip,
            'الموقع': sub.location || 'غير معروف',
            'التاريخ': this.formatDate(sub.timestamp),
            'الحالة': this.getStatusText(sub.status)
        }));
        
        if (format === 'csv') {
            return this.convertToCSV(data);
        }
        
        // لمحاكاة Excel و PDF نستخدم CSV
        return this.convertToCSV(data);
    }

    // تحويل البيانات إلى CSV
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
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

    // حفظ الإعدادات
    saveSettings(formId) {
        const settings = {};
        
        switch (formId) {
            case 'general-settings':
                settings.siteName = document.getElementById('site-name').value;
                settings.siteUrl = document.getElementById('site-url').value;
                settings.defaultLanguage = document.getElementById('default-language').value;
                settings.timezone = document.getElementById('timezone').value;
                settings.itemsPerPage = document.getElementById('items-per-page').value;
                break;
                
            case 'security-settings':
                settings.adminUsername = document.getElementById('admin-username').value;
                settings.newPassword = document.getElementById('new-password').value;
                settings.adminCode = document.getElementById('admin-code').value;
                settings.twoFactorAuth = document.getElementById('two-factor-auth').checked;
                settings.allowedIPs = document.getElementById('allowed-ips').value;
                break;
                
            case 'notification-settings':
                settings.notifications = {
                    newSubmission: document.getElementById('notify-new-submission').checked,
                    newVisitor: document.getElementById('notify-new-visitor').checked,
                    systemErrors: document.getElementById('notify-system-errors').checked,
                    dailyReport: document.getElementById('notify-daily-report').checked
                };
                settings.notificationMethods = {
                    inApp: document.getElementById('notify-in-app').checked,
                    email: document.getElementById('notify-email').checked,
                    telegram: document.getElementById('notify-telegram').checked
                };
                settings.notificationEmail = document.getElementById('notification-email').value;
                settings.telegramChatId = document.getElementById('telegram-chat-id').value;
                break;
        }
        
        // حفظ الإعدادات
        this.saveSettingsToStorage(settings);
        this.showNotification('تم حفظ الإعدادات بنجاح', 'success');
        this.logActivity('save_settings', `حفظ إعدادات ${formId}`);
    }

    // حفظ الإعدادات في التخزين
    saveSettingsToStorage(settings) {
        const existingSettings = this.getSavedSettings();
        const updatedSettings = { ...existingSettings, ...settings };
        localStorage.setItem('admin_settings', JSON.stringify(updatedSettings));
    }

    // الحصول على الإعدادات المحفوظة
    getSavedSettings() {
        try {
            return JSON.parse(localStorage.getItem('admin_settings') || '{}');
        } catch (error) {
            return {};
        }
    }

    // تعبئة نموذج الإعدادات
    populateSettingsForm(settings) {
        // الإعدادات العامة
        if (settings.siteName) document.getElementById('site-name').value = settings.siteName;
        if (settings.siteUrl) document.getElementById('site-url').value = settings.siteUrl;
        if (settings.defaultLanguage) document.getElementById('default-language').value = settings.defaultLanguage;
        if (settings.timezone) document.getElementById('timezone').value = settings.timezone;
        if (settings.itemsPerPage) document.getElementById('items-per-page').value = settings.itemsPerPage;
        
        // إعدادات الأمان
        if (settings.adminUsername) document.getElementById('admin-username').value = settings.adminUsername;
        if (settings.adminCode) document.getElementById('admin-code').value = settings.adminCode;
        if (settings.twoFactorAuth !== undefined) {
            document.getElementById('two-factor-auth').checked = settings.twoFactorAuth;
        }
        if (settings.allowedIPs) document.getElementById('allowed-ips').value = settings.allowedIPs;
        
        // إعدادات الإشعارات
        if (settings.notifications) {
            const notif = settings.notifications;
            document.getElementById('notify-new-submission').checked = notif.newSubmission || false;
            document.getElementById('notify-new-visitor').checked = notif.newVisitor || false;
            document.getElementById('notify-system-errors').checked = notif.systemErrors || false;
            document.getElementById('notify-daily-report').checked = notif.dailyReport || false;
        }
        
        if (settings.notificationMethods) {
            const methods = settings.notificationMethods;
            document.getElementById('notify-in-app').checked = methods.inApp || false;
            document.getElementById('notify-email').checked = methods.email || false;
            document.getElementById('notify-telegram').checked = methods.telegram || false;
        }
        
        if (settings.notificationEmail) {
            document.getElementById('notification-email').value = settings.notificationEmail;
        }
        
        if (settings.telegramChatId) {
            document.getElementById('telegram-chat-id').value = settings.telegramChatId;
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

    // عرض خطأ تسجيل الدخول
    showLoginError(message = 'خطأ في اسم المستخدم أو كلمة المرور') {
        const errorDiv = document.getElementById('login-error');
        const errorSpan = errorDiv.querySelector('span');
        
        errorSpan.textContent = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
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
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // إزالة الإشعار بعد 5 ثواني
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentElement) {
                        container.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }

    // عرض شاشة التحميل
    showLoading(message = 'جاري التحميل...') {
        let overlay = document.getElementById('loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <p>${message}</p>
            `;
            document.body.appendChild(overlay);
        }
    }

    // إخفاء شاشة التحميل
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
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
        const timeElement = document.getElementById('current-time');
        
        if (timeElement) {
            timeElement.textContent = formatter.format(now);
        }
    }

    // تنسيق التاريخ
    formatDate(dateString, format = 'default') {
        const date = new Date(dateString);
        
        if (format === 'time') {
            return date.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        if (format === 'date') {
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (format === 'full') {
            return date.toLocaleString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // إخفاء رقم البطاقة
    maskCardNumber(cardNumber) {
        if (!cardNumber || cardNumber.length < 12) return cardNumber;
        return cardNumber.substring(0, 4) + ' **** **** ' + cardNumber.substring(cardNumber.length - 4);
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

    // اقتطاع النص
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // تسجيل النشاط
    logActivity(type, description) {
        const activity = {
            type,
            description,
            timestamp: new Date().toISOString(),
            user: this.currentUser?.username || 'unknown'
        };
        
        // حفظ النشاط
        const activities = JSON.parse(localStorage.getItem('admin_activities') || '[]');
        activities.push(activity);
        
        // الاحتفاظ بآخر 100 نشاط فقط
        if (activities.length > 100) {
            activities.shift();
        }
        
        localStorage.setItem('admin_activities', JSON.stringify(activities));
        
        // تحديث عداد الإشعارات
        this.updateNotificationCount();
    }

    // تحديث عداد الإشعارات
    updateNotificationCount() {
        const activities = JSON.parse(localStorage.getItem('admin_activities') || '[]');
        const recentActivities = activities.filter(act => {
            const activityTime = new Date(act.timestamp);
            const now = new Date();
            const hoursDiff = (now - activityTime) / (1000 * 60 * 60);
            return hoursDiff < 24; // الأنشطة في آخر 24 ساعة
        });
        
        const count = recentActivities.length;
        const countElement = document.getElementById('notification-count');
        
        if (countElement) {
            countElement.textContent = count > 99 ? '99+' : count;
            countElement.style.display = count > 0 ? 'flex' : 'none';
        }
    }
}

// تهيئة لوحة التحكم
const adminDashboard = new AdminDashboard();

// دوال عامة للاستخدام من HTML
window.logout = function() {
    adminDashboard.logout();
};

window.showPage = function(page) {
    adminDashboard.showPage(page);
};

window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
    
    const mainContent = document.querySelector('.main-content');
    if (sidebar.classList.contains('active')) {
        mainContent.style.marginRight = '0';
    } else {
        mainContent.style.marginRight = 'var(--sidebar-width)';
    }
};

window.deleteSelected = function() {
    adminDashboard.deleteSelected();
};

window.toggleSelectAll = function() {
    adminDashboard.toggleSelectAll();
};

window.prevPage = function() {
    adminDashboard.prevPage();
};

window.nextPage = function() {
    adminDashboard.nextPage();
};

window.exportSubmissions = function() {
    adminDashboard.exportToCSV();
};

window.exportToExcel = function() {
    adminDashboard.exportToExcel();
};

window.exportToCSV = function() {
    adminDashboard.exportToCSV();
};

window.exportToPDF = function() {
    adminDashboard.exportToPDF();
};

window.exportToJSON = function() {
    adminDashboard.exportToJSON();
};

window.closeDetailsModal = function() {
    adminDashboard.closeDetailsModal();
};

window.closeConfirmModal = function() {
    adminDashboard.closeConfirmModal();
};

// جعل الكائن متاحاً عالمياً
window.adminDashboard = adminDashboard;