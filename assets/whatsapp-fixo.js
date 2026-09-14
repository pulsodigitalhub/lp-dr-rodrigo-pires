/*
 * Botão flutuante do WhatsApp + barra fixa de rodapé no celular (padrão das LPs do Dr. Gustavo Pimpão).
 * Os dois usam data-lead-open, então abrem o popup do lead-modal.js e o lead segue indo pro webhook.
 * Este script precisa rodar ANTES do DOMContentLoaded (tag com defer), porque o lead-modal.js liga os gatilhos nesse evento.
 */
(function () {
  'use strict';

  const svg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.91 11.91 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.15 1.59 5.96L0 24l6.25-1.64a11.9 11.9 0 0 0 5.79 1.48h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.48-8.41ZM12.05 21.83a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.62-.23-.37a9.91 9.91 0 0 1-1.51-5.27c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.97 9.92Zm5.44-7.43c-.3-.15-1.78-.88-2.05-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.23-.65.08-1.78-.89-2.95-1.59-4.13-3.61-.31-.53.31-.49.89-1.64.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.13 4.55.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35Z"/></svg>';

  function init() {
    const body = document.body;
    const floatingButton = document.createElement('button');
    floatingButton.type = 'button';
    floatingButton.className = 'wa-float';
    floatingButton.setAttribute('data-lead-open', '');
    floatingButton.setAttribute('aria-label', 'Falar com a equipe pelo WhatsApp');
    floatingButton.innerHTML = svg;
    body.appendChild(floatingButton);

    const stickyBar = document.createElement('div');
    stickyBar.className = 'wa-sticky';
    stickyBar.setAttribute('aria-hidden', 'true');
    stickyBar.innerHTML = '<button type="button" class="wa-sticky-btn" data-lead-open tabindex="-1">' + svg + '<span>Agendar pelo WhatsApp</span></button>';
    body.appendChild(stickyBar);

    const stickyButton = stickyBar.querySelector('.wa-sticky-btn');

    function updateSticky() {
      const isVisible = window.scrollY > 260;

      stickyBar.classList.toggle('is-visible', isVisible);
      stickyBar.setAttribute('aria-hidden', String(!isVisible));
      stickyButton.tabIndex = isVisible ? 0 : -1;
      body.classList.toggle('has-wa-sticky', isVisible);
    }

    updateSticky();
    window.addEventListener('scroll', updateSticky, { passive: true });

    floatingButton.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'cta_click', cta_location: 'floating_whatsapp' });
    });

    stickyButton.addEventListener('click', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'cta_click', cta_location: 'mobile_sticky' });
    });
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
}());
