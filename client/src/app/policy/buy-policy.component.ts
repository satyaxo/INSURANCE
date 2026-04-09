import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpService } from '../../services/http.service';


declare global {
  interface Window {
    Razorpay?: any;
  }
}

type InsuranceType = 'CAR' | 'BIKE' | 'HEALTH' | 'LIFE' | 'TERM' | 'TRAVEL' | 'HOME';
type PlanType = 'BASIC' | 'STANDARD' | 'PREMIUM';

type Plan = {
  planType: PlanType;
  title: string;
  subtitle: string;
  coverageAmount: number;
  premiumAmount: number;
  durationYears: number;
  highlights: string[];
};

type PolicyPurchaseRequest = {
  insuranceType: string;
  planType: string;
  coverageAmount: number;
  premiumAmount: number;
  durationYears: number;
  razorpayOrderId?: string;
};

@Component({
  selector: 'app-buy-policy',
  templateUrl: './buy-policy.component.html',
  styleUrls: ['./buy-policy.component.scss']
})
export class BuyPolicyComponent implements OnInit {

  isLoading = false;
  showError = false;
  errorMessage = '';
  showMessage = false;
  responseMessage = '';

  paymentInProgress = false;
  lastOrderId: string | null = null;

  policyholderId = 0;

  insuranceType: InsuranceType | '' = '';
  selectedPlan: Plan | null = null;

