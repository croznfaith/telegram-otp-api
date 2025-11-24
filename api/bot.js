const { sendOTPToUser, readDatabase } = require('../bot');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { token } = req.query;
    const apiToken = req.url.split('/')[1];
    
    if (!token || !apiToken) {
      return res.status(400).json({ error: 'Token and API token required' });
    }
    
    const db = readDatabase();
    const user = db.users.find(u => u.user_token === token && u.api_token === apiToken);
    
    if (user) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      await sendOTPToUser(user.chat_id, otp);
      
      return res.json({
        profile_pic: user.profile_pic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        name: user.name,
        username: user.username,
        OTP: otp
      });
    } else {
      return res.status(404).json({ error: 'Invalid token' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
