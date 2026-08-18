const axios = require('axios');
const logger = require('../config/logger');
require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;

const sendEmail = async (to, subject, html) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: process.env.EMAIL_FROM, name: 'FitAddis' },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    );

    logger.info(`Email sent successfully to ${to}: ${response.data.messageId}`);
    return true;
  } catch (error) {
    logger.error(
      `Failed to send email to ${to}:`,
      error.response?.data || error.message,
    );
    return false;
  }
};

module.exports = { sendEmail };