  planCatalog: Record<InsuranceType, Plan[]> = {
    CAR: [
      { planType: 'BASIC', title: 'Basic', subtitle: 'Essential coverage for everyday driving', coverageAmount: 200000, premiumAmount: 1999, durationYears: 1, highlights: ['Accident cover', 'Third-party cover', 'Basic support'] },
      { planType: 'STANDARD', title: 'Standard', subtitle: 'Balanced coverage + better claim comfort', coverageAmount: 500000, premiumAmount: 2999, durationYears: 1, highlights: ['Accident cover', 'Third-party cover', 'Better settlement limits'] },
      { planType: 'PREMIUM', title: 'Premium', subtitle: 'Maximum protection & priority handling', coverageAmount: 1000000, premiumAmount: 4499, durationYears: 1, highlights: ['Highest cover', 'Priority processing', 'Enhanced protection'] }
    ],
    BIKE: [
      { planType: 'BASIC', title: 'Basic', subtitle: 'Essential protection for bike owners', coverageAmount: 100000, premiumAmount: 999, durationYears: 1, highlights: ['Accident cover', 'Third-party cover', 'Basic support'] },
      { planType: 'STANDARD', title: 'Standard', subtitle: 'Stronger cover for city commutes', coverageAmount: 250000, premiumAmount: 1499, durationYears: 1, highlights: ['Higher cover', 'Faster routing', 'Better protection'] },
      { planType: 'PREMIUM', title: 'Premium', subtitle: 'Top cover with priority review', coverageAmount: 500000, premiumAmount: 2299, durationYears: 1, highlights: ['Maximum cover', 'Priority processing', 'Enhanced protection'] }
    ],
    HEALTH: [
      { planType: 'BASIC', title: 'Basic', subtitle: 'Hospitalization essentials', coverageAmount: 300000, premiumAmount: 2999, durationYears: 1, highlights: ['Hospitalization cover', 'Basic benefits', 'Standard support'] },
      { planType: 'STANDARD', title: 'Standard', subtitle: 'Better cover + improved limits', coverageAmount: 700000, premiumAmount: 4499, durationYears: 1, highlights: ['Higher hospitalization cover', 'Better limits', 'Stronger protection'] },
      { planType: 'PREMIUM', title: 'Premium', subtitle: 'Best cover with priority handling', coverageAmount: 1500000, premiumAmount: 6999, durationYears: 1, highlights: ['Highest cover', 'Priority processing', 'Maximum protection'] }
    ],
    LIFE: [
      { planType: 'BASIC', title: 'Basic', subtitle: 'Entry life cover', coverageAmount: 500000, premiumAmount: 2499, durationYears: 1, highlights: ['Life cover', 'Simple terms', 'Basic support'] },
      { planType: 'STANDARD', title: 'Standard', subtitle: 'Better life cover', coverageAmount: 1000000, premiumAmount: 3999, durationYears: 1, highlights: ['Higher cover', 'Better protection', 'Standard support'] },
      { planType: 'PREMIUM', title: 'Premium', subtitle: 'Maximum life cover', coverageAmount: 2000000, premiumAmount: 5999, durationYears: 1, highlights: ['Highest cover', 'Priority handling', 'Best protection'] }
    ],
    TERM: [
      { planType: 'BASIC', title: 'Basic', subtitle: 'Affordable term protection', coverageAmount: 1000000, premiumAmount: 1999, durationYears: 1, highlights: ['Term cover', 'Affordable', 'Simple flow'] },
      { planType: 'STANDARD', title: 'Standard', subtitle: 'Balanced term protection', coverageAmount: 2500000, premiumAmount: 3499, durationYears: 1, highlights: ['Higher cover', 'Balanced plan', 'Stronger protection'] },
      { planType: 'PREMIUM', title: 'Premium', subtitle: 'Highest term protection', coverageAmount: 5000000, premiumAmount: 5499, durationYears: 1, highlights: ['Maximum cover', 'Priority processing', 'Best protection'] }
    ],
    TRAVEL: [
      { planType: 'BASIC', title: 'Basic', subtitle: 'Essential travel protection', coverageAmount: 200000, premiumAmount: 799, durationYears: 1, highlights: ['Travel cover', 'Basic medical', 'Standard support'] },
      { planType: 'STANDARD', title: 'Standard', subtitle: 'Better travel protection', coverageAmount: 500000, premiumAmount: 1299, durationYears: 1, highlights: ['Higher cover', 'Better medical', 'Improved protection'] },
      { planType: 'PREMIUM', title: 'Premium', subtitle: 'Best travel cover', coverageAmount: 1000000, premiumAmount: 1899, durationYears: 1, highlights: ['Maximum cover', 'Priority support', 'Best protection'] }
    ],
    HOME: [
      { planType: 'BASIC', title: 'Basic', subtitle: 'Basic home protection', coverageAmount: 300000, premiumAmount: 1499, durationYears: 1, highlights: ['Home cover', 'Basic protection', 'Standard support'] },
      { planType: 'STANDARD', title: 'Standard', subtitle: 'Better home protection', coverageAmount: 800000, premiumAmount: 2499, durationYears: 1, highlights: ['Higher cover', 'Better protection', 'Faster routing'] },
      { planType: 'PREMIUM', title: 'Premium', subtitle: 'Maximum home protection', coverageAmount: 1500000, premiumAmount: 3999, durationYears: 1, highlights: ['Maximum cover', 'Priority processing', 'Best protection'] }
    ]
  };

  // ✅ router must be public because template uses router.navigateByUrl()
  constructor(
    private http: HttpService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.policyholderId = Number(localStorage.getItem('userId'));

    if (!this.policyholderId) {
      this.showError = true;
      this.errorMessage = 'Policyholder not logged in.';
      return;
    }

    this.http.getActivePolicy(this.policyholderId).subscribe({
      next: () => this.router.navigateByUrl('/my-policies'),
      error: () => {}
    });

    this.loadRazorpayScript();
  }

  onSelectInsurance(type: InsuranceType): void {
    this.insuranceType = type;
    this.selectedPlan = null;
    this.clearAlerts();
  }

  selectPlan(plan: Plan): void {
    this.selectedPlan = plan;
    this.clearAlerts();
  }

