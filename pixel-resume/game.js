const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let frameCount = 0; // conta quantos frames já passaram (usado nas luzes que piscam)

// Em que tela estamos? "title" = entrada, "howto" = como jogar, "game" = o jogo, "credits" = os créditos
let screen = "title";
let screenTime = 0;                     // há quantos frames estamos nesta tela
const transition = { timer: 0, to: "" }; // a tela escurecendo para trocar de tela (timer > 0 = acontecendo)
let fadeIn = 0;                          // a tela nova clareando (vai de 24 até 0)

const CONTACT_EMAIL = "carololiveira_7@proton.me";

// Para testar o final sem achar tudo: troca para true e o bolo aparece logo no começo.
const DEBUG_SPAWN_CAKE = false;

// Som: a fanfarra do final. Troca para false se não quiser nenhum som.
const SOUND_ON = true;

// Este aparelho tem tela de toque (celular ou tablet)? Os textos de ajuda mudam conforme a resposta.
const isTouch = window.matchMedia("(pointer: coarse)").matches;

// ---------- 1. CORES ----------
const palette = {
  // Caroline
  H: "#0d0d0d", // cabelo
  S: "#a9713f", // pele
  E: "#1a0f0a", // olhos
  B: "#141414", // t-shirt preta
  W: "#d8d8e0", // estampa
  P: "#2a2a35", // calça
  K: "#6b3f1d", // botas
  // Gato
  C: "#0a0a0a", // pelo preto
  Y: "#ffd600", // olhos amarelos
  N: "#ff7eb6", // focinho rosa
  // Cachorro
  D: "#f2c14e", // pelo amarelo
  d: "#c98f1f", // amarelo escuro (orelha)
  O: "#1a0f0a", // nariz
  // Coração
  R: "#ff3d71", // vermelho
  r: "#ff9ab8", // brilho do coração
  // Gema
  G: "#4fd8e8", // ciano
  g: "#c9f7ff", // brilho da gema
  q: "#1f8fa3", // sombra da gema
  // Bolo
  f: "#ffd86b", // chama da vela
  c: "#4fd8e8", // vela
  w: "#fff1f8", // cobertura branca
  p: "#ff6ec7", // rosa do bolo
  k: "#e8a95c", // massa do bolo
};

// Os dois itens colecionáveis, desenhados com letras (como os personagens)
const heartSprite = [
  ".RR.RR.",
  "RrRRRRR",
  "RRRRRRR",
  ".RRRRR.",
  "..RRR..",
  "...R...",
];
const gemSprite = [
  "..GGG..",
  ".GgGGq.",
  "GgGGGGq",
  ".GGGGq.",
  "..GGq..",
  "...q...",
];

// O bolo de aniversário: 11 colunas, 9 linhas
const cakeSprite = [
  "...f.f.f...",
  "...c.c.c...",
  ".wwwwwwwww.",
  "wwpwwpwwpww",
  "kkkkkkkkkkk",
  "kkkkkkkkkkk",
  "ppppppppppp",
  "ppppppppppp",
  ".ggggggggg.",
];

// ---------- 2. O MAPA ----------
// T = prédio, b = caixote (o livro quebra), # = calçada iluminada,
// V = máquina de bebidas, L = poste de luz, . = chão
// Cada linha tem 4 blocos de 10 caracteres (total: 40 colunas).
// O mapa tem 30 linhas. Cada quadradinho (tile) mede 16x16 pixels.
const map = [
  ["TTTTTTTTTT", "TTTTTTTTTT", "TTTTTTTTTT", "TTTTTTTTTT"],
  ["T.TTTT....", "..b....TTT", "TTT..L..T.", "...b.....T"],
  ["T.TTTT....", "...T...TTT", "TTT...b...", ".T.....b.T"],
  ["T.........", ".b........", "....T.....", "......T..T"],
  ["T.........", "..T.......", ".....#....", ".....b...T"],
  ["T..b.TTT..", ".......T..", ".....#..T.", "..T......T"],
  ["T....TTT..", "..T.......", "....L#....", ".b.......T"],
  ["T.T..TTTb.", "..........", ".....#....", "......T..T"],
  ["T.........", ".T........", ".....#..b.", "..T......T"],
  ["TV........", "....T.....", ".....#####", "#####....T"],
  ["T..TT.....", "..........", ".....#....", "......T..T"],
  ["T..TT.....", ".b........", ".....#....", "..T......T"],
  ["T....T....", "..........", "....L#..T.", ".........T"],
  ["T.........", "...T......", ".....#....", "....b....T"],
  ["T.......##", "##########", "######....", "..T......T"],
  ["T.........", "..........", ".....#....", "b........T"],
  ["T..T......", "......T...", ".....#....", "...TTT...T"],
  ["T.........", ".b........", ".....#.b..", "...TTT...T"],
  ["T.T.......", "..........", "....L#....", "...TTT...T"],
  ["T.........", "....T.....", ".....#..T.", ".......b.T"],
  ["T.........", "..........", ".....#....", "..T......T"],
  ["T.........", "..T.......", ".....#....", ".b.....T.T"],
  ["T...L.....", "....T.....", ".....#...b", ".T.....b.T"],
  ["T.........", ".V........", ".....#....", "..T.....bT"],
  ["T.....####", "##########", "######....", ".T....b..T"],
  ["T.........", "..........", ".....T....", "....b....T"],
  ["T.........", "..T.......", "..........", "..T.....bT"],
  ["T.........", "..........", "...T......", ".....T...T"],
  ["T...T.....", ".....b....", "..T.......", "....T....T"],
  ["TTTTTTTTTT", "TTTTTTTTTT", "TTTTTTTTTT", "TTTTTTTTTT"],
].map((blocks) => blocks.join("").split("")); // junta os blocos e separa em letras

const TILE = 16;
const MAP_COLS = map[0].length;
const MAP_ROWS = map.length;
const MAP_WIDTH = MAP_COLS * TILE;   // 640 pixels
const MAP_HEIGHT = MAP_ROWS * TILE;  // 480 pixels

// Quais tipos de tile bloqueiam a passagem?
const solid = { T: true, b: true, V: true, L: true };

// ---------- 3. PLACAS, BAÚS, PLATAFORMA, BOLO E TEXTOS ----------
const signs = [
  { id: "about", col: 10, row: 22 },                         // placa "Sobre mim"
  { id: "languages", col: 11, row: 5 },                      // placa "Línguas", ao lado da clareira das gemas
  { id: "photographer", col: 29, row: 22, hidden: true },    // atrás de um caixote
  { id: "helpdesk",     col: 27, row: 17, hidden: true },
  { id: "preschool",    col: 30, row: 15, hidden: true },
];

// Os baús. "kind" diz o que tem dentro: "heart" (carreira e estudos) ou "gem" (habilidade).
// "id" liga o baú ao texto no resume.json.
// Os baús ROSA vêm primeiro na lista e ficam pertinho de onde você começa.
const chests = [
  // Corações: experiência profissional (fileira de cima, perto do início)
  { id: "heart_santini", kind: "heart", col: 3, row: 20 },
  { id: "heart_sik",     kind: "heart", col: 5, row: 20 },
  { id: "heart_armazem", kind: "heart", col: 7, row: 20 },
  // Corações: educação (fileira de baixo, perto do início)
  { id: "heart_it",      kind: "heart", col: 3, row: 26 },
  { id: "heart_photo",   kind: "heart", col: 5, row: 26 },
  { id: "heart_comm",    kind: "heart", col: 7, row: 26 },
  // Gemas (habilidades): na clareira ao norte, mais longe, em 3 fileiras de 3 baús
  { id: "gem_adobe",    kind: "gem", col: 13, row: 3 },
  { id: "gem_sql",      kind: "gem", col: 15, row: 3 },
  { id: "gem_web",      kind: "gem", col: 17, row: 3 },
  { id: "gem_code",     kind: "gem", col: 14, row: 5 },
  { id: "gem_shell",    kind: "gem", col: 16, row: 5 },
  { id: "gem_ads",      kind: "gem", col: 18, row: 5 },
  { id: "gem_windows",  kind: "gem", col: 13, row: 7 },
  { id: "gem_learn",    kind: "gem", col: 15, row: 7 },
  { id: "gem_research", kind: "gem", col: 17, row: 7 },
];
chests.forEach((chest) => { chest.opened = false; }); // todos começam fechados

// A plataforma de fogos de artifício: é o "Contato", no fim da calçada
const contactPad = { id: "contact", col: 28, row: 24 };
const pads = [contactPad];

// O bolo de aniversário: só aparece depois de achar toda a informação do currículo
const cake = { col: 8, row: 21, spawned: false, taken: false };

const TOTAL_HEARTS = chests.filter((c) => c.kind === "heart").length;
const TOTAL_GEMS = chests.filter((c) => c.kind === "gem").length;

function countOpened(kind) {
  return chests.filter((c) => c.kind === kind && c.opened).length;
}

let language = "en"; // "en" = inglês, "pt" = português
let resume = null;   // o texto do currículo (carregado do arquivo)

// fetch busca o arquivo; .then espera ele chegar; .catch avisa se der erro
fetch("data/resume.json")
  .then((response) => response.json())
  .then((data) => { resume = data; })
  .catch((error) => console.error("Não consegui carregar o resume.json:", error));

const dialogue = { open: false, sign: null, pages: [], page: 0, title: "" };
const LINES_PER_PAGE = 4;

// Quebra um texto comprido em linhas que cabem na largura da caixa
function wrapText(text, maxWidth) {
  ctx.font = "8px monospace";
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line === "" ? word : line + " " + word;
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      lines.push(line); // a linha encheu: guarda e começa outra
      line = word;
    } else {
      line = test;
    }
  }
  if (line !== "") lines.push(line);
  return lines;
}

// Abre a caixa de texto para uma placa, um baú OU a plataforma (todos têm um "id")
function openDialogue(target) {
  if (!resume) return; // o arquivo ainda não carregou
  target.read = true;  // marca como "lido" (o final do jogo confere isso)
  const entry = resume[target.id];
  const lines = wrapText(entry.text[language], 288);
  dialogue.pages = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    dialogue.pages.push(lines.slice(i, i + LINES_PER_PAGE)); // páginas de 4 linhas
  }
  dialogue.title = entry.title[language];
  dialogue.sign = target;
  dialogue.page = 0;
  dialogue.open = true;
}

// Devolve o que está mais perto da Caroline: placa, baú, plataforma ou bolo (ou null)
function nearestInteractable() {
  const px = player.x + 8;  // centro dos pés dela
  const py = player.y + 12;
  const candidates = signs
    .filter((s) => !s.hidden)                                  // placas escondidas não contam
    .concat(chests, pads, cake.spawned && !cake.taken ? [cake] : []);
  let best = null;
  let bestDistance = 28; // só conta quem estiver a menos de 28 pixels
  for (const item of candidates) {
    const cx = item.col * TILE + 8; // centro do item
    const cy = item.row * TILE + 8;
    const distance = Math.hypot(px - cx, py - cy); // distância em linha reta
    if (distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }
  return best;
}

// Abre um baú pela primeira vez: confetes, e o item sobe flutuando
function openChest(chest) {
  chest.opened = true;
  const colors = chest.kind === "heart"
    ? ["#ff3d71", "#ff9ab8", "#ffffff"]
    : ["#4fd8e8", "#c9f7ff", "#ffffff"];
  spawnParticles(chest.col, chest.row, colors);
  spawnParticles(chest.col, chest.row, ["#ffd86b", "#fff1b0", "#ffffff"]);
  popups.push({ kind: chest.kind, x: chest.col * TILE + 5, y: chest.row * TILE - 2, life: 60 });
}

// O que acontece quando se aperta Espaço (ou o botão A)
function handleAction() {
  if (screen !== "game") { advanceScreen(); return; } // fora do jogo, Espaço passa para a próxima tela
  if (ending.active) { skipEnding(); return; }         // durante o final, Espaço pula para a próxima parte
  if (dialogue.open) {
    dialogue.page++;
    if (dialogue.page >= dialogue.pages.length) dialogue.open = false; // acabou o texto
    return;
  }
  const target = nearestInteractable();
  if (!target) return;
  if (target === cake) { startEnding(); return; }       // pegou o bolo: começa o final!
  if (!resume) return; // sem texto carregado, não abre nada
  if (target.kind && !target.opened) openChest(target); // só os baús têm "kind"
  if (target.id === "contact") startFireworks();        // a plataforma lança os fogos
  openDialogue(target);
}

function toggleLanguage() {
  language = language === "en" ? "pt" : "en";
  if (dialogue.open) openDialogue(dialogue.sign); // refaz o texto no novo idioma
}

// "M" (ou o botão @) abre o app de e-mail: na caixa do Contato e nos créditos
function openMail() {
  const onContact = dialogue.open && dialogue.sign && dialogue.sign.id === "contact";
  if (onContact || screen === "credits") {
    window.location.href = "mailto:" + CONTACT_EMAIL;
  }
}

// O balãozinho "!" que aparece acima do que dá para usar
function drawBalloon(x, y) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 4, y - 9, 8, 9);
  ctx.fillStyle = "#101820";
  ctx.font = "8px monospace";
  ctx.fillText("!", x + 6, y - 2);
}

