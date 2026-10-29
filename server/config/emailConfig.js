const dotenv = require('dotenv');
dotenv.config();

const emailConfig = {
  apiKey: process.env.BREVO_API_KEY || '',
  senderEmail: process.env.SENDER_EMAIL || 'sandeepnayak998182@gmail.com',
  senderName: process.env.SENDER_NAME || 'iMovies',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
};

// Validate configuration
if (!emailConfig.apiKey && !(emailConfig.gmailUser && emailConfig.gmailAppPassword)) {
  console.warn('⚠️ WARNING: Neither BREVO_API_KEY nor GMAIL credentials are fully configured.');
}

module.exports = emailConfig;
