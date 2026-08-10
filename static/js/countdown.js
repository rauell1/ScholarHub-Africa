// Deadline countdown component (System Design v1.0 §13).
// Elements with [data-deadline] get a live "X days" / "X d Y h" badge.
(function () {
  'use strict';

  function update(el) {
    var deadline = new Date(el.dataset.deadline);
    if (isNaN(deadline.getTime())) return;

    var diff = deadline.getTime() - Date.now();

    if (diff <= 0) {
      el.textContent = 'CLOSED';
      el.classList.add('text-crimson', 'font-bold');
      el.classList.remove('animate-pulse');
      return;
    }

    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);

    if (days <= 7) {
      el.textContent = days + 'd ' + hours + 'h left';
      el.classList.add('text-crimson', 'font-bold', 'animate-pulse');
    } else if (days <= 30) {
      el.textContent = days + ' days';
      el.classList.add('text-amber', 'font-semibold');
    } else {
      el.textContent = days + ' days';
      el.classList.add('text-forest', 'font-semibold');
    }
  }

  function init() {
    var els = document.querySelectorAll('[data-deadline]');
    for (var i = 0; i < els.length; i++) {
      update(els[i]);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  // Refresh every minute so countdowns stay honest.
  setInterval(init, 60000);
})();
