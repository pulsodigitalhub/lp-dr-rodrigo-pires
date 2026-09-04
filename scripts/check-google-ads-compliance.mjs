#!/usr/bin/env node
/**
 * Verifica a conformidade da LP com as políticas do Google Ads antes de publicar.
 * Roda sobre dist/ quando existir; caso contrário, roda sobre os arquivos-fonte.
 * Uso: COMPLIANCE_BASE_URL=https://dominio.com.br node scripts/check-google-ads-compliance.mjs [--json]
 * Sai com código 1 se houver violação bloqueante.
 */

import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.COMPLIANCE_BASE_URL;

if (!baseUrl) {
  console.error('COMPLIANCE_BASE_URL é obrigatória e deve ser uma URL https válida.');
  process.exit(1);
}

let baseHost;
try {
  const parsedBaseUrl = new URL(baseUrl);
  if (parsedBaseUrl.protocol !== 'https:') throw new Error('protocolo inválido');
  baseHost = parsedBaseUrl.hostname.replace(/^www\./i, '').toLowerCase();
} catch {
  console.error('COMPLIANCE_BASE_URL deve ser uma URL https válida.');
  process.exit(1);
}

const ROOT = process.cwd();
const EXCLUDE = new Set(['node_modules', 'dist', '.git', 'src', '.github', '.vercel', '.next']);
const SCAN_DIR = fs.existsSync(path.join(ROOT, 'dist')) ? path.join(ROOT, 'dist') : ROOT;
const ALLOWLIST = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'goo.gl',
  'maps.app.goo.gl',
  'instagram.com',
  'www.instagram.com',
  'doctoralia.com.br',
  'www.doctoralia.com.br',
].map((host) => host.replace(/^www\./i, '').toLowerCase()));

const DOMINIOS_EXTRA = new Set(
  (process.env.COMPLIANCE_EXTRA_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').toLowerCase())
    .filter(Boolean)
);

const FORMA_REDIRECIONADOR = /\/(go|r|l|link|redirect|out|track)\//i;
const TEXTO_DE_CTA = /agend|whats|fale|contato|conversar|confirmar|marcar|chamar|solicitar/i;

function pareceCTA(tagAncora) {
  if (/data-lead-open/i.test(tagAncora)) return true;
  return TEXTO_DE_CTA.test(tagAncora);
}

function findFiles(dir, base) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDE.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findFiles(abs, base));
    else if (entry.isFile()) files.push({ abs, rel: path.relative(base, abs) });
  }
  return files;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function trechoCurto(trecho) {
  return trecho.replace(/[\r\n]+/g, ' ').slice(0, 100);
}

const erros = [];
const avisos = [];

function addErro({ regra, arquivo, linha, descricao, trecho, politica, url }) {
  erros.push({ regra, arquivo, linha, descricao, trecho: trechoCurto(trecho), politica, url });
}

function addAviso({ regra, arquivo, linha, descricao, trecho, politica, url }) {
  avisos.push({ regra, arquivo, linha, descricao, trecho: trechoCurto(trecho), politica, url });
}

export function temNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

