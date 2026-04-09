package com.edutech.insurance_claims_processing_system.service;

import java.nio.charset.StandardCharsets;

import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp, int expiryMinutes) {
        try {
            // OTP must be 6 digits; if not, still handle safely
            String safeOtp = (otp == null) ? "" : otp.trim();
            while (safeOtp.length() < 6) safeOtp = "0" + safeOtp;
            if (safeOtp.length() > 6) safeOtp = safeOtp.substring(0, 6);

            char[] digits = safeOtp.toCharArray();

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name()
            );

            // ✅ Optional: nicer sender name (still shows External in Gmail sometimes)
            helper.setFrom(new InternetAddress("no-reply@yourdomain.com", "Claims System"));
            helper.setTo(toEmail);
            helper.setSubject("Your OTP Code - Insurance Claims System");

            String plainText =
                    "OTP Verification - Insurance Claims System\n\n" +
                    "Hello,\n" +
                    "Your OTP for email verification is: " + safeOtp + "\n" +
                    "This OTP is valid for " + expiryMinutes + " minutes.\n" +
                    "Do not share this OTP with anyone.\n" +
                    "If you did not request this, please ignore this email.\n\n" +
                    "Thank you,\nInsurance Claims Processing System";

            // ✅ Premium HTML (table-based so it works on Gmail mobile)
            String html =
                "<!doctype html>" +
                "<html><body style='margin:0;padding:0;background:#0b1220;'>" +

                // Outer wrapper
                "<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#0b1220;padding:24px 0;'>" +
                "  <tr>" +
                "    <td align='center'>" +

                // Card container
                "      <table role='presentation' width='560' cellpadding='0' cellspacing='0' " +
                "             style='width:560px;max-width:92%;background:#0f172a;border:1px solid #1f2937;border-radius:16px;overflow:hidden;'>" +

                // Header strip
                "        <tr>" +
                "          <td style='padding:18px 20px;background:linear-gradient(135deg,#111827,#0b1220);border-bottom:1px solid #1f2937;'>" +
                "            <div style='font-family:Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.2px;'>OTP Verification</div>" +
                "            <div style='font-family:Arial,sans-serif;color:#94a3b8;font-size:13px;margin-top:4px;'>Insurance Claims System</div>" +
                "          </td>" +
                "        </tr>" +

                // Body
                "        <tr>" +
                "          <td style='padding:20px;font-family:Arial,sans-serif;color:#e5e7eb;'>" +
                "            <div style='font-size:14px;line-height:20px;margin-bottom:12px;'>Hello,</div>" +
                "            <div style='font-size:14px;line-height:20px;margin-bottom:16px;'>Use the OTP below to verify your email:</div>" +

                // OTP boxes container
                "            <table role='presentation' cellpadding='0' cellspacing='0' style='margin:0 auto 14px auto;'>" +
                "              <tr>" +
                otpCell(digits[0]) +
                otpCell(digits[1]) +
                otpCell(digits[2]) +
                otpCell(digits[3]) +
                otpCell(digits[4]) +
                otpCell(digits[5]) +
                "              </tr>" +
                "            </table>" +

                // Validity + warning
                "            <div style='text-align:center;color:#cbd5e1;font-size:13px;line-height:18px;margin-bottom:10px;'>" +
                "              This OTP is valid for <b style='color:#ffffff;'>" + expiryMinutes + " minutes</b>." +
                "            </div>" +

                // Do not share banner
                "            <div style='margin:14px 0;padding:12px 12px;background:#111827;border:1px solid #1f2937;border-radius:12px;'>" +
                "              <div style='color:#fbbf24;font-weight:700;font-size:13px;'>Security Notice</div>" +
                "              <div style='color:#cbd5e1;font-size:12px;margin-top:6px;line-height:18px;'>" +
                "                Do not share this OTP with anyone. Our team will never ask for your OTP." +
                "              </div>" +
                "            </div>" +

                "            <div style='color:#94a3b8;font-size:12px;line-height:18px;'>" +
                "              If you did not request this OTP, please ignore this email." +
                "            </div>" +

                "            <hr style='border:none;border-top:1px solid #1f2937;margin:18px 0;'/>" +

                // Footer
                "            <div style='color:#64748b;font-size:11px;line-height:16px;'>" +
                "              © " + java.time.Year.now() + " Insurance Claims Processing System<br/>" +
                "              This is an automated email. Please do not reply." +
                "            </div>" +
                "          </td>" +
                "        </tr>" +

                "      </table>" +
                "    </td>" +
                "  </tr>" +
                "</table>" +

                "</body></html>";

            // ✅ send both plain + html (best practice)
            helper.setText(plainText, html);

            mailSender.send(mimeMessage);

        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to send OTP email. Please try again later."
            );
        }
    }

    // ✅ 1 OTP digit cell (table-based so it never wraps)
    private String otpCell(char digit) {
        return "<td style='padding:0 6px;'>" +
               "  <div style='width:44px;height:52px;line-height:52px;text-align:center;" +
               "              background:#0b1220;border:1px solid #334155;border-radius:12px;" +
               "              color:#ffffff;font-size:22px;font-weight:800;font-family:Arial,sans-serif;'>" +
               digit +
               "  </div>" +
               "</td>";
    }
}