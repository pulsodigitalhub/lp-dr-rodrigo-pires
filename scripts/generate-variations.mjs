import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = readFileSync(join(root, 'index.html'), 'utf8');
const outDir = join(root, 'variacoes');
mkdirSync(outDir, { recursive: true });

const locations = {
  'aguas-claras': { label: 'Águas Claras', clinic: 'Clindor Ortopedia', address: 'Quadra 104, Loja 27, Edifício Real Splendor, Águas Claras, Brasília, DF.', map: 'Clindor+Ortopedia+Águas+Claras+DF' },
  'asa-sul': { label: 'Asa Sul', clinic: 'CEHD', address: 'SGAS 614, Edifício Vitrium, sala 80, Asa Sul, Brasília, DF.', map: 'CEHD+Centro+Especializado+em+Hipermobilidade+e+Dor+Brasília' },
  'jardim-botanico': { label: 'Jardim Botânico', clinic: 'CEHD', address: 'SGAS 614, Edifício Vitrium, sala 80, Asa Sul, Brasília, DF. Atende pacientes do Jardim Botânico.', map: 'CEHD+Centro+Especializado+em+Hipermobilidade+e+Dor+Brasília' },
  'asa-norte': { label: 'Asa Norte', clinic: 'Neurospine', address: 'Instituto de Neurocirurgia, SGAN 605, Conjunto A, Asa Norte, Brasília, DF.', map: 'Neurospine+Instituto+de+Neurocirurgia+Brasília+Asa+Norte' },
  'taguatinga-norte': { label: 'Taguatinga Norte', clinic: 'JK Ortopedia', address: 'Em frente ao Shopping JK, Avenida Comercial Norte, Taguatinga Norte, Brasília, DF.', map: 'JK+Ortopedia+Taguatinga+Norte+Brasília' },
  'ceilandia': { label: 'Ceilândia', clinic: 'JK Ortopedia', address: 'Em frente ao Shopping JK, Avenida Comercial Norte, Taguatinga Norte, Brasília, DF. Unidade mais próxima de quem vem de Ceilândia.', map: 'JK+Ortopedia+Taguatinga+Norte+Brasília' }
};

const regions = {
  joelho: { title: 'Ortopedista Especialista em Joelho', singular: 'joelho', article: 'do joelho', surgery: 'Cirurgia do joelho', surgeryText: 'Avaliação para procedimentos cirúrgicos quando há indicação: lesões meniscais, ligamentares, artrose e outras.', symptom: 'Dor no joelho que persiste', movement: 'Dificuldade para caminhar, agachar ou subir escadas', sport: 'Lesão no esporte ou retorno à atividade', secondary: 'Segunda opinião antes de uma cirurgia no joelho' },
  ombro: { title: 'Ortopedista para Dor no Ombro', singular: 'ombro', article: 'do ombro', surgery: 'Avaliação ortopédica do ombro', surgeryText: 'Avaliação de dor, limitação de movimento e exames do ombro para definir a conduta e, quando necessário, orientar o próximo cuidado.', symptom: 'Dor no ombro que persiste', movement: 'Dificuldade para elevar ou movimentar o braço', sport: 'Dor após treino, queda ou atividade repetitiva', secondary: 'Segunda opinião sobre dor ou tratamento do ombro' },
  quadril: { title: 'Ortopedista para Dor no Quadril', singular: 'quadril', article: 'do quadril', surgery: 'Avaliação ortopédica do quadril', surgeryText: 'Avaliação de dor, mobilidade e exames do quadril para definir a conduta e, quando necessário, orientar o próximo cuidado.', symptom: 'Dor no quadril que persiste', movement: 'Dificuldade para caminhar, sentar ou levantar', sport: 'Dor após atividade física ou sobrecarga', secondary: 'Segunda opinião sobre dor ou tratamento do quadril' },
  coluna: { title: 'Ortopedista para Dor na Coluna', singular: 'coluna', article: 'da coluna', surgery: 'Avaliação ortopédica da coluna', surgeryText: 'Avaliação de dor, limitação e exames da coluna para definir a conduta e, quando necessário, orientar o próximo cuidado.', symptom: 'Dor na coluna que persiste', movement: 'Rigidez ou limitação para trabalhar e se movimentar', sport: 'Dor após esforço, treino ou atividade repetitiva', secondary: 'Segunda opinião sobre dor ou tratamento da coluna' }
};

