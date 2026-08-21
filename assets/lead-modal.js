/* Popup de agendamento (Nome + Telefone) antes de abrir o WhatsApp.
   Auto-detect: qualquer [data-lead-open], a[href^="https://wa.me/"] ou
   a[href^="https://api.whatsapp.com/"] na página abre o modal em vez de
   navegar direto. Número/médico vêm de data-lead-phone/data-lead-doctor no
   próprio link, com fallback pros valores padrão abaixo. */
(function () {
  'use strict';

  var WEBHOOK_URL = 'https://leads-clientes.sergioshouse.com.br/rodrigo';
  var DEFAULT_PHONE = '5561994619084';
  var DEFAULT_DOCTOR = 'Dr. Rodrigo Pires';

  function digits(v) { return String(v || '').replace(/\D/g, ''); }

  function extractPhoneFromHref(href) {
    var m = href && href.match(/(?:wa\.me\/|phone=)(\d{10,15})/);
    return m ? m[1] : '';
  }

  function formatPhone(value) {
    var d = digits(value).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  function isValidBrazilPhone(d) { return d.length === 10 || d.length === 11; }

  var modal, backdrop, form, nameInput, phoneInput, errorEl, submitBtn, submitLabel;
  var lastFocus = null;
  var isSubmitting = false;
  var current = { phone: DEFAULT_PHONE, doctor: DEFAULT_DOCTOR };

  function buildModal() {
    backdrop = document.createElement('div');
    backdrop.className = 'lead-modal-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML =
      '<div class="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">' +
        '<button type="button" class="lead-modal-close" aria-label="Fechar">&times;</button>' +
        '<p class="kicker">Agendar consulta</p>' +
        '<h3 id="lead-modal-title">Fale com a equipe pelo WhatsApp</h3>' +
        '<p class="lead-modal-intro">Preencha nome e telefone para agilizar o atendimento. Você será direcionado ao WhatsApp em seguida.</p>' +
        '<form class="lead-modal-form" novalidate>' +
          '<label for="lead-modal-name">Nome</label>' +
          '<input id="lead-modal-name" name="nome" type="text" autocomplete="name" required minlength="2" />' +
          '<label for="lead-modal-phone">Telefone (com DDD)</label>' +
          '<input id="lead-modal-phone" name="telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(61) 99999-9999" required />' +
          '<p class="lead-modal-error" role="alert"></p>' +
          '<button type="submit" class="lead-modal-submit">' +
            '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411zm-8.475 18.291h-.006a9.928 9.928 0 0 1-5.038-1.376l-.362-.214-3.759.98 1.005-3.658-.235-.375a9.828 9.828 0 0 1-1.517-5.243c.003-5.45 4.454-9.884 9.923-9.884 2.649 0 5.143 1.032 7.017 2.901a9.816 9.816 0 0 1 2.9 6.994c-.003 5.451-4.454 9.885-9.928 9.885z"/></svg>' +
            '<span class="lead-modal-submit-label">Continuar no WhatsApp</span>' +
          '</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(backdrop);

    modal = backdrop.querySelector('.lead-modal');
    form = backdrop.querySelector('form');
    nameInput = backdrop.querySelector('#lead-modal-name');
    phoneInput = backdrop.querySelector('#lead-modal-phone');
    errorEl = backdrop.querySelector('.lead-modal-error');
    submitBtn = backdrop.querySelector('.lead-modal-submit');
    submitLabel = backdrop.querySelector('.lead-modal-submit-label');

    backdrop.querySelector('.lead-modal-close').addEventListener('click', closeModal);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !backdrop.hidden) closeModal();
    });
    phoneInput.addEventListener('input', function () { phoneInput.value = formatPhone(phoneInput.value); });
    form.addEventListener('submit', onSubmit);
  }

  function showError(msg) { errorEl.textContent = msg || ''; }

  function openModal(trigger) {
    if (!backdrop) buildModal();
    current.phone = trigger.getAttribute('data-lead-phone') || extractPhoneFromHref(trigger.getAttribute('href')) || DEFAULT_PHONE;
    current.doctor = trigger.getAttribute('data-lead-doctor') || DEFAULT_DOCTOR;
    lastFocus = document.activeElement;
    showError('');
    form.reset();
    backdrop.hidden = false;
    document.body.classList.add('lead-modal-open');
    window.setTimeout(function () { nameInput.focus(); }, 50);
  }

  function closeModal() {
    if (!backdrop || backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.classList.remove('lead-modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function onSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    var nome = nameInput.value.trim();
    var telefoneDigits = digits(phoneInput.value);

    if (!nome || nome.length < 2) {
      showError('Informe seu nome para continuar.');
      nameInput.focus();
      return;
    }
    if (!isValidBrazilPhone(telefoneDigits)) {
      showError('Informe um telefone válido com DDD.');
      phoneInput.focus();
      return;
    }

    var message =
      'Olá, gostaria de agendar uma avaliação com ' + current.doctor + '.\n\n' +
      'Nome: ' + nome + '\n' +
      'Telefone: ' + formatPhone(telefoneDigits);
    var whatsappUrl = 'https://wa.me/' + current.phone + '?text=' + encodeURIComponent(message);

    isSubmitting = true;
    submitBtn.disabled = true;
    submitLabel.textContent = 'Enviando...';
    showError('');

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_form_submit', form_name: 'lead_modal_rodrigo_pires' });

    window.dataLayer.push({ event: 'whatsapp_open' });

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nome,
        whatsapp: telefoneDigits,
        telefone_digits: telefoneDigits,
        medico: current.doctor,
        motivo: 'Agendamento via popup WhatsApp',
        pagina: window.location.href,
        page_url: window.location.href,
        origem: window.location.href,
        evento: 'lead_form_submit'
      }),
      keepalive: true
    }).catch(function () {
      /* navegação para o WhatsApp já está em andamento; o webhook é melhor-esforço, não bloqueia o usuário. */
    });

    window.location.href = whatsappUrl;

    form.reset();
    closeModal();
    isSubmitting = false;
    submitBtn.disabled = false;
    submitLabel.textContent = 'Continuar no WhatsApp';
  }

  function isWhatsAppTrigger(el) {
    if (el.hasAttribute('data-lead-open')) return true;
    var href = el.getAttribute('href') || '';
    return href.indexOf('https://wa.me/') === 0 || href.indexOf('https://api.whatsapp.com/') === 0;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var triggers = Array.prototype.filter.call(document.querySelectorAll('a, [data-lead-open]'), isWhatsAppTrigger);
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        openModal(trigger);
      });
    });
  });
})();