export function temRedirectAutomatico(html) {
  return /window\.location\s*(\.href)?\s*=/i.test(html)
    || /window\.location\.replace\s*\(/i.test(html)
    || /<meta[^>]+http-equiv=["']refresh["']/i.test(html);
}

function caminhosInternosPossiveis(href, arquivoHtml) {
  const semParametros = href.split(/[?#]/, 1)[0];
  const resolvido = semParametros.startsWith('/')
    ? path.resolve(SCAN_DIR, `.${semParametros}`)
    : path.resolve(path.dirname(arquivoHtml.abs), semParametros);
  const temExtensao = path.extname(resolvido) !== '';

  if (semParametros.endsWith('/') || !temExtensao) {
    return [path.join(resolvido, 'index.html'), `${resolvido}.html`];
  }
  return [resolvido];
}

function checarHref({ href, indice, match, arquivo, arquivosAbsolutos, html }) {
  const linha = lineOf(html, indice);
  const contexto = { arquivo: arquivo.rel, linha, trecho: match };

  if (/^https?:\/\//i.test(href)) {
    try {
      const host = new URL(href).hostname.replace(/^www\./i, '').toLowerCase();
      if (host !== baseHost && !ALLOWLIST.has(host) && !DOMINIOS_EXTRA.has(host)) {
        if (FORMA_REDIRECIONADOR.test(new URL(href).pathname) || pareceCTA(match)) {
          addErro({
            regra: 'B1',
            ...contexto,
            descricao: 'Link externo com forma de redirecionador ou CTA fora do dominio anunciado',
            politica: 'Circumventing systems / Destination mismatch',
            url: 'https://support.google.com/adspolicy/answer/15938075',
          });
        } else {
          addAviso({
            regra: 'A6',
            ...contexto,
            descricao: 'Link externo (referencia, nao CTA) — conferir se e intencional',
            politica: 'Circumventing systems / Destination mismatch',
            url: 'https://support.google.com/adspolicy/answer/15938075',
          });
        }
      }
    } catch {
      // Uma URL absoluta inválida será tratada por outras validações da página.
    }
    return;
  }

  if (/^(#|mailto:|tel:|javascript:|data:|\/\/)/i.test(href)) return;
  const variantes = caminhosInternosPossiveis(href, arquivo);
  if (!variantes.some((caminho) => arquivosAbsolutos.has(caminho))) {
    if (/(^|\/)\.\.\//.test(href) || href.startsWith('../')) {
      addAviso({
        regra: 'A7',
        ...contexto,
        descricao: 'Link relativo com ../ depende da barra final da URL; usar caminho absoluto',
        politica: 'Destination not working',
        url: 'https://support.google.com/adspolicy/answer/6368661',
      });
    } else {
      addErro({
        regra: 'B2',
        ...contexto,
        descricao: 'Link interno aponta para arquivo inexistente no output',
        politica: 'Destination not working',
        url: 'https://support.google.com/adspolicy/answer/6368661',
      });
    }
  }
}

function checarBridgePage({ arquivo, html }) {
  if (temNoindex(html) && temRedirectAutomatico(html)) {
    addErro({
      regra: 'B3',
      arquivo: arquivo.rel,
      linha: 1,
      descricao: 'Pagina noindex com redirecionamento automatico (sneaky redirect)',
      trecho: '<meta name="robots" content="noindex"> + redirecionamento automático',
      politica: 'Circumventing systems',
      url: 'https://support.google.com/adspolicy/answer/15938075',
    });
  }
}

let avisoPoliticaPrivacidadeNoBundleEmitido = false;

function mencionaPoliticaPrivacidade(texto) {
  return /politica[s]?[-_]?de[-_]?privacidade|politica[s]?\s+de\s+privacidade|privacy[-_]?policy/i.test(texto);
}

function checarPoliticaPrivacidade({ arquivo, html }) {
  if (/politica[s]?[-_]?de[-_]?privacidade|privacy[-_]?policy/i.test(arquivo.rel)) return;

  // Pagina sem coleta e sem rastreamento nao esta sujeita a esta exigencia.
  const COLETA = /<form\b|<input\b|googletagmanager\.com|gtag\s*\(|fbq\s*\(|clarity\s*\(|hotjar|analytics\.js/i;
  if (!COLETA.test(html)) return;

  const anchorRegex = /<a\b[^>]*>/gi;
  let match;
  let encontrou = false;

  while ((match = anchorRegex.exec(html)) !== null) {
    const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(match[0]);
    if (!hrefMatch || !/politica|politicas|privacidade|privacy/i.test(hrefMatch[1])) continue;
    encontrou = true;

    const href = hrefMatch[1];
    if (!/^https?:\/\//i.test(href)) continue;
    try {
      const host = new URL(href).hostname.replace(/^www\./i, '').toLowerCase();
      if (host !== baseHost) {
        addErro({
          regra: 'B5',
          arquivo: arquivo.rel,
          linha: lineOf(html, match.index),
          descricao: 'Politica de privacidade hospedada em outro dominio',
          trecho: href,
          politica: 'Data collection and use',
          url: 'https://support.google.com/adspolicy/answer/6020956',
        });
      }
    } catch {
      // URLs absolutas malformadas são tratadas pelas verificações de links existentes.
    }
  }

  if (!encontrou && mencionaPoliticaPrivacidade(TEXTO_DOS_BUNDLES)) {
    if (!avisoPoliticaPrivacidadeNoBundleEmitido) {
      addAviso({
        regra: 'A5',
        arquivo: arquivo.rel,
        linha: 1,
        descricao: 'Link de politica de privacidade so existe no bundle JS (SPA) — nao verificavel estaticamente',
        trecho: 'confirmar no navegador que o link aparece na pagina renderizada',
        politica: 'Data collection and use',
        url: 'https://support.google.com/adspolicy/answer/6020956',
      });
      avisoPoliticaPrivacidadeNoBundleEmitido = true;
    }
  } else if (!encontrou) {
    addErro({
      regra: 'B5',
      arquivo: arquivo.rel,
      linha: 1,
      descricao: 'Pagina sem link para politica de privacidade',
      trecho: '(nenhum href de politica de privacidade encontrado)',
      politica: 'Data collection and use',
      url: 'https://support.google.com/adspolicy/answer/6020956',
    });
  }
}

function checarNoindex({ arquivo, html }) {
  if (!temNoindex(html)) return;
  addAviso({
    regra: 'A4',
    arquivo: arquivo.rel,
    linha: 1,
    descricao: 'Pagina com noindex em producao',
    trecho: '<meta name="robots" ... noindex>',
    politica: 'specs/google-ads.md — historico de indexacao afeta Quality Score futuro',
    url: 'https://support.google.com/adspolicy/answer/6368661',
  });
}

function checarConsentMode({ arquivo, html }) {
  const indiceGtm = html.indexOf('googletagmanager.com');
  if (indiceGtm === -1) return;

  const indiceConsentimento = html.search(/gtag\s*\(\s*['\"]consent['\"]\s*,\s*['\"]default['\"]/);
  if (indiceConsentimento !== -1 && indiceConsentimento < indiceGtm) return;

  addAviso({
    regra: 'A1',
    arquivo: arquivo.rel,
    linha: lineOf(html, indiceGtm),
    descricao: 'Consent Mode v2 ausente ou declarado depois do GTM',
    trecho: "gtag('consent','default') deve vir ANTES da tag do GTM",
    politica: 'specs/google-ads.md — Consent Mode v2 / LGPD',
    url: 'https://support.google.com/adspolicy/answer/6008942',
  });
}

function checarMetadados({ arquivo, html }) {
  const verificacoes = [
    [/<html[^>]+lang\s*=/i, 'Falta atributo lang no <html>'],
    [/<meta[^>]+name=["']viewport["']/i, 'Falta meta viewport'],
    [/<title[^>]*>\s*\S/i, 'Falta <title> preenchido'],
    [/<meta[^>]+name=["']description["']/i, 'Falta meta description'],
  ];

  for (const [padrao, descricao] of verificacoes) {
    if (padrao.test(html)) continue;
    addAviso({
      regra: 'A2',
      arquivo: arquivo.rel,
      linha: 1,
      descricao,
      trecho: descricao,
      politica: 'Editorial e requisitos tecnicos',
      url: 'https://support.google.com/adspolicy/answer/6368661',
    });
  }
}

function checarRobotsTxt() {
  const robotsEmScan = path.join(SCAN_DIR, 'robots.txt');
  const robotsEmPublic = path.join(ROOT, 'public', 'robots.txt');
  const abs = fs.existsSync(robotsEmScan) ? robotsEmScan
    : fs.existsSync(robotsEmPublic) ? robotsEmPublic : null;
  if (!abs) return;

  const linhas = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  let userAgents = [];
  for (let indice = 0; indice < linhas.length; indice += 1) {
    const linha = linhas[indice];
    const userAgent = /^\s*user-agent\s*:\s*(.+?)\s*(?:#.*)?$/i.exec(linha);
    if (userAgent) {
      userAgents.push(userAgent[1].trim().toLowerCase());
      continue;
    }
    const disallow = /^\s*disallow\s*:\s*\/\s*(?:#.*)?$/i.test(linha);
    if (disallow && userAgents.some((agent) => agent === 'adsbot-google' || agent === '*')) {
      addErro({
        regra: 'B7',
        arquivo: path.relative(ROOT, abs),
        linha: indice + 1,
        descricao: 'robots.txt bloqueia o rastreador AdsBot-Google',
        trecho: linha,
        politica: 'Destination not crawlable',
        url: 'https://support.google.com/adspolicy/answer/6368661',
      });
    }
  }
}

function checarSitemap() {
  const sitemapEmScan = path.join(SCAN_DIR, 'sitemap.xml');
  const sitemapEmPublic = path.join(ROOT, 'public', 'sitemap.xml');
  const sitemapEmRoot = path.join(ROOT, 'sitemap.xml');
  const abs = fs.existsSync(sitemapEmScan) ? sitemapEmScan
    : fs.existsSync(sitemapEmPublic) ? sitemapEmPublic
      : fs.existsSync(sitemapEmRoot) ? sitemapEmRoot : null;
  if (!abs) return;

  const xml = fs.readFileSync(abs, 'utf8');
  const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const loc = match[1].trim();
    let pathname;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      continue;
    }

    const resolvido = path.resolve(SCAN_DIR, `.${pathname}`);
    const temExtensao = path.extname(resolvido) !== '';
    const variantes = pathname === '/'
      ? [path.join(SCAN_DIR, 'index.html')]
      : pathname.endsWith('/')
        ? [path.join(resolvido, 'index.html')]
        : temExtensao
          ? [resolvido]
          : [path.join(resolvido, 'index.html'), `${resolvido}.html`];
    const destino = variantes.find((variante) => arquivosAbsolutos.has(variante));
    const contexto = {
      regra: 'B4',
      arquivo: path.relative(ROOT, abs),
      linha: lineOf(xml, match.index),
      trecho: loc,
    };

    if (!destino) {
      addErro({
        ...contexto,
        descricao: 'sitemap.xml lista URL que nao existe no output',
        politica: 'Destination not working',
        url: 'https://support.google.com/adspolicy/answer/6368661',
      });
      continue;
    }

    const html = fs.readFileSync(destino, 'utf8');
    if (temNoindex(html) && temRedirectAutomatico(html)) {
      addErro({
        ...contexto,
        descricao: 'sitemap.xml entrega ao Google uma pagina de redirecionamento automatico',
        politica: 'Circumventing systems / sneaky redirect',
        url: 'https://support.google.com/adspolicy/answer/15938075',
      });
    }
  }
}

const arquivos = findFiles(SCAN_DIR, SCAN_DIR);
const TEXTO_DOS_BUNDLES = arquivos
  .filter((a) => a.rel.endsWith('.js') || a.rel.endsWith('.mjs'))
  .map((a) => { try { return fs.readFileSync(a.abs, 'utf8'); } catch { return ''; } })
  .join('\n');
const arquivosAbsolutos = new Set(arquivos.map((arquivo) => arquivo.abs));
const htmls = arquivos.filter((arquivo) => path.extname(arquivo.abs).toLowerCase() === '.html');
const anchorRegex = /<a\b[^>]*>/gi;

checarRobotsTxt();
checarSitemap();

for (const arquivo of htmls) {
  const html = fs.readFileSync(arquivo.abs, 'utf8');
  anchorRegex.lastIndex = 0;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(match[0]);
    if (!hrefMatch) continue;
    checarHref({
      href: hrefMatch[1],
      indice: match.index,
      match: match[0],
      arquivo,
      arquivosAbsolutos,
      html,
    });
  }
  checarBridgePage({ arquivo, html });
  checarPoliticaPrivacidade({ arquivo, html });
  checarNoindex({ arquivo, html });
  checarConsentMode({ arquivo, html });
  checarMetadados({ arquivo, html });
}

const resultado = erros.length > 0 ? 'FAIL' : 'PASS';
const relatorio = {
  scanDir: SCAN_DIR,
  baseUrl,
  htmlAnalisados: htmls.length,
  erros,
  avisos,
  resultado,
};

function imprimirSecao(titulo, itens) {
  console.log(`\n${titulo}`);
  if (itens.length === 0) {
    console.log('Nenhum.');
    return;
  }
  for (const item of itens) {
    console.log(`[${item.regra}] ${item.arquivo}:${item.linha} — ${item.descricao}`);
    console.log(`  trecho: ${item.trecho}`);
    console.log(`  politica: ${item.politica} (${item.url})`);
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(relatorio, null, 2));
} else {
  console.log('COMPLIANCE GOOGLE ADS');
  console.log(`Diretório varrido: ${SCAN_DIR}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`HTML analisados: ${htmls.length}`);
  imprimirSecao('ERROS (bloqueiam publicacao)', erros);
  imprimirSecao('AVISOS', avisos);
  console.log(`\nRESULTADO: ${resultado} (${erros.length} erros, ${avisos.length} avisos)`);
}

process.exit(erros.length > 0 ? 1 : 0);
