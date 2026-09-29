// Rastreamento de clique no WhatsApp para landing pages, sem pagina-ponte e
// sem formulario.
//
// O que faz:
//   1. Na chegada, guarda os identificadores de campanha da URL (gclid, gbraid,
//      wbraid, fbclid, utm_*) no navegador do visitante, junto com um codigo
//      curto da visita (ex.: MC-7K3QF9). Assim o clique continua atribuido
//      mesmo que a pessoa troque de pagina ou volte outro dia.
//   2. Em todo link de WhatsApp da pagina, escreve uma mensagem curta com o
//      codigo entre colchetes no fim. A redacao muda um pouco conforme a origem
//      da visita, sem citar a origem: se o codigo for apagado ou o clique nao
//      chegar ao Intelligence, a frase ainda permite saber de onde a pessoa
//      veio. Nenhuma delas e igual a do site institucional.
//   3. No clique, avisa o Intelligence em segundo plano (sendBeacon) e deixa o
//      navegador abrir o wa.me direto. Nenhum redirecionamento por dominio
//      nosso: pagina-ponte viola a politica do Google Ads.
//
// O Intelligence casa o codigo da primeira mensagem com o clique e atribui a
// origem da conversa; sem codigo, reconhece a frase (docs/CLICK_TRACKING.md e
// scripts/click-attribution.mjs no repo do Intelligence). Mudou uma frase
// aqui, mude o padrao la.
//
// Nunca envia nome, telefone ou e-mail: o endpoint recusa o corpo inteiro.
//
// Uso:
//   import { initWhatsappTracking } from './wa-tracking.js'
//   initWhatsappTracking({
//     client: 'dr-fulano-de-tal',   // slug do cliente no Intelligence
//     prefix: 'FT',                 // 2 a 6 letras/numeros, unico por cliente
//     doctor: 'o Dr. Fulano de Tal', // com artigo: "o Dr.", "a Dra."
//     booking: 'uma avaliação',      // o que a pessoa quer agendar
//     onClick: (source) => {},       // opcional: evento proprio da pagina (GTM)
//   })

const DEFAULT_ENDPOINT = 'https://intelligence.calil.ia.br/v1/track/whatsapp-click/'
const STORAGE_KEY = 'pulso_wa_attr'
const TTL_MS = 90 * 24 * 60 * 60 * 1000
const CAMPAIGN_KEYS = [
  'gclid', 'gbraid', 'wbraid', 'fbclid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
]
// Sem 0/O, 1/I/L: o codigo pode ser lido em voz alta pela secretaria.
const REF_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const REF_LENGTH = 6
const WHATSAPP_HOSTS = new Set(['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'])
// Limites do endpoint: passar de um deles recusa o clique inteiro.
const MAX_FIELD = 500
const MAX_URL = 2000
const MAX_USER_AGENT = 480
const MAX_BODY_BYTES = 4000
const DUPLICATE_CLICK_MS = 1000

export function newRef(prefix, random = secureRandom) {
  let code = ''
  for (let i = 0; i < REF_LENGTH; i += 1) code += REF_ALPHABET[random(REF_ALPHABET.length)]
  return `${prefix}-${code}`
}

function secureRandom(max) {
  try {
    const buffer = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buffer)
    return buffer[0] % max
  } catch {
    return Math.floor(Math.random() * max)
  }
}

export function campaignFromSearch(search) {
  const params = new URLSearchParams(search || '')
  const campaign = {}
  for (const key of CAMPAIGN_KEYS) {
    const value = (params.get(key) || '').trim()
    if (value) campaign[key] = value.slice(0, MAX_FIELD)
  }
  return campaign
}

const GOOGLE_SOURCES = new Set(['google', 'google ads', 'googleads', 'adwords'])
const META_SOURCES = new Set(['meta', 'meta ads', 'facebook', 'instagram', 'fb', 'ig'])

// Mesma regra de origem do Intelligence (sourceLabelFromClick): identificador
// de clique vale mais que utm_source.
export function originOfCampaign(campaign) {
  if (campaign.gclid || campaign.gbraid || campaign.wbraid) return 'google'
  if (campaign.fbclid) return 'meta'
  const utmSource = (campaign.utm_source || '').trim().toLowerCase()
  if (GOOGLE_SOURCES.has(utmSource)) return 'google'
  if (META_SOURCES.has(utmSource)) return 'meta'
  return 'site'
}

export function messageForOrigin(origin, { doctor, booking }) {
  if (origin === 'google') return `Olá! Quero agendar ${booking} com ${doctor}.`
  if (origin === 'meta') return `Oi! Quero marcar ${booking} com ${doctor}.`
  return `Olá! Gostaria de marcar ${booking} com ${doctor}.`
}

function sameCampaign(a, b) {
  return CAMPAIGN_KEYS.every((key) => (a[key] || '') === (b[key] || ''))
}

// Decide a visita valida para esta pagina. Chegada com campanha nova na URL
// substitui a guardada (vale o ultimo anuncio clicado, que e o que o Google Ads
// aceita na conversao). Chegada sem campanha reaproveita a guardada enquanto
// ela nao vencer. Recarregar a mesma URL nao gera codigo novo.
export function resolveVisit({ stored, campaign, prefix, referrer, now, random }) {
  const valid = isValidVisit(stored, prefix, now) ? stored : null
  const hasCampaign = Object.keys(campaign).length > 0
  if (valid && (!hasCampaign || sameCampaign(valid.campaign, campaign))) return valid
  return { ref: newRef(prefix, random), campaign, referrer: referrer || '', ts: now }
}