// A placa é um painel de neon com uma tela escura
function drawSign(sign) {
  const x = sign.col * TILE;
  const y = sign.row * TILE;
  drawPavement(x, y, sign.col, sign.row);
  ctx.fillStyle = "#2d2a5c";          // poste
  ctx.fillRect(x + 7, y + 10, 2, 6);
  ctx.fillStyle = "#ff6ec7";          // moldura neon rosa
  ctx.fillRect(x + 1, y + 2, 14, 9);
  ctx.fillStyle = "#0f0f2e";          // tela escura
  ctx.fillRect(x + 2, y + 3, 12, 7);
  ctx.fillStyle = "#7dffb0";          // linhas de texto verdes
  ctx.fillRect(x + 4, y + 5, 8, 1);
  ctx.fillRect(x + 4, y + 7, 5, 1);

  if (!dialogue.open && nearestInteractable() === sign) drawBalloon(x, y);
}

// O baú: roxo escuro, com uma faixa de neon (rosa = coração, ciano = gema)
function drawChest(chest) {
  const x = chest.col * TILE;
  const y = chest.row * TILE;
  const edge = chest.kind === "heart" ? "#ff6ec7" : "#4fd8e8";
  const glow = chest.kind === "heart" ? "#ff9ab8" : "#c9f7ff";

  drawPavement(x, y, chest.col, chest.row);
  ctx.fillStyle = "#0a0a24";                // sombrinha no chão
  ctx.fillRect(x + 2, y + 14, 12, 2);
  ctx.fillStyle = "#1d1650";                // contorno
  ctx.fillRect(x + 1, y + 6, 14, 9);
  ctx.fillStyle = "#4b3a96";                // corpo do baú
  ctx.fillRect(x + 2, y + 9, 12, 5);

  if (!chest.opened) {
    ctx.fillStyle = "#6a56c8";              // tampa fechada
    ctx.fillRect(x + 2, y + 6, 12, 4);
    ctx.fillStyle = edge;                   // faixa de neon
    ctx.fillRect(x + 2, y + 9, 12, 1);
    ctx.fillStyle = "#ffd86b";              // fechadura dourada
    ctx.fillRect(x + 7, y + 8, 2, 3);
    // Brilhinho que pisca de vez em quando (cada baú em um momento)
    if ((frameCount + chest.col * 13 + chest.row * 7) % 90 < 8) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + 13, y + 3, 1, 3);
      ctx.fillRect(x + 12, y + 4, 3, 1);
    }
  } else {
    ctx.fillStyle = glow;                   // luz saindo de dentro
    ctx.fillRect(x + 3, y + 8, 10, 2);
    ctx.fillStyle = "#6a56c8";              // tampa aberta, levantada
    ctx.fillRect(x + 2, y + 2, 12, 3);
    ctx.fillStyle = edge;
    ctx.fillRect(x + 2, y + 4, 12, 1);
  }

  if (!dialogue.open && nearestInteractable() === chest) drawBalloon(x, y);
}

// A plataforma de lançamento: uma base escura com 3 tubos de foguete
function drawFireworkPad(pad) {
  const x = pad.col * TILE;
  const y = pad.row * TILE;
  const capColors = ["#ff6ec7", "#4fd8e8", "#ffd86b"]; // a cor da tampa de cada tubo

  drawPavement(x, y, pad.col, pad.row);
  ctx.fillStyle = "#0a0a24";                // sombra no chão
  ctx.fillRect(x + 1, y + 14, 14, 2);
  ctx.fillStyle = "#2d2a5c";                // base
  ctx.fillRect(x + 1, y + 10, 14, 5);
  ctx.fillStyle = "#ff6ec7";                // faixa de neon na base
  ctx.fillRect(x + 1, y + 10, 14, 1);

  for (let i = 0; i < 3; i++) {
    const tx = x + 3 + i * 4;               // posição de cada tubo
    ctx.fillStyle = "#5b4fb8";              // tubo
    ctx.fillRect(tx, y + 4, 3, 7);
    ctx.fillStyle = "#8f7de8";              // brilho no tubo
    ctx.fillRect(tx, y + 4, 1, 7);
    ctx.fillStyle = capColors[i];           // tampa colorida
    ctx.fillRect(tx, y + 3, 3, 1);
  }

  // Faísca no pavio, piscando (mais rápido durante o show)
  const blinkSpeed = fireworks.active ? 3 : 14;
  if (Math.floor(frameCount / blinkSpeed) % 2 === 0) {
    ctx.fillStyle = "#ffd86b";
    ctx.fillRect(x + 4, y + 1, 1, 2);
    ctx.fillRect(x + 8, y + 1, 1, 2);
    ctx.fillRect(x + 12, y + 1, 1, 2);
  }

  if (!dialogue.open && nearestInteractable() === pad) drawBalloon(x, y);
}

// O bolo de aniversário no chão, flutuando de leve e brilhando
function drawCake(c) {
  const x = c.col * TILE;
  const y = c.row * TILE;
  const bob = Math.round(Math.sin(frameCount / 14)); // sobe e desce 1 pixel

  drawPavement(x, y, c.col, c.row);
  ctx.fillStyle = "#0a0a24";                // sombra no chão
  ctx.fillRect(x + 2, y + 14, 12, 2);
  drawSprite(cakeSprite, x + 2, y + 3 + bob);

  // Brilhinho que pisca por cima do bolo
  if (frameCount % 50 < 10) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + 12, y - 1 + bob, 1, 3);
    ctx.fillRect(x + 11, y + bob, 3, 1);
  }

  if (!dialogue.open && nearestInteractable() === c) drawBalloon(x, y - 2);
}

// ---------- 4. FOGOS DE ARTIFÍCIO ----------
const fireworks = { active: false, timer: 0 };
const SHOW_DURATION = 240;   // o show dura 240 frames (~4 segundos)
const rockets = [];           // foguetes subindo
const flashes = [];           // clarões que iluminam a noite quando explodem

// Cada explosão usa um conjunto de 3 cores (principal, clara, branca)
const FIREWORK_COLORS = [
  { colors: ["#ff6ec7", "#ff9ad6", "#ffffff"], glow: "255,110,199" },
  { colors: ["#4fd8e8", "#c9f7ff", "#ffffff"], glow: "79,216,232" },
  { colors: ["#ffd86b", "#fff1b0", "#ffffff"], glow: "255,216,107" },
  { colors: ["#7dffb0", "#d9ffe9", "#ffffff"], glow: "125,255,176" },
  { colors: ["#b48cff", "#e0ccff", "#ffffff"], glow: "180,140,255" },
];

function startFireworks() {
  if (fireworks.active) return; // se o show já está rolando, não começa outro por cima
  fireworks.active = true;
  fireworks.timer = 0;
}

function launchRocket() {
  const set = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
  const tube = Math.floor(Math.random() * 3); // sai de um dos 3 tubos
  rockets.push({
    x: contactPad.col * TILE + 4 + tube * 4,
    y: contactPad.row * TILE + 3,
    vx: (Math.random() - 0.5) * 0.5,          // desvia um pouquinho para os lados
    vy: -2.4,                                  // negativo = sobe
    targetY: contactPad.row * TILE - 50 - Math.random() * 60, // altura em que explode
    set: set,
  });
}

// A explosão: um anel de faíscas + faíscas em velocidades variadas
function explode(x, y, set) {
  for (let i = 0; i < 44; i++) {
    const angle = Math.random() * Math.PI * 2;
    // As primeiras 24 saem na mesma velocidade (formam um anel); as outras variam
    const speed = i < 24 ? 1.5 : 0.3 + Math.random() * 1.0;
    const life = 45 + Math.random() * 25;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,       // guardamos a vida inicial para o brilho ir sumindo
      gravity: 0.03,       // as faíscas caem devagar
      color: set.colors[i % set.colors.length],
    });
  }
  flashes.push({ x: x, y: y, life: 14, maxLife: 14, glow: set.glow });
}

function updateFireworks() {
  // 1) O show: lança um foguete a cada 20 frames, e para um pouco antes do fim
  if (fireworks.active) {
    fireworks.timer++;
    if (fireworks.timer % 20 === 1 && fireworks.timer < SHOW_DURATION - 60) launchRocket();
    if (fireworks.timer >= SHOW_DURATION) fireworks.active = false;
  }

  // 2) Os foguetes subindo (de trás para frente, porque apagamos itens)
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.x += r.vx;
    r.y += r.vy;
    // Rastro: uma faísca dourada que fica para trás
    particles.push({
      x: r.x,
      y: r.y + 2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.3,
      life: 10,
      maxLife: 10,
      gravity: 0,
      color: "#ffd86b",
    });
    if (r.y <= r.targetY) {      // chegou lá em cima: explode!
      explode(r.x, r.y, r.set);
      rockets.splice(i, 1);
    }
  }

  // 3) Os clarões vão sumindo
  for (let i = flashes.length - 1; i >= 0; i--) {
    flashes[i].life--;
    if (flashes[i].life <= 0) flashes.splice(i, 1);
  }
}

function drawRockets() {
  rockets.forEach((r) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(r.x), Math.round(r.y), 2, 3);
  });
}

// ---------- 4B. O FINAL DO JOGO ----------
// O final tem partes (stages): "lift" = a Caroline levanta o bolo, "fireworks" = fogos e THE END.
// Depois vêm os créditos, que são uma tela à parte (screen = "credits").
const ending = { active: false, stage: "", timer: 0, flash: 0 };
let toastTimer = 0; // o aviso "achaste tudo" que aparece no topo

// --- Som: uma fanfarra curta feita com "osciladores" (sem nenhum arquivo de áudio) ---
let audioCtx = null;

function playNotes(notes) {
  if (!SOUND_ON) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    notes.forEach(([freq, start, duration]) => {
      const osc = audioCtx.createOscillator();   // gera o som
      const gain = audioCtx.createGain();        // controla o volume
      osc.type = "square";
      osc.frequency.value = freq;                // frequência = a nota (em Hz)
      gain.gain.setValueAtTime(0.06, now + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration); // o som vai sumindo
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });
  } catch (error) {
    // se o navegador bloquear o som, o jogo segue sem som
  }
}

// [frequência, quando começa (segundos), quanto dura (segundos)]
function playFanfare() {
  playNotes([
    [523.25, 0.00, 0.14], [659.25, 0.14, 0.14], [783.99, 0.28, 0.14], [1046.5, 0.42, 0.45],
    [880.0, 0.95, 0.14], [1046.5, 1.09, 0.14], [1318.5, 1.23, 0.80],
  ]);
}
function playChime() {
  playNotes([[1046.5, 0, 0.12], [1568.0, 0.12, 0.28]]);
}

// ---------- 4C. A MÚSICA DE FUNDO ----------
// Um arquivo mp3 que toca em loop (repete sem parar). Três ideias importantes:
// 1) Os navegadores só deixam tocar som DEPOIS de o jogador tocar/clicar/apertar uma tecla. Por isso
//    a música começa no primeiro gesto (veja "startMusic" mais abaixo), e não ao abrir a página.
// 2) O volume muda aos poucos (fade), para não cortar o som de repente.
// 3) A tecla N (ou o botão ♪ no celular) liga e desliga. A escolha fica guardada no navegador.
const MUSIC_FILE = "assets/music/arcade.mp3";
const MUSIC_VOLUME = 0.3;          // 0 = mudo, 1 = volume máximo. 0.3 deixa a música ao fundo.
const CREDITS_MUSIC_FILE = "assets/music/credits.mp3"; // a música dos créditos (outra faixa)
const creditsMusic = new Audio(CREDITS_MUSIC_FILE);
creditsMusic.loop = true;
creditsMusic.volume = 0;
creditsMusic.preload = "auto";
const music = new Audio(MUSIC_FILE);
music.loop = true;                 // volta ao início quando termina
music.volume = 0;                  // começa em silêncio e sobe aos poucos
music.preload = "auto";

let musicStarted = false;          // já houve um gesto do jogador e a música já começou?
let musicMuted = false;            // o jogador desligou a música?
try { musicMuted = localStorage.getItem("musicMuted") === "1"; } catch (error) {}

// Chamada no primeiro toque, clique ou tecla
function startMusic() {
  if (musicStarted) return;
  musicStarted = true;
  const promise = music.play();    // play() devolve uma "promessa": pode ser recusada pelo navegador
  if (promise) promise.catch(() => { musicStarted = false; }); // recusou? tenta de novo no próximo gesto
}

// Que volume a música deveria ter agora, dependendo de onde o jogador está?
function musicTargetVolume() {
  if (musicMuted) return 0;
  if (screen === "credits") return 0;   // nos créditos a música do jogo some (entra a dos créditos)
  if (screen === "game" && ending.active) {
    return ending.stage === "lift" ? 0 : MUSIC_VOLUME * 0.35; // silêncio para a fanfarra; depois baixinha
  }
  return MUSIC_VOLUME;
}

