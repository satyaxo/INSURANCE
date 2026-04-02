package com.edutech.insurance_claims_processing_system.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
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
public class SecurityConfig extends WebSecurityConfigurerAdapter {

      private final UserDetailsService userDetailsService;
    private final JwtRequestFilter jwtRequestFilter;
    private final PasswordEncoder passwordEncoder;

    public SecurityConfig(UserDetailsService userDetailsService,
                          JwtRequestFilter jwtRequestFilter,
                          PasswordEncoder passwordEncoder) {
        this.userDetailsService = userDetailsService;
        this.jwtRequestFilter = jwtRequestFilter;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth
            .userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder);
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {

        http
            // ✅ Disable CSRF for REST APIs
            .csrf().disable()

            // ✅ Enable CORS
            .cors().and()

            // ✅ Stateless session (JWT based)
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()

            .authorizeRequests()

            // ✅ ✅ ✅ CRITICAL FIX
            // Allow preflight OPTIONS requests (required for PUT from Angular)
            .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // ✅ Public endpoints
            .antMatchers("/api/user/register", "/api/user/login").permitAll()

            // ✅ Role-based endpoints
            .antMatchers("/api/policyholder/**").hasRole("POLICYHOLDER")
            .antMatchers("/api/adjuster/**").hasRole("ADJUSTER")
            .antMatchers("/api/investigator/**").hasRole("INVESTIGATOR")
            .antMatchers("/api/underwriter/**").hasRole("UNDERWRITER")

            // ✅ Everything else must be authenticated
            .anyRequest().authenticated();

        // ✅ JWT Filter
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }
}