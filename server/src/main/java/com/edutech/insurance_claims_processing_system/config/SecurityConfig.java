package com.edutech.insurance_claims_processing_system.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.edutech.insurance_claims_processing_system.jwt.JwtRequestFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    


     private final UserDetailsService userDetailsService;
    private final JwtRequestFilter jwtRequestFilter;
    private final PasswordEncoder passwordEncoder;

    /**
     * Constructor for dependency injection.
     */
    public SecurityConfig(
            UserDetailsService userDetailsService,
            JwtRequestFilter jwtRequestFilter,
            PasswordEncoder passwordEncoder) {
        this.userDetailsService = userDetailsService;
        this.jwtRequestFilter = jwtRequestFilter;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Configures authentication using UserDetailsService and PasswordEncoder.
     */
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder);
    }

    /**
     * Configures HTTP security, role-based access, and JWT authentication.
     */
    protected void configure(HttpSecurity http) throws Exception {

        http
            .csrf().disable()
            .cors().and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()

            // Public endpoints
            .antMatchers(HttpMethod.POST, "/api/user/register").permitAll()
            .antMatchers(HttpMethod.POST, "/api/user/login").permitAll()

            // Adjuster endpoints
            .antMatchers(HttpMethod.PUT, "/api/adjuster/claim/**").hasRole("ADJUSTER")
            .antMatchers(HttpMethod.GET, "/api/adjuster/claims").hasRole("ADJUSTER")
            .antMatchers(HttpMethod.GET, "/api/adjuster/underwriters").hasRole("ADJUSTER")

            // Policyholder endpoints
            .antMatchers(HttpMethod.POST, "/api/policyholder/claim").hasRole("POLICYHOLDER")
            .antMatchers(HttpMethod.GET, "/api/policyholder/claims").hasRole("POLICYHOLDER")

            // Investigator endpoints
            .antMatchers(HttpMethod.POST, "/api/investigator/investigation").hasRole("INVESTIGATOR")
            .antMatchers(HttpMethod.PUT, "/api/investigator/investigation/**").hasRole("INVESTIGATOR")
            .antMatchers(HttpMethod.GET, "/api/investigator/investigations").hasRole("INVESTIGATOR")

            // Underwriter endpoints
            .antMatchers(HttpMethod.PUT, "/api/underwriter/claim/**").hasRole("UNDERWRITER")
            .antMatchers(HttpMethod.GET, "/api/underwriter/claims").hasRole("UNDERWRITER")

            // All other requests
            .anyRequest().authenticated();

        // Add JWT filter before username-password authentication filter
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
    }

    /**
     * Exposes AuthenticationManager as a Spring bean.
     */
    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }




    }