// Roda a cada quadro: aproxima o volume atual do volume desejado (o fade)
// Aproxima o volume de uma faixa do volume desejado, um passinho por quadro
function fadeTo(track, target) {
  const diff = target - track.volume;
  if (Math.abs(diff) < 0.004) track.volume = target;
  else track.volume = Math.max(0, Math.min(1, track.volume + Math.sign(diff) * 0.006));
}

function updateMusic() {
  if (!musicStarted) return;
  fadeTo(music, musicTargetVolume());

  // Música dos créditos: só toca na tela de créditos, e sempre começa do início
  const wantCredits = screen === "credits" && !musicMuted;
  if (wantCredits && creditsMusic.paused && !document.hidden) {
    creditsMusic.currentTime = 0;
    creditsMusic.play().catch(() => {});
  }
  fadeTo(creditsMusic, wantCredits ? MUSIC_VOLUME : 0);
  if (!wantCredits && creditsMusic.volume === 0 && !creditsMusic.paused) creditsMusic.pause();
}

function toggleMusic() {
  musicMuted = !musicMuted;
  try { localStorage.setItem("musicMuted", musicMuted ? "1" : "0"); } catch (error) {}
  startMusic();
  toastText = musicMuted ? "♪ OFF" : "♪ ON";
  musicToast = 70;
}
let toastText = "";
let musicToast = 0;                // quanto tempo (em quadros) o aviso ♪ fica na tela

// Aba escondida ou app em segundo plano: pausa a música. Voltou: continua.
document.addEventListener("visibilitychange", () => {
  if (!musicStarted) return;
  if (document.hidden) { music.pause(); creditsMusic.pause(); }
  else { music.play().catch(() => {}); } // a dos créditos volta sozinha no updateMusic
});

// O primeiro gesto (de qualquer tipo) liga a música
window.addEventListener("pointerdown", startMusic);
window.addEventListener("keydown", startMusic);

// --- O bolo aparece quando o jogador achou TUDO ---
function allInfoFound() {
  return chests.every((c) => c.opened) &&   // todos os baús abertos
         signs.every((s) => s.read) &&      // todas as placas lidas (as escondidas também)
         pads.every((p) => p.read);         // e o Contato visitado
}

function updateCake() {
  if (cake.spawned || ending.active) return;
  if (!dialogue.open && (DEBUG_SPAWN_CAKE || allInfoFound())) {
    cake.spawned = true;
    toastTimer = 360;                       // o aviso fica ~6 segundos
    spawnParticles(cake.col, cake.row, ["#ffd86b", "#fff1b0", "#ffffff"]);
    playChime();
  }
}

// O aviso no topo da tela
function drawToast() {
  if (toastTimer <= 0 || dialogue.open || ending.active) return;
  toastTimer--;
  const text = language === "en"
    ? "Everything found! A surprise is waiting where you started."
    : "Encontraste tudo! Há uma surpresa onde começaste.";
  const lines = wrapText(text, 256);
  const h = 10 + lines.length * 11;
  ctx.fillStyle = "rgba(15, 15, 46, 0.92)";
  ctx.fillRect(20, 22, 280, h);
  ctx.strokeStyle = "#ffd86b";
  ctx.lineWidth = 1;
  ctx.strokeRect(20.5, 22.5, 279, h - 1);
  ctx.font = "8px monospace";
  ctx.fillStyle = "#fff1b0";
  lines.forEach((line, i) => ctx.fillText(line, 28, 36 + i * 11));
}

// Uma setinha dourada na borda da tela, apontando para o bolo quando ele está fora da tela
function drawBigArrow(cx, cy, dir, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {            // um triângulo de 4 linhas
    if (dir === "up")    ctx.fillRect(cx - i, cy - 4 + i, 2 * i + 1, 1);
    if (dir === "down")  ctx.fillRect(cx - i, cy + 3 - i, 2 * i + 1, 1);
    if (dir === "left")  ctx.fillRect(cx - 4 + i, cy - i, 1, 2 * i + 1);
    if (dir === "right") ctx.fillRect(cx + 3 - i, cy - i, 1, 2 * i + 1);
  }
}

function drawCakeArrow() {
  if (!cake.spawned || cake.taken || ending.active) return;
  const sx = cake.col * TILE + 8 - camera.x;       // onde o bolo está na TELA (tira a câmera)
  const sy = cake.row * TILE + 8 - camera.y;
  if (sx > 0 && sx < canvas.width && sy > 0 && sy < canvas.height) return; // já está na tela
  const dx = sx - canvas.width / 2;
  const dy = sy - canvas.height / 2;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
  const ax = Math.max(12, Math.min(canvas.width - 12, sx));   // prende a seta dentro da tela
  const ay = Math.max(26, Math.min(canvas.height - 12, sy));
  const pulse = Math.round(Math.sin(frameCount / 8) * 2);     // a seta "respira"
  const px = dir === "left" ? pulse : dir === "right" ? -pulse : 0;
  const py = dir === "up" ? pulse : dir === "down" ? -pulse : 0;
  drawBigArrow(ax + px + 1, ay + py + 1, dir, "#14123a");     // sombra escura
  drawBigArrow(ax + px, ay + py, dir, "#ffd86b");             // a seta
}

// --- A sequência do final ---
function startEnding() {
  cake.taken = true;
  ending.active = true;
  ending.stage = "lift";
  ending.timer = 0;
  ending.flash = 20;                 // o clarão branco do começo
  player.direction = "down";         // a Caroline olha para quem joga
  player.walkTimer = 0;
  book.active = false;
  playFanfare();
}

// Espaço durante o final: pula para a próxima parte (depois de um tempinho)
function skipEnding() {
  if (ending.stage === "lift" && ending.timer > 100) {
    ending.stage = "fireworks";
    ending.timer = 0;
  } else if (ending.stage === "fireworks" && ending.timer > 100) {
    changeScreen("credits");
  }
}

// Onde o bolo fica quando a Caroline o levanta (acima da cabeça, dobrado de tamanho)
function cakeLiftPos() {
  const rise = ending.stage === "lift" ? Math.min(8, ending.timer / 5) : 8; // sobe aos poucos
  const bob = Math.round(Math.sin(frameCount / 8));
  return { x: Math.round(player.x + 8 - 11), y: Math.round(player.y - 22 - rise + bob) };
}

// Um foguete do show final: sobe de baixo da tela, em qualquer lugar
function launchFinaleRocket() {
  const set = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
  rockets.push({
    x: camera.x + 20 + Math.random() * (canvas.width - 40),
    y: camera.y + canvas.height + 4,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -3.2,
    targetY: camera.y + 30 + Math.random() * 110,
    set: set,
  });
}

function updateEnding() {
  if (!ending.active) return;
  ending.timer++;

  // Faíscas douradas subindo em volta do bolo
  if (frameCount % 4 === 0) {
    const pos = cakeLiftPos();
    particles.push({
      x: pos.x + 11 + (Math.random() - 0.5) * 40,
      y: pos.y + 9 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.3,
      life: 30,
      maxLife: 30,
      gravity: 0,
      color: Math.random() < 0.5 ? "#fff1b0" : "#ffd86b",
    });
  }

  if (ending.stage === "lift") {
    if (ending.timer > 230) { ending.stage = "fireworks"; ending.timer = 0; }
  } else if (ending.stage === "fireworks") {
    if (ending.timer % 9 === 0) launchFinaleRocket(); // um foguete a cada 9 frames
    if (ending.timer > 330) changeScreen("credits");   // depois de ~5 segundos, vão os créditos
  }
}

// Os raios dourados girando atrás da Caroline (desenhados no mundo, com a câmera)
function drawRays() {
  if (!ending.active) return;
  const pos = cakeLiftPos();
  const alpha = ending.stage === "lift" ? Math.min(1, ending.timer / 30) : 1;
  ctx.save();
  ctx.translate(pos.x + 11, pos.y + 9);          // o centro dos raios é o bolo
  ctx.rotate(ending.timer * 0.012 + (ending.stage === "fireworks" ? 2 : 0)); // gira devagar
  ctx.globalAlpha = 0.22 * alpha;
  ctx.fillStyle = "#ffd86b";
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);                     // cada raio gira mais 30 graus (12 x 30 = 360)
    ctx.fillRect(6, -2, 100, 4);
  }
  ctx.restore();                                 // o restore também devolve a transparência ao normal
}

// O bolo erguido acima da cabeça da Caroline
function drawLiftedCake() {
  if (!ending.active) return;
  const pos = cakeLiftPos();
  drawSprite(cakeSprite, pos.x, pos.y, 2);
}

// A caixa de texto do final (parecida com a dos baús e das placas)
function drawEndingText() {
  const title = language === "en" ? "You got the Birthday Cake!" : "Encontraste o Bolo de Aniversário!";
  const body = language === "en"
    ? "You found every heart, gem and sign. Thank you for getting to know me!"
    : "Encontraste todos os corações, gemas e placas. Obrigada por me conheceres!";
  const x = 8, y = 152, w = 304, h = 80;

  ctx.fillStyle = "#0f0f2e";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#ffd86b";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.font = "8px monospace";
  ctx.fillStyle = "#ffd86b";
  ctx.fillText(title, x + 8, y + 12);

  const lines = wrapText(body, 288);
  ctx.font = "8px monospace";
  ctx.fillStyle = "#e8e6ff";
  lines.slice(0, 4).forEach((line, i) => ctx.fillText(line, x + 8, y + 26 + i * 11));

  ctx.font = "7px monospace";
  ctx.fillStyle = "#8c88c9";
  ctx.textAlign = "right";
  ctx.fillText(`${isTouch ? "A" : "ESPACO"} >`, x + w - 8, y + 74);
  ctx.textAlign = "left";
}

