// Fase 4: compases, metrónomo exacto, cursor y bucle de compases
import { el, svg, toast, clamp } from "./util.js";
import { staffLayout } from "./vector.js";
import { sanitizePractice, TS_RE } from "./model.js";

/* ================= Compases de la pieza, en orden ================= */
export function rowXs(o) { return [o.x, ...o.cuts.map(f => o.x + f * o.w), o.x + o.w]; }
export function parseTs(ts) { const [n, d] = String(ts || "4/4").split("/").map(Number); return { n: n || 4, d: d || 4 }; }

// Filas ordenadas: por hoja, luego de arriba abajo; filas a la misma altura, de izquierda a derecha
export function orderedRows(piece) {
  const rows = [];
  piece.pages.forEach((pg, pi) => pg.objs.forEach(o => { if (o.t === "meas") rows.push({ o, pageId: pg.id, pi }); }));
  rows.sort((a, b) => {
    if (a.pi !== b.pi) return a.pi - b.pi;
    const ov = Math.min(a.o.y + a.o.h, b.o.y + b.o.h) - Math.max(a.o.y, b.o.y);
    if (ov > 0.5 * Math.min(a.o.h, b.o.h)) return a.o.x - b.o.x;
    return a.o.y - b.o.y;
  });
  return rows;
}
// Lista de compases con su compás (4/4…) y tempo efectivos
export function measureList(piece) {
  const P = sanitizePractice(piece.practice);
  let ts = P.ts, bpm = P.bpm;
  const out = [];
  for (const r of orderedRows(piece)) {
    const xs = rowXs(r.o);
    for (let i = 0; i < xs.length - 1; i++) {
      const c = r.o.ch?.[i];
      if (c?.ts) ts = c.ts;
      if (c?.bpm) bpm = c.bpm;
      out.push({ n: out.length + 1, pageId: r.pageId, pi: r.pi, rowId: r.o.id, i, x0: xs[i], x1: xs[i + 1], y: r.o.y, h: r.o.h, ts, bpm, change: c || null });
    }
  }
  return out;
}

/* ================= Proponer dónde están las barras de compás ================= */
// 1) si la línea es una pauta de la app, sus barras exactas; 2) si es PDF, busca líneas verticales en la imagen
export function detectBars(box, pg, canvas) {
  for (const st of pg.objs) {
    if (st.t !== "staff") continue;
    const L = staffLayout(st);
    for (const s of L.sys) {
      const top = (s.std || s.tab)[0], bot = s.bottom;
      const ov = Math.min(bot, box.y + box.h) - Math.max(top, box.y);
      if (ov < 0.5 * (bot - top)) continue;
      const xs = L.bars.filter(x => x >= box.x - 25 && x <= box.x + box.w + 25);
      if (xs.length >= 2) return { xs, how: "pauta" };
    }
  }
  if (!canvas || !canvas.width) return null;
  try {
    const k = canvas.width / pg.w;
    const X = Math.max(0, Math.floor(box.x * k)), Y = Math.max(0, Math.floor(box.y * k));
    const W = Math.min(canvas.width - X, Math.ceil(box.w * k)), H = Math.min(canvas.height - Y, Math.ceil(box.h * k));
    if (W < 20 || H < 10) return null;
    const d = canvas.getContext("2d").getImageData(X, Y, W, H).data;
    const run = new Array(W).fill(0);
    for (let x = 0; x < W; x++) {
      let cur = 0, best = 0;
      for (let y = 0; y < H; y++) {
        const i = (y * W + x) * 4, lum = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
        if (lum < 120) { cur++; if (cur > best) best = cur; } else cur = 0;
      }
      run[x] = best;
    }
    const max = Math.max(...run);
    if (max < H * 0.35) return null;
    const cand = [];
    for (let x = 0; x < W; x++) if (run[x] >= max * 0.9) {
      if (cand.length && x - cand[cand.length - 1].b <= 2) cand[cand.length - 1].b = x;
      else cand.push({ a: x, b: x });
    }
    const xs = cand.map(c => X / k + ((c.a + c.b) / 2) / k);
    if (xs.length < 2 || xs.length > 17) return null;
    return { xs, how: "partitura" };
  } catch { return null; }
}
// A partir del recuadro y de las barras encontradas: posición de la fila y separadores interiores
export function rowFromBox(box, found) {
  let x0 = box.x, x1 = box.x + box.w, inner = [];
  if (found?.xs?.length) {
    const xs = [...found.xs].sort((a, b) => a - b);
    if (Math.abs(xs[0] - x0) < 25) x0 = xs[0];
    if (Math.abs(xs[xs.length - 1] - x1) < 25) x1 = xs[xs.length - 1];
    inner = xs.filter(x => x > x0 + 6 && x < x1 - 6);
  }
  return { x: x0, w: Math.max(10, x1 - x0), inner };
}

