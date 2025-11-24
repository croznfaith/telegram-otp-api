const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const BOT_TOKEN = '8488314208:AAEpn00TUMudtmGO4RgrFEtfxeLB235m6Qg';
const bot = new TelegramBot(BOT_TOKEN);

// Express app for Vercel
const app = express();
app.use(express.json());

// Webhook setup (Vercel ke liye better)
app.post('/webhook', (req, res) => {
  const update = req.body;
  bot.processUpdate(update);
  res.sendStatus(200);
});

// Set webhook (Vercel URL ke saath)
const setWebhook = async () => {
  const webhookUrl = `https://${process.env.VERCEL_URL}/webhook`;
  await bot.setWebHook(webhookUrl);
  console.log('Webhook set:', webhookUrl);
};

// Start command handler (webhook version)
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    const userToken = generateToken();
    const apiToken = "KEER6KB590ZL8392";
    
    const userInfo = `
👤 Nick name : ${user.first_name} ${user.last_name || ''}
👤 Username : @${user.username || 'N/A'}
🆔 ID : ${user.id}
🆔 TOKEN : ${userToken}
----------------------------------------
Support @Help
    `.trim();
    
    await bot.sendMessage(chatId, userInfo);
    
    const apiUrl = `https://${process.env.VERCEL_URL}/${apiToken}/api.php?token=${userToken}`;
    await bot.sendMessage(chatId, `Your API URL:\n${apiUrl}`);
});

function generateToken(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Vercel serverless function handler
module.exports = app;
