/* Botões de WhatsApp da página: vão direto para o wa.me, sem formulário.
   O wa-tracking.js escreve a mensagem com o código da visita em cada link e
   avisa o Intelligence no clique. Aqui ficam só os eventos do GTM. */
import { initWhatsappTracking } from './wa-tracking.js';

try {
  initWhatsappTracking({
    client: 'dr-rodrigo-pires',
    prefix: 'RP',
    doctor: 'o Dr. Rodrigo Pires',
    booking: 'uma avaliação',
    onClick: function (source) {
      window.dataLayer = window.dataLayer || [];
      /* A conversão do Google Ads no GTM-P3TMD42G dispara em lead_form_submit.
         O evento vinha do formulário; sem formulário, o clique no botão é a
         conversão. Nome e form_name ficam iguais para o gatilho continuar
         valendo. Só a posição do botão: nada de nome ou telefone. */
      window.dataLayer.push({ event: 'lead_form_submit', form_name: 'lead_modal_rodrigo_pires', cta_location: source });
      window.dataLayer.push({ event: 'whatsapp_open', cta_location: source });
    }
  });
} catch (error) {
  /* Rastreamento nunca pode impedir a ida para o WhatsApp: os links já apontam
     para o wa.me no HTML. */
}