  payNow(): void {
    this.clearAlerts();

    if (!this.insuranceType) {
      this.showError = true;
      this.errorMessage = 'Please select an insurance type.';
      return;
    }
    if (!this.selectedPlan) {
      this.showError = true;
      this.errorMessage = 'Please select a plan to continue.';
      return;
    }
    if (!window.Razorpay) {
      this.showError = true;
      this.errorMessage = 'Razorpay SDK not loaded. Refresh and try again.';
      return;
    }

    // ✅ local const prevents "possibly null" in async blocks
    const plan = this.selectedPlan;
    this.paymentInProgress = true;

    const amountInPaise = Math.round(plan.premiumAmount * 100);

    this.http.createRazorpayOrder(amountInPaise, 'INR', `policy_${this.policyholderId}_${Date.now()}`).subscribe({
      next: (orderRes: any) => {
        const orderId = orderRes?.orderId;
        const keyId = orderRes?.keyId;

        if (!orderId || !keyId) {
          this.paymentInProgress = false;
          this.showError = true;
          this.errorMessage = 'Order creation failed. Missing orderId/keyId.';
          return;
        }

        this.lastOrderId = orderId;

        const purchasePayload: PolicyPurchaseRequest = {
          insuranceType: this.insuranceType,
          planType: plan.planType,
          coverageAmount: plan.coverageAmount,
          premiumAmount: plan.premiumAmount,
          durationYears: plan.durationYears,
          razorpayOrderId: orderId
        };

        this.http.createPolicyPurchase(this.policyholderId, purchasePayload).subscribe({
          next: () => this.openRazorpayCheckout(keyId, orderId, amountInPaise),
          error: (err) => {
            this.paymentInProgress = false;
            this.showError = true;
            this.errorMessage = err?.error?.message || 'Policy purchase initialization failed.';
          }
        });
      },
      error: (err) => {
        this.paymentInProgress = false;
        this.showError = true;
        this.errorMessage = err?.error?.message || 'Unable to create payment order.';
      }
    });
  }

  private openRazorpayCheckout(keyId: string, orderId: string, amountInPaise: number): void {
    const plan = this.selectedPlan; // may be null if user navigated away
    if (!plan) {
      this.paymentInProgress = false;
      return;
    }

    const options = {
      key: keyId,
      amount: amountInPaise,
      currency: 'INR',
      name: 'Insurance Policy Purchase',
      description: `${this.insuranceType} • ${plan.planType} Plan`,
      order_id: orderId,
      theme: { color: '#3B82F6' },

      handler: (response: any) => {
        const verifyPayload = {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        };

        this.http.verifyRazorpayPayment(verifyPayload).subscribe({
          next: () => {
            this.paymentInProgress = false;
            this.showMessage = true;
            this.responseMessage = 'Payment successful. Policy activated.';
            setTimeout(() => this.router.navigateByUrl('/my-policies'), 900);
          },
          error: (err) => {
            this.paymentInProgress = false;
            this.showError = true;
            this.errorMessage = err?.error?.message || 'Payment verification failed.';
          }
        });
      },

      modal: {
        ondismiss: () => {
          this.paymentInProgress = false;
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  private loadRazorpayScript(): void {
    if (document.getElementById('razorpay-sdk')) return;

    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  private clearAlerts(): void {
    this.showError = false;
    this.errorMessage = '';
    this.showMessage = false;
    this.responseMessage = '';
  }

  // ✅ ADD BACK (template needs it)
  typeLabel(t: InsuranceType | ''): string {
    const map: Record<InsuranceType, string> = {
      CAR: 'Car Insurance',
      BIKE: 'Bike Insurance',
      HEALTH: 'Health Insurance',
      LIFE: 'Life Insurance',
      TERM: 'Term Insurance',
      TRAVEL: 'Travel Insurance',
      HOME: 'Home Insurance'
    };
    return t ? map[t as InsuranceType] : '-';
  }

  // ✅ ADD BACK (template needs it)
  formatINR(n: number): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  }
}