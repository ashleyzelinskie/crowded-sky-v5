// Aesthetic test layer for Crowded Sky v5 — runs inside a live v5 page, changes only the look.
// Behaviour (observer, timeline, data, orbit-line geometry) is untouched.
// window.__applyStyle('softdots' | 'palette')
window.__applyStyle = function(variant){
  // ── Palette from the exhibition mood board ─────────────────────────────
  const PAL = {
    gov:    [0.56, 0.69, 0.89],   // mood-board blue   #8FB0E3
    priv:   [0.77, 0.54, 0.33],   // copper / bronze   #C48A55
    debris: [0.50, 0.51, 0.54],   // grey              #80828A
    proj:   [0.86, 0.88, 0.92],   // chrome / silver   #DBE0EB
  };
  const CSS = { gov:'#8FB0E3', priv:'#C48A55', debris:'#8A8F99', proj:'#DBE0EB' };

  // ── Dot colours: catalog, early satellites, projections (also after daily refresh) ──
  typeColor = t => t===2 ? PAL.debris : t===1 ? PAL.gov : PAL.priv;
  const recolour = () => {
    objects.forEach(o => o.col = typeColor(o.type));
    EARLY_SATS.forEach(e => e.col = PAL.gov);
    PROJ_OBJS.forEach(o => o.col = PAL.proj);
    lastRingCount = -1; rebuildGeometry();
  };
  const _ip = initProjectedSatellites;
  initProjectedSatellites = function(){ _ip(); PROJ_OBJS.forEach(o => o.col = PAL.proj); };
  recolour();
  // target glow: neutral white instead of warm gold
  thlMat.fragmentShader = thlMat.fragmentShader.replace('vec4(1.,0.90,0.60,', 'vec4(1.,0.98,0.95,');
  thlMat.needsUpdate = true;

  // ── Variant A: soft-dot relief (after the "Soft dots" study) ─────────────
  if (variant === 'softdots') {
    pMat.uniforms.sizeMul = { value: 1.7 };
    pMat.vertexShader = pMat.vertexShader
      .replace('uniform float uTime;', 'uniform float uTime;\n  uniform float sizeMul;')
      .replace('gl_PointSize=finalSize*(680./-mv.z);', 'gl_PointSize=finalSize*sizeMul*(680./-mv.z);')
      .replace('float pulse = 1.0 + 0.35 * noise;', 'float pulse = 1.0 + 0.08 * noise;')   // calmer: the relief carries the form
      .replace('float spike = max(0., snoise2(vec2(ph*3.14+uTime*0.8, uTime*0.6)))*0.22;', 'float spike = 0.0;');
    pMat.fragmentShader = `
      varying vec3 vC; varying float vRim; varying float vIsDebris;
      // one soft mound: height falls from a crisp centre to a flat edge; lit by one light (upper left)
      vec4 mound(vec2 q, float r){
        float d = length(q) / r;
        if (d > 1.0) return vec4(0.0);
        float g = 1.6 * pow(max(1.0 - d, 0.0), 0.6) / r;            // slope of h = (1-d)^1.6
        vec2 grad = -normalize(q + 1e-5) * g;
        vec3 n = normalize(vec3(-grad * 0.11, 1.0));
        vec3 L = normalize(vec3(-0.55, 0.50, 0.68));
        float diff = clamp(dot(n, L), 0.0, 1.0);
        float spec = pow(diff, 28.0) * (1.0 - d);                    // small metallic glint near the crown
        vec3 col = vC * (0.18 + 1.05 * diff) + vec3(spec * 0.35);
        float a = smoothstep(1.0, 0.72, d);
        return vec4(col, a);
      }
      void main(){
        vec2 u = gl_PointCoord - 0.5; u.y = -u.y;
        vec4 c;
        if (vIsDebris > 0.5) {                                        // debris: three small mounds
          vec2 c1 = vec2(0.0, 0.19), c2 = vec2(-0.17, -0.10), c3 = vec2(0.17, -0.10);
          vec2 q = u - c1; if (length(u - c2) < length(q)) q = u - c2; if (length(u - c3) < length(q)) q = u - c3;
          c = mound(q, 0.13);
        } else {
          c = mound(u, 0.5);
        }
        if (c.a <= 0.0) discard;
        gl_FragColor = vec4(c.rgb, c.a * 0.95);
      }`;
    pMat.blending = THREE.NormalBlending;   // shadows must be able to darken
    pMat.needsUpdate = true;
  }

  // ── Info box: same layout and type as the companion app ─────────────────
  const doc = document, st = doc.createElement('style');
  st.textContent = `
  #data-panel{background:rgba(0,0,0,0.9)!important;border-left:1px solid rgba(255,255,255,0.08)!important;
    padding:28px 24px!important;justify-content:flex-start!important;font-family:'Courier New',monospace;backdrop-filter:none!important}
  #data-panel .cp-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  #data-panel .cp-badge{font-size:8px;letter-spacing:.28em;text-transform:uppercase;padding:4px 10px;border-radius:2px;border:1px solid currentColor;opacity:.8}
  #data-panel .cp-year{font-size:9px;letter-spacing:.25em;color:rgba(255,255,255,0.45);text-transform:uppercase}
  #data-panel .cp-name{font-size:24px;letter-spacing:.05em;text-transform:uppercase;color:#fff;line-height:1.15;margin-bottom:5px;word-break:break-word}
  #data-panel .cp-norad{font-size:9px;letter-spacing:.3em;color:rgba(255,255,255,0.32);margin-bottom:16px;text-transform:uppercase}
  #data-panel .cp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px 12px;border-top:1px solid rgba(255,255,255,0.08);padding-top:14px}
  #data-panel .cp-f.w2{grid-column:span 2} #data-panel .cp-f.w3{grid-column:span 3}
  #data-panel .cp-l{font-size:7px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,0.32);margin-bottom:3px}
  #data-panel .cp-v{font-size:12px;letter-spacing:.03em;color:rgba(255,255,255,0.88);line-height:1.35;overflow-wrap:anywhere}
  #data-panel .cp-warn{font-size:7.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-top:14px;padding:6px 9px;border:1px solid rgba(255,255,255,0.25)}
  #data-panel .cp-proj{font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;line-height:1.6;color:${CSS.proj};opacity:.7;margin-top:10px}
  #data-panel .cp-note{font-size:11px;letter-spacing:.02em;line-height:1.6;color:rgba(255,255,255,0.42);margin-top:14px;border-top:1px solid rgba(255,255,255,0.07);padding-top:12px}`;
  doc.head.appendChild(st);

  const esc2 = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function cardFor(obj){   // the same fields writeTargetToWorker sends to the companion
    const meta = getMeta(obj.norad), inf = inferFields(obj);
    return { norad: obj.norad, name: obj.name, type: obj.type, alt: obj.alt ? Math.round(obj.alt) : null,
      period: obj.mm ? (1440/obj.mm).toFixed(1) : null, inc: obj.inc ? (obj.inc*180/Math.PI).toFixed(2) : null,
      ecc: obj.ecc ? obj.ecc.toFixed(6) : null, raan: obj.raan ? (obj.raan*180/Math.PI).toFixed(2) : null,
      mm: obj.mm ? obj.mm.toFixed(8) : null, m0: obj.M0 ? (obj.M0*180/Math.PI).toFixed(4) : null,
      epoch: obj.epoch_ms ? new Date(obj.epoch_ms).toISOString().slice(0,19).replace('T',' ')+' UTC' : null,
      country: meta?.country || inf.country, launched: meta?.launched || inf.launched,
      purpose: meta?.purpose || inferPurpose(obj.name) || (obj.type===2 ? 'TRACKABLE DEBRIS' : null),
      note: meta?.note || null, sim_year: new Date(simTime).getUTCFullYear(), projected: false,
      warning: obj.type===2 ? 'TRACKABLE DEBRIS — UNCONTROLLED OBJECT' : (obj.alt && obj.alt<600) ? 'LOW ORBIT — ELEVATED COLLISION RISK ZONE' : null };
  }
  function renderCard(d){
    const proj = d.projected === true;
    const [label, colr] = proj ? ['PROJECTED', CSS.proj] : d.type===2 ? ['DEBRIS', CSS.debris] : d.type===1 ? ['GOVERNMENT', CSS.gov] : ['COMMERCIAL', CSS.priv];
    const yr = d.sim_year, now = new Date().getFullYear();
    const era = yr > now ? 'PROJECTED · '+yr : yr < now ? 'HISTORICAL · '+yr : 'PRESENT · '+yr;
    const f = (l, v, w='') => `<div class="cp-f ${w}"><div class="cp-l">${esc2(l)}</div><div class="cp-v">${esc2(v ?? '—')}</div></div>`;
    const deg = v => v != null && v !== '' ? v+'°' : '—';
    document.getElementById('data-panel').innerHTML = `
      <div class="cp-top"><div class="cp-badge" style="color:${colr}">${label}</div><div class="cp-year">${esc2(era)}</div></div>
      <div class="cp-name">${esc2(d.name || '—')}</div>
      <div class="cp-norad">${esc2(proj ? 'NOT YET CATALOGUED' + (d.constellation ? '  ·  '+d.constellation : '') : (d.norad ? 'NORAD  '+d.norad : ''))}</div>
      <div class="cp-grid">
        ${f('Purpose', d.purpose, 'w3')}${f('Country / Operator', d.country, 'w2')}${f('Launched', d.launched)}
        ${f('Altitude', d.alt ? Number(d.alt).toLocaleString()+' km' : null)}${f('Orbital Period', d.period ? d.period+' min' : null)}${f('Inclination', deg(d.inc))}
        ${f('Eccentricity', d.ecc)}${f('RAAN', deg(d.raan))}${f('Mean Anomaly', deg(d.m0))}
        ${f('Rev / Day', d.mm)}${f('Epoch', d.epoch, 'w2')}
      </div>
      ${d.warning ? `<div class="cp-warn">⚠ ${esc2(d.warning)}</div>` : ''}
      ${proj ? `<div class="cp-proj">⚠ This object does not exist yet — projected from constellation filings. All data is speculative.</div>` : ''}
      ${d.note ? `<div class="cp-note">${esc2(d.note)}</div>` : ''}`;
  }
  buildDataPanel = obj => renderCard(cardFor(obj));
  buildProjectedDataPanel = obj => { const pd = generateProjectedData(obj); currentProjectedData = pd; renderCard(pd); };
  if (!infoMode) document.getElementById('info-toggle').click();   // show the box for this review
  if (currentTarget && (state===S.INSPECT || state===S.ZOOM_IN)) (currentTarget.isProjected ? buildProjectedDataPanel : buildDataPanel)(currentTarget);
  return variant + ' applied';
};
