/* ==========================================================================
   APP.JS — Premium Portfolio Engine
   Three.js 3D Scene · GSAP Animations · Custom Cursor · Scroll Logic
   ========================================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     CONFIGURATION
     ----------------------------------------------------------------------- */
  const CONFIG = {
    cursor: {
      lerpSpeed: 0.15,
      dotLerpSpeed: 0.6,
    },
    three: {
      isMobile: window.innerWidth < 768,
    },
    preloader: {
      duration: 2.6,
    },
  };

  /* -----------------------------------------------------------------------
     PRELOADER
     ----------------------------------------------------------------------- */
  function initPreloader(onComplete) {
    document.body.classList.add('is-loading');

    const numberEl = document.getElementById('preloader-number');
    const barEl = document.getElementById('preloader-bar');
    const preloaderEl = document.getElementById('preloader');
    if (!numberEl || !barEl || !preloaderEl) { onComplete(); return; }

    const counter = { value: 0 };

    gsap.to(counter, {
      value: 100,
      duration: CONFIG.preloader.duration,
      ease: 'power2.inOut',
      onUpdate: function () {
        const val = Math.floor(counter.value);
        numberEl.textContent = val;
        barEl.style.width = val + '%';
      },
      onComplete: function () {
        gsap.to(preloaderEl, {
          yPercent: -100,
          duration: 1,
          ease: 'power4.inOut',
          delay: 0.35,
          onComplete: function () {
            preloaderEl.style.display = 'none';
            document.body.classList.remove('is-loading');
            onComplete();
          },
        });
      },
    });
  }

  /* -----------------------------------------------------------------------
     CUSTOM CURSOR
     ----------------------------------------------------------------------- */
  function initCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    const cursorEl = document.getElementById('cursor');
    const dotEl = document.getElementById('cursor-dot');
    if (!cursorEl || !dotEl) return;

    const labelEl = cursorEl.querySelector('.cursor__label');

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Dot follows instantly
      dotEl.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px) translate(-50%, -50%)';
    });

    function renderCursor() {
      cursorX += (mouseX - cursorX) * CONFIG.cursor.lerpSpeed;
      cursorY += (mouseY - cursorY) * CONFIG.cursor.lerpSpeed;
      cursorEl.style.transform = 'translate(' + cursorX + 'px, ' + cursorY + 'px)';
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Hover states
    var interactiveEls = document.querySelectorAll(
      'a, button, [data-magnetic], .btn, .work__item, .service-card, input, textarea'
    );

    interactiveEls.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        var label = el.getAttribute('data-cursor-label');
        if (label) {
          cursorEl.classList.add('has-label');
          cursorEl.classList.remove('is-hovering');
          if (labelEl) labelEl.textContent = label;
        } else {
          cursorEl.classList.add('is-hovering');
          cursorEl.classList.remove('has-label');
        }
      });

      el.addEventListener('mouseleave', function () {
        cursorEl.classList.remove('is-hovering', 'has-label');
        if (labelEl) labelEl.textContent = '';
      });
    });
  }

  /* -----------------------------------------------------------------------
     THREE.JS — HYBRID NEURAL CRYSTAL SCENE
     Center: Morphing iridescent crystal sphere with glow aura
     Mid-layer: Neural network nodes + dynamic connections
     Outer: Orbiting particles + ambient dust
     ----------------------------------------------------------------------- */
  function initThreeScene() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.z = 6.5;

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !CONFIG.three.isMobile,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    var isMobile = window.innerWidth < 768;

    // =====================================================================
    //  LAYER 1 — CENTER MORPHING CRYSTAL SPHERE
    // =====================================================================
    var sphereGeom = new THREE.IcosahedronGeometry(1.4, isMobile ? 4 : 5);

    var crystalVertexShader = [
      'uniform float uTime;',
      'uniform float uHover;',
      'varying vec3 vNormal;',
      'varying vec3 vPosition;',
      'varying float vDisplacement;',
      '',
      'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
      'vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
      'vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }',
      'vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',
      '',
      'float snoise(vec3 v) {',
      '  const vec2 C = vec2(1.0/6.0, 1.0/3.0);',
      '  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
      '  vec3 i = floor(v + dot(v, C.yyy));',
      '  vec3 x0 = v - i + dot(i, C.xxx);',
      '  vec3 g = step(x0.yzx, x0.xyz);',
      '  vec3 l = 1.0 - g;',
      '  vec3 i1 = min(g.xyz, l.zxy);',
      '  vec3 i2 = max(g.xyz, l.zxy);',
      '  vec3 x1 = x0 - i1 + C.xxx;',
      '  vec3 x2 = x0 - i2 + C.yyy;',
      '  vec3 x3 = x0 - D.yyy;',
      '  i = mod289(i);',
      '  vec4 p = permute(permute(permute(',
      '    i.z + vec4(0.0, i1.z, i2.z, 1.0))',
      '  + i.y + vec4(0.0, i1.y, i2.y, 1.0))',
      '  + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
      '  float n_ = 0.142857142857;',
      '  vec3 ns = n_ * D.wyz - D.xzx;',
      '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);',
      '  vec4 x_ = floor(j * ns.z);',
      '  vec4 y_ = floor(j - 7.0 * x_);',
      '  vec4 x = x_ * ns.x + ns.yyyy;',
      '  vec4 y = y_ * ns.x + ns.yyyy;',
      '  vec4 h = 1.0 - abs(x) - abs(y);',
      '  vec4 b0 = vec4(x.xy, y.xy);',
      '  vec4 b1 = vec4(x.zw, y.zw);',
      '  vec4 s0 = floor(b0) * 2.0 + 1.0;',
      '  vec4 s1 = floor(b1) * 2.0 + 1.0;',
      '  vec4 sh = -step(h, vec4(0.0));',
      '  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;',
      '  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;',
      '  vec3 p0 = vec3(a0.xy, h.x);',
      '  vec3 p1 = vec3(a0.zw, h.y);',
      '  vec3 p2 = vec3(a1.xy, h.z);',
      '  vec3 p3 = vec3(a1.zw, h.w);',
      '  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));',
      '  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;',
      '  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);',
      '  m = m * m;',
      '  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));',
      '}',
      '',
      'void main() {',
      '  vNormal = normalize(normalMatrix * normal);',
      '  float speed = uTime * 0.25;',
      '  float n1 = snoise(position * 1.2 + speed) * 0.15;',
      '  float n2 = snoise(position * 2.4 + speed * 1.3) * 0.07;',
      '  float n3 = snoise(position * 4.8 + speed * 0.7) * 0.03;',
      '  float displacement = (n1 + n2 + n3) * (1.0 + uHover * 0.35);',
      '  vDisplacement = displacement;',
      '  vec3 newPos = position + normal * displacement;',
      '  vPosition = newPos;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);',
      '}'
    ].join('\n');

    var crystalFragmentShader = [
      'uniform float uTime;',
      'varying vec3 vNormal;',
      'varying vec3 vPosition;',
      'varying float vDisplacement;',
      '',
      'void main() {',
      '  vec3 viewDir = normalize(cameraPosition - vPosition);',
      '  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);',
      '  float angle = dot(vNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;',
      '  float shift = vDisplacement * 4.0 + uTime * 0.15;',
      '  vec3 col1 = vec3(0.784, 0.663, 0.494);',
      '  vec3 col2 = vec3(0.92, 0.88, 0.82);',
      '  vec3 col3 = vec3(0.55, 0.52, 0.65);',
      '  float t = fract(angle + shift);',
      '  vec3 iri = t < 0.33 ? mix(col1, col2, t / 0.33) : t < 0.66 ? mix(col2, col3, (t - 0.33) / 0.33) : mix(col3, col1, (t - 0.66) / 0.34);',
      '  vec3 surface = mix(vec3(0.06, 0.055, 0.07), iri, 0.25 + fresnel * 0.5);',
      '  surface += col1 * fresnel * 0.8;',
      '  surface += col1 * (sin(uTime * 0.6) * 0.5 + 0.5) * 0.04;',
      '  gl_FragColor = vec4(surface, 0.88 + fresnel * 0.12);',
      '}'
    ].join('\n');

    var crystalUniforms = { uTime: { value: 0 }, uHover: { value: 0 } };

    var crystalMat = new THREE.ShaderMaterial({
      vertexShader: crystalVertexShader,
      fragmentShader: crystalFragmentShader,
      uniforms: crystalUniforms,
      transparent: true,
      side: THREE.FrontSide,
    });

    var crystal = new THREE.Mesh(sphereGeom, crystalMat);
    scene.add(crystal);

    // Wireframe shell
    var wireMat = new THREE.MeshBasicMaterial({
      color: 0xC8A97E, wireframe: true, transparent: true,
      opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var wireOverlay = new THREE.Mesh(new THREE.IcosahedronGeometry(1.42, 3), wireMat);
    scene.add(wireOverlay);

    // Glow aura
    var glowMat = new THREE.ShaderMaterial({
      vertexShader: [
        'varying vec3 vN;',
        'void main() {',
        '  vN = normalize(normalMatrix * normal);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vN;',
        'void main() {',
        '  float i = pow(0.65 - dot(vN, vec3(0.0,0.0,1.0)), 3.5);',
        '  gl_FragColor = vec4(0.784, 0.663, 0.494, i * 0.3);',
        '}'
      ].join('\n'),
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.BackSide, depthWrite: false,
    });
    var glowMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 4), glowMat);
    scene.add(glowMesh);

    // =====================================================================
    //  LAYER 2 — NEURAL NETWORK (nodes + connections)
    // =====================================================================
    var nodeCount = isMobile ? 50 : 100;
    var nodePositions = [];
    var nodeGeom = new THREE.BufferGeometry();
    var nodeArr = new Float32Array(nodeCount * 3);
    var nodeSizes = new Float32Array(nodeCount);

    for (var ni = 0; ni < nodeCount; ni++) {
      // Distribute in a shell around the crystal (radius 2.2 — 4.2)
      var nr = 2.2 + Math.random() * 2.0;
      var ntheta = Math.random() * Math.PI * 2;
      var nphi = Math.acos(2 * Math.random() - 1);
      var nx = nr * Math.sin(nphi) * Math.cos(ntheta) * 1.15;
      var ny = nr * Math.sin(nphi) * Math.sin(ntheta) * 0.9;
      var nz = nr * Math.cos(nphi);
      nodeArr[ni * 3] = nx;
      nodeArr[ni * 3 + 1] = ny;
      nodeArr[ni * 3 + 2] = nz;
      nodePositions.push(new THREE.Vector3(nx, ny, nz));
      nodeSizes[ni] = 0.03 + Math.random() * 0.05;
    }

    nodeGeom.setAttribute('position', new THREE.BufferAttribute(nodeArr, 3));
    nodeGeom.setAttribute('size', new THREE.BufferAttribute(nodeSizes, 1));

    var nodeVertShader = [
      'attribute float size;',
      'varying float vAlpha;',
      'void main() {',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = size * (300.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '  vAlpha = size / 0.08;',
      '}'
    ].join('\n');

    var nodeFragShader = [
      'varying float vAlpha;',
      'void main() {',
      '  float d = length(gl_PointCoord - vec2(0.5));',
      '  if (d > 0.5) discard;',
      '  float glow = 1.0 - smoothstep(0.0, 0.5, d);',
      '  gl_FragColor = vec4(0.784, 0.663, 0.494, glow * vAlpha * 0.85);',
      '}'
    ].join('\n');

    var nodeMat = new THREE.ShaderMaterial({
      vertexShader: nodeVertShader, fragmentShader: nodeFragShader,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });

    var nodePoints = new THREE.Points(nodeGeom, nodeMat);
    scene.add(nodePoints);

    // Store originals for breathing
    var origNodePos = new Float32Array(nodeArr);

    // Build connections
    var connThreshold = isMobile ? 2.4 : 2.1;
    var lineVerts = [];
    for (var ca = 0; ca < nodePositions.length; ca++) {
      for (var cb = ca + 1; cb < nodePositions.length; cb++) {
        if (nodePositions[ca].distanceTo(nodePositions[cb]) < connThreshold) {
          lineVerts.push(
            nodePositions[ca].x, nodePositions[ca].y, nodePositions[ca].z,
            nodePositions[cb].x, nodePositions[cb].y, nodePositions[cb].z
          );
        }
      }
    }

    var lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));

    var lineMat = new THREE.LineBasicMaterial({
      color: 0xC8A97E, transparent: true, opacity: 0.06,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var lineSegments = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lineSegments);

    // Faint lines connecting some nodes to the crystal center
    var coreLinkVerts = [];
    for (var cl = 0; cl < nodeCount; cl += (isMobile ? 5 : 3)) {
      coreLinkVerts.push(0, 0, 0);
      coreLinkVerts.push(nodeArr[cl * 3], nodeArr[cl * 3 + 1], nodeArr[cl * 3 + 2]);
    }
    var coreLinkGeom = new THREE.BufferGeometry();
    coreLinkGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(coreLinkVerts), 3));
    var coreLinkMat = new THREE.LineBasicMaterial({
      color: 0xC8A97E, transparent: true, opacity: 0.025,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var coreLinks = new THREE.LineSegments(coreLinkGeom, coreLinkMat);
    scene.add(coreLinks);

    // =====================================================================
    //  LAYER 3 — ORBITING PARTICLES
    // =====================================================================
    var orbitCount = isMobile ? 120 : 300;
    var orbitGeom = new THREE.BufferGeometry();
    var orbitArr = new Float32Array(orbitCount * 3);
    var orbitAngles = new Float32Array(orbitCount);
    var orbitRadii = new Float32Array(orbitCount);
    var orbitSpeeds = new Float32Array(orbitCount);
    var orbitTilts = new Float32Array(orbitCount);

    for (var oi = 0; oi < orbitCount; oi++) {
      orbitAngles[oi] = Math.random() * Math.PI * 2;
      orbitRadii[oi] = 3.0 + Math.random() * 1.8;
      orbitSpeeds[oi] = 0.08 + Math.random() * 0.12;
      orbitTilts[oi] = (Math.random() - 0.5) * 1.6;
      orbitArr[oi * 3] = Math.cos(orbitAngles[oi]) * orbitRadii[oi];
      orbitArr[oi * 3 + 1] = orbitTilts[oi];
      orbitArr[oi * 3 + 2] = Math.sin(orbitAngles[oi]) * orbitRadii[oi];
    }

    orbitGeom.setAttribute('position', new THREE.BufferAttribute(orbitArr, 3));

    var orbitMat = new THREE.ShaderMaterial({
      vertexShader: [
        'varying float vA;',
        'void main() {',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  float dist = length(position.xz);',
        '  gl_PointSize = (2.2 / -mv.z) * (1.0 + (dist - 3.0) * 0.2);',
        '  gl_Position = projectionMatrix * mv;',
        '  vA = smoothstep(5.0, 3.0, dist);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying float vA;',
        'void main() {',
        '  float d = length(gl_PointCoord - vec2(0.5));',
        '  if (d > 0.5) discard;',
        '  float g = 1.0 - smoothstep(0.0, 0.5, d);',
        '  gl_FragColor = vec4(0.784, 0.663, 0.494, g * vA * 0.55);',
        '}'
      ].join('\n'),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var orbitPoints = new THREE.Points(orbitGeom, orbitMat);
    scene.add(orbitPoints);

    // =====================================================================
    //  AMBIENT DUST
    // =====================================================================
    var dustCount = isMobile ? 150 : 500;
    var dustGeom = new THREE.BufferGeometry();
    var dustArr = new Float32Array(dustCount * 3);
    for (var di = 0; di < dustCount * 3; di += 3) {
      dustArr[di] = (Math.random() - 0.5) * 18;
      dustArr[di + 1] = (Math.random() - 0.5) * 14;
      dustArr[di + 2] = (Math.random() - 0.5) * 12;
    }
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustArr, 3));
    var dustMat = new THREE.PointsMaterial({
      color: 0x777777, size: isMobile ? 0.012 : 0.008,
      sizeAttenuation: true, transparent: true, opacity: 0.18,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    var dustPoints = new THREE.Points(dustGeom, dustMat);
    scene.add(dustPoints);

    // =====================================================================
    //  MOUSE + RENDER LOOP
    // =====================================================================
    var mouse = { x: 0, y: 0 };
    var smoothMouse = { x: 0, y: 0 };
    var isHovering = false;
    var heroVisible = true;

    window.addEventListener('mousemove', function (e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    var heroEl = document.querySelector('.hero');
    if (heroEl) {
      heroEl.addEventListener('mouseenter', function () { isHovering = true; });
      heroEl.addEventListener('mouseleave', function () { isHovering = false; });
    }

    // Track hero visibility for render throttling
    if ('IntersectionObserver' in window) {
      var heroObs = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0 });
      if (heroEl) heroObs.observe(heroEl);
    }

    // Whole scene group for unified rotation
    var networkGroup = new THREE.Group();
    networkGroup.add(nodePoints);
    networkGroup.add(lineSegments);
    networkGroup.add(coreLinks);
    scene.add(networkGroup);

    function animate() {
      requestAnimationFrame(animate);

      // Skip rendering when hero is off-screen
      if (!heroVisible) return;

      var time = performance.now() * 0.001;
      crystalUniforms.uTime.value = time;

      // Smooth mouse
      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.03;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.03;

      // Hover lerp
      var hTarget = isHovering ? 1.0 : 0.0;
      crystalUniforms.uHover.value += (hTarget - crystalUniforms.uHover.value) * 0.05;

      // ---- Crystal rotation ----
      crystal.rotation.y = time * 0.1 + smoothMouse.x * 0.25;
      crystal.rotation.x = Math.sin(time * 0.07) * 0.12 + smoothMouse.y * 0.15;
      wireOverlay.rotation.copy(crystal.rotation);
      glowMesh.rotation.y = crystal.rotation.y * 0.4;

      // ---- Neural network: breathe + rotate ----
      var nPos = nodeGeom.attributes.position.array;
      for (var j = 0; j < nPos.length; j += 3) {
        var ox = origNodePos[j], oy = origNodePos[j + 1], oz = origNodePos[j + 2];
        var pulse = Math.sin(time * 0.5 + ox * 1.2) * 0.06 + Math.cos(time * 0.4 + oz) * 0.04;
        nPos[j] = ox + pulse * 0.6;
        nPos[j + 1] = oy + pulse * 0.5;
        nPos[j + 2] = oz + pulse * 0.4;
      }
      nodeGeom.attributes.position.needsUpdate = true;

      // Network rotates opposite to crystal — creates depth
      networkGroup.rotation.y = -time * 0.04 + smoothMouse.x * 0.12;
      networkGroup.rotation.x = smoothMouse.y * 0.08;

      // Connection pulse
      lineMat.opacity = 0.045 + Math.sin(time * 0.7) * 0.025;
      coreLinkMat.opacity = 0.018 + Math.sin(time * 0.5) * 0.012;

      // ---- Orbiting particles ----
      var op = orbitGeom.attributes.position.array;
      for (var ok = 0; ok < orbitCount; ok++) {
        orbitAngles[ok] += orbitSpeeds[ok] * 0.006;
        var oa = orbitAngles[ok];
        var or2 = orbitRadii[ok];
        op[ok * 3] = Math.cos(oa) * or2;
        op[ok * 3 + 1] = orbitTilts[ok] + Math.sin(oa * 2.0 + time * 0.25) * 0.3;
        op[ok * 3 + 2] = Math.sin(oa) * or2;
      }
      orbitGeom.attributes.position.needsUpdate = true;
      orbitPoints.rotation.y = time * 0.015;

      // ---- Dust ----
      dustPoints.rotation.y = time * 0.006;
      dustPoints.rotation.x = Math.sin(time * 0.04) * 0.02;

      // ---- Glow pulse ----
      var gs = 1.0 + Math.sin(time * 0.45) * 0.03;
      glowMesh.scale.set(gs, gs, gs);

      renderer.render(scene, camera);
    }

    animate();

    /* ===== RESIZE ===== */
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      }, 150);
    });
  }

  /* -----------------------------------------------------------------------
     GSAP SCROLL ANIMATIONS
     ----------------------------------------------------------------------- */
  function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // --- Hero Parallax on scroll ---
    gsap.to('.hero__content', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
      },
      y: -120,
      opacity: 0,
      ease: 'none',
    });

    gsap.to('.hero__canvas', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
      },
      opacity: 0,
      scale: 0.92,
      ease: 'none',
    });

    gsap.to('.hero__footer', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '40% top',
        scrub: 0.5,
      },
      opacity: 0,
      y: -30,
      ease: 'none',
    });

    // --- Fade Up animations ---
    document.querySelectorAll('[data-animation="fade-up"]').forEach(function (el) {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 98%',
          toggleActions: 'play none none none',
          once: true,
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    // --- Text reveal animations (hero) ---
    document.querySelectorAll('[data-animation="reveal"]').forEach(function (el) {
      var inner = el.querySelector('span');
      if (!inner) return;

      gsap.set(inner, { yPercent: 120 });
    });

    // --- Stats counter animation ---
    document.querySelectorAll('.stat__number[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var obj = { value: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            value: target,
            duration: 2.2,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = Math.floor(obj.value);
            },
          });
        },
      });
    });

    // --- Marquee speed on scroll ---
    gsap.to('.marquee__track', {
      scrollTrigger: {
        trigger: '.marquee',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      x: -80,
      ease: 'none',
    });
  }

  /* -----------------------------------------------------------------------
     HERO ENTRANCE ANIMATION (after preloader)
     ----------------------------------------------------------------------- */
  function animateHeroEntrance() {
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Title lines reveal
    var revealSpans = document.querySelectorAll('[data-animation="reveal"] span');
    tl.to(revealSpans, {
      yPercent: 0,
      duration: 1.2,
      stagger: 0.12,
    }, 0);

    // Label fade up
    tl.from('.hero__label span', {
      y: 30,
      opacity: 0,
      duration: 0.9,
    }, 0.3);

    // Subtitle fade up
    tl.from('.hero__subtitle', {
      y: 35,
      opacity: 0,
      duration: 0.9,
    }, 0.5);

    // Footer items
    tl.from('.hero__footer > *', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
    }, 0.7);

    // Nav
    tl.from('.nav', {
      y: -20,
      opacity: 0,
      duration: 0.7,
    }, 0.6);

    return tl;
  }

  /* -----------------------------------------------------------------------
     NAVIGATION BEHAVIOR
     ----------------------------------------------------------------------- */
  function initNavigation() {
    var nav = document.getElementById('nav');
    var hamburger = document.getElementById('nav-hamburger');
    var overlay = document.getElementById('menu-overlay');
    var lastScroll = 0;
    var isMenuOpen = false;

    // Scroll behavior — show/hide, add background
    window.addEventListener('scroll', function () {
      if (isMenuOpen) return;
      var currentScroll = window.scrollY;

      if (currentScroll > 100) {
        nav.classList.add('is-scrolled');
      } else {
        nav.classList.remove('is-scrolled');
      }

      if (currentScroll > lastScroll && currentScroll > 250) {
        nav.classList.add('is-hidden');
      } else {
        nav.classList.remove('is-hidden');
      }

      lastScroll = currentScroll;
    });

    // Hamburger toggle
    if (hamburger && overlay) {
      hamburger.addEventListener('click', function () {
        isMenuOpen = !isMenuOpen;
        hamburger.classList.toggle('is-active', isMenuOpen);
        overlay.classList.toggle('is-open', isMenuOpen);
        document.body.classList.toggle('menu-open', isMenuOpen);

        if (isMenuOpen) {
          nav.classList.remove('is-hidden');
          gsap.from('.menu-overlay__link span', {
            yPercent: 110,
            opacity: 0,
            stagger: 0.07,
            duration: 0.85,
            ease: 'power3.out',
            delay: 0.2,
          });
          gsap.from('.menu-overlay__footer a', {
            y: 20,
            opacity: 0,
            stagger: 0.05,
            duration: 0.6,
            ease: 'power3.out',
            delay: 0.5,
          });
        }
      });

      // Close on link click
      overlay.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          isMenuOpen = false;
          hamburger.classList.remove('is-active');
          overlay.classList.remove('is-open');
          document.body.classList.remove('menu-open');
        });
      });
    }
  }

  /* -----------------------------------------------------------------------
     MAGNETIC BUTTONS
     ----------------------------------------------------------------------- */
  function initMagnetic() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;

        gsap.to(el, {
          x: x * 0.25,
          y: y * 0.25,
          duration: 0.5,
          ease: 'power2.out',
        });
      });

      el.addEventListener('mouseleave', function () {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: 'elastic.out(1, 0.5)',
        });
      });
    });
  }

  /* -----------------------------------------------------------------------
     SMOOTH ANCHOR SCROLLING
     ----------------------------------------------------------------------- */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href === '#') return;

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        gsap.to(window, {
          scrollTo: { y: target, offsetY: 80 },
          duration: 1,
          ease: 'power3.inOut',
        });
      });
    });
  }

  /* -----------------------------------------------------------------------
     PARALLAX EFFECTS
     ----------------------------------------------------------------------- */
  function initParallax() {
    // Portrait accent offset
    var accent = document.querySelector('.about__portrait-accent');
    if (accent) {
      gsap.to(accent, {
        scrollTrigger: {
          trigger: '.about__portrait',
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
        },
        y: -20,
        x: 8,
        ease: 'none',
      });
    }

    // Service cards stagger
    gsap.utils.toArray('.service-card').forEach(function (card, i) {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 92%',
          toggleActions: 'play none none none',
        },
        y: 60,
        opacity: 0,
        duration: 0.9,
        delay: i * 0.1,
        ease: 'power3.out',
      });
    });
  }

  /* -----------------------------------------------------------------------
     CREDENTIALS — Scroll-driven horizontal movement (pinned)
     ----------------------------------------------------------------------- */
  function initCredsScroll() {
    var section = document.querySelector('.creds');
    var track = document.querySelector('.creds__track');
    var scroll = document.querySelector('.creds__scroll');
    if (!section || !track || !scroll) return;

    // Delay to ensure DOM layout is fully settled
    setTimeout(function () {
      var scrollWidth = scroll.scrollWidth;
      var viewWidth = track.offsetWidth;
      var distance = scrollWidth - viewWidth;

      if (distance <= 0) return;

      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;

      gsap.set(scroll, { x: 0 });

      gsap.to(scroll, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top ' + navH + 'px',
          end: '+=' + (distance + viewWidth * 0.2),
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: -1,
        },
      });

      // Double-refresh to ensure all pinned spacing is correct
      ScrollTrigger.refresh(true);
    }, 300);
  }

  /* -----------------------------------------------------------------------
     INTERACTIVE TERMINAL
     ----------------------------------------------------------------------- */
  function initTerminal() {
    var input = document.getElementById('terminal-input');
    var body = document.getElementById('terminal-body');
    if (!input || !body) return;

    var commands = {
      help: 'Available commands: <strong>about</strong>, <strong>skills</strong>, <strong>projects</strong>, <strong>hackathons</strong>, <strong>achievements</strong>, <strong>education</strong>, <strong>contact</strong>, <strong>clear</strong>',
      about: 'Abhinav Sai Madapati — B.Tech CSE student at VIT-AP University, specializing in AI & ML. Top Contributor (1st place) in the GDG Git & GitHub Open Source Challenge with 30 PRs, 2nd place in ElectroQuest (IETE), Oracle certified, and GDG AI/ML & Data Analytics team member (2025-2026).',
      skills: 'Python, Java, TypeScript, JavaScript, React, Next.js, TensorFlow, Google Cloud, Firebase, Gemini API, Node.js, Three.js, GSAP, FastAPI, Docker, Git',
      projects: '1. Quallium AI — AI platform\n2. EduVision-X — Education tech\n3. Code Vision — Dev tool\n4. Sentiment Analysis — NLP/ML\n5. CivicAI — AI Agent (Gemini API, Top 15/53)\n6. LaundryHub — QR-based Firebase app\n7. CricketConnect Pro — Sports\n8. Ultimate Career AI — Career Advisor',
      hackathons: '1. HackAura VITaura\'25 — CivicAI, Top 15 of 53 teams\n2. TechSprint \'25 (GDG) — LaundryHub, Round 2 qualifier\n3. Radiothon Hackathon (CSI VIT-AP)\n4. Gen AI Exchange 2025 (Google Cloud)',
      achievements: '1. 1st Place — Git & GitHub Open Source Challenge (GDG On Campus VIT-AP), Top Contributor with 30 PRs\n2. 2nd Place — ElectroQuest (IETE), ECE-focused technical event\n3. HackAura VITaura\'25 — Top 15 of 53 teams',
      education: 'VIT-AP University (2024-2028) — B.Tech CSE, AI & ML\nNarayana Junior College (2022-2024) — Intermediate MPC\nSri Chaitanya Techno School — 10th Standard',
      contact: 'Email: abhinavsaimadapati@gmail.com\nGitHub: github.com/abhinavsai2006\nLinkedIn: linkedin.com/in/madapati-abhinav-sai',
    };

    function addLine(text, type) {
      var line = document.createElement('div');
      line.className = 'terminal__line' + (type ? ' terminal__line--' + type : '');
      line.innerHTML = '<span class="terminal__prompt">$</span><span class="terminal__text">' + text + '</span>';
      body.appendChild(line);
      body.scrollTop = body.scrollHeight;
    }

    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var cmd = input.value.trim().toLowerCase();
      if (!cmd) return;

      addLine(cmd, 'cmd');
      input.value = '';

      if (cmd === 'clear') {
        body.innerHTML = '';
        addLine('Terminal cleared. Type <strong>help</strong> for commands.', 'response');
        return;
      }

      var response = commands[cmd];
      if (response) {
        response.split('\n').forEach(function (line) {
          addLine(line, 'response');
        });
      } else {
        addLine('Command not found: <strong>' + cmd.replace(/[<>&"']/g, '') + '</strong>. Type <strong>help</strong> for available commands.', 'response');
      }
    });
  }

  /* -----------------------------------------------------------------------
     CONTACT FORM
     ----------------------------------------------------------------------- */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    if (!form || !status) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('.contact-form__submit');
      btn.disabled = true;
      status.textContent = 'Sending...';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      })
        .then(function (res) {
          if (res.ok) {
            status.textContent = 'Message sent! I\'ll get back to you soon.';
            status.style.color = '#27c93f';
            form.reset();
          } else {
            status.textContent = 'Something went wrong. Try emailing me directly.';
            status.style.color = '#ff5f56';
          }
          btn.disabled = false;
        })
        .catch(function () {
          status.textContent = 'Network error. Please try again.';
          status.style.color = '#ff5f56';
          btn.disabled = false;
        });
    });
  }

  /* -----------------------------------------------------------------------
     AI CHATBOT
     ----------------------------------------------------------------------- */
  function initChatbot() {
    var toggle = document.getElementById('chatbot-toggle');
    var win = document.getElementById('chatbot-window');
    var close = document.getElementById('chatbot-close');
    var input = document.getElementById('chatbot-input');
    var send = document.getElementById('chatbot-send');
    var messages = document.getElementById('chatbot-messages');
    if (!toggle || !win || !input) return;

    toggle.addEventListener('click', function () {
      win.classList.toggle('is-open');
      if (win.classList.contains('is-open')) input.focus();
    });

    if (close) {
      close.addEventListener('click', function () {
        win.classList.remove('is-open');
      });
    }

    var knowledge = {
      projects: 'Abhinav has built 50+ projects including: Quallium AI (AI platform), EduVision-X (education tech), CivicAI (AI agent for city issue management using Gemini API — Top 15/53 at HackAura), Code Vision (developer tool), Sentiment Analysis (NLP/ML), LaundryHub (QR-based Firebase platform — TechSprint Round 2), CricketConnect Pro (sports platform), and Ultimate Career AI.',
      skills: 'His core skills include Python, Java, TypeScript, JavaScript, React, Next.js, TensorFlow, Google Cloud, Firebase, Gemini API, Node.js, Three.js, GSAP, and FastAPI. He specializes in AI & Machine Learning.',
      education: 'He\'s pursuing B.Tech CSE with AI & ML specialization at VIT-AP University (2024-2028). Previously at Narayana Junior College (MPC) and Sri Chaitanya Techno School.',
      experience: 'He\'s an AI/ML & Data Analytics Team Member at Google Developer Groups VIT-AP (2025-2026). He was recognized as 1st place Top Contributor in the GDG Git & GitHub Open Source Challenge with 30 PRs, secured 2nd place in ElectroQuest (IETE), and placed Top 15/53 at HackAura building CivicAI.',
      hackathon: 'Abhinav competed in 4 hackathons: HackAura VITaura\'25 (CivicAI, Top 15/53), TechSprint \'25 (LaundryHub, Round 2), Radiothon (CSI VIT-AP), and Gen AI Exchange 2025 (Google Cloud). His first hackathon was HackAura where he built an AI agentic pipeline.',
      achievements: 'Recent highlights: 1st place in the Git & GitHub Open Source Challenge by GDG On Campus VIT-AP (Top Contributor with 30 PRs), 2nd place in ElectroQuest conducted by IETE, and Top 15/53 at HackAura VITaura\'25.',
      electroquest: 'Abhinav secured 2nd place in ElectroQuest, an ECE-focused technical event conducted by IETE.',
      opensource: 'He was recognized as the Top Contributor (1st place) in the Git & GitHub Open Source Challenge by GDG On Campus VIT-AP with 30 pull requests.',
      "open source": 'He was recognized as the Top Contributor (1st place) in the Git & GitHub Open Source Challenge by GDG On Campus VIT-AP with 30 pull requests.',
      contact: 'You can reach Abhinav at abhinavsaimadapati@gmail.com, on GitHub (abhinavsai2006), or LinkedIn (madapati-abhinav-sai).',
      certifications: 'He holds 10+ certifications from Oracle (AI Foundations), Google (Project Management), UPenn (Python), Google Cloud (Gen AI Academy 2.0 — 5 tracks), MathWorks (MATLAB), Deloitte (Data Analytics), Wadhwani Foundation (Entrepreneurship), Board Infinity (Java), and more.',
      ai: 'Abhinav specializes in AI/ML — he\'s built CivicAI (Gemini API agentic pipeline for smart cities), sentiment analyzers, image classifiers, and AI platforms like Quallium AI. He completed Gen AI Academy 2.0 and attended a Gen AI workshop at IIT Hyderabad.',
      hello: 'Hey! I\'m Abhinav\'s AI assistant. Ask me about his projects, skills, hackathons, or experience!',
      hi: 'Hello! What would you like to know about Abhinav? Try asking about his projects, hackathons, skills, or certifications.',
      resume: 'You can download Abhinav\'s resume from the hero section at the top of the page — look for the "Download Resume" button.',
      github: 'Abhinav has 50+ repositories on GitHub covering AI, web development, and developer tools. Check them out at github.com/abhinavsai2006',
      gdg: 'Abhinav is a member of the AI/ML & Data Analytics Team at Google Developer Groups (GDG), VIT-AP for 2025-2026.',
      cloud: 'He completed Gen AI Academy 2.0 by Google Cloud & Hack2Skill, mastering 5 tracks: Networking, DevOps, Data Engineering, Cloud Security, and AI/ML. He\'s also Oracle Cloud AI Foundations certified.',
      linkedin: 'Abhinav has 500+ followers on LinkedIn. Find him at linkedin.com/in/madapati-abhinav-sai'
    };

    function addMsg(text, type) {
      var msg = document.createElement('div');
      msg.className = 'chatbot__msg chatbot__msg--' + type;
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function getResponse(q) {
      q = q.toLowerCase();
      var keys = Object.keys(knowledge);
      for (var i = 0; i < keys.length; i++) {
        if (q.indexOf(keys[i]) !== -1) return knowledge[keys[i]];
      }
      return 'I\'m not sure about that! Try asking about projects, skills, education, certifications, or contact info.';
    }

    function handleSend() {
      var q = input.value.trim();
      if (!q) return;
      addMsg(q, 'user');
      input.value = '';

      setTimeout(function () {
        addMsg(getResponse(q), 'bot');
      }, 400);
    }

    send.addEventListener('click', handleSend);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleSend();
    });
  }

  /* -----------------------------------------------------------------------
     LAZY LOAD ANIMATIONS (IntersectionObserver)
     ----------------------------------------------------------------------- */
  function initLazyAnimations() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-lazy]').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* -----------------------------------------------------------------------
     INITIALIZE
     ----------------------------------------------------------------------- */
  function init() {
    // Start 3D scene immediately (behind preloader)
    initThreeScene();

    // Start preloader, then trigger entrance + all scroll logic
    initPreloader(function () {
      animateHeroEntrance();
      initScrollAnimations();
      initParallax();
      // Init pinned scroll AFTER all other scroll triggers
      initCredsScroll();
    });

    // These can init right away
    initCursor();
    initNavigation();
    initMagnetic();
    initSmoothAnchors();
    initTerminal();
    initContactForm();
    initChatbot();
    initLazyAnimations();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