function cards(items) {
  const fallback = [
    'icon_dor_persistente-160.webp', 'icon_limitacao_atividades-160.webp', 'icon_duvida_conduta-160.webp', 'icon_retorno_esporte-160.webp', 'icon_segunda_opiniao-160.webp'
  ];
  return items.map((item, index) => `        <article class="card">\n          <span class="card-icon" aria-hidden="true"><img src="../img/3d-icons/${fallback[index]}" width="160" height="160" alt="" /></span>\n          <h3>${item.title}</h3>\n          <p>${item.text}</p>\n        </article>`).join('\n');
}

function whenSection(title, intro, items) {
  return `    <section id="quando" class="section pattern-dots">\n      <div class="section-head section-head--center">\n        <div>\n          <p class="kicker">Quando procurar</p>\n          <h2>${title}</h2>\n        </div>\n        <p class="apoio">${intro}</p>\n      </div>\n      <div class="cards qp-cards">\n${cards(items)}\n      </div>\n    </section>`;
}

function locationSection(location) {
  return `    <section id="locais" class="section section-fullbg section-locais-bg">\n      <div class="section-inner" style="padding: var(--section-py) 0;">\n      <div class="section-head section-head--center">\n        <div>\n          <p class="kicker">Local de atendimento</p>\n          <h2>Atendimento em ${location.label}.</h2>\n        </div>\n        <p class="apoio">Confirmação de agenda, cobertura por convênio e horário é feita pelo WhatsApp antes da consulta.</p>\n      </div>\n      <div class="locations">\n        <article class="location">\n          <div class="location-body">\n            <p class="region">${location.label}</p>\n            <h3>${location.clinic}</h3>\n            <p>${location.address}</p>\n          </div>\n          <iframe class="location-map" src="https://www.google.com/maps?q=${location.map}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa da unidade ${location.clinic}, ${location.label}"></iframe>\n        </article>\n      </div>\n      </div>\n    </section>`;
}

function serviceSection({ heading, intro, injectionText, surgeryTitle, surgeryText }) {
  return `    <section id="servicos" class="section">\n      <div class="section-head section-head--center">\n        <div>\n          <p class="kicker">Serviços</p>\n          <h2>${heading}</h2>\n        </div>\n        <p class="apoio">${intro}</p>\n      </div>\n      <div class="cards">\n        <article class="card"><span class="card-icon" aria-hidden="true"><img src="../img/3d-icons/icon_consulta_ortopedica-160.webp" width="160" height="160" alt="" /></span><h3>Consulta ortopédica</h3><p>Avaliação clínica, histórico, exame físico e revisão de exames conforme a queixa.</p></article>\n        <article class="card"><span class="card-icon" aria-hidden="true"><img src="../img/3d-icons/icon_ultrassonografia-160.webp" width="160" height="160" alt="" /></span><h3>Ultrassonografia musculoesquelética</h3><p>Imagem em tempo real, na própria consulta, quando indicada.</p></article>\n        <article class="card"><span class="card-icon" aria-hidden="true"><img src="../img/3d-icons/icon_infiltracoes-160.webp" width="160" height="160" alt="" /></span><h3>Infiltrações e bloqueios</h3><p>${injectionText}</p></article>\n        <article class="card"><span class="card-icon" aria-hidden="true"><img src="../img/3d-icons/icon_medicina_regenerativa-160.webp" width="160" height="160" alt="" /></span><h3>Medicina regenerativa</h3><p>Aplicação de PRP e outros ortobiológicos conforme avaliação clínica.</p></article>\n        <article class="card"><span class="card-icon" aria-hidden="true"><img src="../img/3d-icons/icon_cirurgia_joelho-160.webp" width="160" height="160" alt="" /></span><h3>${surgeryTitle}</h3><p>${surgeryText}</p></article>\n        <article class="card"><span class="card-icon" aria-hidden="true"><img src="../img/3d-icons/icon_medicina_esportiva-160.webp" width="160" height="160" alt="" /></span><h3>Medicina esportiva</h3><p>Avaliação de lesões, sobrecargas e retorno às atividades.</p></article>\n      </div>\n    </section>`;
}