// O que fica por cima de tudo durante o final: clarão, texto e "THE END"
function drawEndingOverlay() {
  if (!ending.active) return;

  if (ending.flash > 0) {                        // o clarão branco que vai sumindo
    ctx.fillStyle = `rgba(255, 255, 255, ${(ending.flash / 20) * 0.9})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ending.flash--;
  }

  if (ending.stage === "lift" && ending.timer > 70) drawEndingText();

  if (ending.stage === "fireworks") {
    ctx.globalAlpha = Math.min(1, ending.timer / 40);  // THE END aparece aos poucos
    drawBigText("THE END", 160, 34, 4, { fill: "#ffd86b", light: "#fff1b0", shadow: "#ff6ec7" });
    ctx.globalAlpha = 1;
  }
}

// Os itens que sobem flutuando quando um baú abre
const popups = [];

function updatePopups() {
  for (let i = popups.length - 1; i >= 0; i--) {
    popups[i].life--;
    if (popups[i].life <= 0) popups.splice(i, 1);
  }
}

function drawPopups() {
  popups.forEach((p) => {
    if (p.life < 14 && p.life % 4 < 2) return; // pisca antes de sumir
    const rise = (60 - p.life) * 0.4;          // quanto já subiu
    drawSprite(p.kind === "heart" ? heartSprite : gemSprite, p.x, p.y - rise);
  });
}

// O contador no canto da tela (fixo, não se mexe com a câmera)
function drawHud() {
  const hearts = countOpened("heart");
  const gems = countOpened("gem");
  ctx.fillStyle = "rgba(15, 15, 46, 0.75)";
  ctx.fillRect(226, 2, 92, 13);
  drawSprite(heartSprite, 230, 5);
  drawSprite(gemSprite, 272, 5);
  ctx.font = "7px monospace";
  ctx.fillStyle = hearts === TOTAL_HEARTS ? "#ffd86b" : "#e8e6ff"; // dourado quando completa
  ctx.fillText(`${hearts}/${TOTAL_HEARTS}`, 240, 11);
  ctx.fillStyle = gems === TOTAL_GEMS ? "#ffd86b" : "#e8e6ff";
  ctx.fillText(`${gems}/${TOTAL_GEMS}`, 282, 11);
}

// A caixa de texto, desenhada por cima de tudo, fixa na tela
function drawDialogue() {
  if (!dialogue.open) return;
  const x = 8, y = 152, w = 304, h = 80;

  ctx.fillStyle = "#0f0f2e";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#ff6ec7";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.font = "8px monospace";
  ctx.fillStyle = "#4fd8e8";
  ctx.fillText(dialogue.title, x + 8, y + 12);

  ctx.fillStyle = "#e8e6ff";
  dialogue.pages[dialogue.page].forEach((line, i) => {
    ctx.fillText(line, x + 8, y + 26 + i * 11);
  });

  // Rodapé: os textos de ajuda mudam no celular (botões) e no computador (teclas)
  ctx.font = "7px monospace";
  ctx.fillStyle = "#8c88c9";
  ctx.fillText(isTouch ? "EN/PT: language" : "L: EN / PT", x + 8, y + 74);
  if (dialogue.sign && dialogue.sign.id === "contact") {
    ctx.fillStyle = "#ffd86b";
    ctx.fillText(isTouch ? "@: e-mail" : "M: e-mail", x + 80, y + 74); // só aparece na caixa do Contato
    ctx.fillStyle = "#8c88c9";
  }
  ctx.textAlign = "right"; // alinha à direita só para esta linha
  ctx.fillText(`${isTouch ? "A" : "ESPACO"} >  ${dialogue.page + 1}/${dialogue.pages.length}`, x + w - 8, y + 74);
  ctx.textAlign = "left";  // volta ao normal
}

// ---------- 5. LIVRO MÁGICO ----------
const book = { active: false, timer: 0 };
const BOOK_DURATION = 16; // quantos frames a ação dura (~0,27 segundo)
const particles = [];      // pedacinhos e brilhos

function startBook() {
  if (screen !== "game" || ending.active) return; // fora do jogo, e durante o final, o livro não abre
  if (book.active || dialogue.open) return;       // já está usando o livro, ou lendo
  book.active = true;
  book.timer = 0;
}

// A área na frente da Caroline que o livro alcança
function bookBox() {
  const cx = player.x + 8;
  const cy = player.y + 11;
  switch (player.direction) {
    case "up":    return { x: cx - 10, y: cy - 20, w: 20, h: 14 };
    case "down":  return { x: cx - 10, y: cy + 2,  w: 20, h: 14 };
    case "left":  return { x: cx - 22, y: cy - 8,  w: 16, h: 16 };
    default:      return { x: cx + 6,  y: cy - 8,  w: 16, h: 16 }; // right
  }
}

// Quebra os caixotes ("b") que estão na área do livro
function cutCrates() {
  const box = bookBox();
  // Quais colunas e linhas de tiles essa área toca?
  const firstCol = Math.floor(box.x / TILE);
  const lastCol = Math.floor((box.x + box.w) / TILE);
  const firstRow = Math.floor(box.y / TILE);
  const lastRow = Math.floor((box.y + box.h) / TILE);

  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      if (row < 0 || col < 0 || row >= MAP_ROWS || col >= MAP_COLS) continue;
      if (map[row][col] !== "b") continue;      // só caixotes

      map[row][col] = ".";                      // o caixote vira chão
      spawnParticles(col, row, ["#5b4a9e", "#ff6ec7", "#8b78d6"]);

      const sign = signs.find((s) => s.hidden && s.col === col && s.row === row);
      if (sign) {
        sign.hidden = false;                    // a placa aparece!
        spawnParticles(col, row, ["#4fd8e8", "#ffffff", "#ffd86b"]);
      }
    }
  }
}

function updateBook() {
  if (!book.active) return;
  book.timer++;
  if (book.timer === 5) cutCrates();            // quando o livro abre, a magia acerta
  if (book.timer >= BOOK_DURATION) book.active = false;
}

function drawBook() {
  if (!book.active) return;
  const t = book.timer;
  const isOpen = t >= 4 && t < 13;              // frames 0-3: fechado, 4-12: aberto, 13-15: fecha
  const reach = t < 4 ? 6 : t < 13 ? 11 : 7;    // o livro se afasta da mão e volta
  const hx = Math.round(player.x + 8);          // onde está a mão
  const hy = Math.round(player.y + 10);
  const stepX = player.direction === "left" ? -1 : player.direction === "right" ? 1 : 0;
  const stepY = player.direction === "up" ? -1 : player.direction === "down" ? 1 : 0;
  const bx = hx + stepX * reach;                // centro do livro
  const by = hy + stepY * reach;

  if (isOpen) {
    ctx.fillStyle = "#3b2f8a";                  // capa aberta
    ctx.fillRect(bx - 6, by - 4, 12, 8);
    ctx.fillStyle = "#f2e8cf";                  // duas páginas
    ctx.fillRect(bx - 5, by - 3, 5, 6);
    ctx.fillRect(bx + 1, by - 3, 5, 6);
    ctx.fillStyle = "#b8a98a";                  // linhas de texto nas páginas
    ctx.fillRect(bx - 4, by - 2, 3, 1);
    ctx.fillRect(bx - 4, by, 3, 1);
    ctx.fillRect(bx + 2, by - 2, 3, 1);
    ctx.fillRect(bx + 2, by, 3, 1);
    ctx.fillStyle = "#8b78d6";                  // lombada no meio
    ctx.fillRect(bx, by - 4, 1, 8);
  } else {
    ctx.fillStyle = "#3b2f8a";                  // livro fechado
    ctx.fillRect(bx - 3, by - 4, 6, 8);
    ctx.fillStyle = "#ff6ec7";                  // lombada neon
    ctx.fillRect(bx - 3, by - 4, 1, 8);
    ctx.fillStyle = "#ffd86b";                  // fecho dourado
    ctx.fillRect(bx + 1, by - 1, 1, 2);
  }

  // Explosão mágica: 8 pontinhos que se afastam do livro em círculo
  if (t >= 5 && t < 12) {
    const radius = (t - 4) * 2.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.fillStyle = i % 2 === 0 ? "#ff6ec7" : "#4fd8e8";
      ctx.fillRect(
        Math.round(bx + Math.cos(angle) * radius),
        Math.round(by + Math.sin(angle) * radius),
        2,
        2
      );
    }
  }
}

// ---------- 6. PARTÍCULAS (pedacinhos, brilhos e faíscas) ----------
function spawnParticles(col, row, colors) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: col * TILE + 8,
      y: row * TILE + 8,
      vx: (Math.random() - 0.5) * 2.4,  // velocidade para os lados
      vy: (Math.random() - 1) * 2,      // velocidade para cima/baixo
      life: 25 + Math.random() * 15,    // quantos frames ela dura
      color: colors[i % colors.length],
    });
  }
}

function updateParticles() {
  // Percorremos de trás para frente, porque vamos apagar itens da lista
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity === undefined ? 0.12 : p.gravity; // gravidade: cada partícula pode ter a sua
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  particles.forEach((p) => {
    // Partículas com "maxLife" (as dos fogos) vão ficando transparentes no final
    ctx.globalAlpha = p.maxLife ? Math.min(1, p.life / (p.maxLife * 0.5)) : 1;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
  });
  ctx.globalAlpha = 1; // volta ao normal
}

// Dica fixa no canto da tela (muda no celular)
function drawHint() {
  if (dialogue.open || ending.active) return;
  ctx.font = "7px monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  const hint = isTouch
    ? "B: book   A: read/open   EN/PT: language"
    : "X: book   SPACE: read/open   L: EN/PT";
  ctx.fillText(hint, 6, 10);
}

// ---------- 7. DESENHAR OS TILES ----------
// Cada função pinta um quadradinho com retângulos. (x, y) é o canto de cima à esquerda.

// Chão da cidade: lajes verde-água com brilhos
function drawPavement(x, y, col, row) {
  ctx.fillStyle = "#0d6b63";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#0a5650";          // juntas entre as lajes
  ctx.fillRect(x, y + TILE - 1, TILE, 1);
  ctx.fillRect(x + TILE - 1, y, 1, TILE);
  const n = (col * 7 + row * 13) % 4; // muda de tile para tile, mas é sempre igual para o mesmo tile
  ctx.fillStyle = "#15897b";          // brilho
  ctx.fillRect(x + 3 + n * 2, y + 3, 3, 1);
  ctx.fillRect(x + 9 - n, y + 9, 2, 1);
}

// Calçada iluminada: roxo escuro com luzinhas neon rosa nos cantos
function drawPath(x, y, col, row) {
  ctx.fillStyle = "#2c2a63";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#3d3a85";          // bordas mais claras
  ctx.fillRect(x, y, TILE, 1);
  ctx.fillRect(x, y + TILE - 1, TILE, 1);
  ctx.fillStyle = "#ff6ec7";          // luzinhas neon
  ctx.fillRect(x + 1, y + 1, 2, 2);
  ctx.fillRect(x + 13, y + 1, 2, 2);
  ctx.fillRect(x + 1, y + 13, 2, 2);
  ctx.fillRect(x + 13, y + 13, 2, 2);
}

// Prédio: se o tile de cima também é prédio, as paredes se juntam num prédio alto
function drawBuilding(x, y, col, row) {
  const above = row > 0 && map[row - 1][col] === "T";
  const below = row < MAP_ROWS - 1 && map[row + 1][col] === "T";

  ctx.fillStyle = "#35307a";          // parede
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#2a2663";          // sombra na lateral
  ctx.fillRect(x, y, 1, TILE);

  if (!above) {                       // telhado, só no topo do prédio
    ctx.fillStyle = "#5b4fb8";
    ctx.fillRect(x, y, TILE, 4);
    ctx.fillStyle = "#8f7de8";        // brilho no topo
    ctx.fillRect(x, y, TILE, 1);
    if ((col + row) % 3 === 0) {      // respiro no telhado de alguns prédios
      ctx.fillStyle = "#2a2663";
      ctx.fillRect(x + 10, y + 1, 3, 2);
    }
  }

  // Duas janelas. A cor depende da posição, então cada prédio tem janelas diferentes.
  const windowColors = ["#ff7ee8", "#4fd8e8", "#2a2860", "#ff7ee8", "#2a2860", "#4fd8e8", "#2a2860"];
  const wy = above ? y + 4 : y + 7;
  ctx.fillStyle = windowColors[(col * 3 + row * 5) % 7];
  ctx.fillRect(x + 3, wy, 4, 4);
  ctx.fillStyle = windowColors[(col * 5 + row * 3 + 2) % 7];
  ctx.fillRect(x + 9, wy, 4, 4);

  if (!below) {                       // base escura do prédio
    ctx.fillStyle = "#1f1b4d";
    ctx.fillRect(x, y + 13, TILE, 3);
    if ((col * 7 + row) % 3 === 0) {  // faixa de neon em alguns prédios
      ctx.fillStyle = "#ff4fc3";
      ctx.fillRect(x + 3, y + 12, 10, 1);
    }
  }
}

// Caixote de carga (o livro quebra)
function drawCrate(x, y, col, row) {
  drawPavement(x, y, col, row);
  ctx.fillStyle = "#2a2260";          // contorno
  ctx.fillRect(x + 1, y + 4, 14, 11);
  ctx.fillStyle = "#5b4a9e";          // caixa
  ctx.fillRect(x + 2, y + 5, 12, 9);
  ctx.fillStyle = "#8b78d6";          // tampa
  ctx.fillRect(x + 2, y + 5, 12, 2);
  ctx.fillStyle = "#ff6ec7";          // faixa neon
  ctx.fillRect(x + 7, y + 5, 2, 9);
}

// Máquina de bebidas
function drawVending(x, y, col, row) {
  drawPavement(x, y, col, row);
  ctx.fillStyle = "#a99bd6";          // corpo
  ctx.fillRect(x + 2, y + 1, 12, 15);
  ctx.fillStyle = "#ff9ad6";          // topo rosa
  ctx.fillRect(x + 2, y + 1, 12, 3);
  ctx.fillStyle = "#1a2a4a";          // vitrine
  ctx.fillRect(x + 3, y + 5, 10, 6);
  const dots = ["#ff6ec7", "#4fd8e8", "#ffd86b", "#7dffb0"];
  for (let i = 0; i < 4; i++) {       // latinhas coloridas, em duas fileiras
    ctx.fillStyle = dots[i];
    ctx.fillRect(x + 4 + i * 2, y + 6, 2, 2);
    ctx.fillStyle = dots[(i + 2) % 4];
    ctx.fillRect(x + 4 + i * 2, y + 9, 2, 2);
  }
  ctx.fillStyle = "#4a3d7a";          // abertura de retirada
  ctx.fillRect(x + 5, y + 12, 6, 2);
}

// Poste de luz
function drawLamp(x, y, col, row) {
  drawPavement(x, y, col, row);
  ctx.fillStyle = "#2d2a5c";          // poste
  ctx.fillRect(x + 7, y + 4, 2, 12);
  ctx.fillRect(x + 7, y + 3, 6, 2);   // braço
  ctx.fillStyle = "#4fd8e8";          // lâmpada
  ctx.fillRect(x + 10, y + 5, 4, 2);
}

function drawMap() {
  // Só desenhamos os tiles que aparecem na tela (a câmera mostra uma parte do mapa)
  const startCol = Math.max(0, Math.floor(camera.x / TILE));
  const endCol = Math.min(MAP_COLS - 1, startCol + 21);
  const startRow = Math.max(0, Math.floor(camera.y / TILE));
  const endRow = Math.min(MAP_ROWS - 1, startRow + 16);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const x = col * TILE;
      const y = row * TILE;
      const tile = map[row][col];
      if (tile === "T") drawBuilding(x, y, col, row);
      else if (tile === "b") drawCrate(x, y, col, row);
      else if (tile === "V") drawVending(x, y, col, row);
      else if (tile === "L") drawLamp(x, y, col, row);
      else if (tile === "#") drawPath(x, y, col, row);
      else drawPavement(x, y, col, row);
    }
  }
}

// ---------- 8. LETREIROS DE NEON ----------
// Uma fontinha de pixels: cada letra tem 3 colunas e 5 linhas ("#" = pixel aceso).
const font = {
  O: ["###", "#.#", "#.#", "#.#", "###"],
  P: ["###", "#.#", "###", "#..", "#.."],
  E: ["###", "#..", "###", "#..", "###"],
  N: ["#.#", "###", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  A: ["###", "#.#", "###", "#.#", "#.#"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  K: ["#.#", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", "###", "..#", "##."],
  C: ["###", "#..", "#..", "#..", "###"],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
};

// Cada letreiro: o texto, a posição (em pixels do mapa) e as cores.
// "glow" é a cor da luz que ele joga em volta (números R,G,B). "flicker" = pisca.
const neons = [
  { text: "OPEN",   vertical: true, x: 5 * TILE + 4, y: 5 * TILE + 8,  color: "#ff6ec7", glow: "255,110,199", flicker: true },
  { text: "BAR",    x: 19 * TILE + 9, y: 2 * TILE + 3,                  color: "#4fd8e8", glow: "79,216,232",  flicker: false },
  { text: "OPEN",   x: 34 * TILE - 6, y: 17 * TILE + 4,                 color: "#ff6ec7", glow: "255,110,199", flicker: true },
  { text: "DRINKS", x: 1 * TILE + 8 - 13,  y: 9 * TILE - 10,            color: "#ffd86b", glow: "255,216,107", flicker: false },
  { text: "DRINKS", x: 11 * TILE + 8 - 13, y: 23 * TILE - 10,           color: "#ffd86b", glow: "255,216,107", flicker: false },
  // Letreiro flutuando (como um holograma) acima da plataforma de fogos
  { text: "CONTACT", x: 28 * TILE + 8 - 15, y: 24 * TILE - 22,          color: "#ffd86b", glow: "255,216,107", flicker: false },
];

// Calcula o tamanho de cada letreiro (para saber onde fica o centro dele)
neons.forEach((n) => {
  const len = n.text.length;
  n.w = n.vertical ? 7 : len * 4 - 1 + 4;       // cada letra: 3 de largura + 1 de espaço, mais a margem
  n.h = n.vertical ? len * 6 - 1 + 4 : 9;       // na vertical, cada letra ocupa 5 de altura + 1 de espaço
});

// O letreiro está aceso agora? Os que piscam apagam por um instante de vez em quando.
function neonOn(n) {
  if (!n.flicker) return true;
  const t = Math.floor(frameCount / 4) + Math.floor(n.x); // o "+ n.x" faz cada um piscar em um momento
  return t % 23 !== 0 && t % 23 !== 2;
}

function drawGlyph(letter, x, y, color) {
  ctx.fillStyle = color;
  font[letter].forEach((rowText, r) => {
    for (let c = 0; c < 3; c++) {
      if (rowText[c] === "#") ctx.fillRect(x + c, y + r, 1, 1);
    }
  });
}

function drawNeon(n) {
  const on = neonOn(n);
  const color = on ? n.color : "#3b3768";       // apagado: roxo fosco

  ctx.fillStyle = "#14123a";                    // placa escura
  ctx.fillRect(n.x, n.y, n.w, n.h);
  ctx.fillStyle = color;                        // moldura
  ctx.fillRect(n.x, n.y, n.w, 1);
  ctx.fillRect(n.x, n.y + n.h - 1, n.w, 1);
  ctx.fillRect(n.x, n.y, 1, n.h);
  ctx.fillRect(n.x + n.w - 1, n.y, 1, n.h);

  n.text.split("").forEach((letter, i) => {
    const lx = n.vertical ? n.x + 2 : n.x + 2 + i * 4;
    const ly = n.vertical ? n.y + 2 + i * 6 : n.y + 2;
    drawGlyph(letter, lx, ly, color);
  });
}

// ---------- 9. A NOITE (escuridão com luzes) ----------
const NIGHT_DARKNESS = 0.5; // 0 = dia claro, 1 = escuridão total. Experimenta valores!

// Uma segunda "tela" invisível, só para a escuridão
const nightCanvas = document.createElement("canvas");
nightCanvas.width = canvas.width;
nightCanvas.height = canvas.height;
const nctx = nightCanvas.getContext("2d");

// As luzes fixas: postes, máquinas de bebidas, plataforma e letreiros
const staticLights = [];
for (let row = 0; row < MAP_ROWS; row++) {
  for (let col = 0; col < MAP_COLS; col++) {
    if (map[row][col] === "L") {
      staticLights.push({ x: col * TILE + 12, y: row * TILE + 5, r: 46, glow: "79,216,232" });
    }
    if (map[row][col] === "V") {
      staticLights.push({ x: col * TILE + 8, y: row * TILE + 8, r: 32, glow: "255,154,214" });
    }
  }
}
pads.forEach((pad) => {
  staticLights.push({ x: pad.col * TILE + 8, y: pad.row * TILE + 8, r: 30, glow: "255,216,107" });
});
neons.forEach((n) => {
  staticLights.push({ x: n.x + n.w / 2, y: n.y + n.h / 2, r: 30, glow: n.glow, neon: n });
});

function drawNight() {
  // No final, a noite fica mais escura, para o bolo e os fogos brilharem mais
  const darkness = ending.active ? 0.72 : NIGHT_DARKNESS;

  // 1) Pinta a tela invisível toda de azul escuro semitransparente
  nctx.globalCompositeOperation = "source-over";
  nctx.clearRect(0, 0, nightCanvas.width, nightCanvas.height);
  nctx.fillStyle = `rgba(8, 6, 40, ${darkness})`;
  nctx.fillRect(0, 0, nightCanvas.width, nightCanvas.height);

  // 2) Lista de luzes: as fixas, a Caroline, as placas, os baús fechados, o bolo e os clarões dos fogos
  const lights = staticLights.concat([
    { x: player.x + 8, y: player.y + 8, r: 46 },
  ]);
  signs.filter((s) => !s.hidden).forEach((s) => {
    lights.push({ x: s.col * TILE + 8, y: s.row * TILE + 8, r: 24, glow: "125,255,176" });
  });
  chests.filter((c) => !c.opened).forEach((c) => {
    lights.push({
      x: c.col * TILE + 8,
      y: c.row * TILE + 8,
      r: 22,
      glow: c.kind === "heart" ? "255,110,199" : "79,216,232", // rosa = coração, ciano = gema
    });
  });
  if (cake.spawned && !cake.taken) {            // o bolo no chão brilha dourado
    lights.push({ x: cake.col * TILE + 8, y: cake.row * TILE + 8, r: 40, glow: "255,216,107" });
  }
  if (ending.active) {                          // o bolo erguido ilumina tudo em volta
    const pos = cakeLiftPos();
    lights.push({ x: pos.x + 11, y: pos.y + 9, r: 80, glow: "255,216,107" });
  }
  flashes.forEach((f) => {
    // O clarão começa grande e vai encolhendo até sumir
    lights.push({ x: f.x, y: f.y, r: 20 + 50 * (f.life / f.maxLife), glow: f.glow });
  });

  // 3) "destination-out" APAGA a escuridão onde desenhamos. Três círculos
  //    empilhados deixam o centro bem claro e a borda suave.
  nctx.globalCompositeOperation = "destination-out";
  lights.forEach((light) => {
    if (light.neon && !neonOn(light.neon)) return;       // letreiro apagado não ilumina
    const sx = light.x - camera.x;                       // posição na tela (tira a câmera)
    const sy = light.y - camera.y;
    if (sx < -light.r || sx > canvas.width + light.r) return; // fora da tela: ignora
    if (sy < -light.r || sy > canvas.height + light.r) return;
    [1, 0.7, 0.4].forEach((k) => {
      nctx.beginPath();
      nctx.arc(sx, sy, light.r * k, 0, Math.PI * 2);
      nctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      nctx.fill();
    });
  });

  // 4) Cola a escuridão (já com os buracos de luz) por cima do jogo
  ctx.drawImage(nightCanvas, 0, 0);

  // 5) Brilho colorido em volta das luzes. "lighter" SOMA as cores, como luz de verdade.
  ctx.globalCompositeOperation = "lighter";
  lights.forEach((light) => {
    if (!light.glow) return;
    if (light.neon && !neonOn(light.neon)) return;
    const sx = light.x - camera.x;
    const sy = light.y - camera.y;
    if (sx < -light.r || sx > canvas.width + light.r) return;
    if (sy < -light.r || sy > canvas.height + light.r) return;
    [0.8, 0.45].forEach((k) => {
      ctx.beginPath();
      ctx.arc(sx, sy, light.r * k, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${light.glow}, 0.07)`;
      ctx.fill();
    });
  });
  ctx.globalCompositeOperation = "source-over"; // volta ao normal
}

