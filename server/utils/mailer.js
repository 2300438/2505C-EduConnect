const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetUrl) => {
    // 1. Create the transporter (The "Mail Truck")
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2. Define the email options (The "Envelope")
    const mailOptions = {
        from: '"EduConnect Support" <support@educonnect.com>',
        to: email,
        subject: 'Password Reset Request - EduConnect',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #1976d2;">EduConnect Password Reset</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password. Click the button below to choose a new one. <strong>This link expires in 1 hour.</strong></p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: #fff; text-decoration: none; border-radius: 5px;">Reset My Password</a>
                <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
                <hr />
                <p style="font-size: 0.8rem; color: #777;">Secure Education Platform - Capstone 2026</p>
            </div>
        `
    };

    // 3. Send it
    await transporter.sendMail(mailOptions);
};

module.exports = sendResetEmail;