function render(config) {
  let html = base
    .replaceAll('img/', '../img/')
    .replaceAll('href="politica-de-privacidade.html"', 'href="../politica-de-privacidade.html"')
    .replace('<title>Preview LP · Dr. Rodrigo Pires · Ortopedista em Brasília</title>', `<title>${config.title} | Dr. Rodrigo Pires</title>`)
    .replace('content="Preview da landing page do Dr. Rodrigo Pires, ortopedista e traumatologista em Brasília, para campanha de Google Ads."', `content="${config.description}"`)
    .replace('<p class="kicker">Ortopedista em Brasília · Cirurgião do joelho</p>', `<p class="kicker">${config.kicker}</p>`)
    .replace('<h1>Ortopedista Especialista em Joelho</h1>', `<h1>${config.title}</h1>`)
    .replace('<p class="lede">Dr. Rodrigo Pires é médico ortopedista e traumatologista com foco em cirurgia do joelho e intervenção em dor. Atendimento em vários locais e +40 convênios atendidos.</p>', `<p class="lede">${config.lede}</p>`)
    .replace(/    <section id="quando"[\s\S]*?    <\/section>\n\n    <section id="abordagem"/, `${config.when}\n\n    <section id="abordagem"`)
    .replace(/    <section id="servicos"[\s\S]*?(?=    <section class="section section-fullbg section--white">)/, `${config.services}\n\n`)
    .replace(/    <section id="locais"[\s\S]*?    <\/section>\n\n    <section id="duvidas"/, `${config.location}\n\n    <section id="duvidas"`);
  writeFileSync(join(outDir, `${config.slug}.html`), html);
}

const configs = [];
for (const [slug, region] of Object.entries(regions)) {
  configs.push({
    slug: `ortopedista-${slug}-brasilia`,
    title: `${region.title} em Brasília`,
    description: `Landing page de ${region.title.toLowerCase()} em Brasília com Dr. Rodrigo Pires.`,
    kicker: `Ortopedista em Brasília · Atendimento ${region.article}`,
    lede: `Dr. Rodrigo Pires é ortopedista e traumatologista. A consulta investiga dor ${region.article}, limitação e exames antes de definir a conduta.`,
    when: whenSection(`Quando procurar um ortopedista para o ${region.singular}.`, `Dor ${region.article}, limitação de movimento ou dúvida sobre o próximo cuidado merecem avaliação individual.`, [
      { title: region.symptom, text: `Dor ${region.article} que não melhora, piora com o movimento ou volta com frequência.` },
      { title: region.movement, text: 'Limitação nas atividades habituais por causa da dor ou da rigidez.' },
      { title: 'Dúvida sobre o tratamento', text: 'Quando não está claro se o cuidado deve seguir de forma conservadora ou com procedimento.' },
      { title: region.sport, text: 'Avaliação da queixa relacionada a treino, trabalho ou atividade diária.' },
      { title: region.secondary, text: 'Revisão do diagnóstico e das opções apresentadas em outro atendimento.' }
    ]),
    services: serviceSection({ heading: `O que a consulta para o ${region.singular} pode cobrir.`, intro: 'Cada indicação depende do diagnóstico e dos objetivos do tratamento.', injectionText: `Infiltrações e bloqueios para dor ${region.article}, guiados por ultrassom quando indicados.`, surgeryTitle: region.surgery, surgeryText: region.surgeryText }),
    location: locationSection(locations['asa-norte'])
  });
}

for (const [slug, location] of Object.entries(locations)) {
  configs.push({
    slug: `ortopedista-${slug}`,
    title: `Ortopedista em ${location.label}`,
    description: `Landing page de ortopedista em ${location.label}, Brasília, com Dr. Rodrigo Pires.`,
    kicker: `Ortopedista em ${location.label} · Brasília`,
    lede: `Dr. Rodrigo Pires é ortopedista e traumatologista com atendimento em ${location.label}. A consulta avalia dor articular, limitação e exames antes de definir a conduta.`,
    when: whenSection(`Quando procurar ortopedista em ${location.label}.`, `Se a dor limita sua rotina, esporte ou trabalho, a consulta ajuda a organizar sintomas, exames e possibilidades de cuidado.`, [
      { title: 'Dor articular persistente', text: 'Dor no joelho, ombro, quadril ou coluna que não melhora como esperado.' },
      { title: 'Limitação no dia a dia', text: 'Dificuldade para caminhar, treinar, trabalhar ou dormir por causa da dor.' },
      { title: 'Dúvida de conduta', text: 'Quando é preciso entender se o cuidado deve ser conservador ou intervencionista.' },
      { title: 'Lesão e retorno à atividade', text: 'Avaliação após lesão, sobrecarga ou cirurgia, conforme o caso.' },
      { title: 'Segunda opinião ortopédica', text: 'Revisão antes de decidir uma intervenção proposta em outro atendimento.' }
    ]),
    services: serviceSection({ heading: `O que a consulta em ${location.label} pode cobrir.`, intro: 'A lista mostra possibilidades de avaliação; a conduta depende do diagnóstico.', injectionText: 'Infiltrações articulares, bloqueios para dor e terapia por ondas de choque, guiados por ultrassom quando indicados.', surgeryTitle: 'Cirurgia do joelho', surgeryText: regions.joelho.surgeryText }),
    location: locationSection(location)
  });
}

