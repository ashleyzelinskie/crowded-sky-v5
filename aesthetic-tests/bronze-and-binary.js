// Runs inside a live v5 page: polished-bronze UI accents (replacing red) + full-catalog binary column.
window.__bronzeAndBinary = function(){
  // ── 1. Polished bronze instead of red ──────────────────────────────────────
  const st = document.createElement('style');
  st.textContent = `
  :root{
    --bz-grad: linear-gradient(110deg,#6e4421 0%,#b98146 18%,#f6dcae 34%,#c48d53 48%,#ecc792 64%,#8f5d2f 82%,#d9a96f 100%);
    --bz: #c99559; --bz-hi: #f6dcae;
  }
  @keyframes bzSheen{0%{background-position:0% 50%}100%{background-position:200% 50%}}
  /* metal text: gradient clipped to the letters, with a slow moving highlight */
  #reticle-label,#reticle-norad,#state-label,#tl-today-label,#tl-era,#new-obj-banner{
    background:var(--bz-grad);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;
    color:transparent!important;animation:bzSheen 7s linear infinite}
  #new-obj-banner{opacity:0}   /* hidden until flashNewObject() shows it */
  #reticle-norad,#state-label,#tl-era{opacity:.75}
  /* reticle corners and crosshair */
  #reticle .corner{border-image:var(--bz-grad) 1!important;filter:drop-shadow(0 0 2px rgba(246,220,174,.35))}
  #reticle-h,#reticle-v{background:var(--bz-grad)!important;background-size:200% 100%!important}
  #reticle-dot{box-shadow:0 0 6px 2px rgba(246,220,174,.9),0 0 14px 5px rgba(201,149,89,.45)!important}
  /* timeline TODAY marker */
  #tl-today{background:var(--bz-grad)!important;box-shadow:0 0 4px rgba(246,220,174,.55)}
  /* info button */
  #info-toggle.active{border-color:var(--bz)!important}
  #info-toggle.active svg{stroke:var(--bz-hi)!important}
  /* new-object banner frame */
  #new-obj-banner{border:1px solid transparent!important;border-image:var(--bz-grad) 1!important}
  /* binary column: driven by script now, not the CSS loop */
  #binary-inner{animation:none!important}`;
  document.head.appendChild(st);

  // ── 2. Binary column: every object in the catalog, streamed ────────────────
  const inner = document.getElementById('binary-inner');
  const LINE = 6.5 * 1.7;                 // font-size × line-height, as in the original
  const SPEED = 36.8;                      // px per second — the original scroll speed
  const toBin = (n, b) => (Math.abs(n) >>> 0).toString(2).padStart(b, '0');
  const line = o => toBin(o.norad || 0, 17) + ' ' + toBin(Math.round(o.alt) || 0, 14) + ' ' + toBin(Math.round((o.inc || 0) * 1000), 16);
  buildBinaryScroll = function(){ /* replaced by the streaming column below */ };
  let offset = 0, last = performance.now(), shownStart = -1;
  function frame(now){
    const n = objects.length;
    if (n) {
      offset += SPEED * Math.min(0.1, (now - last) / 1000);
      const start = Math.floor(offset / LINE) % n;
      const rows = Math.ceil(innerHeight / LINE) + 2;
      if (start !== shownStart) {
        let s = '';
        for (let i = 0; i < rows; i++) s += line(objects[(start + i) % n]) + '\n';
        inner.textContent = s;
        shownStart = start;
      }
      inner.style.transform = `translateY(${-(offset % LINE)}px)`;
    }
    last = now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return 'bronze accents + full-catalog binary applied (' + objects.length + ' objects)';
};