// ---------- 10. OS DESENHOS DOS PERSONAGENS ----------
// CAROLINE: corpo (14 linhas) + pernas (2 linhas). Cada linha tem 16 caracteres.
const body = {
  down: [
    ".....HHHHHH.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHSSSSSSHH...",
    "...HHSSSSSSHH...",
    "...HHSESSESHH...",
    "...HHSSSSSSHH...",
    "...HHHSSSSHHH...",
    "...HHBBBBBBHH...",
    "...HHBWWWWBHH...",
    "...HHBWWWWBHH...",
    "...HHBBBBBBHH...",
    "...HHPPPPPPHH...",
    "....HPPPPPPH....",
  ],
  up: [
    ".....HHHHHH.....",
    "....HHHHHHHH....",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "..BHHHHHHHHHHB..",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHHHHHHHH...",
    "...HHHPPPPHHH...",
    "....HPPPPPPH....",
  ],
  right: [
    "......HHHHH.....",
    ".....HHHHHHH....",
    "....HHHHHHHHH...",
    "....HHHSSSSS....",
    "....HHHSSSSS....",
    "....HHHSSSES....",
    "....HHHSSSSS....",
    "....HHHHSSS.....",
    "....HHBBBBBB....",
    "....HHBBBBBB....",
    "....HHBBBBBB....",
    "....HHBBBBBB....",
    "....HHPPPPPP....",
    ".....HPPPPPP....",
  ],
};

const legsFrontBack = [
  ["....PPP..PPP....", "....KKK..KKK...."],
  ["....PPP..PPP....", "....KKK........."],
  ["....PPP..PPP....", ".........KKK...."],
];
const legsSide = [
  [".....PPPPPP.....", ".....KKKKKKK...."],
  ["....PPP...PPP...", "....KKK...KKK..."],
  [".....PPPPPP.....", ".....KKKKKK....."],
];
const legs = { down: legsFrontBack, up: legsFrontBack, right: legsSide };

// GATO: de lado, olhando para a direita. Cada linha tem 12 caracteres.
const catBody = [
  "........C.C.",
  "C......CCCCC",
  "C......CYCYC",
  "C......CCNCC",
  "CCCCCCCCCCCC",
  ".CCCCCCCCCC.",
  ".CCCCCCCCCC.",
];
const catLegs = [
  [".CC......CC.", ".CC......CC."],
  ["..CC....CC..", "..CC....CC.."],
];

// CACHORRO: de lado, olhando para a direita. Cada linha tem 14 caracteres.
const dogBody = [
  "..........dd..",
  "D.........dDDD",
  "D.........dDED", // olho (1 pixel)
  "DD........dDDO", // nariz, na linha de baixo
  "DDDDDDDDDDDDD.",
  ".DDDDDDDDDDD..",
  ".DDDDDDDDDDD..",
];
const dogLegs = [
  [".DD.......DD..", ".DD.......DD.."],
  ["..DD.....DD...", "..DD.....DD..."],
];

// Espelha um desenho (para olhar para a esquerda)
function mirror(rows) {
  return rows.map((row) => row.split("").reverse().join(""));
}

function getSprite(direction, frame) {
  const dir = direction === "left" ? "right" : direction;
  const rows = body[dir].concat(legs[dir][frame]);
  return direction === "left" ? mirror(rows) : rows;
}

// Serve para qualquer bichinho: monta corpo + patas e espelha se precisar
function getPetSprite(pet) {
  const frame = pet.walkTimer === 0 ? 0 : Math.floor(pet.walkTimer / 8) % 2;
  const rows = pet.body.concat(pet.legs[frame]);
  return pet.facing === "left" ? mirror(rows) : rows;
}

// Desenha um sprite. "scale" aumenta o desenho: com 2, cada pixel vira um quadradinho 2x2.
function drawSprite(sprite, x, y, scale = 1) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      const letter = sprite[row][col];
      if (letter === ".") continue;
      ctx.fillStyle = palette[letter];
      ctx.fillRect(Math.round(x) + col * scale, Math.round(y) + row * scale, scale, scale);
    }
  }
}

