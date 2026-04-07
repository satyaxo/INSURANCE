import { Component, AfterViewInit, OnDestroy } from '@angular/core';

type CSComment = {
  name: string;
  rating: number;
  text: string;
  createdAt: number;
  likes: number;
};

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {

  private revealObserver?: IntersectionObserver;
  private counterObserver?: IntersectionObserver;
  private scrollListener: any;

  // Overview modal
  showOverview = false;

  // Footer comments (no ngModel needed)
  commentName = '';
  commentText = '';
  commentRating = 5;
  commentMessage = '';
  comments: CSComment[] = [];

  currentYear = new Date().getFullYear();

  ngAfterViewInit(): void {
    this.loadComments();
    this.initScrollReveal();
    this.initCounters();
    this.initNavbarScrollEffect();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.counterObserver?.disconnect();
    if (this.scrollListener) window.removeEventListener('scroll', this.scrollListener);
  }

  /* ================= Smooth Scroll ================= */
  scrollTo(id: string, ev?: Event): void {
    ev?.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ================= Overview Modal ================= */
  openOverview(ev?: Event): void {
    ev?.preventDefault();
    this.showOverview = true;
  }

  closeOverview(): void {
    this.showOverview = false;
  }

  /* ================= Scroll Reveal ================= */
  private initScrollReveal(): void {
    const elements = document.querySelectorAll<HTMLElement>('.ic-reveal, .ic-fade-up');
    if (!elements.length) return;

    this.revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = `${index * 0.06}s`;
            setTimeout(() => el.classList.add('visible'), parseFloat(delay) * 1000);
            this.revealObserver?.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => this.revealObserver!.observe(el));
  }

  /* ================= Counters ================= */
  private initCounters(): void {
    const counters = document.querySelectorAll<HTMLElement>('.ic-count');
    if (!counters.length) return;

    this.counterObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = Number(el.dataset['target'] || 0);
            this.animateCounter(el, target);
            this.counterObserver?.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(el => this.counterObserver!.observe(el));
  }

  private animateCounter(el: HTMLElement, target: number): void {
    const duration = 1800;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  /* ================= Navbar Scroll Effect ================= */
  private initNavbarScrollEffect(): void {
    const nav = document.querySelector('.ic-nav');
    if (!nav) return;

    this.scrollListener = () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', this.scrollListener);
  }

  /* ================= Comments (LocalStorage) ================= */
  private storageKey(): string {
    return 'claimsurepro_comments';
  }

  private loadComments(): void {
    try {
      const raw = localStorage.getItem(this.storageKey());
      const parsed = raw ? (JSON.parse(raw) as CSComment[]) : [];
      this.comments = Array.isArray(parsed) ? parsed : [];
      this.comments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch {
      this.comments = [];
    }
  }

  private saveComments(): void {
    localStorage.setItem(this.storageKey(), JSON.stringify(this.comments || []));
  }

  submitComment(): void {
    this.commentMessage = '';

    const name = (this.commentName || '').trim();
    const text = (this.commentText || '').trim();
    const rating = Math.max(1, Math.min(5, Number(this.commentRating || 5)));

    if (name.length < 2) {
      this.commentMessage = 'Please enter a valid name.';
      return;
    }
    if (text.length < 5) {
      this.commentMessage = 'Please write a longer comment (min 5 characters).';
      return;
    }

    const newComment: CSComment = {
      name,
      text,
      rating,
      createdAt: Date.now(),
      likes: 0
    };

    this.comments = [newComment, ...this.comments].slice(0, 30);
    this.saveComments();

    this.commentName = '';
    this.commentText = '';
    this.commentRating = 5;
    this.commentMessage = 'Posted! ✅ Thank you for engaging with ClaimSurePro.';
  }

  like(index: number): void {
    if (index < 0 || index >= this.comments.length) return;
    this.comments[index].likes = (this.comments[index].likes || 0) + 1;
    this.comments = [...this.comments];
    this.saveComments();
  }

  deleteComment(index: number): void {
    if (index < 0 || index >= this.comments.length) return;
    this.comments.splice(index, 1);
    this.comments = [...this.comments];
    this.saveComments();
  }

  clearComments(): void {
    this.comments = [];
    this.saveComments();
    this.commentMessage = 'All comments cleared.';
  }

  stars(rating: number): string {
    const r = Math.max(1, Math.min(5, Number(rating || 5)));
    return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
  }

  formatTime(ts: number): string {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return '';
    }
  }
}