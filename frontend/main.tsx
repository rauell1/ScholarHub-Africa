import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeToggle } from './components/ThemeToggle';
import '../static/css/main.css';

// Mount React components into existing DOM elements
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleRoot = document.getElementById('react-theme-toggle');
  if (themeToggleRoot) {
    const root = createRoot(themeToggleRoot);
    root.render(<ThemeToggle />);
  }
  
  const themeToggleMobileRoot = document.getElementById('react-theme-toggle-mobile');
  if (themeToggleMobileRoot) {
    const root = createRoot(themeToggleMobileRoot);
    root.render(<ThemeToggle />);
  }

  // Handle mobile menu toggle
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }

  // Handle FAQ accordion toggles
  const faqToggles = document.querySelectorAll('[data-faq-toggle]');
  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const id = toggle.getAttribute('data-faq-toggle');
      const content = document.getElementById(`faq-${id}`);
      const icon = document.querySelector(`[data-faq-icon="${id}"]`);
      if (content && icon) {
        content.classList.toggle('hidden');
        const isHidden = content.classList.contains('hidden');
        toggle.setAttribute('aria-expanded', (!isHidden).toString());
        icon.textContent = isHidden ? '+' : '-';
      }
    });
  });
});
