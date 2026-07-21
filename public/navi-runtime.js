(() => {
  window.__naviRuntimeLoaded = true;
    document.querySelectorAll('button[aria-controls]:not([role="tab"])').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const region = document.getElementById(trigger.getAttribute('aria-controls'));
        if (!region) return;
        const opening = trigger.getAttribute('aria-expanded') !== 'true';
        trigger.setAttribute('aria-expanded', String(opening));
        trigger.dataset.state = opening ? 'open' : 'closed';
        region.dataset.state = opening ? 'open' : 'closed';
        region.hidden = !opening;
        [trigger.parentElement, region.parentElement].forEach((node) => {
          if (node?.dataset?.state) node.dataset.state = opening ? 'open' : 'closed';
        });
      });
    });

    document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
      const tabs = [...tablist.querySelectorAll('[role="tab"]')];
      const activate = (tab) => {
        tabs.forEach((candidate) => {
          const selected = candidate === tab;
          candidate.setAttribute('aria-selected', String(selected));
          candidate.tabIndex = selected ? 0 : -1;
          candidate.dataset.state = selected ? 'active' : 'inactive';
          const panel = document.getElementById(candidate.getAttribute('aria-controls'));
          if (panel) {
            panel.hidden = !selected;
            panel.dataset.state = selected ? 'active' : 'inactive';
          }
        });
      };
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          tabs[next].focus(); activate(tabs[next]);
        });
      });
    });

    const socials = [
      ['t.me/', 'Telegram', 'T'], ['facebook.com/', 'Facebook', 'f'],
      ['instagram.com/', 'Instagram', '◎'], ['linkedin.com/', 'LinkedIn', 'in'],
      ['youtube.com/', 'YouTube', '▶'],
    ];
    socials.forEach(([fragment, label, glyph]) => {
      document.querySelectorAll(`a[href*="${fragment}"]`).forEach((link) => {
        if (link.textContent.trim() || link.querySelector('img,svg')) return;
        link.setAttribute('aria-label', label);
        link.title = label;
        link.innerHTML = `<svg class="navi-social-icon" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15"/><text x="16" y="16">${glyph}</text></svg>`;
      });
    });

    document.querySelectorAll('[role="formclosebutton"]').forEach((close) => {
      close.addEventListener('click', () => {
        const overlay = close.closest('#contact_modal_bg') || close.parentElement;
        if (overlay) overlay.hidden = true;
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      });
    });

    const headings = [...document.querySelectorAll('h1,h2,h3')];
    const formHeading = headings.find((node) => /^(Подать заявку|Подати заявку|Apply)$/i.test(node.textContent.trim()));
    if (formHeading) {
      let card = formHeading.parentElement;
      while (card && card !== document.body && !card.querySelector('form') && card.querySelectorAll('input,textarea').length < 2) card = card.parentElement;
      if (card && card !== document.body && !card.querySelector('.navi-modal-close')) {
        if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
        const close = document.createElement('button');
        close.className = 'navi-modal-close'; close.type = 'button'; close.setAttribute('aria-label', 'Close'); close.textContent = '×';
        close.addEventListener('click', () => {
          if (location.hash) history.replaceState(null, '', location.pathname + location.search);
          const overlay = card.parentElement;
          if (overlay && getComputedStyle(overlay).position === 'fixed') overlay.hidden = true;
          else card.hidden = true;
        });
        card.prepend(close);
      }
    }
})();
