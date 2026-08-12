const RESET_PASSWORD_TEMPLATE = `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Reset your FitAddis password</title>
    <style type="text/css">
        /* Email Client Resets */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .fluid { width: 100% !important; max-width: 100% !important; }
        }
    </style>
</head>
<body style="background-color: #0b141e; margin: 0; padding: 0; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">

    <!-- Center Wrapper -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b141e;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                
                <!-- Logo / Header -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; margin: 0 auto;">
                    <tr>
                        <td align="center" style="padding-bottom: 30px;">
                            <!-- Logo: No dot, weight 600, letter-spacing 0.5px -->
                            <span style="color:#00e599; font-size:22px; font-weight:600; letter-spacing:0.5px; font-family:'Segoe UI', 'Helvetica Neue', sans-serif;">FitAddis</span>
                        </td>
                    </tr>
                </table>

                <!-- Main Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; background-color: #1a2634; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 30px;">
                            
                            <!-- Heading & Greeting -->
                            <h1 style="color: #ffffff; font-weight: 700; margin: 0 0 15px 0; font-size: 26px; line-height: 1.2;">
                                Hi {USER_NAME},
                            </h1>
                            
                            <p style="color: #8b9bb5; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: left;">
                                We received a request to reset the password for your FitAddis account. 
                                Please click the button below to create a new password.
                            </p>

                            <!-- CTA Button (Styled like "Get Started") -->
                            <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="background-color: #00e599; border-radius: 6px;">
                                        <a href="{RESET_LINK}" style="display: block; padding: 16px 40px; color: #0b141e; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Visible Direct Link Fallback -->
                            <div style="background-color: #0b141e; border: 1px solid #2c3e50; padding: 15px; border-radius: 6px; text-align: center; margin-top: 25px;">
                                <p style="color: #8b9bb5; font-size: 13px; margin: 0 0 10px 0;">If the button above doesn't work, use this direct link:</p>
                                <a href="{RESET_LINK}" style="color: #00e599; font-size: 15px; font-weight: bold; word-break: break-all; text-decoration: underline;">{RESET_LINK}</a>
                            </div>

                            <!-- Security Note -->
                            <p style="color: #8b9bb5; font-size: 13px; line-height: 1.4; margin: 25px 0 0 0; text-align: left; border-top: 1px solid #2c3e50; padding-top: 20px;">
                                If you did not request a password reset, please ignore this email or contact our support team if you have any concerns.
                            </p>

                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; margin: 20px auto 0 auto;">
                    <tr>
                        <td align="center" style="color: #5a6c83; font-size: 12px; line-height: 1.5; padding: 20px;">
                            &copy; 2026 FitAddis. All rights reserved.<br>
                            Need help? Contact <a href="mailto:support@fitaddis.com" style="color: #00e599; text-decoration: none;">support@fitaddis.com</a>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`;

module.exports = {
  RESET_PASSWORD_TEMPLATE,
};
