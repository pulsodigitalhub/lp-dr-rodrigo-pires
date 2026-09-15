/*
 * Banner de consentimento de cookies (LGPD + Google Consent Mode v2). A configuração vem dos atributos data-* da tag <script>; o consentimento padrão (tudo negado) deve ser declarado antes do GTM, no <head>. Também adota um banner externo já existente sem interferir nele e, no celular, posiciona o banner acima de barras fixas do rodapé.
 */
(function () {
  'use strict';
  var script = document.currentScript, banner, essentialButton, chave, politica, candidatos = [], medicaoAgendada = false, recalcAgendado = false;
  var todos = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted', functionality_storage: 'granted', personalization_storage: 'granted', security_storage: 'granted' };
  var essenciais = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', functionality_storage: 'granted', personalization_storage: 'denied', security_storage: 'granted' };

  try {
    script = script || document.querySelector('script[src*="consentimento.js"]');
    chave = (script && script.getAttribute('data-chave')) || 'lp_consent_v1';
    politica = (script && script.getAttribute('data-politica')) || '/politica-de-privacidade/';
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') { window.gtag = function gtag() { window.dataLayer.push(arguments); }; }
  } catch (e) { chave = 'lp_consent_v1'; politica = '/politica-de-privacidade/'; }

  function injectStyle() {
    try {
      if (document.getElementById('consentimento-estilo')) { return; }
      var style = document.createElement('style');
      style.id = 'consentimento-estilo'; style.type = 'text/css';
      style.textContent = '.cc-banner{position:fixed;z-index:100;right:20px;bottom:20px;left:20px;max-width:760px;margin:0 auto;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:20px;color:#fff;background:var(--cc-fundo);border:1px solid rgba(255,255,255,.18);border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.28);font-family:inherit;box-sizing:border-box;transition:bottom .2s ease}.cc-banner[hidden]{display:none!important}.cc-copy{max-width:460px}.cc-copy strong{display:block;margin-bottom:4px;font-size:14px}.cc-copy p{margin:0;color:rgba(255,255,255,.82);font-size:12px;line-height:1.5}.cc-copy a{color:#fff;text-decoration:underline;text-underline-offset:2px}.cc-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.cc-actions button{min-height:42px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.62);font:inherit;font-size:12px;font-weight:700;cursor:pointer}.cc-essencial{color:#fff;background:transparent}.cc-aceitar{color:var(--cc-texto-destaque);background:var(--cc-destaque);border-color:var(--cc-destaque)!important}.cc-actions button:focus-visible,.cc-copy a:focus-visible{outline:3px solid #fff;outline-offset:3px}@media (max-width:640px){.cc-banner{right:12px;bottom:12px;left:12px;padding:16px;flex-direction:column;align-items:flex-start}.cc-actions{width:100%;justify-content:flex-start}.cc-actions button{flex:1 1 100%;width:100%}}@media (prefers-reduced-motion:reduce){.cc-banner{transition:none}}';
      (document.head || document.documentElement).appendChild(style);
    } catch (e) {}
  }

  function ajustarAcimaDoRodape() {
    try {
      if (!banner) { return; }
      if (window.innerWidth > 640) { banner.style.bottom = ''; return; }
      if (banner.hidden) { return; }
      var topoMaisAlto = null;
      candidatos.forEach(function (el) {
        try {
          var r = el.getBoundingClientRect(), cs = window.getComputedStyle(el);
          if (cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05 && r.width >= window.innerWidth * 0.6 && r.height > 0 && r.height <= window.innerHeight * 0.4 && r.bottom >= window.innerHeight - 4 && r.top < window.innerHeight - 1) {
            topoMaisAlto = topoMaisAlto === null ? r.top : Math.min(topoMaisAlto, r.top);
          }
        } catch (e) {}
      });
      banner.style.bottom = topoMaisAlto === null ? '' : Math.round(window.innerHeight - topoMaisAlto + 12) + 'px';
    } catch (e) {}
  }
  function medirNoProximoFrame() {
    try {
      if (medicaoAgendada) { return; }
      medicaoAgendada = true;
      (window.requestAnimationFrame || function (fn) { return window.setTimeout(fn, 0); })(function () { medicaoAgendada = false; ajustarAcimaDoRodape(); });
    } catch (e) {}
  }
  function recalcularCandidatos() {
    try {
      if (!banner || !document.body) { return; }
      candidatos = [];
      Array.prototype.forEach.call(document.body.querySelectorAll('*'), function (el) {
        try {
          if (el === banner || el.contains(banner) || banner.contains(el)) { return; }
          var cs = window.getComputedStyle(el);
          if (cs.position === 'fixed' || (cs.position === 'sticky' && cs.bottom === '0px')) { candidatos.push(el); }
        } catch (e) {}
      });
      ajustarAcimaDoRodape();
    } catch (e) {}
  }
  function agendarRecalculo() {
    try {
      if (recalcAgendado) { return; }
      recalcAgendado = true;
      window.setTimeout(function () { recalcAgendado = false; recalcularCandidatos(); }, 250);
    } catch (e) {}
  }
  function ativarPosicionamento() {
    try {
      recalcularCandidatos();
      window.addEventListener('scroll', medirNoProximoFrame, { passive: true });
      window.addEventListener('resize', function () { recalcularCandidatos(); ajustarAcimaDoRodape(); }, false);
      if (window.MutationObserver && document.body) { new window.MutationObserver(agendarRecalculo).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); }
      window.setInterval(function () { try { if (banner && !banner.hidden) { ajustarAcimaDoRodape(); } } catch (e) {} }, 700);
    } catch (e) {}
  }

  function choose(choice) {
    try {
      var consent = choice === 'all' ? todos : essenciais;
      window.gtag('consent', 'update', consent);
      window.dataLayer.push({ event: 'consent_choice', consent_choice: choice });
      try { window.localStorage.setItem(chave, JSON.stringify(consent)); } catch (e) {}
      if (banner) { banner.hidden = true; }
    } catch (e) {}
  }
  function reopenConsent() {
    try {
      if (banner) { banner.hidden = false; }
      if (essentialButton) { essentialButton.focus(); }
      ajustarAcimaDoRodape();
    } catch (e) {}
  }
  function createBanner() {
    try {
      var fundo = (script && script.getAttribute('data-fundo')) || '#1f2937', destaque = (script && script.getAttribute('data-destaque')) || '#ffffff', textoDestaque = (script && script.getAttribute('data-texto-destaque')) || '#111827', copy, title, paragraph, link, actions, acceptButton, stored;
      injectStyle();
      banner = document.createElement('section');
      banner.id = 'consent-banner'; banner.className = 'cc-banner'; banner.setAttribute('role', 'region'); banner.setAttribute('aria-labelledby', 'cc-titulo'); banner.hidden = true;
      banner.style.setProperty('--cc-fundo', fundo); banner.style.setProperty('--cc-destaque', destaque); banner.style.setProperty('--cc-texto-destaque', textoDestaque);
      copy = document.createElement('div'); copy.className = 'cc-copy';
      title = document.createElement('strong'); title.id = 'cc-titulo'; title.textContent = 'Sua privacidade';
      paragraph = document.createElement('p');
      paragraph.appendChild(document.createTextNode('Usamos cookies essenciais para o funcionamento da página. Com sua autorização, também usamos cookies de medição e publicidade para melhorar a comunicação. Consulte a '));
      link = document.createElement('a'); link.setAttribute('href', politica); link.textContent = 'Política de Privacidade';
      paragraph.appendChild(link); paragraph.appendChild(document.createTextNode('.'));
      copy.appendChild(title); copy.appendChild(paragraph);
      actions = document.createElement('div'); actions.className = 'cc-actions';
      essentialButton = document.createElement('button'); essentialButton.type = 'button'; essentialButton.className = 'cc-essencial'; essentialButton.setAttribute('data-consent-choice', 'essential'); essentialButton.textContent = 'Usar apenas essenciais';
      acceptButton = document.createElement('button'); acceptButton.type = 'button'; acceptButton.className = 'cc-aceitar'; acceptButton.setAttribute('data-consent-choice', 'all'); acceptButton.textContent = 'Aceitar todos';
      essentialButton.onclick = function () { choose('essential'); }; acceptButton.onclick = function () { choose('all'); };
      actions.appendChild(essentialButton); actions.appendChild(acceptButton); banner.appendChild(copy); banner.appendChild(actions); document.body.appendChild(banner);
      try { stored = window.localStorage.getItem(chave); } catch (e) { stored = null; }
      banner.hidden = !!stored;
      if (window.location.hash === '#consentimento') { reopenConsent(); }
    } catch (e) {}
  }
  function iniciar() {
    try {
      var existente = document.getElementById('consent-banner');
      if (existente && !existente.classList.contains('cc-banner')) {
        banner = existente;
        if (typeof window.reopenConsent !== 'function') { window.reopenConsent = reopenConsent; }
        ativarPosicionamento();
        if (window.location.hash === '#consentimento') { reopenConsent(); }
        return;
      }
      if (existente) { banner = existente; } else { createBanner(); }
      ativarPosicionamento();
    } catch (e) {}
  }
  try {
    if (document.body) { iniciar(); } else { document.addEventListener('DOMContentLoaded', iniciar, false); }
  } catch (e) {}
  try { if (typeof window.reopenConsent !== 'function') { window.reopenConsent = reopenConsent; } } catch (e) {}
  try { window.addEventListener('hashchange', function () { if (window.location.hash === '#consentimento') { reopenConsent(); } }, false); } catch (e) {}
  try {
    document.addEventListener('click', function (event) {
      try {
        var node = event.target;
        while (node && node !== document) {
          var matches = node.matches || node.webkitMatchesSelector || node.mozMatchesSelector || node.msMatchesSelector;
          if (matches && matches.call(node, '[data-abrir-consentimento], a[href$="#consentimento"]')) { event.preventDefault(); reopenConsent(); return; }
          node = node.parentNode;
        }
      } catch (e) {}
    }, false);
  } catch (e) {}
}());
