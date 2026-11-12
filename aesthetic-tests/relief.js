// Relief rendering for Crowded Sky v5 (after the "Soft dots" study): every object adds a soft mound to
// one screen-space height map; that single surface is lit with one light and shown in greyscale on a
// graphite ground, so neighbouring mounds merge with creases instead of overlapping as separate sprites.
// Runs inside a live v5 page. Orbit lines, target glow, reticle, timeline and all behaviour unchanged.
window.__applyRelief = function(opts = {}){
  const O = Object.assign({
    ground: [0.30, 0.30, 0.31],   // the lit flat surface (mid graphite, like the study's paper grey)
    relief: 0.85,                 // how far lit/shadow sides depart from the ground tone
    normalZ: 0.012,               // smaller = steeper relief (the study uses 0.01)
    ramp: 1.4,                    // height compression: summed mounds above this read as a plateau
    sizeMul: 3.2,                 // mound diameter relative to the original dot
    grain: 0.035,
    light: [-0.62, 0.52, 0.58],
  }, opts);

  // 1. Height pass: the same points (catalog + projected), drawn as additive soft mounds
  const hMat = new THREE.ShaderMaterial({
    uniforms: { sizeMul: { value: O.sizeMul } },
    vertexShader: `
      attribute float size; attribute float isDebris; uniform float sizeMul; varying float vDeb;
      void main(){ vDeb = isDebris; vec4 mv = modelViewMatrix * vec4(position, 1.);
        gl_PointSize = size * sizeMul * (680. / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying float vDeb;
      float bump(vec2 q, float r){ float d = length(q) / r; return d >= 1. ? 0. : pow(1. - d * d, 2.2); }
      void main(){
        vec2 u = gl_PointCoord - .5;
        float h;
        if (vDeb > .5) {   // debris: three small mounds
          h = max(bump(u - vec2(0., -.19), .16), max(bump(u - vec2(-.17, .10), .16), bump(u - vec2(.17, .10), .16))) * .7;
        } else h = bump(u, .5);
        if (h <= 0.) discard;
        gl_FragColor = vec4(h, 0., 0., 1.);
      }`,
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
  });
  const hScene = new THREE.Scene();
  const hPoints = new THREE.Points(pGeo, hMat), hProj = new THREE.Points(projGeo, hMat);
  hPoints.frustumCulled = hProj.frustumCulled = false;
  hScene.add(hPoints, hProj);
  // hide the original sprite layers (the relief replaces them)
  scene.children.filter(c => c.isPoints && c.material === pMat).forEach(c => c.visible = false);

  let hRT = null; const size = new THREE.Vector2();
  function ensureRT(){
    renderer.getDrawingBufferSize(size);
    if (!hRT || hRT.width !== size.x || hRT.height !== size.y) {
      hRT?.dispose();
      hRT = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    }
  }

  // 2. Lighting pass: replaces the (black) background layer
  fgMat.uniforms.uH = { value: null };
  fgMat.uniforms.uRes = { value: new THREE.Vector2() };
  fgMat.uniforms.uGround = { value: new THREE.Vector3(...O.ground) };
  fgMat.uniforms.uRelief = { value: O.relief };
  fgMat.uniforms.uNZ = { value: O.normalZ };
  fgMat.uniforms.uRamp = { value: O.ramp };
  fgMat.uniforms.uGrain = { value: O.grain };
  fgMat.uniforms.uL = { value: new THREE.Vector3(...O.light).normalize() };
  fgMat.fragmentShader = `
    uniform sampler2D uH; uniform vec2 uRes; uniform vec3 uGround, uL;
    uniform float uRelief, uNZ, uRamp, uGrain; varying vec2 vUV;
    float H(vec2 uv){ float h = texture2D(uH, uv).r; return smoothstep(0., uRamp, h); }
    float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main(){
      vec2 e = 1.5 / uRes;
      float hx = H(vUV - vec2(e.x, 0.)) - H(vUV + vec2(e.x, 0.));
      float hy = H(vUV - vec2(0., e.y)) - H(vUV + vec2(0., e.y));
      vec3 n = normalize(vec3(hx, hy, uNZ));
      float lit = dot(n, uL) - uL.z;                    // 0 on flat ground, + toward the light, - away
      vec3 c = uGround + vec3(lit * uRelief * .5);
      c += (hash(gl_FragCoord.xy) - .5) * uGrain;      // print grain
      gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
    }`;
  fgMat.needsUpdate = true;

  // 3. Fill the height map right before the background layer is drawn each frame
  const _render = renderer.render.bind(renderer);
  renderer.render = function(s, c){
    if (s === fgScene) {
      ensureRT();
      hScene.rotation.copy(scene.rotation);
      hMat.uniforms.sizeMul.value = O.sizeMul;
      const prevTarget = renderer.getRenderTarget(), prevAuto = renderer.autoClear;
      renderer.setRenderTarget(hRT); renderer.setClearColor(0x000000, 1); renderer.clear();
      _render(hScene, camera);
      renderer.setRenderTarget(prevTarget); renderer.autoClear = prevAuto;
      fgMat.uniforms.uH.value = hRT.texture;
      fgMat.uniforms.uRes.value.copy(size);
    }
    return _render(s, c);
  };
  window.__relief = { O, hMat, fgMat };   // for live tuning
  return 'relief applied';
};
