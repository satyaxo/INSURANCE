package com.edutech.insurance_claims_processing_system.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edutech.insurance_claims_processing_system.entity.Adjuster;
import com.edutech.insurance_claims_processing_system.entity.Investigator;
import com.edutech.insurance_claims_processing_system.entity.Policyholder;
import com.edutech.insurance_claims_processing_system.entity.Underwriter;
import com.edutech.insurance_claims_processing_system.entity.User;
import com.edutech.insurance_claims_processing_system.repository.AdjusterRepository;
import com.edutech.insurance_claims_processing_system.repository.InvestigatorRepository;
import com.edutech.insurance_claims_processing_system.repository.PolicyholderRepository;
import com.edutech.insurance_claims_processing_system.repository.UnderwriterRepository;
import com.edutech.insurance_claims_processing_system.repository.UserRepository;

import java.util.Collections;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdjusterRepository adjusterRepository;
    private final InvestigatorRepository investigatorRepository;
    private final PolicyholderRepository policyholderRepository;
    private final UnderwriterRepository underwriterRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(
            UserRepository userRepository,
            AdjusterRepository adjusterRepository,
            InvestigatorRepository investigatorRepository,
            PolicyholderRepository policyholderRepository,
            UnderwriterRepository underwriterRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.adjusterRepository = adjusterRepository;
        this.investigatorRepository = investigatorRepository;
        this.policyholderRepository = policyholderRepository;
        this.underwriterRepository = underwriterRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(User user) {
        if (user == null || user.getRole() == null) {
            throw new RuntimeException("User role must be specified");
        }

        // Normalize role: remove ROLE_ if present, uppercase
        String role = user.getRole().toUpperCase();
        if (role.startsWith("ROLE_")) role = role.substring(5);
        user.setRole(role);

        User target;

        switch (role) {
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

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }

        // Normalize authority: ensure single ROLE_ prefix
        String role = user.getRole() == null ? "" : user.getRole().toUpperCase();
        if (!role.startsWith("ROLE_")) role = "ROLE_" + role;

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(role))
        );
    }

    private void copyProperties(User source, User target) {
        target.setUsername(source.getUsername());
        target.setEmail(source.getEmail());

        // Ensure role stored without ROLE_ prefix
        String role = source.getRole().toUpperCase();
        if (role.startsWith("ROLE_")) role = role.substring(5);
        target.setRole(role);

        target.setPassword(passwordEncoder.encode(source.getPassword()));
    }
}