/* ================= Metrónomo y reproductor ================= */
export class Player {
  constructor({ onFrame, onEnd }) { this.onFrame = onFrame; this.onEnd = onEnd; this.ctx = null; this.playing = false; }
  ensureCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }
  click(t, level, vol) { // level: 2 = primera parte (acento), 1 = parte fuerte secundaria (6/8…), 0 = normal
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square";
    o.frequency.value = level === 2 ? 1760 : level === 1 ? 1320 : 990;
    const peak = Math.max(0.0002, vol * (level === 2 ? 0.55 : level === 1 ? 0.38 : 0.28));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.06);
  }
  // opts: { measures, startIdx, loop, loopLen, countIn, gap, vol, ramp }
  start(opts) {
    this.stop(true);
    const ctx = this.ensureCtx();
    this.opts = opts;
    const M = opts.measures;
    this.first = clamp(opts.startIdx, 0, M.length - 1);
    this.last = opts.loop ? Math.min(M.length - 1, this.first + opts.loopLen - 1) : M.length - 1;
    this.loopNo = 1;
    this.queue = [];             // trozos por sonar: { kind, m, beats, beatDur, ts }
    this.segs = [];              // trozos ya programados con su hora (para el cursor)
    this.beat = 0; this.cur = null;
    this.nextTime = ctx.currentTime + 0.12;
    this.pushPrep(opts.countIn, "count");
    this.pushRange();
    this.playing = true;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
    const frame = () => { if (!this.playing) return; this.draw(); this.raf = requestAnimationFrame(frame); };
    this.raf = requestAnimationFrame(frame);
  }
  pct() {
    const r = this.opts.ramp;
    if (!this.opts.loop || !r?.on) return 100;
    return Math.min(r.max, r.start + r.step * Math.floor((this.loopNo - 1) / r.every));
  }
  item(kind, m) {
    const mm = this.opts.measures[m], { n, d } = parseTs(mm.ts);
    return { kind, m, beats: n, ts: mm.ts, beatDur: 60 / (mm.bpm * this.pct() / 100), d, loopNo: this.loopNo, pct: this.pct() };
  }
  pushPrep(bars, kind) { for (let i = 0; i < bars; i++) this.queue.push(this.item(kind, this.first)); }
  pushRange() { for (let m = this.first; m <= this.last; m++) this.queue.push(this.item("meas", m)); }
  schedule() {
    const ctx = this.ctx;
    while (this.playing && this.nextTime < ctx.currentTime + 0.15) {
      if (!this.cur) {
        if (!this.queue.length) {
          if (!this.opts.loop) { // fin de la pieza
            this.endAt = this.nextTime;
            clearInterval(this.timer); this.timer = null;
            return;
          }
          this.loopNo++;
          this.pushPrep(this.opts.gap, "gap");
          this.pushRange();
        }
        this.cur = this.queue.shift();
        this.beat = 0;
        this.segs.push({ ...this.cur, t0: this.nextTime, dur: this.cur.beats * this.cur.beatDur });
        if (this.segs.length > 64) this.segs.shift();
      }
      const it = this.cur, b = this.beat;
      const compound = it.d === 8 && it.beats % 3 === 0 && it.beats > 3;
      this.click(this.nextTime, b === 0 ? 2 : compound && b % 3 === 0 ? 1 : 0, this.opts.vol);
      this.nextTime += it.beatDur;
      this.beat++;
      if (this.beat >= it.beats) this.cur = null;
    }
  }
  draw() {
    const t = this.ctx.currentTime;
    if (this.endAt && t >= this.endAt) { this.stop(); return; }
    let seg = null;
    for (let i = this.segs.length - 1; i >= 0; i--) if (this.segs[i].t0 <= t) { seg = this.segs[i]; break; }
    if (!seg) { this.onFrame?.({ kind: "wait" }); return; }
    const frac = clamp((t - seg.t0) / seg.dur, 0, 0.9999);
    this.onFrame?.({ ...seg, frac, beatNo: Math.floor(frac * seg.beats) + 1 });
  }
  stop(silent = false) {
    const was = this.playing;
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.timer = null; this.raf = null; this.endAt = null;
    if (was && !silent) this.onEnd?.();
  }
}

