package com.edutech.insurance_claims_processing_system.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class PaymentService {

    @Value("${razorpay.keyId}")
    private String keyId;

    @Value("${razorpay.keySecret}")
    private String keySecret;

    /**
     * ✅ Create Razorpay Order
     * amount must be in paise: ₹499.00 => 49900
     */
    public Map<String, Object> createOrder(long amountInPaise, String currency, String receipt) {
        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject options = new JSONObject();
            options.put("amount", amountInPaise);
            options.put("currency", currency == null ? "INR" : currency);
            options.put("receipt", receipt == null ? ("rcpt_" + System.currentTimeMillis()) : receipt);
            options.put("payment_capture", 1); // auto capture

            Order order = client.orders.create(options);

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("orderId", order.get("id"));
            res.put("amount", order.get("amount"));
            res.put("currency", order.get("currency"));
            res.put("receipt", order.get("receipt"));
            res.put("keyId", keyId); // frontend needs keyId for Razorpay checkout
            return res;

        } catch (RazorpayException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unable to create Razorpay order: " + e.getMessage()
            );
        }
    }

    /**
     * ✅ Verify Razorpay signature (SECURITY CRITICAL)
     *
     * Razorpay signature formula:
     * signature = HMAC_SHA256(orderId + "|" + paymentId, keySecret)
     */
    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {

        if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
            return false;
        }

        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            String generated = hmacSha256(payload, keySecret);

            return constantTimeEquals(generated, razorpaySignature);

        } catch (Exception e) {
            return false;
        }
    }

    // ---------------------------
    // Internal helpers
    // ---------------------------

    private String hmacSha256(String data, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);

        byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

        // Razorpay sends signature as hex string (not base64)
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    /**
     * ✅ constant-time string compare to prevent timing attacks
     */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;

        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
