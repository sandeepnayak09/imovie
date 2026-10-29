const express = require('express');
const router = express.Router();
const { sendTestEmail, sendTicketPassEmail } = require('../controllers/emailController');

// Test & manual transactional triggers
router.post('/test', sendTestEmail);
router.post('/send-ticket', sendTicketPassEmail);

module.exports = router;
