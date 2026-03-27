package com.edutech.insurance_claims_processing_system.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.edutech.insurance_claims_processing_system.entity.User;
import com.edutech.insurance_claims_processing_system.repository.UserRepository;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {


     private final UserRepository userRepository;

    /** Secret key for signing JWT tokens */
    private final String secret = "insuranceClaimsSecretKey";

    /** Token expiration time in seconds (10 hours) */
    private final int expiration = 60 * 60 * 10;

    /**
     * Constructor that initializes UserRepository.
     */
    public JwtUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Generates a JWT token with user-specific claims.
     */
    public String generateToken(String username) {

        User user = userRepository.findByUsername(username);

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000L))
                .signWith(SignatureAlgorithm.HS256, secret)
                .compact();
    }

    /**
     * Extracts all claims from the JWT token.
     */
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .setSigningKey(secret)
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Retrieves username from JWT token.
     */
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Checks whether the JWT token is expired.
     */
    public boolean isTokenExpired(String token) {
        Date expirationDate = extractAllClaims(token).getExpiration();
        return expirationDate.before(new Date());
    }

    /**
     * Validates the JWT token.
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }


    
}