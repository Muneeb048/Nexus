const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  console.log('=============================================');
  console.log(`[EMAIL SIMULATION] To: ${options.email}`);
  console.log(`[EMAIL SIMULATION] Subject: ${options.subject}`);
  console.log(`[EMAIL SIMULATION] Message: \n${options.message}`);
  console.log('=============================================');
};

module.exports = sendEmail;