configs.push({
  slug: 'infiltracao-brasilia', title: 'Infiltração para Dor Articular em Brasília', description: 'Landing page sobre infiltração para dor articular em Brasília com Dr. Rodrigo Pires.', kicker: 'Ortopedista em Brasília · Intervenção em dor', lede: 'Dr. Rodrigo Pires avalia se infiltrações, bloqueios ou outras condutas fazem sentido para cada queixa. Procedimentos são considerados apenas quando indicados.',
  when: whenSection('Quando a infiltração pode entrar na conversa.', 'A indicação depende do diagnóstico, da região afetada, do histórico e da resposta ao cuidado já realizado.', [
    { title: 'Dor articular persistente', text: 'Quando a dor continua apesar de orientações e medidas iniciais.' }, { title: 'Limitação funcional', text: 'Dificuldade para movimentar, trabalhar, treinar ou realizar atividades habituais.' }, { title: 'Diagnóstico definido', text: 'Quando o exame clínico e os exames ajudam a localizar a fonte da dor.' }, { title: 'Dúvida sobre indicação', text: 'Para entender benefícios, limites e alternativas antes de um procedimento.' }, { title: 'Segunda opinião', text: 'Revisão de uma proposta de infiltração ou bloqueio feita em outro atendimento.' }
  ]),
  services: serviceSection({ heading: 'O que a avaliação para infiltração pode cobrir.', intro: 'A consulta define se há indicação e qual caminho faz sentido para o caso.', injectionText: 'Infiltrações articulares e bloqueios para dor, guiados por ultrassom quando indicados.', surgeryTitle: 'Avaliação ortopédica', surgeryText: 'Revisão do diagnóstico e das alternativas de cuidado antes de decidir por qualquer procedimento.' }), location: locationSection(locations['asa-norte'])
});

for (const [slug, region] of Object.entries(regions)) {
  configs.push({
    slug: `infiltracao-${slug}-brasilia`, title: `Infiltração no ${region.singular[0].toUpperCase()}${region.singular.slice(1)} em Brasília`, description: `Landing page sobre infiltração ${region.article} em Brasília com Dr. Rodrigo Pires.`, kicker: `Ortopedista em Brasília · Infiltração ${region.article}`, lede: `Dr. Rodrigo Pires avalia dor ${region.article} e indica infiltração ou bloqueio apenas quando esse caminho faz sentido para o diagnóstico.`,
    when: whenSection(`Quando conversar sobre infiltração ${region.article}.`, 'A indicação não é automática: ela depende da causa da dor, da avaliação clínica e do que já foi tentado.', [
      { title: region.symptom, text: `Dor ${region.article} que persiste ou limita atividades.` }, { title: region.movement, text: 'Restrição de movimento que interfere na rotina.' }, { title: 'Dor com diagnóstico avaliado', text: 'Quando a consulta e os exames ajudam a localizar a queixa.' }, { title: 'Dúvida sobre procedimento', text: 'Para entender se infiltração ou bloqueio são opções para o caso.' }, { title: region.secondary, text: 'Revisão de uma indicação feita em outro atendimento.' }
    ]),
    services: serviceSection({ heading: `O que a avaliação para infiltração ${region.article} pode cobrir.`, intro: 'A lista apresenta possibilidades; a indicação depende da avaliação individual.', injectionText: `Infiltrações e bloqueios para dor ${region.article}, guiados por ultrassom quando indicados.`, surgeryTitle: `Avaliação ortopédica ${region.article}`, surgeryText: `Revisão de dor, mobilidade e exames ${region.article} antes de decidir a conduta.` }), location: locationSection(locations['asa-norte'])
  });
}

for (const config of configs) render(config);

const links = configs.map(c => `        <li><a href="${c.slug}.html">${c.title}</a></li>`).join('\n');
writeFileSync(join(outDir, 'index.html'), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Variações de LP | Dr. Rodrigo Pires</title><style>body{font-family:system-ui,sans-serif;margin:40px;background:#f3ebde;color:#212e51}main{max-width:820px;margin:auto}a{color:#212e51}li{margin:12px 0}</style></head><body><main><p>Dr. Rodrigo Pires</p><h1>Variações de Landing Pages</h1><p>Prévia interna. Ícones específicos estão documentados em <code>docs/prompt-gemini-icones-variacoes.md</code>.</p><ul>\n${links}\n</ul></main></body></html>`);
console.log(`Generated ${configs.length} variation pages.`);
