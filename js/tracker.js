// ملف لجمع معلومات الجهاز والموقع
class DeviceTracker {
    constructor() {
        this.deviceInfo = {};
        this.geoData = {};
    }

    // جمع معلومات الجهاز الأساسية
    collectBasicInfo() {
        this.deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            screenWidth: screen.width,
            screenHeight: screen.height,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            doNotTrack: navigator.doNotTrack,
            vendor: navigator.vendor,
            maxTouchPoints: navigator.maxTouchPoints,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
        };
    }

    // جمع معلومات الاتصال
    collectConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            this.deviceInfo.connection = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                onchange: connection.onchange
            };
        }
    }

    // تحديد نوع الجهاز
    detectDeviceType() {
        const ua = navigator.userAgent;
        
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return 'جهاز لوحي';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return 'هاتف محمول';
        }
        return 'كمبيوتر مكتبي';
    }

    // تحديد نوع المتصفح
    detectBrowser() {
        const ua = navigator.userAgent;
        let browser = "متصفح غير معروف";
        
        if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
        else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
        else if (ua.includes("Trident")) browser = "Internet Explorer";
        else if (ua.includes("Edge")) browser = "Microsoft Edge";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";
        
        return browser;
    }

    // تحديد نظام التشغيل
    detectOS() {
        const ua = navigator.userAgent;
        let os = "نظام غير معروف";
        
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Mac")) os = "macOS";
        else if (ua.includes("X11")) os = "UNIX";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
        
        return os;
    }

    // الحصول على عنوان IP
    async getIPAddress() {
        try {
            // محاولة من عدة مصادر
            const sources = [
                'https://api.ipify.org?format=json',
                'https://api64.ipify.org?format=json',
                'https://ipinfo.io/json'
            ];

            for (const source of sources) {
                try {
                    const response = await fetch(source, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        return data.ip || data.query || 'غير متاح';
                    }
                } catch (error) {
                    console.log(`فشل المصدر ${source}:`, error);
                    continue;
                }
            }
            
            // إذا فشلت جميع المصادر
            const fallbackResponse = await fetch('https://api.db-ip.com/v2/free/self');
            if (fallbackResponse.ok) {
                const data = await fallbackResponse.json();
                return data.ipAddress || 'غير متاح';
            }
            
            return 'غير متاح';
        } catch (error) {
            console.error('خطأ في جلب عنوان IP:', error);
            return 'غير متاح';
        }
    }

    // الحصول على معلومات الموقع الجغرافي (مع إذن المستخدم)
    async getGeolocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ error: 'المتصفح لا يدعم تحديد الموقع' });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.geoData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: new Date(position.timestamp).toLocaleString('ar-SA')
                    };
                    resolve(this.geoData);
                },
                (error) => {
                    const errors = {
                        1: 'تم رفض الإذن',
                        2: 'معلومات الموقع غير متاحة',
                        3: 'انتهى وقت الانتظار'
                    };
                    resolve({ error: errors[error.code] || 'خطأ غير معروف' });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    // جمع معلومات الشبكة
    async getNetworkInfo() {
        try {
            // الحصول على عنوان IP
            const ip = await this.getIPAddress();
            
            // الحصول على معلومات الموقع من IP
            let locationInfo = {};
            try {
                if (ip !== 'غير متاح') {
                    const response = await fetch(`https://ipapi.co/${ip}/json/`);
                    if (response.ok) {
                        locationInfo = await response.json();
                    }
                }
            } catch (error) {
                console.log('لا يمكن جلب معلومات الموقع من IP');
            }

            return {
                ipAddress: ip,
                location: locationInfo,
                timestamp: new Date().toLocaleString('ar-SA', {
                    timeZone: 'Africa/Algiers',
                    dateStyle: 'full',
                    timeStyle: 'medium'
                })
            };
        } catch (error) {
            console.error('خطأ في جمع معلومات الشبكة:', error);
            return {
                ipAddress: 'غير متاح',
                location: {},
                timestamp: new Date().toLocaleString('ar-SA')
            };
        }
    }

    // جمع جميع المعلومات
    async collectAllData() {
        // جمع المعلومات الأساسية
        this.collectBasicInfo();
        this.collectConnectionInfo();
        
        // إضافة المعلومات المحللة
        this.deviceInfo.deviceType = this.detectDeviceType();
        this.deviceInfo.browser = this.detectBrowser();
        this.deviceInfo.operatingSystem = this.detectOS();
        this.deviceInfo.isMobile = /Mobi|Android/i.test(navigator.userAgent);
        this.deviceInfo.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // جمع معلومات الشبكة
        const networkInfo = await this.getNetworkInfo();
        
        // جمع الموقع الجغرافي (مع إذن المستخدم)
        const geolocation = await this.getGeolocation();
        
        // معلومات إضافية
        const additionalInfo = {
            referrer: document.referrer || 'مباشر',
            pageUrl: window.location.href,
            pageTitle: document.title,
            cookiesEnabled: navigator.cookieEnabled,
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            indexedDB: !!window.indexedDB,
            online: navigator.onLine,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        };

        // دمج جميع المعلومات
        return {
            device: this.deviceInfo,
            network: networkInfo,
            geolocation: geolocation,
            additional: additionalInfo,
            collectionTime: new Date().toISOString()
        };
    }

    // عرض المعلومات في الواجهة
    async displayDeviceInfo() {
        const data = await this.collectAllData();
        
        // تحديث العناصر في الصفحة
        if (document.getElementById('device-type')) {
            document.getElementById('device-type').textContent = data.device.deviceType;
        }
        
        if (document.getElementById('os-type')) {
            document.getElementById('os-type').textContent = data.device.operatingSystem;
        }
        
        if (document.getElementById('browser-type')) {
            document.getElementById('browser-type').textContent = data.device.browser;
        }
        
        if (document.getElementById('screen-resolution')) {
            const res = `${data.device.screenWidth} × ${data.device.screenHeight}`;
            document.getElementById('screen-resolution').textContent = res;
        }
        
        return data;
    }

    // توليد رمز تحقق عشوائي
    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // تخزين البيانات محلياً
    storeDataLocally(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('خطأ في تخزين البيانات:', error);
            return false;
        }
    }

    // استرجاع البيانات المحلية
    getStoredData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('خطأ في استرجاع البيانات:', error);
            return null;
        }
    }

    // مسح البيانات المحلية
    clearStoredData(key) {
        try {
            if (key) {
                localStorage.removeItem(key);
            } else {
                localStorage.clear();
            }
            return true;
        } catch (error) {
            console.error('خطأ في مسح البيانات:', error);
            return false;
        }
    }
}

// إنشاء كائن التتبع العام
const deviceTracker = new DeviceTracker();

// تصدير الكائن للاستخدام في ملفات أخرى
window.deviceTracker = deviceTracker;