package com.edutech.insurance_claims_processing_system.entity;


import javax.persistence.*;
import java.util.Set;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "user_type")
public class User {

    
   @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role;

    // -------------------- Getters and Setters --------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * Stores encrypted password.
     */
    public String getPassword() {
        return password;
    }

    /**
     * Password encryption should be handled in service layer.
     */
    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Role values example:
     * POLICYHOLDER, ADJUSTER, UNDERWRITER, INVESTIGATOR
     */
    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }



   
}
