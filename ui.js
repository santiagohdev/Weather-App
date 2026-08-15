/* ============================================================================
   Capa de presentación.
   Se carga DESPUÉS de script.js y le pisa las funciones de dibujo. La lógica de
   datos (fetch, unidades, idiomas) sigue viviendo allá sin tocar: acá solo se
   decide cómo se ve.

   Dos cambios de fondo respecto de la versión anterior:
   1. El cielo deja de ser un canvas de nubes y pasa a ser CSS — gradientes y
      luces difusas. Se ve mejor y no cuesta un frame.
   2. El protagonista deja de ser el número gigante y pasa a ser la curva de
      temperatura del día, que es lo que uno realmente quiere saber.
   ========================================================================== */
(function () {
  'use strict';

  /* ── el canvas ya no dibuja nubes; queda solo para lluvia y nieve ───────── */
  const CON_PARTICULAS = new Set(['rain', 'drizzle', 'storm', 'snow']);
  const cvs = document.getElementById('scene');

  const esDeNoche = () => { const h = new Date().getHours(); return h < 6 || h >= 19; };

  const CIELO = {
    clear:   'clear',   pcloudy: 'pcloudy', cloudy: 'cloudy',
    rain:    'rain',    drizzle: 'rain',    storm:  'storm',
    snow:    'snow',    fog:     'fog'
  };

  const _setScene = window.setScene;
  window.setScene = function (tipo) {
    const t = CIELO[tipo] ? tipo : 'clear';
    document.body.dataset.sky = (esDeNoche() ? 'night-' : 'day-') + (CIELO[t] || 'clear');
    // Las partículas siguen saliendo del motor original; el resto no se dibuja.
    if (cvs) cvs.style.opacity = CON_PARTICULAS.has(t) ? '1' : '0';
    if (typeof _setScene === 'function') _setScene(t);
  };

  /* ── la curva del día ───────────────────────────────────────────────────── */

  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}) => {
    const e = document.createElementNS(NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    return e;
  };

  /* Suaviza la línea con Catmull-Rom convertido a Bézier. Una polilínea recta
     entre horas se ve dura y sugiere saltos que no existen. */
  function trazo(pts, tension = 0.5) {
    if (pts.length < 2) return '';
    let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6 * tension, c1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const c2x = p2.x - (p3.x - p1.x) / 6 * tension, c2y = p2.y - (p3.y - p1.y) / 6 * tension;
      d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }

  let datosCurva = [];

  function pintarCurva(horas) {
    const cont = document.getElementById('curvePlot');
    if (!cont) return;
    datosCurva = (horas || []).slice(0, 16);
    cont.innerHTML = '';
    if (datosCurva.length < 2) return;

    // Se dibuja al tamaño real del contenedor. Con un viewBox fijo y
    // preserveAspectRatio="none" el SVG se estira y deforma las etiquetas.
    const W = Math.max(340, Math.round(cont.clientWidth || 900));
    const H = Math.max(180, Math.round(parseFloat(getComputedStyle(cont).getPropertyValue('--plot-h')) || 240));
    const M = { t: 30, r: 26, b: 34, l: 26 };
    const iw = W - M.l - M.r, ih = H - M.t - M.b;

    const temps = datosCurva.map(h => h.temp);
    let lo = Math.min(...temps), hi = Math.max(...temps);
    if (hi - lo < 4) { const c = (hi + lo) / 2; lo = c - 2; hi = c + 2; }
    const pad = (hi - lo) * 0.18;
    lo -= pad; hi += pad;

    const X = i => M.l + (i / (datosCurva.length - 1)) * iw;
    const Y = v => M.t + ih - ((v - lo) / (hi - lo)) * ih;
    const pts = datosCurva.map((h, i) => ({ x: X(i), y: Y(h.temp), ...h, i }));

    const svg = el('svg', {
      viewBox: `0 0 ${W} ${H}`, class: 'curve-svg',
      width: W, height: H, role: 'img'
    });
    svg.appendChild(el('title')).textContent = 'Temperature through the day';

    const defs = el('defs');
    // El relleno se apaga hacia abajo para que no compita con la línea.
    const g = el('linearGradient', { id: 'cvFill', x1: '0', y1: '0', x2: '0', y2: '1' });
    [['0','.34'],['.55','.10'],['1','0']].forEach(([off,op])=>{
      const st = el('stop', { offset: off });
      st.style.stopColor = 'var(--curve)';   // como atributo, var() no resuelve
      st.style.stopOpacity = op;
      g.appendChild(st);
    });
    defs.appendChild(g);
    svg.appendChild(defs);

    // Rejilla horizontal: tres líneas, discretas, con su valor a la izquierda.
    const grid = el('g', { class: 'cv-grid' });
    [0, .5, 1].forEach(f => {
      const v = lo + (hi - lo) * f, y = Y(v);
      grid.appendChild(el('line', { x1: M.l, y1: y, x2: W - M.r, y2: y }));
    });
    svg.appendChild(grid);

    const d = trazo(pts);
    const area = el('path', {
      d: `${d}L${pts[pts.length - 1].x.toFixed(2)},${M.t + ih}L${pts[0].x.toFixed(2)},${M.t + ih}Z`,
      class: 'cv-area', fill: 'url(#cvFill)'
    });
    svg.appendChild(area);

    const linea = el('path', { d, class: 'cv-line' });
    svg.appendChild(linea);

    // Extremos del día: se etiquetan solo esos dos, no todos los puntos.
    const iMax = temps.indexOf(Math.max(...temps));
    const iMin = temps.indexOf(Math.min(...temps));
    [[iMax, 'max'], [iMin, 'min']].forEach(([i, cls]) => {
      if (i < 0 || i === 0) return;
      const p = pts[i];
      svg.appendChild(el('circle', { cx: p.x, cy: p.y, r: 3.5, class: 'cv-ext' }));
      const tx = el('text', {
        x: p.x, y: cls === 'max' ? p.y - 14 : p.y + 22,
        class: 'cv-extlbl', 'text-anchor': 'middle'
      });
      tx.textContent = window.td ? window.td(p.temp) : p.temp + '°';
      svg.appendChild(tx);
    });

    // "Ahora" es el primer punto: marca fija, no una etiqueta más.
    const p0 = pts[0];
    svg.appendChild(el('line', { x1: p0.x, y1: p0.y, x2: p0.x, y2: M.t + ih, class: 'cv-nowline' }));
    svg.appendChild(el('circle', { cx: p0.x, cy: p0.y, r: 9, class: 'cv-nowhalo' }));
    svg.appendChild(el('circle', { cx: p0.x, cy: p0.y, r: 4.5, class: 'cv-now' }));

    // Horas al pie, salteadas para que no se pisen.
    const paso = Math.max(1, Math.ceil(datosCurva.length / 7));
    const ejes = el('g', { class: 'cv-axis' });
    pts.forEach((p, i) => {
      if (i % paso && i !== pts.length - 1) return;
      const t = el('text', { x: p.x, y: H - 10, 'text-anchor': i === 0 ? 'start' : (i === pts.length - 1 ? 'end' : 'middle') });
      t.textContent = p.t;
      ejes.appendChild(t);
    });
    svg.appendChild(ejes);

    // Capa de interacción: un rectángulo por hora, invisible pero clickeable.
    const hit = el('g', { class: 'cv-hit' });
    pts.forEach((p, i) => {
      const w = iw / (pts.length - 1);
      const r = el('rect', { x: p.x - w / 2, y: M.t, width: w, height: ih, 'data-i': i });
      hit.appendChild(r);
    });
    svg.appendChild(hit);

    cont.appendChild(svg);

    const tip = document.createElement('div');
    tip.className = 'cv-tip'; tip.hidden = true;
    cont.appendChild(tip);

    const marca = el('circle', { cx: p0.x, cy: p0.y, r: 5, class: 'cv-hover' });
    marca.style.opacity = '0';
    svg.appendChild(marca);

    function mostrar(i) {
      const p = pts[i]; if (!p) return;
      marca.setAttribute('cx', p.x); marca.setAttribute('cy', p.y);
      marca.style.opacity = '1';
      tip.hidden = false;
      tip.innerHTML = `<b>${window.td ? window.td(p.temp) : p.temp + '°'}</b><span>${p.t}</span>` +
        (p.pre ? `<i>${p.pre}% rain</i>` : '');
      tip.style.left = (p.x / W * 100) + '%';
      tip.style.top  = (p.y / H * 100) + '%';
    }
    hit.addEventListener('mousemove', e => {
      const r = e.target.closest('rect'); if (r) mostrar(+r.dataset.i);
    });
    hit.addEventListener('mouseleave', () => { marca.style.opacity = '0'; tip.hidden = true; });
    hit.addEventListener('click', e => {
      const r = e.target.closest('rect'); if (!r) return;
      const p = pts[+r.dataset.i]; if (!p) return;
      const mt = document.getElementById('mainTemp');
      if (mt) mt.textContent = window.td ? window.td(p.temp) : p.temp + '°';
      window.setScene(p.c); if (window.buildVisual) window.buildVisual(p.c);
    });
  }

  /* ── enganche ────────────────────────────────────────────────────────────
     No se puede leer CITIES desde acá: está declarado con const y por eso no
     queda colgado de window. En cambio renderHeroHourly es una function
     declaration y recibe el array de horas ya armado, que es justo lo que la
     curva necesita.                                                          */
  const _rhh = window.renderHeroHourly;
  window.renderHeroHourly = function (horas) {
    if (typeof _rhh === 'function') _rhh.apply(this, arguments);
    if (horas && horas.length) {
      pintarCurva(horas);
      window.setScene(horas[0].c || 'clear');
    }
  };

  // Al cambiar °C/°F hay que redibujar los números de la curva.
  ['btnC', 'btnF'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => setTimeout(() => pintarCurva(datosCurva), 0));
  });

  let tRes;
  window.addEventListener('resize', () => {
    clearTimeout(tRes);
    tRes = setTimeout(() => { if (datosCurva.length) pintarCurva(datosCurva); }, 140);
  });
})();
