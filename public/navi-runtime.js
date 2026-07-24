(() => {
  window.__naviRuntimeLoaded = true;

    const importedNavigation = document.querySelector('nav');
    if (importedNavigation) importedNavigation.classList.add('navi-evo-header');
    const mobileToggle = document.querySelector('.navi-evo-mobile-toggle');
    const mobileMenu = document.querySelector('.navi-evo-mobile-menu');
    const setMobileMenu = (open) => {
      if (!mobileToggle || !mobileMenu) return;
      mobileToggle.setAttribute('aria-expanded', String(open));
      mobileMenu.hidden = !open;
      document.body.classList.toggle('navi-mobile-menu-open', open);
    };
    mobileToggle?.addEventListener('click', () => setMobileMenu(mobileToggle.getAttribute('aria-expanded') !== 'true'));
    mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMobileMenu(false); });

    const mainPagePaths = new Set(['/', '/ru/home/', '/ua/home/', '/en/home/']);
    document.addEventListener('click', (event) => {
      if (!mainPagePaths.has(location.pathname)) return;
      const option = event.target.closest?.('[id^="Lang-box-"]');
      const language = option?.querySelector('.w-text')?.textContent.trim().toUpperCase();
      const destination = { RU: '/', UA: '/ua/home/', EN: '/en/home/' }[language];
      if (!destination) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.assign(destination);
    }, true);

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

    const importedPhotoStrip = [...document.querySelectorAll('section, footer')].find((candidate) =>
      [...candidate.querySelectorAll('img')].filter((image) => /(?:^|_)l\d+(?:_|\.)/i.test(image.currentSrc || image.src)).length >= 6
    );
    const isHomePage = ['/', '/ru/home/', '/ua/home/', '/en/home/'].includes(location.pathname);
    if (isHomePage && importedPhotoStrip && !document.querySelector('.navi-home-encyclopedia')) {
      const locale = location.pathname.startsWith('/ua/') ? 'ua' : location.pathname.startsWith('/en/') ? 'en' : 'ru';
      const copy = {
        ru: ['Яхтенная энциклопедия', 'Море говорит на своём языке', 'Понятный справочник яхтенных терминов: от устройства судна и ветра до навигации и безопасности.', 'Открыть энциклопедию'],
        ua: ['Яхтова енциклопедія', 'Море говорить своєю мовою', 'Зрозумілий довідник яхтових термінів: від будови судна й вітру до навігації та безпеки.', 'Відкрити енциклопедію'],
        en: ['Sailing encyclopedia', 'The sea has a language of its own', 'A clear guide to sailing terms, from boat anatomy and wind to navigation and safety.', 'Explore the encyclopedia'],
      }[locale];
      const prefix = `/${locale}`;
      const section = document.createElement('section');
      section.className = 'navi-home-encyclopedia';
      section.setAttribute('aria-labelledby', 'navi-home-encyclopedia-title');
      section.innerHTML = `<div class="navi-home-encyclopedia__content"><div class="navi-home-encyclopedia__copy"><p class="navi-evo-kicker">${copy[0]}</p><h2 id="navi-home-encyclopedia-title">${copy[1]}</h2><p>${copy[2]}</p><a href="${prefix}/encyclopedia">${copy[3]}<span aria-hidden="true">→</span></a></div><div class="navi-home-encyclopedia__chart" aria-hidden="true"><span>46.1603° N</span><i></i><b>1.1511° W</b></div></div>`;
      const faqSection = [...document.querySelectorAll('section')].find((candidate) => {
        const heading = candidate.querySelector('h2')?.textContent.trim() || '';
        return candidate.querySelector('img[src*="faq_lines"]')
          || /^(FAQ|FAQs|Часто задаваемые вопросы|Поширені запитання)$/i.test(heading);
      });
      (faqSection || importedPhotoStrip).before(section);
    }
    if (importedPhotoStrip) {
      const sources = [...importedPhotoStrip.querySelectorAll('img')]
        .filter((image) => /(?:^|_)l\d+(?:_|\.)/i.test(image.currentSrc || image.src))
        .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt || '' }))
        .filter((image, index, images) => images.findIndex((candidate) => candidate.src === image.src) === index);
      importedPhotoStrip.className = 'navi-runtime-photo-strip';
      importedPhotoStrip.removeAttribute('style');
      const track = document.createElement('div');
      track.className = 'navi-runtime-photo-strip__track';
      importedPhotoStrip.replaceChildren(track);

      const renderPhotoStrip = () => {
        const width = importedPhotoStrip.clientWidth || window.innerWidth;
        const gap = 4;
        const preferredSize = 116;
        const count = Math.max(4, Math.ceil((width + gap) / (preferredSize + gap)));
        const size = (width - gap * (count - 1)) / count;
        importedPhotoStrip.style.setProperty('--navi-photo-size', `${size}px`);
        track.style.setProperty('--navi-photo-count', String(count));
        if (track.dataset.photoCount === String(count)) return;
        track.replaceChildren(...Array.from({ length: count }, (_, index) => {
          const image = document.createElement('img');
          image.src = sources[index % sources.length].src;
          image.alt = sources[index % sources.length].alt;
          image.loading = 'lazy';
          image.decoding = 'async';
          return image;
        }));
        track.dataset.photoCount = String(count);
      };

      renderPhotoStrip();
      if ('ResizeObserver' in window) new ResizeObserver(renderPhotoStrip).observe(importedPhotoStrip);
      else window.addEventListener('resize', renderPhotoStrip, { passive: true });
      document.querySelectorAll('footer[data-evo-footer]').forEach((footer) => {
        if (footer !== importedPhotoStrip && footer.querySelector('img[src*="navi_logo"]')) footer.hidden = true;
      });
    }

    const leadEndpoint = 'https://payload.navi.training/api/public/leads';
    const pageLocale = document.documentElement.lang.toLowerCase().startsWith('uk') || location.pathname.startsWith('/ua/') ? 'ua'
      : document.documentElement.lang.toLowerCase().startsWith('en') || location.pathname.startsWith('/en/') ? 'en' : 'ru';
    const pageService = location.pathname.includes('/yacht-delivery') ? 'yacht-delivery'
      : location.pathname.includes('/yacht-expertise') ? 'yacht-expertise'
      : location.pathname.includes('/charter') ? 'charter'
      : /\/(?:sailing-school|inshore-skipper|offshore-skipper|master-of-yacht|vhf)/.test(location.pathname) ? 'sailing-school'
      : 'general';
    document.querySelectorAll('.navi-evo-footer').forEach((footer) => {
      if (footer.querySelector('a[href*="/sailing-school"]')) return;
      const links = footer.querySelectorAll('.navi-evo-footer__links');
      const target = links[1] || links[0];
      if (!target) return;
      const school = document.createElement('a');
      school.href = `/${pageLocale}/sailing-school`;
      school.textContent = pageLocale === 'ua' ? 'Яхтова школа' : pageLocale === 'en' ? 'Sailing school' : 'Яхтенная школа';
      target.append(school);
    });
    const privacyUrl = pageLocale === 'ua' ? '/ua/privacy-policy' : pageLocale === 'en' ? '/en/privacy-policy' : '/ru/privacy-policy';
    const leadCopy = {
      ru: { newsletterKicker: 'Бортовой журнал', newsletterTitle: 'Новости для тех, кого зовёт море', newsletterBody: 'Маршруты, практика чартера и новые истории из нашего журнала. Без лишнего шума.', email: 'E-mail', subscribe: 'Подписаться', consent: 'Согласен получать рассылку и принимаю', privacy: 'политику конфиденциальности', success: 'Вы в списке экипажа. Следующий выпуск придёт на эту почту.', error: 'Не удалось отправить. Попробуйте ещё раз.', sending: 'Отправляем…', close: 'Закрыть' },
      ua: { newsletterKicker: 'Бортовий журнал', newsletterTitle: 'Новини для тих, кого кличе море', newsletterBody: 'Маршрути, практика чартеру та нові історії з нашого журналу. Без зайвого шуму.', email: 'E-mail', subscribe: 'Підписатися', consent: 'Погоджуюся отримувати розсилку та приймаю', privacy: 'політику конфіденційності', success: 'Ви в списку екіпажу. Наступний випуск надійде на цю пошту.', error: 'Не вдалося надіслати. Спробуйте ще раз.', sending: 'Надсилаємо…', close: 'Закрити' },
      en: { newsletterKicker: 'The logbook', newsletterTitle: 'News for those called by the sea', newsletterBody: 'Routes, practical charter notes and new stories from our journal. Useful reading, never inbox noise.', email: 'E-mail', subscribe: 'Join the crew', consent: 'I agree to receive the newsletter and accept the', privacy: 'privacy policy', success: 'You are on the crew list. The next edition will arrive at this address.', error: 'Could not send. Please try again.', sending: 'Sending…', close: 'Close' },
    }[pageLocale];

    const postLead = async (data) => {
      const response = await fetch(leadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, locale: pageLocale, sourceUrl: location.href, utm: location.search.slice(1), consent: true }) });
      if (!response.ok) throw new Error('lead_submit_failed');
      return response.json();
    };

    const contactOverlay = document.getElementById('contact_modal_bg');
    const contactCard = document.getElementById('contact-modal');
    const contactForm = contactCard?.querySelector('form');
    let returnFocus = null;
    const closeContact = () => {
      if (!contactOverlay) return;
      contactOverlay.classList.remove('is-open');
      document.body.classList.remove('navi-modal-open');
      window.setTimeout(() => { contactOverlay.hidden = true; contactOverlay.style.display = 'none'; }, 260);
      returnFocus?.focus?.();
    };
    const openContact = (trigger) => {
      if (!contactOverlay || !contactCard) return;
      returnFocus = trigger;
      if (contactForm) contactForm.dataset.service = trigger?.dataset?.service || pageService;
      contactOverlay.hidden = false;
      contactOverlay.style.display = 'grid';
      contactOverlay.classList.add('navi-lead-overlay', 'navi-contact-overlay');
      contactCard.classList.add('navi-lead-card', 'navi-contact-card');
      contactCard.setAttribute('role', 'dialog'); contactCard.setAttribute('aria-modal', 'true');
      document.body.classList.add('navi-modal-open');
      requestAnimationFrame(() => contactOverlay.classList.add('is-open'));
      window.setTimeout(() => contactCard.querySelector('input:not([type="hidden"])')?.focus(), 280);
    };
    document.querySelectorAll('[data-navi-formbutton]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); openContact(button); }));
    if (new URLSearchParams(location.search).get('contact-preview') === '1') window.setTimeout(() => openContact(document.body), 300);
    contactOverlay?.addEventListener('click', (event) => { if (event.target === contactOverlay) closeContact(); });
    contactCard?.querySelectorAll('[role="formclosebutton"], .navi-modal-close').forEach((button) => button.addEventListener('click', closeContact));
    contactForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = contactForm.querySelector('[type="submit"]');
      const original = submit?.textContent;
      if (submit) { submit.disabled = true; submit.textContent = leadCopy.sending; }
      try {
        const values = new FormData(contactForm);
        const service = contactForm?.dataset?.service || pageService;
        await postLead({ kind: 'contact', service, firstName: values.get('First-Name'), lastName: values.get('Last-Name'), email: values.get('Email'), phone: values.get('Phone'), message: values.get('Message'), company: values.get('company') });
        contactForm.innerHTML = `<div class="navi-lead-success"><strong>${leadCopy.success}</strong></div>`;
      } catch {
        let status = contactForm.querySelector('.navi-lead-status');
        if (!status) { status = document.createElement('p'); status.className = 'navi-lead-status'; contactForm.append(status); }
        status.textContent = leadCopy.error;
        if (submit) { submit.disabled = false; submit.textContent = original; }
      }
    });

    if (!document.getElementById('newsletter-modal')) {
      const newsletterStorage = 'navi-newsletter-state-v1';
      const shouldShowNewsletter = () => {
        if (new URLSearchParams(location.search).get('newsletter-preview') === '1') return true;
        if (/thank-you|404|privacy-policy|cookie-policy/.test(location.pathname)) return false;
        try { const state = JSON.parse(localStorage.getItem(newsletterStorage) || '{}'); return state.subscribed !== true && (!state.dismissedAt || Date.now() - state.dismissedAt > 7 * 864e5); } catch { return true; }
      };
      const createNewsletter = () => {
        if (!shouldShowNewsletter() || document.getElementById('navi-newsletter')) return;
        const overlay = document.createElement('div');
        overlay.id = 'navi-newsletter'; overlay.className = 'navi-lead-overlay navi-newsletter-overlay'; overlay.hidden = true;
        overlay.innerHTML = `<section class="navi-lead-card navi-newsletter-card" role="dialog" aria-modal="true" aria-labelledby="navi-newsletter-title"><button class="navi-lead-close" type="button" aria-label="${leadCopy.close}">×</button><div class="navi-newsletter-visual" aria-hidden="true"><span>46.1603° N</span><b>1.1511° W</b></div><div class="navi-newsletter-copy"><p class="navi-lead-kicker">${leadCopy.newsletterKicker}</p><h2 id="navi-newsletter-title">${leadCopy.newsletterTitle}</h2><p>${leadCopy.newsletterBody}</p><form><label class="navi-field"><span>${leadCopy.email}</span><input name="email" type="email" autocomplete="email" required></label><input class="navi-honeypot" name="company" tabindex="-1" autocomplete="off"><label class="navi-consent"><input name="consent" type="checkbox" required><span>${leadCopy.consent} <a href="${privacyUrl}">${leadCopy.privacy}</a>.</span></label><button type="submit">${leadCopy.subscribe}<span aria-hidden="true">→</span></button><p class="navi-lead-status" aria-live="polite"></p></form></div></section>`;
        document.body.append(overlay);
        const card = overlay.firstElementChild;
        const close = () => { overlay.classList.remove('is-open'); document.body.classList.remove('navi-modal-open'); try { localStorage.setItem(newsletterStorage, JSON.stringify({ dismissedAt: Date.now() })); } catch {} window.setTimeout(() => overlay.remove(), 260); };
        overlay.querySelector('.navi-lead-close').addEventListener('click', close);
        overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
        overlay.querySelector('form').addEventListener('submit', async (event) => {
          event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); const status = form.querySelector('.navi-lead-status'); const values = new FormData(form);
          button.disabled = true; button.firstChild.textContent = leadCopy.sending; status.textContent = '';
          try { await postLead({ kind: 'newsletter', email: values.get('email'), company: values.get('company') }); try { localStorage.setItem(newsletterStorage, JSON.stringify({ subscribed: true })); } catch {} form.innerHTML = `<div class="navi-lead-success"><strong>${leadCopy.success}</strong></div>`; }
          catch { status.textContent = leadCopy.error; button.disabled = false; button.firstChild.textContent = leadCopy.subscribe; }
        });
        overlay.hidden = false; document.body.classList.add('navi-modal-open'); requestAnimationFrame(() => overlay.classList.add('is-open')); window.setTimeout(() => card.querySelector('input[type="email"]')?.focus(), 280);
      };
      if (shouldShowNewsletter()) window.setTimeout(() => { if (!document.hidden && !document.body.classList.contains('navi-modal-open')) createNewsletter(); }, new URLSearchParams(location.search).get('newsletter-preview') === '1' ? 300 : 20000);
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const newsletter = document.getElementById('navi-newsletter');
        if (newsletter?.classList.contains('is-open')) newsletter.querySelector('.navi-lead-close')?.click();
        else if (contactOverlay?.classList.contains('is-open')) closeContact();
      });
    }

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
