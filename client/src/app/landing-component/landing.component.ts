import { Component, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
selector: 'app-landing',
templateUrl: './landing.component.html',
styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements AfterViewInit, OnDestroy {

private revealObserver?: IntersectionObserver;
private counterObserver?: IntersectionObserver;
private scrollListener?: () => void;

ngAfterViewInit(): void {
this.initScrollReveal();
this.initCounters();
this.initNavbarScrollEffect();
}

ngOnDestroy(): void {
this.revealObserver?.disconnect();
this.counterObserver?.disconnect();
window.removeEventListener('scroll', this.scrollListener as EventListener);
}

/* ================= Scroll Reveal ================= */
private initScrollReveal(): void {
const elements = document.querySelectorAll<HTMLElement>('.ic-reveal');
if (!elements.length) return;

this.revealObserver = new IntersectionObserver(
entries => {
entries.forEach((entry, index) => {
if (entry.isIntersecting) {
const el = entry.target as HTMLElement;
const delay = el.style.animationDelay || `${index * 0.08}s`;

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
// Ease‑out cubic (smooth SaaS standard)
const eased = 1 - Math.pow(1 - progress, 3);

el.textContent = Math.floor(eased * target).toLocaleString();

if (progress < 1) {
requestAnimationFrame(step);
}
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
}
