// Tab switching with a colour-sheet transition.
// Each tab is a <section class="panel"> in index.html; the URL hash
// (#home, #personal, #projects, #resume) decides which one is visible,
// so refreshing the page or using the browser's back button works.

const panels = [...document.querySelectorAll(".panel")];
const navLinks = [...document.querySelectorAll(".nav a")];
const curtain = document.querySelector(".curtain");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const titles = {
  home: "Aman Srivastava",
  personal: "Personal info – Aman Srivastava",
  projects: "Projects – Aman Srivastava",
  resume: "Resume – Aman Srivastava",
};

let current = null;
let busy = false;
let pending = null;

function tabFromHash() {
  const name = location.hash.slice(1);
  return panels.some((p) => p.id === name) ? name : "home";
}

function render(name) {
  panels.forEach((panel) => {
    const active = panel.id === name;
    panel.hidden = !active;
    panel.classList.remove("play");

    if (active) {
      // stagger the entrance of the elements inside this tab
      panel.querySelectorAll("[data-rise]").forEach((el, i) => {
        el.style.setProperty("--i", i);
      });
      void panel.offsetWidth; // restart the CSS animations
      panel.classList.add("play");
    }
  });

  navLinks.forEach((link) => {
    if (link.dataset.tab === name) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  document.title = titles[name] || titles.home;
  window.scrollTo(0, 0);
  document.getElementById(name).focus({ preventScroll: true });
  if (typeof onTab === "function") onTab(name);
}

async function go(name) {
  if (name === current) return;

  // first load, or the visitor prefers less motion: no transition
  if (current === null || reduceMotion.matches) {
    render(name);
    current = name;
    return;
  }

  // ignore rapid clicks while a transition runs, but remember the last one
  if (busy) {
    pending = name;
    return;
  }
  busy = true;

  const cover = curtain.animate(
    [
      { transform: "scaleX(0)", transformOrigin: "left" },
      { transform: "scaleX(1)", transformOrigin: "left" },
    ],
    { duration: 380, easing: "cubic-bezier(.7,0,.3,1)", fill: "forwards" }
  );
  await cover.finished;

  render(name);
  current = name;

  const reveal = curtain.animate(
    [
      { transform: "scaleX(1)", transformOrigin: "right" },
      { transform: "scaleX(0)", transformOrigin: "right" },
    ],
    { duration: 380, easing: "cubic-bezier(.7,0,.3,1)", fill: "forwards" }
  );
  await reveal.finished;

  busy = false;
  if (pending && pending !== current) {
    const next = pending;
    pending = null;
    go(next);
  } else {
    pending = null;
  }
}


// =====================================================
// Animated extras
// =====================================================

// ---- Typed line on the Home tab ----
const phrases = [
  "web apps with Flask and MySQL.",
  "database-driven projects.",
  "apps that work offline.",
  "things that run in the browser.",
];
let typedRun = 0;

function startTyped() {
  const el = document.getElementById("typed");
  const run = ++typedRun;
  if (reduceMotion.matches) { el.textContent = phrases[0]; return; }
  el.textContent = "";
  let p = 0, c = 0, deleting = false;
  (function tick() {
    if (run !== typedRun) return;
    const word = phrases[p];
    if (!deleting) {
      c++;
      el.textContent = word.slice(0, c);
      if (c === word.length) { deleting = true; return setTimeout(tick, 1600); }
      return setTimeout(tick, 55);
    }
    c--;
    el.textContent = word.slice(0, c);
    if (c === 0) { deleting = false; p = (p + 1) % phrases.length; return setTimeout(tick, 350); }
    setTimeout(tick, 28);
  })();
}

// ---- Code card that types itself ----
// k = keyword, p = property, s = string, b = boolean, t = plain text
const codeLines = [
  [["k", "const "], ["t", "aman = {"]],
  [["t", "  "], ["p", "role"], ["t", ": "], ["s", '"Full-Stack Developer"'], ["t", ","]],
  [["t", "  "], ["p", "stack"], ["t", ": ["], ["s", '"Flask"'], ["t", ", "], ["s", '"MySQL"'], ["t", ", "], ["s", '"JS"'], ["t", "],"]],
  [["t", "  "], ["p", "studying"], ["t", ": "], ["s", '"CSE, RVITM"'], ["t", ","]],
  [["t", "  "], ["p", "openToWork"], ["t", ": "], ["b", "true"], ["t", ","]],
  [["t", "};"]],
];
let codeRun = 0;

function typeCode() {
  const pre = document.getElementById("code");
  const run = ++codeRun;
  pre.textContent = "";

  const flat = [];
  codeLines.forEach((line, i) => {
    line.forEach(([cls, text]) => flat.push([cls, text]));
    if (i < codeLines.length - 1) flat.push(["t", "\n"]);
  });

  if (reduceMotion.matches) {
    flat.forEach(([cls, text]) => {
      const span = document.createElement("span");
      span.className = "c-" + cls;
      span.textContent = text;
      pre.append(span);
    });
    return;
  }

  const caret = document.createElement("span");
  caret.className = "caret caret-code";
  pre.append(caret);

  let i = 0, j = 0, current = null;
  (function step() {
    if (run !== codeRun || i >= flat.length) return;
    const [cls, text] = flat[i];
    if (j === 0) {
      current = document.createElement("span");
      current.className = "c-" + cls;
      pre.insertBefore(current, caret);
    }
    const ch = text[j];
    current.textContent += ch;
    j++;
    if (j >= text.length) { i++; j = 0; }
    setTimeout(step, ch === "\n" ? 150 : 14 + Math.random() * 16);
  })();
}

// ---- Tilt on the code card (mouse only) ----
const tiltCard = document.getElementById("tilt");
if (tiltCard && window.matchMedia("(hover: hover)").matches && !reduceMotion.matches) {
  tiltCard.addEventListener("pointermove", (e) => {
    const r = tiltCard.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tiltCard.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  });
  tiltCard.addEventListener("pointerleave", () => { tiltCard.style.transform = ""; });
}

// ---- Light that follows the mouse on project rows ----
document.querySelectorAll(".project").forEach((row) => {
  row.addEventListener("pointermove", (e) => {
    const r = row.getBoundingClientRect();
    row.style.setProperty("--x", e.clientX - r.left + "px");
    row.style.setProperty("--y", e.clientY - r.top + "px");
  });
});

// ---- Sports numbers: win rate + count-up ----
const playedEl = document.getElementById("played");
const wonEl = document.getElementById("won");
const rateEl = document.getElementById("winrate");
const rateRow = document.getElementById("winrate-row");
const played = parseInt(playedEl.textContent, 10);
const won = parseInt(wonEl.textContent, 10);

if (Number.isFinite(played) && Number.isFinite(won) && played > 0 && won <= played) {
  playedEl.dataset.target = played;
  wonEl.dataset.target = won;
  rateEl.dataset.target = Math.round((won / played) * 100);
  rateEl.dataset.suffix = "%";
  rateEl.textContent = rateEl.dataset.target + "%";
  rateRow.hidden = false;
}

function countUp(el) {
  const target = Number(el.dataset.target);
  if (!Number.isFinite(target) || reduceMotion.matches) return;
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  const duration = 1100;
  el.textContent = "0" + suffix;
  requestAnimationFrame(function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  });
}

// ---- Run the right effects when a tab opens ----
function onTab(name) {
  if (name === "home") {
    setTimeout(startTyped, 500);
    setTimeout(typeCode, 700);
  } else {
    typedRun++;
    codeRun++;
  }
  if (name === "personal") {
    setTimeout(() => [playedEl, wonEl, rateEl].forEach(countUp), 600);
  }
}
window.addEventListener("hashchange", () => go(tabFromHash()));
go(tabFromHash());