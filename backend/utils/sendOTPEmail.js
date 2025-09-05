const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (to, otp, username = "Inkwell User") => {
  const mailOptions = {
    from: `"Inkwell Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Verify Your Identity – OTP Enclosed",
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>OTP Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td align="center" style="background-color: #7A86B6; padding: 30px 20px;">
                      <h1 style="color: #fff; margin: 0; font-size: 24px;">Inkwell</h1>
                      <p style="color: #e0e0ff; font-size: 14px; margin-top: 4px;">Secure Account Verification</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 18px; margin-bottom: 10px; color: #333;">
                        Hello <strong>${username}</strong>,
                      </p>
                      <p style="font-size: 16px; color: #444;">
                        Please use the following One-Time Password (OTP) to verify your account. This code is valid for the next <strong>10 minutes</strong> and should not be shared with anyone.
                      </p>

                      <!-- OTP Box -->
                      <div style="margin: 40px auto; text-align: center;">
                        <span style="
                          display: inline-block;
                          background: #495C83;
                          color: #ffffff;
                          padding: 16px 32px;
                          font-size: 28px;
                          font-weight: 600;
                          border-radius: 10px;
                          letter-spacing: 6px;
                          box-shadow: 0 6px 20px rgba(73, 92, 131, 0.4);
                        ">
                          ${otp}
                        </span>
                      </div>

                      <p style="font-size: 14px; color: #666;">
                        If you did not request this, please disregard this email or <a href="mailto:support@inkwell.com" style="color: #495C83; text-decoration: none;">contact our support team</a>.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #888;">
                      &copy; ${new Date().getFullYear()} Inkwell. All rights reserved.<br/>
                      <a href="mailto:support@inkwell.com" style="color: #495C83; text-decoration: underline;">support@inkwell.com</a>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = sendOTPEmail;
