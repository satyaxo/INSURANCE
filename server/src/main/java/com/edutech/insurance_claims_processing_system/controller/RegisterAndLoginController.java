package com.edutech.insurance_claims_processing_system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import com.edutech.insurance_claims_processing_system.dto.LoginRequest;
import com.edutech.insurance_claims_processing_system.dto.LoginResponse;
import com.edutech.insurance_claims_processing_system.entity.User;
import com.edutech.insurance_claims_processing_system.jwt.JwtUtil;
import com.edutech.insurance_claims_processing_system.service.UserService;
import com.edutech.insurance_claims_processing_system.service.EmailOtpService;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class RegisterAndLoginController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailOtpService emailOtpService;   // ✅ NEW

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    // ✅ OTP VERIFIED REQUIRED REGISTER
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody User user) {

        if (user == null || user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        // ✅ BLOCK registration unless OTP verified
        emailOtpService.requireEmailVerified(user.getEmail());

        User registeredUser = userService.registerUser(user);
        return new ResponseEntity<>(registeredUser, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> loginUser(@RequestBody LoginRequest loginRequest) {

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(),
                    loginRequest.getPassword()
                )
            );
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userService.getUserByUsername(loginRequest.getUsername());
        String token = jwtUtil.generateToken(user.getUsername());

        LoginResponse response = new LoginResponse(
                user.getId(),
                token,
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }
}