function isValidVisit(visit, prefix, now) {
  return Boolean(visit)
    && typeof visit.ref === 'string' && visit.ref.startsWith(`${prefix}-`)
    && typeof visit.ts === 'number' && now - visit.ts < TTL_MS
    && typeof visit.campaign === 'object' && visit.campaign !== null
}

export function isWhatsappUrl(href) {
  try {
    return WHATSAPP_HOSTS.has(new URL(href).hostname.toLowerCase())
  } catch {
    return false
  }
}

// Escreve a mensagem da origem com o codigo no fim. O texto que o link trazia e
// substituido: a frase precisa ser a do modelo para o Intelligence reconhecer.
// A query e montada com encodeURIComponent porque o WhatsApp nao converte "+"
// em espaco.
export function whatsappUrlWithRef(href, ref, originMessage) {
  const url = new URL(href)
  const message = `${originMessage} [${ref}]`
  const others = []
  url.searchParams.forEach((value, key) => {
    if (key !== 'text') others.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
  })
  const query = [...others, `text=${encodeURIComponent(message)}`].join('&')
  return `${url.origin}${url.pathname}?${query}`
}

// So origem + caminho: a query do site de onde a pessoa veio pode trazer dado
// pessoal.
export function referrerWithoutQuery(referrer) {
  try {
    const url = new URL(referrer)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return `${url.origin}${url.pathname}`.slice(0, MAX_FIELD)
  } catch {
    return ''
  }
}

export function clickPayload({ visit, source, pageUrl, userAgent }) {
  const payload = {
    ref: visit.ref,
    pagina: source,
    ...visit.campaign,
    landing_page_url: (pageUrl || '').slice(0, MAX_URL),
    referrer_url: visit.referrer,
    user_agent: (userAgent || '').slice(0, MAX_USER_AGENT),
  }
  for (const key of Object.keys(payload)) if (!payload[key]) delete payload[key]
  // Identificadores de campanha sao o que importa; o resto sai primeiro se o
  // corpo estourar.
  for (const key of ['landing_page_url', 'user_agent', 'referrer_url', 'utm_content', 'utm_term']) {
    if (byteLength(JSON.stringify(payload)) <= MAX_BODY_BYTES) break
    delete payload[key]
  }
  return payload
}

function byteLength(text) {
  return new TextEncoder().encode(text).length
}

let visitInMemory = null

function readStored() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || visitInMemory
  } catch {
    return visitInMemory
  }
}

function writeStored(visit) {
  visitInMemory = visit
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visit))
  } catch {
    // Navegacao anonima ou armazenamento bloqueado: segue so em memoria.
  }
}

function send(endpoint, payload) {
  const body = JSON.stringify(payload)
  if (navigator.sendBeacon && navigator.sendBeacon(endpoint, body)) return
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function initWhatsappTracking(config) {
  const { client, prefix, doctor, booking } = config || {}
  if (!/^[a-z0-9-]+$/.test(client || '') || !/^[A-Z0-9]{2,6}$/.test(prefix || '') || !doctor || !booking) {
    throw new Error('wa-tracking: informe client, prefix, doctor e booking')
  }
  const endpoint = config.endpoint || `${DEFAULT_ENDPOINT}${client}`

  const visit = resolveVisit({
    stored: readStored(),
    campaign: campaignFromSearch(window.location.search),
    prefix,
    referrer: referrerWithoutQuery(document.referrer),
    now: Date.now(),
  })
  writeStored(visit)
  const message = messageForOrigin(originOfCampaign(visit.campaign), { doctor, booking })

  const decorate = (anchor) => {
    anchor.href = whatsappUrlWithRef(anchor.href, visit.ref, message)
  }

  let lastSentAt = 0
  const sendClick = (source) => {
    const now = Date.now()
    if (now - lastSentAt < DUPLICATE_CLICK_MS) return
    lastSentAt = now
    send(endpoint, clickPayload({
      visit,
      source: source || 'lp',
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    }))
  }

  // Rastreamento nunca pode atrasar nem impedir a ida para o WhatsApp: todo
  // erro daqui para baixo e engolido.
  const decorateAll = () => {
    try {
      document.querySelectorAll('a[href]').forEach((anchor) => {
        if (isWhatsappUrl(anchor.href)) decorate(anchor)
      })
    } catch {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorateAll)
  else decorateAll()

  // Fase de captura: o href e corrigido antes de o navegador seguir o link,
  // inclusive em links criados depois do carregamento.
  document.addEventListener('click', (event) => {
    try {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!anchor || !isWhatsappUrl(anchor.href)) return
      decorate(anchor)
      sendClick(anchor.dataset.cta)
      if (typeof config.onClick === 'function') config.onClick(anchor.dataset.cta || 'lp', anchor)
    } catch {}
  }, true)

  // Para paginas que montam o link por conta propria (React, modal).
  return {
    ref: visit.ref,
    whatsappUrl: (href) => whatsappUrlWithRef(href, visit.ref, message),
    sendClick,
  }
}