// ---------- 11. OS PERSONAGENS ----------
// As posições são coordenadas do MAPA (que mede 640x480), não da tela.
const player = {
  x: 8 * TILE,   // coluna 8
  y: 23 * TILE,  // linha 23 (perto da calçada)
  speed: 1,
  direction: "down",
  walkTimer: 0,
};

const cat = {
  x: 7 * TILE, y: 23.5 * TILE,
  speed: 0.8, stopDistance: 20,
  facing: "right", walkTimer: 0,
  body: catBody, legs: catLegs,
};

const dog = {
  x: 6 * TILE, y: 24.5 * TILE,
  speed: 0.9, stopDistance: 36,
  facing: "right", walkTimer: 0,
  body: dogBody, legs: dogLegs,
};

const pets = [cat, dog];

// ---------- 12. A CÂMERA ----------
const camera = { x: 0, y: 0 };

function updateCamera() {
  // Centraliza a câmera na Caroline (+8 = metade do tamanho dela)...
  camera.x = Math.round(player.x + 8 - canvas.width / 2);
  camera.y = Math.round(player.y + 8 - canvas.height / 2);
  // ...mas nunca mostra nada fora do mapa
  camera.x = Math.max(0, Math.min(MAP_WIDTH - canvas.width, camera.x));
  camera.y = Math.max(0, Math.min(MAP_HEIGHT - canvas.height, camera.y));
}

// ---------- 13. COLISÃO ----------
// Esse ponto (px, py) está dentro de um tile bloqueado?
function isSolid(px, py) {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return true; // fora do mapa
  if (signs.some((s) => !s.hidden && s.col === col && s.row === row)) return true; // placas bloqueiam
  if (chests.some((c) => c.col === col && c.row === row)) return true;             // baús bloqueiam
  if (pads.some((p) => p.col === col && p.row === row)) return true;               // a plataforma bloqueia
  if (cake.spawned && !cake.taken && cake.col === col && cake.row === row) return true; // o bolo bloqueia
  return solid[map[row][col]] === true;
}

// A Caroline pode ficar em (x, y)? Testamos só os PÉS dela (uma caixinha de 8x4 pixels),
// assim a cabeça pode passar "na frente" dos prédios, como no Zelda.
function canMoveTo(x, y) {
  const left = x + 4;
  const right = x + 11;
  const top = y + 12;
  const bottom = y + 15;
  return !(
    isSolid(left, top) ||
    isSolid(right, top) ||
    isSolid(left, bottom) ||
    isSolid(right, bottom)
  );
}

// ---------- 14. O TECLADO ----------
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key.startsWith("Arrow") || e.key === " ") e.preventDefault();
  if (e.repeat) return; // ignora quando a tecla fica apertada (só conta o toque)
  if (e.key === "Enter") advanceScreen(); // Enter também passa de tela (no jogo, não faz nada)
  if (e.key === " ") handleAction();
  if (e.key === "x" || e.key === "X") startBook();
  if (e.key === "l" || e.key === "L") toggleLanguage();
  if (e.key === "m" || e.key === "M") openMail();
  if (e.key === "n" || e.key === "N") toggleMusic();  // N = liga/desliga a música
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// ---------- 14B. OS CONTROLES DE TOQUE (celular) ----------
// A ideia é simples: os botões da tela fazem exatamente o que o teclado faz.
// As setas preenchem o mesmo "keys" de antes, e os outros botões chamam as mesmas funções.

// Botões com "data-hold" (as setas) são como uma tecla SEGURADA.
document.querySelectorAll("[data-hold]").forEach((button) => {
  const key = button.dataset.hold; // por exemplo "ArrowUp"

  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId); // continua recebendo o toque mesmo se o dedo escorregar
    keys[key] = true;                      // "a tecla está apertada"
    button.classList.add("pressed");       // acende o botão (veja o style.css)
  });

  const release = (e) => {
    e.preventDefault();
    keys[key] = false;                     // "a tecla foi solta"
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
});

// Botões com "data-tap" são como uma tecla apertada UMA vez.
// Cada nome do HTML aponta para uma função que já existe no jogo.
const tapActions = {
  action: handleAction,    // botão A (o mesmo que Espaço)
  book: startBook,         // botão B (o mesmo que X)
  language: toggleLanguage, // botão EN/PT (o mesmo que L)
  mail: openMail,          // botão @ (o mesmo que M)
  music: toggleMusic,      // botão ♪ (o mesmo que N)
};

document.querySelectorAll("[data-tap]").forEach((button) => {
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    button.classList.add("pressed");
    tapActions[button.dataset.tap](); // chama a função do botão
  });
  const release = () => button.classList.remove("pressed");
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

// Segurar o dedo num botão não deve abrir o menu do navegador
document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("contextmenu", (e) => e.preventDefault());
});

// Fora do jogo, tocar (ou clicar) na tela também passa para a próxima
canvas.addEventListener("pointerdown", () => advanceScreen());

// ---------- 15. ATUALIZAR ----------
function updatePlayer() {
  // Parada enquanto lê, usa o livro ou durante o final
  if (dialogue.open || book.active || ending.active) { player.walkTimer = 0; return; }

  let dx = 0;
  let dy = 0;

  if (keys["ArrowUp"])    { dy = -player.speed; player.direction = "up"; }
  if (keys["ArrowDown"])  { dy = player.speed;  player.direction = "down"; }
  if (keys["ArrowLeft"])  { dx = -player.speed; player.direction = "left"; }
  if (keys["ArrowRight"]) { dx = player.speed;  player.direction = "right"; }

  // Movemos um eixo de cada vez: se bater num prédio na horizontal,
  // ela ainda consegue deslizar na vertical (e vice-versa).
  if (dx !== 0 && canMoveTo(player.x + dx, player.y)) player.x += dx;
  if (dy !== 0 && canMoveTo(player.x, player.y + dy)) player.y += dy;

  const moving = dx !== 0 || dy !== 0;
  player.walkTimer = moving ? player.walkTimer + 1 : 0;
}

// Uma única função faz TODOS os bichinhos seguirem a Caroline
function updatePet(pet) {
  const dx = player.x - pet.x;
  const dy = player.y - pet.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > pet.stopDistance) {
    pet.x += (dx / distance) * pet.speed;
    pet.y += (dy / distance) * pet.speed;
    if (Math.abs(dx) > 1) pet.facing = dx > 0 ? "right" : "left";
    pet.walkTimer++;
  } else {
    pet.walkTimer = 0;
  }
}

// ---------- 16. DESENHAR ----------
function draw() {
  ctx.save();                                  // guarda o estado do "pincel"
  ctx.translate(-camera.x, -camera.y);         // desloca TUDO que for desenhado a seguir

  drawMap();
  neons.forEach(drawNeon);                     // os letreiros ficam por cima dos prédios
  drawRays();                                  // no final, os raios dourados ficam atrás de todos

  const walkCycle = [1, 0, 2, 0];
  const playerFrame = player.walkTimer === 0
    ? 0
    : walkCycle[Math.floor(player.walkTimer / 8) % 4];

  const drawables = [
    {
      feet: player.y + 16,
      draw: () => {
        drawSprite(getSprite(player.direction, playerFrame), player.x, player.y);
        drawBook(); // o livro acompanha a Caroline
      },
    },
  ];
  signs.filter((sign) => !sign.hidden).forEach((sign) => {
    drawables.push({ feet: (sign.row + 1) * TILE, draw: () => drawSign(sign) });
  });
  chests.forEach((chest) => {
    drawables.push({ feet: (chest.row + 1) * TILE, draw: () => drawChest(chest) });
  });
  pads.forEach((pad) => {
    drawables.push({ feet: (pad.row + 1) * TILE, draw: () => drawFireworkPad(pad) });
  });
  if (cake.spawned && !cake.taken) {
    drawables.push({ feet: (cake.row + 1) * TILE, draw: () => drawCake(cake) });
  }
  pets.forEach((pet, i) => {
    // No final, o gato e o cachorro pulam de alegria (cada um em um ritmo)
    const hop = ending.active ? Math.round(-Math.abs(Math.sin((frameCount + i * 12) / 6)) * 4) : 0;
    drawables.push({
      feet: pet.y + 9,
      draw: () => drawSprite(getPetSprite(pet), pet.x, pet.y + hop),
    });
  });

  // Quem está mais "embaixo" na tela é desenhado por último (fica na frente)
  drawables.sort((a, b) => a.feet - b.feet);
  drawables.forEach((item) => item.draw());

  drawLiftedCake();                            // o bolo erguido, por cima da cabeça dela
  drawRockets();                               // os foguetes subindo
  drawParticles();                             // faíscas, folhinhas e brilhos
  drawPopups();                                // os itens que sobem dos baús, por cima de tudo

  ctx.restore();                               // volta ao normal
  drawNight();                                 // a escuridão cobre o mundo, mas não o texto
  if (!ending.active) drawHud();               // contador de corações e gemas
  drawDialogue();                              // por cima de tudo, sem câmera
  drawToast();                                 // o aviso "achaste tudo"
  drawCakeArrow();                             // a seta que aponta para o bolo
  drawEndingOverlay();                         // clarão, texto e THE END
  drawHint();
}

// ---------- 17. AS TELAS DE ENTRADA, "COMO JOGAR" E CRÉDITOS ----------
// Tudo aqui usa as coordenadas da TELA (320 x 240), sem câmera.

// O céu: 8 faixas de 24 pixels, do azul-noite lá em cima ao rosa no horizonte
const TITLE_SKY = ["#12103a", "#1a1650", "#2a2163", "#3b2a7a", "#55368f", "#7d3f9e", "#b04aa0", "#e0589c"];

// Estrelas [x, y]: cada uma pisca em um momento diferente
const TITLE_STARS = [
  [18, 14], [52, 30], [92, 10], [134, 22], [172, 8], [214, 26], [250, 12],
  [292, 30], [306, 10], [34, 62], [268, 60], [12, 84], [300, 88], [120, 6],
];

// Nuvens que passam devagar atrás da cidade (speed = pixels por frame)
const TITLE_CLOUDS = [
  { x: 10,  y: 98,  w: 64, speed: 0.10 },
  { x: 150, y: 114, w: 88, speed: 0.06 },
  { x: 250, y: 90,  w: 52, speed: 0.12 },
  { x: 70,  y: 136, w: 72, speed: 0.08 },
];

// Prédios [x, largura, altura]. Os do fundo são mais escuros e mais baixos.
const SKYLINE_FAR = [
  [0, 30, 50], [30, 24, 70], [54, 34, 44], [88, 26, 80], [114, 30, 56], [144, 24, 90],
  [168, 34, 60], [202, 28, 76], [230, 26, 48], [256, 30, 84], [286, 34, 58],
];
// Os da frente ficam só nos lados, para deixar o meio livre para os personagens
const SKYLINE_NEAR = [
  [-4, 44, 72], [44, 36, 52], [226, 40, 66], [266, 60, 86],
];
const TITLE_STREET_Y = 192; // onde a calçada começa

// Os letreiros da entrada (os mesmos do jogo: BAR, OPEN que pisca, DRINKS)
const titleNeons = [
  { text: "BAR",    x: 48,  y: 150, color: "#4fd8e8", glow: "79,216,232",  flicker: false },
  { text: "OPEN",   vertical: true, x: 232, y: 132, color: "#ff6ec7", glow: "255,110,199", flicker: true },
  { text: "DRINKS", x: 280, y: 168, color: "#ffd86b", glow: "255,216,107", flicker: false },
];
titleNeons.forEach((n) => {
  const len = n.text.length;
  n.w = n.vertical ? 7 : len * 4 - 1 + 4;
  n.h = n.vertical ? len * 6 - 1 + 4 : 9;
});

