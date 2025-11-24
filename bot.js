const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

// Bot Token
const BOT_TOKEN = '8488314208:AAEpn00TUMudtmGO4RgrFEtfxeLB235m6Qg';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Database file path
const DB_FILE = './api/database.json';

// Initialize database if not exists
function initializeDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            users: [],
            pending_approvals: [],
            api_tokens: {}
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Read database
function readDatabase() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (error) {
        console.error('Database read error:', error);
        return { users: [], pending_approvals: [], api_tokens: {} };
    }
}

// Write to database
function writeDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Generate random token
function generateToken(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Start command handler
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    // Generate user token
    const userToken = generateToken();
    const apiToken = "KEER6KB590ZL8392"; // Fixed API token
    
    // Save user to database
    const db = readDatabase();
    const existingUser = db.users.find(u => u.chat_id === chatId);
    
    if (!existingUser) {
        db.users.push({
            chat_id: chatId,
            user_token: userToken,
            api_token: apiToken,
            name: `${user.first_name} ${user.last_name || ''}`.trim(),
            username: user.username || 'N/A',
            status: 'active',
            joined_at: new Date().toISOString()
        });
        writeDatabase(db);
    }
    
    // Get user profile picture
    let profilePicUrl = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    try {
        const photos = await bot.getUserProfilePhotos(user.id);
        if (photos.total_count > 0) {
            const photo = photos.photos[0][0];
            const file = await bot.getFile(photo.file_id);
            profilePicUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
        }
    } catch (error) {
        console.log('Profile pic error:', error);
    }
    
    // Prepare user info message
    const userInfo = `
👤 Nick name : ${user.first_name} ${user.last_name || ''}
👤 Username : @${user.username || 'N/A'}
🆔 ID : ${user.id}
🆔 TOKEN : ${userToken}
----------------------------------------
Support @Help
    `.trim();
    
    // Send message with profile picture
    try {
        await bot.sendPhoto(chatId, profilePicUrl, { caption: userInfo });
    } catch (error) {
        await bot.sendMessage(chatId, userInfo);
    }
    
    // Send API URL
    const apiUrl = `https://xi.vercel.app/${apiToken}/api.php?token=${userToken}`;
    const apiMessage = `
🌐 Your API URL:
<code>${apiUrl}</code>

📝 How to use:
1. Call this URL in your application
2. OTP will be sent to this Telegram account
3. JSON response will contain user details + OTP

🔁 Refresh the URL to get new OTP
    `.trim();
    
    await bot.sendMessage(chatId, apiMessage, { parse_mode: 'HTML' });
});

// OTP sending function
async function sendOTPToUser(chatId, otp) {
    try {
        const message = `
🔐 OTP Verification

Your One-Time Password is:
📱 <b>${otp}</b>

This OTP is valid for 5 minutes.

⚠️ Do not share this code with anyone.
        `.trim();
        
        await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
        console.log(`OTP ${otp} sent to chat ${chatId}`);
        return true;
    } catch (error) {
        console.error('Failed to send OTP:', error);
        return false;
    }
}

// Admin approval notifications (simplified)
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    // Only respond to owner
    if (chatId === 123456789) { // Replace with owner's chat ID
        bot.sendMessage(chatId, 'Admin commands:\n/approvals - View pending approvals');
    }
});

// Initialize database when bot starts
initializeDatabase();

console.log('🤖 Telegram OTP Bot is running...');
module.exports = { sendOTPToUser, readDatabase, writeDatabase };
