// Fase 4: compases, metrónomo exacto, cursor y bucle de compases
import { el, svg, toast, clamp } from "./util.js";
import { staffLayout } from "./vector.js";
import { sanitizePractice, TS_RE, CURSOR_COLORS } from "./model.js";
import { parseTs, playOrder, tempoPlan, compactOrder, boxesLayout } from "./music.js";
export { parseTs };

/* ================= Compases de la pieza, en orden ================= */
export function rowXs(o) {
  if (o.t === "boxes") return boxesLayout(o).xs;
  return [o.x, ...o.cuts.map(f => o.x + f * o.w), o.x + o.w];
}
// Geometría de una fila de compases: una fila de «Compases» o una fila de cajas de acordes
export function rowGeo(o) {
  if (o.t === "boxes") { const L = boxesLayout(o); return { xs: L.xs, y: L.top, h: o.h }; }
  return { xs: rowXs(o), y: o.y, h: o.h };
}
export const isMeasRow = (o) => o.t === "meas" || (o.t === "boxes" && o.meas !== false);

// Filas ordenadas: por hoja, luego de arriba abajo; filas a la misma altura, de izquierda a derecha
export function orderedRows(piece) {
  const rows = [];
  piece.pages.forEach((pg, pi) => pg.objs.forEach(o => { if (isMeasRow(o)) rows.push({ o, pageId: pg.id, pi, g: rowGeo(o) }); }));
  rows.sort((a, b) => {
    if (a.pi !== b.pi) return a.pi - b.pi;
    const ov = Math.min(a.g.y + a.g.h, b.g.y + b.g.h) - Math.max(a.g.y, b.g.y);
    if (ov > 0.5 * Math.min(a.g.h, b.g.h)) return a.g.xs[0] - b.g.xs[0];
    return a.g.y - b.g.y;
  });
  return rows;
}
// Lista de compases con su compás (4/4…) y tempo efectivos
export function measureList(piece) {
  const P = sanitizePractice(piece.practice);
  let ts = P.ts, bpm = P.bpm;
  const out = [];
  for (const r of orderedRows(piece)) {
    const { xs, y, h } = r.g;
    for (let i = 0; i < xs.length - 1; i++) {
      const c = r.o.ch?.[i];
      if (c?.ts) ts = c.ts;
      if (c?.bpm) bpm = c.bpm;
      out.push({ n: out.length + 1, pageId: r.pageId, pi: r.pi, rowId: r.o.id, i, x0: xs[i], x1: xs[i + 1], y, h, ts, bpm, mk: c || null });
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
    if (Math.abs(xs[0] - x0) < 25 || (found.how === "pauta" && x0 < xs[0])) x0 = xs[0]; // en una pauta, la clave no es un compás
    if (Math.abs(xs[xs.length - 1] - x1) < 25) x1 = xs[xs.length - 1];
    inner = xs.filter(x => x > x0 + 6 && x < x1 - 6);
  }
  return { x: x0, w: Math.max(10, x1 - x0), inner };
}


/* ================= Metrónomo y reproductor ================= */
// Toca una secuencia de compases (seq: [{ m, f0, f1 }], en el orden real) con clics exactos del reloj de audio.
// f0/f1: factor de tempo al principio y al final del compás (rit. / accel.). Calderón: pulsos extra sin clic.
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
  // opts: { measures, seq, loop, countIn, gap, vol, ramp }
  start(opts) {
    this.stop(true);
    const ctx = this.ensureCtx();
    this.opts = opts;
    this.loopNo = 1;
    this.queue = [];             // trozos por sonar
    this.segs = [];              // trozos ya programados con la hora de cada pulso (para el cursor)
    this.beat = 0; this.cur = null;
    this.nextTime = ctx.currentTime + 0.12;
    this.pushPrep(opts.countIn, "count");
    this.pushSeq();
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
  item(kind, e, step) {
    const mm = this.opts.measures[e.m], { n, d } = parseTs(mm.ts);
    const isM = kind === "meas";
    return { kind, m: e.m, step, beats: n, extra: isM ? (mm.mk?.ferm || 0) : 0, ts: mm.ts, bpm: mm.bpm, d,
      f0: isM ? (e.f0 ?? 1) : 1, f1: isM ? (e.f1 ?? 1) : 1, loopNo: this.loopNo, pct: this.pct() };
  }
  pushPrep(bars, kind) { for (let i = 0; i < bars; i++) this.queue.push(this.item(kind, this.opts.seq[0], -1)); }
  pushSeq() { this.opts.seq.forEach((e, j) => this.queue.push(this.item("meas", e, j))); }
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
          this.pushSeq();
        }
        this.cur = this.queue.shift();
        this.beat = 0;
        this.cur.seg = { ...this.cur, t0: this.nextTime, times: [this.nextTime] };
        this.segs.push(this.cur.seg);
        if (this.segs.length > 64) this.segs.shift();
      }
      const it = this.cur, b = this.beat;
      if (b < it.beats) {
        const compound = it.d === 8 && it.beats % 3 === 0 && it.beats > 3;
        this.click(this.nextTime, b === 0 ? 2 : compound && b % 3 === 0 ? 1 : 0, this.opts.vol);
      }
      const f = b < it.beats ? it.f0 + (it.f1 - it.f0) * (b / it.beats) : it.f1;
      this.nextTime += 60 / (it.bpm * it.pct / 100 * f);
      this.beat++;
      it.seg.times.push(this.nextTime);
      if (this.beat >= it.beats + it.extra) this.cur = null;
    }
  }
  draw() {
    const t = this.ctx.currentTime;
    if (this.endAt && t >= this.endAt) { this.stop(); return; }
    let seg = null;
    for (let i = this.segs.length - 1; i >= 0; i--) if (this.segs[i].t0 <= t) { seg = this.segs[i]; break; }
    if (!seg) { this.onFrame?.({ kind: "wait" }); return; }
    const T = seg.times;
    let k = 0;
    while (k + 1 < T.length && T[k + 1] <= t) k++;
    let frac, beat, hold = false;
    if (k >= seg.beats) { beat = seg.beats - 1; frac = 0.9999; hold = true; } // calderón: el cursor espera al final
    else {
      const nx = T[k + 1] ?? (T[k] + (k > 0 ? T[k] - T[k - 1] : 0.5));
      beat = k;
      frac = clamp((k + (t - T[k]) / Math.max(1e-4, nx - T[k])) / seg.beats, 0, 0.9999);
    }
    this.onFrame?.({ ...seg, frac, beat, beatNo: beat + 1, hold });
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
// api: { getPiece, measures(), drawOverlay(state), changed(), close() }
export function buildPracticePanel(api) {
  let P = null;
  const num = (v, min, max, w = "64px") => el("input", { type: "number", value: v, min, max, style: { width: w } });
  const playBtn = el("button", { class: "btn primary", type: "button", text: "▶ Tocar", title: "Empezar o parar (barra espaciadora)" });
  const startIn = num(1, 1, 5000);
  const modeSel = el("select", { title: "Qué tocar" },
    el("option", { value: "loop", text: "Bucle de" }),
    el("option", { value: "full", text: "Hasta el final, con repeticiones y saltos" }),
    el("option", { value: "norep", text: "Hasta el final, sin repeticiones" }));
  const loopLen = num(2, 1, 64, "56px");
  const loopWrap = el("span", { class: "pr-inline" }, loopLen, " compases");
  const bpmIn = num(80, 20, 400);
  const tsIn = el("input", { type: "text", value: "4/4", maxlength: 5, style: { width: "56px" }, title: "Compás de la pieza: 4/4, 3/4, 6/8…" });
  const curSel = el("select", { title: "Cómo se ve el cursor" },
    el("option", { value: "line", text: "Línea que avanza" }),
    el("option", { value: "beat", text: "Pulsos: avanza a saltos con cada clic" }));
  const swatches = el("span", { class: "pr-swatches" });
  for (const [k, c] of Object.entries(CURSOR_COLORS)) swatches.append(el("button", { type: "button", class: "pr-sw", "data-c": k, title: k, style: { background: c } }));
  const countIn = el("select", {}, ...[0, 1, 2, 3, 4].map(n => el("option", { value: n, text: String(n) })));
  const gapIn = el("select", {}, ...[0, 1, 2, 3, 4].map(n => el("option", { value: n, text: String(n) })));
  const volIn = el("input", { type: "range", min: 0, max: 1, step: 0.05, style: { width: "90px" } });
  const rampOn = el("input", { type: "checkbox" });
  const repJump = el("input", { type: "checkbox" });
  const rStart = num(70, 20, 100, "54px"), rStep = num(5, 1, 50, "48px"), rEvery = num(2, 1, 50, "48px"), rMax = num(100, 30, 200, "58px");
  const status = el("div", { class: "pr-status", text: "Toca un compás de la partitura para empezar desde ahí." });
  const orderBox = el("div", { class: "pr-order muted small" });
  const beatBox = el("div", { class: "pr-beats" });
  const rampRow = el("div", { class: "pr-row" },
    el("label", { class: "check" }, rampOn, " Subir el tempo en el bucle:"),
    el("label", {}, "empezar al ", rStart, " %"), el("label", {}, "subir ", rStep, " %"), el("label", {}, "cada ", rEvery, " vueltas"), el("label", {}, "hasta el ", rMax, " %"));
  const more = el("details", { class: "pr-more" }, el("summary", { text: "Opciones" }),
    el("div", { class: "pr-row" },
      el("label", {}, "Entrada ", countIn, " compases de clics"),
      el("label", {}, "Entre vueltas ", gapIn, " compases"),
      el("label", {}, "Volumen ", volIn)),
    rampRow,
    el("div", { class: "pr-row" }, el("label", { class: "check" }, repJump, " Al volver con D.C. o D.S., tocar también las repeticiones (lo habitual es no repetirlas)")),
    el("p", { class: "muted small", text: "El tempo cuenta la figura de abajo del compás (♩ en 4/4, ♪ en 6/8). Los cambios de compás o de tempo, las repeticiones, casillas, D.C., D.S., Coda, Fine, calderón y rit. se ponen con la herramienta «Compases»: toca el compás." }));
  const close = el("button", { class: "btn small", type: "button", text: "Cerrar" });
  const panel = el("div", { id: "practicePanel", class: "floating pr-panel", hidden: true },
    el("div", { class: "pr-row pr-main" },
      playBtn,
      el("label", {}, "Desde el compás ", startIn),
      modeSel, loopWrap,
      el("label", {}, "Tempo ", bpmIn),
      el("label", {}, "Compás ", tsIn),
      beatBox, close),
    el("div", { class: "pr-row" }, el("label", {}, "Cursor ", curSel), swatches),
    status, orderBox, more);

  const load = () => {
    P = sanitizePractice(api.getPiece().practice);
    startIn.value = P.start; modeSel.value = P.mode; loopLen.value = P.loopLen; bpmIn.value = P.bpm; tsIn.value = P.ts;
    curSel.value = P.cursor; countIn.value = P.countIn; gapIn.value = P.gap; volIn.value = P.vol; repJump.checked = P.repJump;
    rampOn.checked = P.ramp.on; rStart.value = P.ramp.start; rStep.value = P.ramp.step; rEvery.value = P.ramp.every; rMax.value = P.ramp.max;
  };
  const read = (extra = {}) => {
    const ts = TS_RE.test(tsIn.value.trim()) ? tsIn.value.trim() : P.ts;
    P = sanitizePractice({ ...P, start: startIn.value, mode: modeSel.value, loop: modeSel.value === "loop", loopLen: loopLen.value, bpm: bpmIn.value, ts, countIn: countIn.value, gap: gapIn.value, vol: volIn.value,
      cursor: curSel.value, repJump: repJump.checked, ramp: { on: rampOn.checked, start: rStart.value, step: rStep.value, every: rEvery.value, max: rMax.value }, ...extra });
    const piece = api.getPiece();
    if (JSON.stringify(piece.practice) !== JSON.stringify(P)) { piece.practice = P; api.changed(); }
    return P;
  };
  const range = () => {
    const M = api.measures();
    const a = clamp(P.start, 1, Math.max(1, M.length)) - 1;
    const b = P.mode === "loop" ? Math.min(M.length - 1, a + P.loopLen - 1) : a;
    return { M, a, b };
  };
  // Compases que van a sonar, en orden
  const buildSeq = () => {
    const { M, a, b } = range();
    let idx = [];
    if (P.mode === "loop") for (let k = a; k <= b; k++) idx.push(k);
    else if (P.mode === "norep") for (let k = a; k < M.length; k++) idx.push(k);
    else {
      const ord = playOrder(M, { repAfterJump: P.repJump }).map(x => x.m);
      let j = ord.indexOf(a); if (j < 0) j = ord.findIndex(x => x >= a);
      idx = j < 0 ? [] : ord.slice(j);
    }
    return { M, idx, seq: tempoPlan(M, idx) };
  };
  const style = () => ({ cursor: P.cursor, color: CURSOR_COLORS[P.ccol] });
  const refresh = () => {
    if (!P) return;
    const { M, a, b } = range();
    loopWrap.hidden = P.mode !== "loop";
    rampRow.style.opacity = P.mode === "loop" ? 1 : 0.5;
    swatches.hidden = P.cursor !== "beat";
    swatches.querySelectorAll(".pr-sw").forEach(s => s.classList.toggle("on", s.dataset.c === P.ccol));
    if (P.mode === "full" && M.length) {
      const ord = playOrder(M, { repAfterJump: P.repJump }).map(x => x.m);
      const txt = compactOrder(ord);
      orderBox.textContent = `Orden de la pieza (${ord.length} compases): ${txt.length > 260 ? txt.slice(0, 260) + "…" : txt}`;
    } else orderBox.textContent = "";
    if (!player.playing) {
      const what = P.mode === "loop" ? `Bucle: compases ${a + 1} a ${b + 1}.` : P.mode === "full" ? `Desde el compás ${a + 1} hasta el final, siguiendo repeticiones y saltos.` : `Desde el compás ${a + 1} hasta el final, sin repeticiones.`;
      status.textContent = M.length
        ? `${M.length} compases en la pieza. ${what} Toca un compás de la partitura para empezar desde ahí.`
        : "Aún no hay compases: elige la herramienta «Compases» y arrastra sobre cada línea de la partitura (las filas de cajas de acordes ya cuentan como compases).";
      api.drawOverlay({ M, a, b, cursor: null, style: style() });
    }
  };
  let current = null; // { M, idx }
  const player = new Player({
    onFrame: (f) => {
      if (f.kind === "wait" || !current) return;
      const { M, idx } = current, { a, b } = range();
      const m = M[f.m];
      if (f.kind === "meas") {
        const where = P.mode === "loop" ? ` · Vuelta ${f.loopNo}${P.ramp.on ? ` · ${f.pct} %` : ""}` : ` · ${f.step + 1} de ${idx.length}`;
        status.textContent = `Compás ${m.n} · ${m.ts} · ♩=${Math.round(m.bpm * f.pct / 100 * (f.f0 + (f.f1 - f.f0) * f.frac))}${f.hold ? " · calderón" : ""}${where}`;
        api.drawOverlay({ M, a, b, cursor: { m, frac: f.frac, beat: f.beat, beats: f.beats, hold: f.hold }, style: style() });
      } else {
        status.textContent = `${f.kind === "count" ? "Entrada" : "Prepárate para la vuelta " + f.loopNo}: ${f.beatNo} de ${f.beats}${P.ramp.on && P.loop ? ` · ${f.pct} %` : ""}`;
        api.drawOverlay({ M, a, b, cursor: null, prep: { m: M[idx[0]], beat: f.beatNo }, style: style() });
      }
      beatBox.textContent = "●".repeat(f.beatNo) + "○".repeat(Math.max(0, f.beats - f.beatNo));
    },
    onEnd: () => { playBtn.textContent = "▶ Tocar"; beatBox.textContent = ""; current = null; refresh(); },
  });
  const play = () => {
    if (player.playing) { player.stop(); return; }
    read();
    const { M, idx, seq } = buildSeq();
    if (!M.length) { toast("Primero marca los compases con la herramienta «Compases» (o pon una fila de cajas de acordes)."); return; }
    if (!seq.length) { toast("Ese compás no suena en el orden de la pieza (por ejemplo, una casilla de 1.ª vez ya tocada). Elige otro."); return; }
    current = { M, idx };
    player.start({ measures: M, seq, loop: P.mode === "loop", countIn: P.countIn, gap: P.gap, vol: P.vol, ramp: P.ramp });
    playBtn.textContent = "■ Parar";
  };
  playBtn.onclick = play;
  close.onclick = () => api.close();
  swatches.addEventListener("click", (e) => { const b = e.target.closest(".pr-sw"); if (!b) return; read({ ccol: b.dataset.c }); refresh(); });
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
    setMode(mode) { modeSel.value = mode; read(); refresh(); },
  };
}