// Uma fonte de letras GRANDES para o logo e para o "THE END". Cada letra é uma lista de 5 linhas
// e pode ter larguras diferentes (o M e o N são mais largos).
const bigFont = {
  C: ["###", "#..", "#..", "#..", "###"],
  A: ["###", "#.#", "###", "#.#", "#.#"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  O: ["###", "#.#", "#.#", "#.#", "###"],
  L: ["#..", "#..", "#..", "#..", "###"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  E: ["###", "#..", "###", "#..", "###"],
  S: [".##", "#..", "###", "..#", "##."],
  P: ["###", "#.#", "###", "#..", "#.."],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  M: ["#...#", "##.##", "#.#.#", "#...#", "#...#"],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  "'": ["#", "#", ".", ".", "."],
  " ": ["..", "..", "..", "..", ".."],
};

// Largura de um texto, contando em "pixels grandes" (cada letra mais 1 de espaço)
function bigTextWidth(text) {
  let width = 0;
  for (const ch of text) width += bigFont[ch][0].length + 1;
  return width - 1;
}

// Pinta o texto inteiro UMA vez, com um deslocamento (dx, dy) e uma cor.
// part = "top" pinta só as 2 linhas de cima (para o brilho no topo da letra).
function drawBigLayer(text, startX, y, scale, dx, dy, color, part) {
  ctx.fillStyle = color;
  let x = startX;
  for (const ch of text) {
    const glyph = bigFont[ch];
    for (let r = 0; r < glyph.length; r++) {
      if (part === "top" && r > 1) continue;
      for (let c = 0; c < glyph[r].length; c++) {
        if (glyph[r][c] === "#") {
          ctx.fillRect(x + c * scale + dx, y + r * scale + dy, scale, scale);
        }
      }
    }
    x += (glyph[0].length + 1) * scale;
  }
}

// O logo: sombra colorida, contorno escuro (8 cópias em volta), preenchimento e brilho
function drawBigText(text, cx, y, scale, colors) {
  const startX = Math.round(cx - (bigTextWidth(text) * scale) / 2);
  drawBigLayer(text, startX, y, scale, 0, scale + 1, colors.shadow, "all"); // sombra para baixo
  for (const dx of [-2, 0, 2]) {
    for (const dy of [-2, 0, 2]) {
      if (dx !== 0 || dy !== 0) drawBigLayer(text, startX, y, scale, dx, dy, "#14123a", "all"); // contorno
    }
  }
  drawBigLayer(text, startX, y, scale, 0, 0, colors.fill, "all");
  drawBigLayer(text, startX, y, scale, 0, 0, colors.light, "top");
}

// Texto pequeno com contorno, para ficar legível sobre qualquer fundo
function drawOutlinedText(text, x, y, fill, outline, font) {
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.fillStyle = outline;
  for (const dx of [-1, 0, 1]) {
    for (const dy of [-1, 0, 1]) {
      if (dx !== 0 || dy !== 0) ctx.fillText(text, x + dx, y + dy);
    }
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left"; // volta ao normal
}

// Uma nuvem feita de retângulos empilhados. "main" = cor principal, "shade" = sombra de baixo.
function drawCloud(x, y, w, main, shade) {
  x = Math.round(x);
  y = Math.round(y);
  const h = Math.round(w * 0.32);
  ctx.fillStyle = main;
  ctx.fillRect(x + Math.round(w * 0.18), y, Math.round(w * 0.34), 3);      // morrinho de cima
  ctx.fillRect(x + Math.round(w * 0.5), y + 2, Math.round(w * 0.26), 3);   // segundo morrinho
  ctx.fillRect(x + 4, y + 3, w - 8, 3);
  ctx.fillRect(x, y + 6, w, h - 6);
  ctx.fillStyle = shade;
  ctx.fillRect(x + 3, y + h - 3, w - 6, 3);
}

// Uma estrelinha de 4 pontas que aparece e some (usada em volta do logo)
function drawSparkle(x, y, offset) {
  const phase = (frameCount + offset) % 100;
  if (phase > 40) return;                 // só aparece em parte do tempo
  const size = phase < 20 ? 2 : 1;        // cresce e depois encolhe
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, 2, 2);
  for (let i = 1; i <= size; i++) {
    ctx.fillRect(x - i * 2, y, 2, 2);
    ctx.fillRect(x + i * 2, y, 2, 2);
    ctx.fillRect(x, y - i * 2, 2, 2);
    ctx.fillRect(x, y + i * 2, 2, 2);
  }
}

// O céu da noite, as estrelas e as nuvens (as telas usam o mesmo fundo)
function drawNightSky() {
  // 1) O céu em faixas, com pontinhos de mistura na emenda de cada faixa
  TITLE_SKY.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * 24, canvas.width, 24);
    if (i > 0) {
      ctx.fillStyle = TITLE_SKY[i - 1];
      for (let x = 0; x < canvas.width; x += 4) {
        ctx.fillRect(x, i * 24, 2, 2);
        ctx.fillRect(x + 2, i * 24 + 2, 2, 2);
      }
    }
  });

  // 2) As estrelas, que piscam
  TITLE_STARS.forEach(([sx, sy], i) => {
    const phase = (frameCount + i * 17) % 90;
    ctx.fillStyle = "#fff1f8";
    ctx.fillRect(sx, sy, 2, 2);
    if (phase >= 60 && phase < 75) {       // por um instante, a estrela vira uma cruzinha
      ctx.fillRect(sx - 2, sy, 2, 2);
      ctx.fillRect(sx + 2, sy, 2, 2);
      ctx.fillRect(sx, sy - 2, 2, 2);
      ctx.fillRect(sx, sy + 2, 2, 2);
    }
  });

  // 3) As nuvens, que andam devagar e dão a volta (o "%" faz voltar ao começo)
  TITLE_CLOUDS.forEach((c) => {
    const x = ((c.x + frameCount * c.speed) % 400) - 80;
    drawCloud(x, c.y, c.w, "#473a8c", "#33296b");
  });
}

function drawSkyline() {
  // Prédios do fundo: escuros, com poucas janelinhas acesas
  SKYLINE_FAR.forEach(([x, w, h], i) => {
    const top = TITLE_STREET_Y - h;
    ctx.fillStyle = "#241f5c";
    ctx.fillRect(x, top, w, h);
    ctx.fillStyle = "#33296b";             // topo um pouco mais claro
    ctx.fillRect(x, top, w, 2);
    for (let wy = top + 6; wy < TITLE_STREET_Y - 6; wy += 8) {
      for (let wx = x + 4; wx < x + w - 4; wx += 7) {
        if ((wx * 3 + wy * 7 + i) % 5 === 0) {   // só algumas janelas acendem
          ctx.fillStyle = (wx + wy) % 2 === 0 ? "#ff7ee8" : "#4fd8e8";
          ctx.fillRect(wx, wy, 2, 3);
        }
      }
    }
  });

  // Prédios da frente: as mesmas cores dos prédios do jogo
  const windowColors = ["#ff7ee8", "#4fd8e8", "#2a2860", "#ff7ee8", "#2a2860", "#4fd8e8", "#2a2860"];
  SKYLINE_NEAR.forEach(([x, w, h], i) => {
    const top = TITLE_STREET_Y - h;
    ctx.fillStyle = "#35307a";             // parede
    ctx.fillRect(x, top, w, h);
    ctx.fillStyle = "#2a2663";             // sombra na lateral
    ctx.fillRect(x, top, 1, h);
    ctx.fillStyle = "#5b4fb8";             // telhado
    ctx.fillRect(x, top, w, 4);
    ctx.fillStyle = "#8f7de8";             // brilho no topo
    ctx.fillRect(x, top, w, 1);
    for (let wy = top + 10, j = 0; wy < TITLE_STREET_Y - 10; wy += 10, j++) {
      for (let wx = x + 5, k = 0; wx < x + w - 8; wx += 9, k++) {
        ctx.fillStyle = windowColors[(k * 3 + j * 5 + i * 2) % 7];
        ctx.fillRect(wx, wy, 5, 5);
      }
    }
    ctx.fillStyle = "#1f1b4d";             // base escura
    ctx.fillRect(x, TITLE_STREET_Y - 5, w, 5);
    ctx.fillStyle = "#ff4fc3";             // faixa de neon
    ctx.fillRect(x + 4, TITLE_STREET_Y - 6, w - 8, 1);
  });
}

// A calçada (a mesma do jogo) e a rua, com a máquina de bebidas e o poste de luz
function drawStreet() {
  for (let col = 0; col < 20; col++) {
    drawPath(col * TILE, 192, col, 12);
    drawPavement(col * TILE, 208, col, 13);
    drawPavement(col * TILE, 224, col, 14);
  }
  drawVending(1 * TILE, 192, 1, 12);
  drawLamp(18 * TILE, 192, 18, 12);
}

