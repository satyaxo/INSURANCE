// package com.edutech.insurance_claims_processing_system.entity;

// import com.fasterxml.jackson.annotation.JsonIgnore;
// import javax.persistence.*;
// import java.util.Date;
// import java.util.List;


package com.edutech.insurance_claims_processing_system.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import javax.persistence.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    @Temporal(TemporalType.DATE)
    private Date date;

    /**
     * Status examples: Submitted, Under Review, Approved, Rejected
     */
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policyholder_id")
    private Policyholder policyholder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adjuster_id")
    private Adjuster adjuster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "underwriter_id")
    private Underwriter underwriter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigator_id")
    private Investigator investigator;

    @OneToOne(mappedBy = "claim", fetch = FetchType.LAZY)
    @JsonIgnore
    private Investigation investigation;

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClaimDocument> documents = new ArrayList<>();

    // -------------------- Getters and Setters --------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Policyholder getPolicyholder() {
        return policyholder;
    }

    public void setPolicyholder(Policyholder policyholder) {
        this.policyholder = policyholder;
    }

    public Adjuster getAdjuster() {
        return adjuster;
    }

    public void setAdjuster(Adjuster adjuster) {
        this.adjuster = adjuster;
    }

    public Underwriter getUnderwriter() {
        return underwriter;
    }

    public void setUnderwriter(Underwriter underwriter) {
        this.underwriter = underwriter;
    }

    public Investigator getInvestigator() {
        return investigator;
    }

    public void setInvestigator(Investigator investigator) {
        this.investigator = investigator;
    }

    public Investigation getInvestigation() {
        return investigation;
    }

    public void setInvestigation(Investigation investigation) {
        this.investigation = investigation;
    }

    public List<ClaimDocument> getDocuments() {
        return documents;
    }

    public void setDocuments(List<ClaimDocument> documents) {
        this.documents = documents;
    }

    // Optional convenience helpers (recommended)
    public void addDocument(ClaimDocument doc) {
        documents.add(doc);
        doc.setClaim(this);
    }

    public void removeDocument(ClaimDocument doc) {
        documents.remove(doc);
        doc.setClaim(null);
    }
}
// @Entity
// @Table(name = "claims")
// public class Claim {

//     @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     private Long id;

//     private String description;

//     @Temporal(TemporalType.DATE)
//     private Date date;

//     private String status;

//     @ManyToOne
//     @JoinColumn(name = "policyholder_id")
//     private Policyholder policyholder;

//     @ManyToOne
//     @JoinColumn(name = "adjuster_id")
//     private Adjuster adjuster;

//     @ManyToOne
//     @JoinColumn(name = "underwriter_id")
//     private Underwriter underwriter;

//     @ManyToOne
//     @JoinColumn(name = "investigator_id") // ✅ NEW
//     private Investigator investigator;

//     @OneToOne(mappedBy = "claim")
//     @JsonIgnore
//     private Investigation investigation;

//     @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL)
// private List<ClaimDocument> documents;

// // getter and setter


// public List<ClaimDocument> getDocuments() { return documents; }
//     public void setDocuments(List<ClaimDocument> documents) { this.documents = documents; }
// }

    
//     // -------------------- Getters and Setters --------------------

//     public Long getId() {
//         return id;
//     }

//     public void setId(Long id) {
//         this.id = id;
//     }

//     public String getDescription() {
//         return description;
//     }

//     public void setDescription(String description) {
//         this.description = description;
//     }

//     public Date getDate() {
//         return date;
//     }

//     public void setDate(Date date) {
//         this.date = date;
//     }

//     /**
//      * Status examples: Submitted, Under Review, Approved, Rejected
//      */
//     public String getStatus() {
//         return status;
//     }

//     public void setStatus(String status) {
//         this.status = status;
//     }

//     public Policyholder getPolicyholder() {
//         return policyholder;
//     }

//     public void setPolicyholder(Policyholder policyholder) {
//         this.policyholder = policyholder;
//     }

//     public Adjuster getAdjuster() {
//         return adjuster;
//     }

//     public void setAdjuster(Adjuster adjuster) {
//         this.adjuster = adjuster;
//     }

//     public Underwriter getUnderwriter() {
//         return underwriter;
//     }

//     public void setUnderwriter(Underwriter underwriter) {
//         this.underwriter = underwriter;
//     }

//     public Investigation getInvestigation() {
//         return investigation;
//     }

//     public void setInvestigation(Investigation investigation) {
//         this.investigation = investigation;
//     }

//     public Investigator getInvestigator() {
//         return investigator;
//     }

//     public void setInvestigator(Investigator investigator) {
//         this.investigator = investigator;
//     }
// }    


