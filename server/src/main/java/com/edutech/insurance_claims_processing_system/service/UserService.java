package com.edutech.insurance_claims_processing_system.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edutech.insurance_claims_processing_system.entity.*;
import com.edutech.insurance_claims_processing_system.repository.*;

import java.util.ArrayList;
import java.util.Collections;

@Service
public class UserService  implements UserDetailsService{

     private final UserRepository userRepository;
    private final AdjusterRepository adjusterRepository;
    private final InvestigatorRepository investigatorRepository;
    private final PolicyholderRepository policyholderRepository;
    private final UnderwriterRepository underwriterRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Default constructor with @Autowired dependencies.
     */
    @Autowired
    public UserService(
            UserRepository userRepository,
            AdjusterRepository adjusterRepository,
            InvestigatorRepository investigatorRepository,
            PolicyholderRepository policyholderRepository,
            UnderwriterRepository underwriterRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.adjusterRepository = adjusterRepository;
        this.investigatorRepository = investigatorRepository;
        this.policyholderRepository = policyholderRepository;
        this.underwriterRepository = underwriterRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a user based on their role and saves to the respective repository.
     */
    public User registerUser(User user) {
        String role = user.getRole();

        if (role == null) {
            throw new RuntimeException("User role must be specified");
        }

        User target;

        switch (role.toUpperCase()) {
            case "ADJUSTER":
                target = new Adjuster();
                copyProperties(user, target);
                return adjusterRepository.save((Adjuster) target);

            case "INVESTIGATOR":
                target = new Investigator();
                copyProperties(user, target);
                return investigatorRepository.save((Investigator) target);

            case "POLICYHOLDER":
                target = new Policyholder();
                copyProperties(user, target);
                return policyholderRepository.save((Policyholder) target);

            case "UNDERWRITER":
                target = new Underwriter();
                copyProperties(user, target);
                return underwriterRepository.save((Underwriter) target);

            default:
                throw new RuntimeException("Invalid user role: " + role);
        }
    }

    /**
     * Retrieves a user by username.
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Loads user details for authentication.
     */
    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole())
                )
        );
    }

    /**
     * Copies user details while encoding the password.
     */
    private void copyProperties(User source, User target) {
        target.setUsername(source.getUsername());
        target.setEmail(source.getEmail());
        target.setRole(source.getRole());
        target.setPassword(passwordEncoder.encode(source.getPassword()));
    }

}