// Brilho colorido das luzes da entrada. "lighter" SOMA as cores, como luz de verdade.
function drawTitleGlow() {
  ctx.globalCompositeOperation = "lighter";
  const glows = [
    { x: 24,  y: 200, r: 34, glow: "255,154,214" },   // máquina de bebidas
    { x: 300, y: 196, r: 46, glow: "79,216,232" },    // poste de luz
    { x: 160, y: 196, r: 70, glow: "255,110,199" },   // luz rosa atrás da Caroline
  ];
  titleNeons.forEach((n) => {
    if (neonOn(n)) glows.push({ x: n.x + n.w / 2, y: n.y + n.h / 2, r: 26, glow: n.glow });
  });
  glows.forEach((g) => {
    [1, 0.7, 0.4].forEach((k) => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r * k, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${g.glow}, 0.07)`;
      ctx.fill();
    });
  });
  ctx.globalCompositeOperation = "source-over"; // volta ao normal
}

function drawTitle() {
  // 1) O fundo: céu, estrelas e nuvens, e depois a cidade
  drawNightSky();
  drawSkyline();
  titleNeons.forEach(drawNeon);
  drawStreet();

  // 2) Os personagens, em tamanho dobrado (scale = 2), parados e respirando
  const hop = Math.floor(frameCount / 30) % 2;               // sobe e desce 1 pixel
  const catSprite = catBody.concat(catLegs[0]);
  const dogSprite = mirror(dogBody.concat(dogLegs[0]));      // espelhado: o cachorro olha para a Caroline
  ctx.fillStyle = "rgba(10, 10, 36, 0.45)";                  // sombrinhas no chão
  ctx.fillRect(146, 206, 28, 3);
  ctx.fillRect(106, 206, 24, 2);
  ctx.fillRect(190, 206, 28, 2);
  drawSprite(catSprite, 104, 188 - (1 - hop), 2);
  drawSprite(getSprite("down", 0), 144, 174 - hop, 2);
  drawSprite(dogSprite, 188, 188 - hop, 2);

  // 3) O brilho das luzes
  drawTitleGlow();

  // 4) O logo, que flutua de leve, e as estrelinhas em volta
  const bob = Math.round(Math.sin(frameCount / 25) * 2);
  drawBigText("CAROLINE'S", 160, 28 + bob, 4,
    { fill: "#ff6ec7", light: "#ffc2e6", shadow: "#4fd8e8" });
  drawBigText("PIXEL RESUME", 160, 56 + bob, 4,
    { fill: "#4fd8e8", light: "#c9f7ff", shadow: "#ff6ec7" });
  drawSparkle(30, 40, 0);
  drawSparkle(286, 62, 30);
  drawSparkle(44, 78, 55);
  drawSparkle(274, 28, 80);

  // 5) Os textos: subtítulo, "aperte para começar" (piscando) e a dica do idioma
  const subtitle = language === "en" ? "an interactive resume" : "um currículo interativo";
  drawOutlinedText(subtitle, 160, 96, "#ffe3f1", "#14123a", "8px monospace");

  const startText = isTouch
    ? (language === "en" ? "TAP TO START" : "TOQUE PARA COMEÇAR")
    : (language === "en" ? "PRESS SPACE TO START" : "APERTE ESPAÇO PARA COMEÇAR");
  if (Math.floor(frameCount / 30) % 2 === 0) {
    drawOutlinedText(startText, 160, 224, "#fff1b0", "#14123a", "bold 8px monospace");
  }
  drawOutlinedText(isTouch ? "EN/PT: language" : "L: EN / PT", 160, 236, "#c9f7ff", "#14123a", "7px monospace");
}

// --- Os pequenos ícones da tela "Como jogar" ---

// Uma tecla desenhada: caixinha com a letra dentro. Devolve a largura, para quem quiser desenhar algo ao lado.
function drawKeyCap(label, x, cy) {
  ctx.font = "7px monospace";
  const w = Math.ceil(ctx.measureText(label).width) + 8; // a tecla se ajusta ao tamanho do texto
  const y = cy - 6;
  ctx.fillStyle = "#2d2a5c";
  ctx.fillRect(x, y, w, 12);
  ctx.strokeStyle = "#ff6ec7";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 11);
  ctx.fillStyle = "#ffd86b";
  ctx.fillText(label, x + 4, y + 9);
  return w;
}

// As 4 setas do teclado, no formato de cruz. Cada seta é uma caixinha de 9x9 com um triângulo.
function drawArrowKeys(ax, cy) {
  const top = cy - 9;
  const keysPos = [
    { dir: "up",    x: ax + 10, y: top },
    { dir: "left",  x: ax,      y: top + 10 },
    { dir: "down",  x: ax + 10, y: top + 10 },
    { dir: "right", x: ax + 20, y: top + 10 },
  ];
  keysPos.forEach((k) => {
    ctx.fillStyle = "#2d2a5c";
    ctx.fillRect(k.x, k.y, 9, 9);
    ctx.strokeStyle = "#ff6ec7";
    ctx.lineWidth = 1;
    ctx.strokeRect(k.x + 0.5, k.y + 0.5, 8, 8);
    ctx.fillStyle = "#ffd86b";             // o triângulo: 3 linhas de largura 1, 3 e 5
    if (k.dir === "up") {
      ctx.fillRect(k.x + 4, k.y + 3, 1, 1);
      ctx.fillRect(k.x + 3, k.y + 4, 3, 1);
      ctx.fillRect(k.x + 2, k.y + 5, 5, 1);
    } else if (k.dir === "down") {
      ctx.fillRect(k.x + 2, k.y + 3, 5, 1);
      ctx.fillRect(k.x + 3, k.y + 4, 3, 1);
      ctx.fillRect(k.x + 4, k.y + 5, 1, 1);
    } else if (k.dir === "left") {
      ctx.fillRect(k.x + 3, k.y + 4, 1, 1);
      ctx.fillRect(k.x + 4, k.y + 3, 1, 3);
      ctx.fillRect(k.x + 5, k.y + 2, 1, 5);
    } else {
      ctx.fillRect(k.x + 3, k.y + 2, 1, 5);
      ctx.fillRect(k.x + 4, k.y + 3, 1, 3);
      ctx.fillRect(k.x + 5, k.y + 4, 1, 1);
    }
  });
}

// O livro mágico fechado (o mesmo desenho do jogo)
function drawBookIcon(x, cy) {
  ctx.fillStyle = "#3b2f8a";
  ctx.fillRect(x, cy - 5, 8, 10);
  ctx.fillStyle = "#ff6ec7";               // lombada neon
  ctx.fillRect(x, cy - 5, 1, 10);
  ctx.fillStyle = "#ffd86b";               // fecho dourado
  ctx.fillRect(x + 5, cy - 1, 1, 2);
}

// Uma explosão de fogos de artifício em miniatura
function drawBurstIcon(cx, cy) {
  const dots = [[-6, 0], [6, 0], [0, -6], [0, 6], [-4, -4], [4, -4], [-4, 4], [4, 4]];
  const colors = ["#ff6ec7", "#4fd8e8", "#ffd86b"];
  dots.forEach(([dx, dy], i) => {
    ctx.fillStyle = colors[i % 3];
    ctx.fillRect(cx + dx - 1, cy + dy - 1, 2, 2);
  });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 1, cy - 1, 2, 2);
}

// A tela "Como jogar": um painel com 7 linhas, cada uma com um ícone e uma explicação curta
function drawHowTo() {
  // 1) O mesmo fundo da entrada, mais escuro, para o painel se destacar
  drawNightSky();
  drawSkyline();
  drawStreet();
  ctx.fillStyle = "rgba(10, 8, 40, 0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2) O painel
  ctx.fillStyle = "rgba(15, 15, 46, 0.92)";
  ctx.fillRect(8, 6, 304, 228);
  ctx.strokeStyle = "#ff6ec7";
  ctx.lineWidth = 1;
  ctx.strokeRect(8.5, 6.5, 303, 227);

  // 3) O título e uma linha embaixo
  drawOutlinedText(language === "en" ? "HOW TO PLAY" : "COMO JOGAR", 160, 24, "#4fd8e8", "#14123a", "bold 10px monospace");
  ctx.fillStyle = "#ff6ec7";
  ctx.fillRect(60, 30, 200, 1);

  // 4) As linhas: no computador aparecem as teclas, no celular os botões
  const rows = [
    { icon: "arrows",
      en: "Walk around the neon city",
      pt: "Anda pela cidade de neon" },
    { icon: "key", key: isTouch ? "A" : "SPACE",
      en: "Read signs and open chests",
      pt: "Lê as placas e abre os baús" },
    { icon: "book", key: isTouch ? "B" : "X",
      en: "Magic book: break crates to find hidden signs",
      pt: "Livro mágico: quebra caixotes e acha placas escondidas" },
    { icon: "heart",
      en: `Hearts (${TOTAL_HEARTS}): jobs and studies`,
      pt: `Corações (${TOTAL_HEARTS}): empregos e estudos` },
    { icon: "gem",
      en: `Gems (${TOTAL_GEMS}): skills`,
      pt: `Gemas (${TOTAL_GEMS}): habilidades` },
    { icon: "key", key: isTouch ? "EN/PT" : "L",
      en: "Switch between English and Portuguese",
      pt: "Troca entre inglês e português" },
    { icon: "fireworks",
      en: "Fireworks at the end of the street: contact me!",
      pt: "Fogos no fim da rua: fala comigo!" },
  ];

  rows.forEach((row, i) => {
    const top = 36 + i * 24;   // cada linha ocupa 24 pixels de altura
    const cy = top + 12;       // o meio da linha

    // O ícone, na coluna da esquerda
    if (row.icon === "arrows") drawArrowKeys(20, cy);
    else if (row.icon === "key") drawKeyCap(row.key, 20, cy);
    else if (row.icon === "book") {
      const w = drawKeyCap(row.key, 20, cy);
      drawBookIcon(20 + w + 5, cy);
    }
    else if (row.icon === "heart") drawSprite(heartSprite, 24, cy - 6, 2);
    else if (row.icon === "gem") drawSprite(gemSprite, 24, cy - 6, 2);
    else if (row.icon === "fireworks") drawBurstIcon(34, cy);

    // O texto, na coluna da direita (row[language] pega "en" ou "pt")
    const lines = wrapText(row[language], 210);
    ctx.font = "8px monospace";
    ctx.fillStyle = "#e8e6ff";
    const firstBaseline = lines.length === 1 ? top + 15 : top + 10; // 1 linha fica no meio, 2 linhas se dividem
    lines.forEach((line, k) => ctx.fillText(line, 84, firstBaseline + k * 10));
  });

  // 5) "Aperte para continuar", piscando
  const continueText = isTouch
    ? (language === "en" ? "TAP TO CONTINUE" : "TOQUE PARA CONTINUAR")
    : (language === "en" ? "PRESS SPACE TO CONTINUE" : "APERTE ESPAÇO PARA CONTINUAR");
  if (Math.floor(frameCount / 30) % 2 === 0) {
    drawOutlinedText(continueText, 160, 226, "#fff1b0", "#14123a", "bold 8px monospace");
  }
}

// --- Os créditos ---
// Cada item da lista tem um tipo e uma altura (h) em pixels. Para mudar um texto, é só editar aqui.
const CREDITS = [
  { type: "big", h: 56 },
  { type: "title", text: { en: "Thank you for playing!", pt: "Obrigada por jogares!" }, h: 26 },
  { type: "space", h: 24 },
  { type: "role", label: { en: "STARRING", pt: "COM" }, name: "Caroline", h: 30 },
  { type: "role", label: { en: "SIDEKICK", pt: "COMPANHEIRO" }, name: { en: "The Cat", pt: "O Gato" }, h: 30 },
  { type: "role", label: { en: "SIDEKICK", pt: "COMPANHEIRO" }, name: { en: "The Dog", pt: "O Cachorro" }, h: 30 },
  { type: "role", label: { en: "SPECIAL GUEST", pt: "CONVIDADO ESPECIAL" }, name: { en: "The Birthday Cake", pt: "O Bolo de Aniversário" }, h: 30 },
  { type: "role", label: { en: "HEARTS", pt: "CORAÇÕES" }, name: `${TOTAL_HEARTS}/${TOTAL_HEARTS}`, h: 30 },
  { type: "role", label: { en: "GEMS", pt: "GEMAS" }, name: `${TOTAL_GEMS}/${TOTAL_GEMS}`, h: 30 },
  { type: "role", label: { en: "BUILT WITH", pt: "FEITO COM" }, name: "HTML, CSS, JavaScript", h: 30 },
  { type: "space", h: 24 },
  { type: "title", text: { en: "Want to work together?", pt: "Queres trabalhar comigo?" }, h: 26 },
  { type: "email", h: 28 },
  { type: "final", h: 24 },
];

let creditsScroll = 0; // quantos pixels os créditos já subiram
let creditsHold = 0;   // há quantos frames os créditos pararam no final

function creditsMaxScroll() {
  const total = CREDITS.reduce((sum, entry) => sum + entry.h, 0);
  return total + 8; // quando chega aqui, o último item está encostado no fundo da tela
}

// Se for um texto simples, devolve ele; se for { en, pt }, devolve o do idioma atual
function creditsText(value) {
  return typeof value === "string" ? value : value[language];
}

function drawCreditsEntry(entry, y) {
  if (entry.type === "big") {
    drawBigText("THE END", 160, y + 14, 4, { fill: "#ffd86b", light: "#fff1b0", shadow: "#ff6ec7" });
  } else if (entry.type === "title") {
    drawOutlinedText(creditsText(entry.text), 160, y + 16, "#ffd86b", "#14123a", "bold 9px monospace");
  } else if (entry.type === "role") {
    drawOutlinedText(creditsText(entry.label), 160, y + 10, "#4fd8e8", "#14123a", "7px monospace");
    drawOutlinedText(creditsText(entry.name), 160, y + 22, "#ffffff", "#14123a", "bold 8px monospace");
  } else if (entry.type === "email") {
    drawOutlinedText(CONTACT_EMAIL, 160, y + 12, "#fff1b0", "#14123a", "bold 8px monospace");
    drawOutlinedText(isTouch ? "@: e-mail" : "M: e-mail", 160, y + 23, "#c9f7ff", "#14123a", "7px monospace");
  } else if (entry.type === "final") {
    if (creditsHold > 0 && Math.floor(frameCount / 30) % 2 === 0) {  // só aparece quando os créditos pararam
      const text = isTouch
        ? (language === "en" ? "TAP: play again" : "TOQUE: jogar de novo")
        : (language === "en" ? "SPACE: play again" : "ESPAÇO: jogar de novo");
      drawOutlinedText(text, 160, y + 16, "#fff1b0", "#14123a", "bold 8px monospace");
    }
  }
}

function drawCredits() {
  // O mesmo fundo da entrada, escurecido
  drawNightSky();
  drawSkyline();
  drawStreet();
  ctx.fillStyle = "rgba(10, 8, 40, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Os créditos sobem 0,5 pixel por frame e param no final
  const maxScroll = creditsMaxScroll();
  creditsScroll = Math.min(maxScroll, creditsScroll + 0.5);
  creditsHold = creditsScroll >= maxScroll ? creditsHold + 1 : 0;

  // Começam logo abaixo da tela (y = 240) e vão subindo
  let y = canvas.height - creditsScroll;
  CREDITS.forEach((entry) => {
    if (y + entry.h > 0 && y < canvas.height) drawCreditsEntry(entry, y); // só desenha o que aparece
    y += entry.h;
  });
}

// Espaço nos créditos: primeiro pula para o fim; depois de um tempinho, joga de novo
function creditsAdvance() {
  const maxScroll = creditsMaxScroll();
  if (creditsScroll < maxScroll) {
    creditsScroll = maxScroll;
  } else if (creditsHold > 60) {
    window.location.reload(); // recarrega a página: volta para a entrada, com tudo do começo
  }
}

// --- Trocar de tela ---

// Começa a trocar para outra tela: a tela escurece e, no fim, a troca acontece (veja drawTransition)
function changeScreen(next) {
  if (transition.timer > 0) return; // já está trocando
  transition.timer = 1;
  transition.to = next;
}

// Passa da entrada para o "Como jogar" e dele para o jogo (e nos créditos, avança os créditos)
function advanceScreen() {
  if (screen === "title") changeScreen("howto");
  else if (screen === "howto" && screenTime > 45) changeScreen("game"); // espera um pouco, para dar tempo de ler
  else if (screen === "credits") creditsAdvance();
}

// A cortina preta entre as telas: escurece (transition) e depois clareia (fadeIn)
function drawTransition() {
  if (transition.timer > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, transition.timer / 24)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    transition.timer++;
    if (transition.timer > 24) {     // já escureceu por completo: troca de tela
      screen = transition.to;
      transition.timer = 0;
      screenTime = 0;
      fadeIn = 24;
      if (screen === "credits") { creditsScroll = 0; creditsHold = 0; } // os créditos sempre começam do topo
    }
  } else if (fadeIn > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeIn / 24})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    fadeIn--;
  }
}

// O aviso pequenininho no canto: ♪ ON / ♪ OFF
function drawMusicToast() {
  if (musicToast <= 0) return;
  musicToast--;
  ctx.globalAlpha = Math.min(1, musicToast / 20);
  ctx.fillStyle = "rgba(15, 15, 46, 0.85)";
  ctx.fillRect(canvas.width - 54, 6, 48, 14);
  ctx.fillStyle = "#ffd86b";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(toastText, canvas.width - 30, 16);
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}

// ---------- 18. O LOOP DO JOGO ----------
function loop() {
  frameCount++;
  screenTime++;

  if (screen === "title") {
    drawTitle();
  } else if (screen === "howto") {
    drawHowTo();
  } else if (screen === "credits") {
    drawCredits();
  } else {
    updatePlayer();
    updateBook();
    pets.forEach(updatePet);
    updateFireworks();
    updateParticles();
    updatePopups();
    updateCake();     // confere se o jogador achou tudo e faz o bolo aparecer
    updateEnding();   // anda a sequência do final, se ela estiver acontecendo
    updateCamera();
    draw();
  }

  updateMusic();    // ajusta o volume da música (fade)
  drawMusicToast(); // o aviso "♪ ON / ♪ OFF", se estiver ativo

  drawTransition(); // por cima de qualquer tela: a cortina preta, se estiver trocando

  requestAnimationFrame(loop);
}
loop();