/* ================= Panel de práctica ================= */
// api: { getPiece, measures(), onChange(), drawOverlay(state), changed() }
export function buildPracticePanel(api) {
  let P = null;
  const num = (v, min, max, w = "64px") => el("input", { type: "number", value: v, min, max, style: { width: w } });
  const playBtn = el("button", { class: "btn primary", type: "button", text: "▶ Tocar", title: "Empezar o parar (barra espaciadora)" });
  const startIn = num(1, 1, 5000);
  const loopChk = el("input", { type: "checkbox" });
  const loopLen = num(2, 1, 64, "56px");
  const bpmIn = num(80, 20, 400);
  const tsIn = el("input", { type: "text", value: "4/4", maxlength: 5, style: { width: "56px" }, title: "Compás de la pieza: 4/4, 3/4, 6/8…" });
  const countIn = el("select", {}, ...[0, 1, 2, 3, 4].map(n => el("option", { value: n, text: String(n) })));
  const gapIn = el("select", {}, ...[0, 1, 2, 3, 4].map(n => el("option", { value: n, text: String(n) })));
  const volIn = el("input", { type: "range", min: 0, max: 1, step: 0.05, style: { width: "90px" } });
  const rampOn = el("input", { type: "checkbox" });
  const rStart = num(70, 20, 100, "54px"), rStep = num(5, 1, 50, "48px"), rEvery = num(2, 1, 50, "48px"), rMax = num(100, 30, 200, "58px");
  const status = el("div", { class: "pr-status", text: "Toca un compás de la partitura para empezar desde ahí." });
  const beatBox = el("div", { class: "pr-beats" });
  const more = el("details", { class: "pr-more" }, el("summary", { text: "Opciones" }),
    el("div", { class: "pr-row" },
      el("label", {}, "Entrada ", countIn, " compases de clics"),
      el("label", {}, "Entre vueltas ", gapIn, " compases"),
      el("label", {}, "Volumen ", volIn)),
    el("div", { class: "pr-row" },
      el("label", { class: "check" }, rampOn, " Subir el tempo en el bucle:"),
      el("label", {}, "empezar al ", rStart, " %"), el("label", {}, "subir ", rStep, " %"), el("label", {}, "cada ", rEvery, " vueltas"), el("label", {}, "hasta el ", rMax, " %")),
    el("p", { class: "muted small", text: "El tempo cuenta la figura de abajo del compás (♩ en 4/4, ♪ en 6/8). Los cambios de compás o de tempo a mitad de pieza se ponen con la herramienta «Compases»: toca el compás donde cambia." }));
  const close = el("button", { class: "btn small", type: "button", text: "Cerrar" });
  const panel = el("div", { id: "practicePanel", class: "floating pr-panel", hidden: true },
    el("div", { class: "pr-row pr-main" },
      playBtn,
      el("label", {}, "Desde el compás ", startIn),
      el("label", { class: "check" }, loopChk, " Bucle de "), loopLen, el("span", {}, " compases"),
      el("label", {}, "Tempo ", bpmIn),
      el("label", {}, "Compás ", tsIn),
      beatBox, close),
    status, more);

  const load = () => {
    P = sanitizePractice(api.getPiece().practice);
    startIn.value = P.start; loopChk.checked = P.loop; loopLen.value = P.loopLen; bpmIn.value = P.bpm; tsIn.value = P.ts;
    countIn.value = P.countIn; gapIn.value = P.gap; volIn.value = P.vol;
    rampOn.checked = P.ramp.on; rStart.value = P.ramp.start; rStep.value = P.ramp.step; rEvery.value = P.ramp.every; rMax.value = P.ramp.max;
  };
  const read = () => {
    const ts = TS_RE.test(tsIn.value.trim()) ? tsIn.value.trim() : P.ts;
    P = sanitizePractice({ ...P, start: startIn.value, loop: loopChk.checked, loopLen: loopLen.value, bpm: bpmIn.value, ts, countIn: countIn.value, gap: gapIn.value, vol: volIn.value,
      ramp: { on: rampOn.checked, start: rStart.value, step: rStep.value, every: rEvery.value, max: rMax.value } });
    const piece = api.getPiece();
    if (JSON.stringify(piece.practice) !== JSON.stringify(P)) { piece.practice = P; api.changed(); }
    return P;
  };
  const range = () => {
    const M = api.measures();
    const a = clamp(P.start, 1, Math.max(1, M.length)) - 1;
    const b = P.loop ? Math.min(M.length - 1, a + P.loopLen - 1) : a;
    return { M, a, b };
  };
  const refresh = () => {
    if (!P) return;
    const { M, a, b } = range();
    rampOn.closest("label").parentElement.style.opacity = loopChk.checked ? 1 : 0.5;
    if (!player.playing) {
      status.textContent = M.length
        ? `${M.length} compases en la pieza. ${P.loop ? `Bucle: compases ${a + 1} a ${b + 1}.` : `Desde el compás ${a + 1} hasta el final.`} Toca un compás de la partitura para empezar desde ahí.`
        : "Aún no hay compases: elige la herramienta «Compases» y arrastra sobre cada línea de la partitura.";
      api.drawOverlay({ M, a, b, cursor: null });
    }
  };
  const player = new Player({
    onFrame: (f) => {
      const { M, a, b } = range();
      if (f.kind === "wait") return;
      const m = M[f.m];
      if (f.kind === "meas") {
        status.textContent = `Compás ${m.n} · ${m.ts} · ♩=${Math.round(m.bpm * f.pct / 100)}${P.loop ? ` · Vuelta ${f.loopNo}${P.ramp.on ? ` · ${f.pct} %` : ""}` : ""}`;
        api.drawOverlay({ M, a, b, cursor: { m, frac: f.frac } });
      } else {
        status.textContent = `${f.kind === "count" ? "Entrada" : "Prepárate para la vuelta " + f.loopNo}: ${f.beatNo} de ${f.beats}${P.ramp.on && P.loop ? ` · ${f.pct} %` : ""}`;
        api.drawOverlay({ M, a, b, cursor: null, prep: { m: M[a], beat: f.beatNo } });
      }
      beatBox.textContent = "●".repeat(f.beatNo) + "○".repeat(Math.max(0, f.beats - f.beatNo));
    },
    onEnd: () => { playBtn.textContent = "▶ Tocar"; beatBox.textContent = ""; refresh(); },
  });
  const play = () => {
    if (player.playing) { player.stop(); return; }
    read();
    const M = api.measures();
    if (!M.length) { toast("Primero marca los compases con la herramienta «Compases»."); return; }
    const { a } = range();
    player.start({ measures: M, startIdx: a, loop: P.loop, loopLen: P.loopLen, countIn: P.countIn, gap: P.gap, vol: P.vol, ramp: P.ramp });
    playBtn.textContent = "■ Parar";
  };
  playBtn.onclick = play;
  close.onclick = () => api.close();
  panel.addEventListener("input", () => { if (P) { read(); refresh(); } });
  panel.addEventListener("change", () => { if (P) { read(); refresh(); } });
  return {
    el: panel,
    open() { load(); panel.hidden = false; refresh(); },
    close() { player.stop(); panel.hidden = true; },
    isOpen: () => !panel.hidden,
    playing: () => player.playing,
    toggle: play,
    stop: () => player.stop(),
    refresh,
    setStart(n) { if (player.playing) player.stop(); startIn.value = n; read(); refresh(); },
  };
}
