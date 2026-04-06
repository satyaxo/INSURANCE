import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


type SectionId = 'top' | 'products' | 'how' | 'tracking' | 'workflow' | 'trust' | 'faq';

type WorkflowStep = {
  title: string;
  ownerLabel: string;   // customer-friendly owner label (no heavy jargon)
  status: string;       // your real statuses
  description: string;  // customer-friendly description
};

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  // auth state
  isLoggedIn = false;
  role: string | null = null;

  // template-safe year
  currentYear: number = new Date().getFullYear();

  // nav active highlight
  activeSection: SectionId = 'top';

  // reduced motion support
  reducedMotion = false;

  // workflow (consumer-friendly copy but real backend stages)
  workflow: WorkflowStep[] = [
    {
      title: 'Submit claim',
      ownerLabel: 'You',
      status: 'SUBMITTED',
      description: 'Submit details in minutes. Evidence upload is optional.'
    },
    {
      title: 'Initial review',
      ownerLabel: 'Claims team',
      status: 'IN_PROGRESS / UNDER_PROGRESS',
      description: 'We validate policy details and route the claim for processing.'
    },
    {
      title: 'Verification (if needed)',
      ownerLabel: 'Verification team',
      status: 'INVESTIGATION_IN_PROGRESS',
      description: 'Evidence is checked and a verification report is prepared.'
    },
    {
      title: 'Final decision',
      ownerLabel: 'Approval team',
      status: 'UNDER_REVIEW',
      description: 'Decision is made after reviewing report and documents.'
    },
    {
      title: 'Outcome',
      ownerLabel: 'System update',
      status: 'APPROVED / REJECTED',
      description: 'You get the final decision, and history stays visible as record.'
    }
  ];

  activeWorkflowIndex = 0;

  // observers + raf
  private revealIO?: IntersectionObserver;
  private sectionIO?: IntersectionObserver;
  private workflowIO?: IntersectionObserver;
  private rafId: any = null;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.getLoginStatus;
    this.role = this.authService.getRole;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }

  ngAfterViewInit(): void {
    this.setupRevealObserver();
    this.setupSectionObserver();
    this.setupWorkflowObserver();
    this.setupScrollVars();
  }

  ngOnDestroy(): void {
    if (this.revealIO) this.revealIO.disconnect();
    if (this.sectionIO) this.sectionIO.disconnect();
    if (this.workflowIO) this.workflowIO.disconnect();
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  // ----------------------------
  // Navigation / CTAs
  // ----------------------------
  scrollTo(id: SectionId): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: this.reducedMotion ? 'auto' : 'smooth', block: 'start' });
    this.activeSection = id;
  }

  goLogin(): void { this.router.navigateByUrl('/login'); }
  goRegister(): void { this.router.navigateByUrl('/registration'); }

  goPrimary(): void {
    if (this.isLoggedIn) this.goDashboard();
    else this.goLogin();
  }

  goFileClaim(): void {
    const r = (this.role || '').toUpperCase();
    if (this.isLoggedIn && r === 'POLICYHOLDER') this.router.navigateByUrl('/create-claim');
    else if (this.isLoggedIn) this.goDashboard();
    else this.goLogin();
  }

  goTrackClaim(): void {
    const r = (this.role || '').toUpperCase();
    if (this.isLoggedIn && r === 'POLICYHOLDER') this.router.navigateByUrl('/dashboard');
    else if (this.isLoggedIn) this.goDashboard();
    else this.goLogin();
  }

  // Role-based internal redirect
  goDashboard(): void {
    const r = (this.role || localStorage.getItem('role') || '').toUpperCase();
    if (r === 'UNDERWRITER') this.router.navigateByUrl('/underwriter-dashboard');
    else if (r === 'INVESTIGATOR') this.router.navigateByUrl('/create-investigator');
    else if (r === 'ADJUSTER') this.router.navigateByUrl('/adjuster-dashboard');
    else if (r === 'POLICYHOLDER') this.router.navigateByUrl('/dashboard');
    else this.router.navigateByUrl('/landing');
  }

  // ----------------------------
  // Reveal animations
  // ----------------------------
  private setupRevealObserver(): void {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!els.length) return;

    this.revealIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('in-view');
          this.revealIO?.unobserve(e.target);
        }
      });
    }, { threshold: 0.14 });

    els.forEach(el => this.revealIO?.observe(el));
  }

  // ----------------------------
  // Active section highlight
  // ----------------------------
  private setupSectionObserver(): void {
    const ids: SectionId[] = ['top', 'products', 'how', 'tracking', 'workflow', 'trust', 'faq'];
    const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    this.sectionIO = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

      if (visible?.target?.id) this.activeSection = visible.target.id as SectionId;
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0.12, 0.2, 0.35] });

    els.forEach(el => this.sectionIO?.observe(el));
  }

  // ----------------------------
  // Workflow scrollytelling
  // ----------------------------
  private setupWorkflowObserver(): void {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-wf]'));
    if (!items.length) return;

    this.workflowIO = new IntersectionObserver((entries) => {
      const inView = entries.filter(e => e.isIntersecting);
      if (!inView.length) return;

      const best = inView.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
      const idx = Number((best.target as HTMLElement).dataset['wf'] || 0);
      if (!Number.isNaN(idx)) this.activeWorkflowIndex = idx;
    }, { rootMargin: '-42% 0px -45% 0px', threshold: [0.25, 0.4, 0.6] });

    items.forEach(el => this.workflowIO?.observe(el));
  }

  workflowActive(): WorkflowStep {
    return this.workflow[this.activeWorkflowIndex] || this.workflow[0];
  }

  workflowProgress(): number {
    const total = Math.max(1, this.workflow.length - 1);
    return Math.round((this.activeWorkflowIndex / total) * 100);
  }

  // ----------------------------
  // Minimal-motion background vars
  // ----------------------------
  private setupScrollVars(): void {
    if (this.reducedMotion) return;

    const update = () => {
      const y = window.scrollY || 0;
      const doc = document.documentElement;
      const h = doc.scrollHeight - window.innerHeight;
      const p = h > 0 ? (y / h) : 0;

      doc.style.setProperty('--scrollY', String(y));
      doc.style.setProperty('--scrollP', String(p));

      this.rafId = requestAnimationFrame(update);
    };

    this.rafId = requestAnimationFrame(update);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  }
}