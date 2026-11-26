/**
 * GUHAN N // PORTFOLIO INTERACTION ENGINE
 * Powered by Lenis & GSAP ScrollTrigger
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. LENIS SMOOTH SCROLL INITIALIZATION
  // =========================================================================
  // Default Lenis Engine Configuration (High Performance & Smooth Scrolling)
  const lenisConfig = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.8,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    infinite: false,
  };

  const lenis = new Lenis(lenisConfig);

  // Connect Lenis to GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Smooth out any delta hitching for silky 60 FPS
  gsap.ticker.lagSmoothing(500, 33);

  // =========================================================================
  // 3. THREE.JS CONTINUOUS 3D SCROLLYTELLING ENGINE (Lenis.dev Style)
  // =========================================================================
  let threeScene, threeCamera, threeRenderer, torusMesh, wireframeMesh, starfieldPoints, haloPoints;
  let sculptureGroup, worldGroup, customModelGroup, customWireframeGroup, cubeSpinGroup;
  let ambientLight, keyLight, rimCoral, rimCyan;
  let mouseNormX = 0, mouseNormY = 0;
  let currentTiltX = 0, currentTiltY = 0;
  let scrollVelocityBoost = 0;
  let currentRenderMode = 0; // 0: Hybrid, 1: Wireframe, 2: Solid

  const bgCanvas = document.getElementById('bg3dCanvas');
  const canvas3dMeta = document.getElementById('canvas3dMeta');

  if (typeof THREE !== 'undefined' && bgCanvas) {
    initScrollytelling3D();
  }

  function initScrollytelling3D() {
    // 1. Scene & Camera Setup
    threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x09090b, 0.04);

    const w = window.innerWidth;
    const h = window.innerHeight;

    threeCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    threeCamera.position.set(0, 0, 7.5);

    // 2. High-Performance WebGL Renderer
    threeRenderer = new THREE.WebGLRenderer({
      canvas: bgCanvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    threeRenderer.setSize(w, h);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    threeRenderer.toneMappingExposure = 1.35;

    // 3. Cinematic Multi-Point Lighting (Matching Horizon Glow)
    ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    threeScene.add(ambientLight);

    keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(6, 8, 6);
    threeScene.add(keyLight);

    // Warm Coral / Sunset Horizon Rim (Directly matching lenis.dev video!)
    rimCoral = new THREE.DirectionalLight(0xff3355, 5.5);
    rimCoral.position.set(-6, -6, -2);
    threeScene.add(rimCoral);

    // Cool Cyan Secondary Fill
    rimCyan = new THREE.DirectionalLight(0x00f0ff, 3.0);
    rimCyan.position.set(5, -5, 4);
    threeScene.add(rimCyan);

    // Top Subtle Golden Fill
    const topGold = new THREE.DirectionalLight(0xffaa44, 1.8);
    topGold.position.set(0, 8, -2);
    threeScene.add(topGold);

    // 4. Cosmic Starfield Particles (Stars floating throughout space)
    worldGroup = new THREE.Group();
    threeScene.add(worldGroup);

    const starCount = 900;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starCoords[i * 3] = (Math.random() - 0.5) * 45;
      starCoords[i * 3 + 1] = (Math.random() - 0.5) * 45;
      starCoords[i * 3 + 2] = -25 + Math.random() * 35;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
    });
    starfieldPoints = new THREE.Points(starGeo, starMat);
    worldGroup.add(starfieldPoints);

    // 5. Hero 3D Kinetic Sculpture Outer Group (For GSAP Position & Scrollytelling Path)
    sculptureGroup = new THREE.Group();
    worldGroup.add(sculptureGroup);

    // Initial position on screen (prominently right-center of the Hero section)
    const isMobileInit = window.innerWidth <= 768;
    const isTabletInit = window.innerWidth <= 1024;
    sculptureGroup.position.set(
      isMobileInit ? 0.35 : (isTabletInit ? 1.6 : 2.2),
      isMobileInit ? -0.2 : 0.2,
      isMobileInit ? -0.5 : 0
    );
    if (isMobileInit) {
      sculptureGroup.scale.set(0.85, 0.85, 0.85);
    }

    // Inner Spin Group: Continues free flow, rotation, and organic floating across all sections
    cubeSpinGroup = new THREE.Group();
    sculptureGroup.add(cubeSpinGroup);

    // Fallback Procedural Torus Knot (visible until GLTF finishes loading)
    const knotGeo = new THREE.TorusKnotGeometry(1.4, 0.42, 120, 32, 2, 3);
    const knotMat = new THREE.MeshStandardMaterial({
      color: 0x14141a,
      roughness: 0.16,
      metalness: 0.94,
    });
    torusMesh = new THREE.Mesh(knotGeo, knotMat);
    cubeSpinGroup.add(torusMesh);

    const wireGeo = new THREE.TorusKnotGeometry(1.405, 0.425, 60, 16, 2, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xff3b00,
      wireframe: true,
      transparent: true,
      opacity: 0.42,
    });
    wireframeMesh = new THREE.Mesh(wireGeo, wireMat);
    cubeSpinGroup.add(wireframeMesh);

    // Orbiting Data Halo Particles
    const haloCount = 200;
    const haloCoords = new Float32Array(haloCount * 3);
    for (let i = 0; i < haloCount; i++) {
      const radius = 2.4 + Math.random() * 1.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      haloCoords[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      haloCoords[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      haloCoords[i * 3 + 2] = radius * Math.cos(phi);
    }
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloCoords, 3));
    const haloMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0xff5522,
      transparent: true,
      opacity: 0.8,
    });
    haloPoints = new THREE.Points(haloGeo, haloMat);
    cubeSpinGroup.add(haloPoints);

    // Load User's Custom 3D Model: Infinity Cube
    loadInfinityCubeModel();

    // 6. CONTINUOUS SCROLL CHOREOGRAPHY (Scrollytelling Timeline)
    setup3DScrollytelling();

    // 7. Cursor Interaction (Spring Tilt)
    window.addEventListener('mousemove', (e) => {
      mouseNormX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNormY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // 8. Window Resize Handler
    window.addEventListener('resize', () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      threeCamera.aspect = newW / newH;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(newW, newH);
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    });

    // 9. Master Animation RAF Loop
    function animate3D(time) {
      // Free-flow idle spin + scroll velocity momentum (gentle, majestic & cinematic speed)
      const baseSpin = 0.0016;
      const totalSpin = baseSpin + scrollVelocityBoost;

      cubeSpinGroup.rotation.y += totalSpin;
      cubeSpinGroup.rotation.x += totalSpin * 0.38;
      cubeSpinGroup.rotation.z += totalSpin * 0.12;

      // Organic multi-axis floating / levitation across all sections (dark & white)
      const t = time * 0.001;
      cubeSpinGroup.position.y = Math.sin(t) * 0.14;
      cubeSpinGroup.position.x = Math.cos(t * 0.7) * 0.06;
      cubeSpinGroup.position.z = Math.sin(t * 0.5) * 0.04;

      // Halo & star drift
      if (haloPoints) haloPoints.rotation.y -= 0.0008;
      if (starfieldPoints) starfieldPoints.rotation.y += 0.0002;

      // Spring lerp cursor tilt on worldGroup
      currentTiltX += (mouseNormY * 0.35 - currentTiltX) * 0.06;
      currentTiltY += (mouseNormX * 0.45 - currentTiltY) * 0.06;
      worldGroup.rotation.x = currentTiltX;
      worldGroup.rotation.y = currentTiltY;

      // Dampen velocity boost smoothly
      scrollVelocityBoost *= 0.90;

      threeRenderer.render(threeScene, threeCamera);
      requestAnimationFrame(animate3D);
    }
    requestAnimationFrame(animate3D);
  }

  function setup3DScrollytelling() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024;

    const aboutPos = {
      x: isMobile ? 0.35 : (isTablet ? 1.65 : 2.15),
      y: isMobile ? -0.2 : 0.05,
      z: isMobile ? -0.4 : 0.15,
      scale: isMobile ? 0.88 : 1.18,
    };
    const projectsPos = {
      x: isMobile ? -0.35 : -2.2,
      y: isMobile ? 0.45 : 0.65,
      z: isMobile ? -1.4 : -1.8,
      scale: isMobile ? 0.75 : 0.95,
    };
    const portalPos = {
      x: isMobile ? 0.25 : 1.8,
      y: -0.1,
      z: 0.4,
      scale: isMobile ? 0.85 : 1.15,
    };
    const reelPos = {
      x: isMobile ? 0.35 : 2.2,
      y: 0.1,
      z: 0.35,
      scale: isMobile ? 0.88 : 1.18,
    };
    const matrixPos = {
      x: isMobile ? 0.3 : 1.7,
      y: -0.1,
      z: 0.5,
      scale: isMobile ? 0.85 : 1.12,
    };

    // Master timeline scrubbing the 3D sculpture's transform across the full page!
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      },
    });

    // Phase 1: From Hero -> Throughout About Me Section
    // Keeps the 3D Infinity Cube prominently and steadily visible on the right, framing the manifesto text cleanly in foreground
    tl.to(sculptureGroup.position, {
      x: aboutPos.x,
      y: aboutPos.y,
      z: aboutPos.z,
      duration: 0.20,
      ease: 'power1.inOut',
    }, 0)
      .to(sculptureGroup.scale, {
        x: aboutPos.scale,
        y: aboutPos.scale,
        z: aboutPos.scale,
        duration: 0.20,
        ease: 'power1.inOut',
      }, 0);

    // Phase 2: From About Me -> Into Stacking Cards (Featured Work)
    // Only shifts into the background when entering the Projects section!
    tl.to(sculptureGroup.position, {
      x: projectsPos.x,
      y: projectsPos.y,
      z: projectsPos.z,
      duration: 0.25,
      ease: 'power1.inOut',
    }, 0.22)
      .to(sculptureGroup.scale, {
        x: projectsPos.scale,
        y: projectsPos.scale,
        z: projectsPos.scale,
        duration: 0.25,
        ease: 'power1.inOut',
      }, 0.22);

    // Phase 3: Expanding White Portal Transition (The Shift into Light Mode)
    tl.to(sculptureGroup.position, {
      x: portalPos.x,
      y: portalPos.y,
      z: portalPos.z,
      duration: 0.20,
      ease: 'power1.inOut',
    }, 0.48)
      .to(sculptureGroup.scale, {
        x: portalPos.scale,
        y: portalPos.scale,
        z: portalPos.scale,
        duration: 0.20,
        ease: 'power1.inOut',
      }, 0.48);

    // Phase 4: Academics & Experience Pinned Horizontal Reel on the White Canvas
    tl.to(sculptureGroup.position, {
      x: reelPos.x,
      y: reelPos.y,
      z: reelPos.z,
      duration: 0.20,
      ease: 'power1.inOut',
    }, 0.65)
      .to(sculptureGroup.scale, {
        x: reelPos.scale,
        y: reelPos.scale,
        z: reelPos.scale,
        duration: 0.20,
        ease: 'power1.inOut',
      }, 0.65);

    // Phase 5: Technical Matrix & Light Finale Contact
    tl.to(sculptureGroup.position, {
      x: matrixPos.x,
      y: matrixPos.y,
      z: matrixPos.z,
      duration: 0.20,
      ease: 'power1.inOut',
    }, 0.88)
      .to(sculptureGroup.scale, {
        x: matrixPos.scale,
        y: matrixPos.scale,
        z: matrixPos.scale,
        duration: 0.20,
        ease: 'power1.inOut',
      }, 0.88);
  }

  // Load User's Custom 3D Model: Infinity Cube
  function loadInfinityCubeModel() {
    if (typeof THREE.GLTFLoader === 'undefined') return;

    const loader = new THREE.GLTFLoader();
    const source = typeof INFINITY_CUBE_BASE64 !== 'undefined' ? INFINITY_CUBE_BASE64 : 'infinity_cube.glb';

    loader.load(
      source,
      (gltf) => {
        const rawModel = gltf.scene;

        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(rawModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;

        rawModel.position.sub(center);

        // Normalize scale to fit the stage perfectly
        const targetDim = 3.2;
        const normScale = targetDim / maxDim;

        customModelGroup = new THREE.Group();
        customModelGroup.add(rawModel);
        customModelGroup.scale.set(normScale, normScale, normScale);

        // Check if currently starting in light-theme
        const isCurrentLight = document.body.classList.contains('light-theme');

        // Apply initial material settings
        customModelGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.metalness = isCurrentLight ? 0.08 : 0.92;
              child.material.roughness = isCurrentLight ? 0.20 : 0.18;
              child.material.color = new THREE.Color(isCurrentLight ? 0xffffff : 0x181822);
              child.material.needsUpdate = true;
            }
          }
        });

        // Create Wireframe overlay of the Infinity Cube
        customWireframeGroup = customModelGroup.clone(true);
        customWireframeGroup.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: isCurrentLight ? 0xff3355 : 0xff3b00,
              wireframe: true,
              transparent: true,
              opacity: isCurrentLight ? 0.55 : 0.45,
            });
          }
        });

        // Hide procedural fallback and add Infinity Cube to cubeSpinGroup
        if (torusMesh) torusMesh.visible = false;
        if (wireframeMesh) wireframeMesh.visible = false;

        cubeSpinGroup.add(customModelGroup);
        cubeSpinGroup.add(customWireframeGroup);

        if (canvas3dMeta) {
          canvas3dMeta.textContent = 'INFINITY_CUBE // SCROLL-FLOW ONLINE';
        }

        console.log('%c[GUHAN.N] Infinity Cube 3D Model Loaded & Centered', 'color: #00e5ff; font-weight: bold;');
      },
      undefined,
      (err) => {
        console.warn('[GUHAN.N] GLTF direct load notice, using procedural fallback:', err);
      }
    );
  }

  // System Light/Dark Theme Inversion (White Cube on White Side)
  let currentThemeIsLight = null;

  function setLightMode(isLight) {
    if (currentThemeIsLight === isLight) return;
    currentThemeIsLight = isLight;

    if (isLight) {
      document.body.classList.add('light-theme');
      if (ambientLight) ambientLight.intensity = 0.85;
      if (keyLight) {
        keyLight.intensity = 2.4;
        keyLight.position.set(6, 8, 5);
      }
      if (rimCoral) rimCoral.intensity = 3.2;
      if (rimCyan) rimCyan.intensity = 1.0;
      if (threeScene && threeScene.fog) {
        threeScene.fog.color.set(0xf8f8fa);
        threeScene.fog.density = 0.004;
      }
      if (starfieldPoints && starfieldPoints.material) {
        starfieldPoints.material.opacity = 0;
      }
      if (haloPoints && haloPoints.material) {
        haloPoints.material.color.set(0xff3355);
        haloPoints.material.opacity = 0.45;
      }
      // Morph Infinity Cube to Pure Sculptural White
      if (customModelGroup) {
        customModelGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            gsap.killTweensOf(child.material.color);
            gsap.to(child.material.color, {
              r: 1.0,
              g: 1.0,
              b: 1.0,
              duration: 0.35,
              ease: 'power2.out',
            });
            child.material.metalness = 0.08;
            child.material.roughness = 0.20;
          }
        });
      }
      // Crisp Coral Wireframe Outline on White
      if (customWireframeGroup) {
        customWireframeGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.set(0xff3355);
            child.material.opacity = 0.55;
          }
        });
      }
      if (torusMesh && torusMesh.material) {
        torusMesh.material.color.set(0xffffff);
        torusMesh.material.metalness = 0.08;
        torusMesh.material.roughness = 0.20;
      }
      if (wireframeMesh && wireframeMesh.material) {
        wireframeMesh.material.color.set(0xff3355);
        wireframeMesh.material.opacity = 0.55;
      }
    } else {
      document.body.classList.remove('light-theme');
      if (ambientLight) ambientLight.intensity = 0.55;
      if (keyLight) {
        keyLight.intensity = 2.5;
        keyLight.position.set(6, 8, 6);
      }
      if (rimCoral) rimCoral.intensity = 5.5;
      if (rimCyan) rimCyan.intensity = 3.0;
      if (threeScene && threeScene.fog) {
        threeScene.fog.color.set(0x09090b);
        threeScene.fog.density = 0.04;
      }
      if (starfieldPoints && starfieldPoints.material) {
        starfieldPoints.material.opacity = 0.65;
      }
      if (haloPoints && haloPoints.material) {
        haloPoints.material.color.set(0xff5522);
        haloPoints.material.opacity = 0.8;
      }
      // Morph Infinity Cube back to Dark Metallic Obsidian
      if (customModelGroup) {
        customModelGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            gsap.killTweensOf(child.material.color);
            gsap.to(child.material.color, {
              r: 0.094,
              g: 0.094,
              b: 0.133,
              duration: 0.35,
              ease: 'power2.out',
            });
            child.material.metalness = 0.92;
            child.material.roughness = 0.18;
          }
        });
      }
      if (customWireframeGroup) {
        customWireframeGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.set(0xff3b00);
            child.material.opacity = 0.45;
          }
        });
      }
      if (torusMesh && torusMesh.material) {
        torusMesh.material.color.set(0x181822);
        torusMesh.material.metalness = 0.92;
        torusMesh.material.roughness = 0.18;
      }
      if (wireframeMesh && wireframeMesh.material) {
        wireframeMesh.material.color.set(0xff3b00);
        wireframeMesh.material.opacity = 0.42;
      }
    }
  }

  // Hook scroll velocity directly into 3D spin acceleration with smooth cap
  lenis.on('scroll', ({ velocity }) => {
    const absVel = Math.abs(velocity);
    scrollVelocityBoost += absVel * 0.00006;
    // Cap velocity boost so it never spins wildly
    scrollVelocityBoost = Math.min(scrollVelocityBoost, 0.008);
    if (absVel > 2 && canvas3dMeta) {
      canvas3dMeta.textContent = `WARP_VELOCITY: ${absVel.toFixed(1)} px/s // 3D SCENE SYNCED`;
    }
  });

  // Sleek Floating 3D Mode Toggle
  const toggleWireframeBtn = document.getElementById('toggleWireframeBtn');
  const toggleWireframeText = document.getElementById('toggleWireframeText');

  if (toggleWireframeBtn) {
    toggleWireframeBtn.addEventListener('click', () => {
      currentRenderMode = (currentRenderMode + 1) % 3;

      const solidObj = customModelGroup || torusMesh;
      const wireObj = customWireframeGroup || wireframeMesh;
      const dot = toggleWireframeBtn.querySelector('.btn-dot');
      const isLight = document.body.classList.contains('light-theme');

      if (!solidObj || !wireObj) return;

      if (currentRenderMode === 0) {
        // Hybrid: Both Solid and Wireframe
        solidObj.visible = true;
        wireObj.visible = true;
        if (toggleWireframeText) toggleWireframeText.textContent = '3D: HYBRID';
        if (dot) {
          dot.style.background = isLight ? '#ff3355' : 'var(--accent)';
          dot.style.boxShadow = `0 0 8px ${isLight ? '#ff3355' : 'var(--accent)'}`;
        }
        toggleWireframeBtn.style.color = isLight ? '#ff3355' : 'var(--accent)';
      } else if (currentRenderMode === 1) {
        // Wireframe Only
        solidObj.visible = false;
        wireObj.visible = true;
        if (toggleWireframeText) toggleWireframeText.textContent = '3D: WIREFRAME';
        if (dot) {
          dot.style.background = 'var(--accent-green)';
          dot.style.boxShadow = '0 0 8px var(--accent-green)';
        }
        toggleWireframeBtn.style.color = 'var(--accent-green)';
      } else {
        // Solid Only
        solidObj.visible = true;
        wireObj.visible = false;
        if (toggleWireframeText) toggleWireframeText.textContent = '3D: SOLID';
        if (dot) {
          dot.style.background = isLight ? '#09090b' : '#ffffff';
          dot.style.boxShadow = `0 0 8px ${isLight ? '#09090b' : '#ffffff'}`;
        }
        toggleWireframeBtn.style.color = isLight ? '#09090b' : '#ffffff';
      }
    });
  }

  // =========================================================================
  // 4. SCROLL-SCRUBBED TYPOGRAPHY STATEMENT
  // =========================================================================
  const scrubText = document.getElementById('scrubText');
  if (scrubText) {
    const rawWords = scrubText.innerText.trim().split(/\s+/);
    scrubText.innerHTML = rawWords
      .map((word) => `<span class="scrub-word" style="color: var(--text-dim); transition: color 0.15s ease;">${word} </span>`)
      .join('');

    const wordSpans = scrubText.querySelectorAll('.scrub-word');

    gsap.to(wordSpans, {
      scrollTrigger: {
        trigger: '#about',
        start: 'top 75%',
        end: 'bottom 40%',
        scrub: 0.5,
      },
      color: '#ffffff',
      stagger: 0.05,
      ease: 'none',
    });
  }

  // =========================================================================
  // 5. STICKY STACKING CARDS ANIMATION
  // =========================================================================
  const stackCards = document.querySelectorAll('.stack-card');
  stackCards.forEach((card, index) => {
    if (index < stackCards.length - 1) {
      // Scale down and dim when the next card scrolls in (GPU-composited only)
      gsap.to(card, {
        scrollTrigger: {
          trigger: stackCards[index + 1],
          start: 'top 200px',
          end: 'top 100px',
          scrub: true,
        },
        scale: 0.94 - index * 0.015,
        opacity: 0.45,
        transformOrigin: 'top center',
        ease: 'none',
      });
    }
  });

  // =========================================================================
  // 6. THE EXPANDING WHITE PORTAL TRANSITION (Smooth & Balanced Pace)
  // =========================================================================
  const portalSection = document.getElementById('portalSection');
  const portalCard = document.getElementById('portalCard');

  if (portalSection && portalCard) {
    const portalTl = gsap.timeline({
      scrollTrigger: {
        trigger: portalSection,
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: 1.0,
        onUpdate: (self) => {
          setLightMode(self.progress >= 0.50);
        },
        onLeave: () => {
          setLightMode(true);
        },
        onEnterBack: (self) => {
          setLightMode(self.progress >= 0.50);
        },
        onLeaveBack: () => {
          setLightMode(false);
        },
      },
    });

    // 1. Expand white card to 100vw x 100vh smoothly (0.0 to 0.55)
    portalTl.to(portalCard, {
      width: '100vw',
      height: '100vh',
      borderRadius: '0px',
      boxShadow: 'none',
      ease: 'power2.inOut',
      duration: 0.55,
    }, 0);

    // 2. Fade out preview content cleanly as expansion begins (0.0 to 0.22)
    portalTl.to('.portal-preview-content', {
      opacity: 0,
      scale: 0.92,
      ease: 'power1.inOut',
      duration: 0.22,
    }, 0);

    // 3. Reveal editorial transition typography inside the white canvas (0.38 to 0.72)
    portalTl.fromTo('.portal-white-content',
      { opacity: 0, y: 35, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.34 },
      0.38
    );

    // 4. Gently drift up transition typography before flowing into Academics & Experience (0.85 to 1.0)
    portalTl.to('.portal-white-content', {
      y: -25,
      opacity: 0.85,
      ease: 'power1.inOut',
      duration: 0.15,
    }, 0.85);

    // 5. Hold solid white card throughout remainder of pin (0.55 to 1.0)
    portalTl.to(portalCard, {
      width: '100vw',
      height: '100vh',
      borderRadius: '0px',
      duration: 0.45,
    }, 0.55);
  }

  // =========================================================================
  // 6.5 PINNED HORIZONTAL TRACK (ACADEMICS & EXPERIENCE IN WHITE WORLD)
  // =========================================================================
  const horizontalSection = document.getElementById('experience');
  const horizontalTrack = document.getElementById('horizontalTrack');

  if (horizontalSection && horizontalTrack) {
    // Calculate scroll distance
    const getScrollAmount = () => {
      const trackWidth = horizontalTrack.scrollWidth;
      return -(trackWidth - window.innerWidth + 450);
    };

    gsap.to(horizontalTrack, {
      x: getScrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: horizontalSection,
        start: 'top top',
        end: () => `+=${Math.abs(getScrollAmount())}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  // Master light theme trigger for the entire White World (#whiteWorld to bottom)
  ScrollTrigger.create({
    trigger: '#whiteWorld',
    start: 'top bottom', // Activates as whiteWorld enters viewport
    end: 'bottom bottom',
    onEnter: () => setLightMode(true),
    onEnterBack: () => setLightMode(true),
  });

  // =========================================================================
  // 7. MAGNETIC INTERACTIVE BUTTONS
  // =========================================================================
  const magneticElements = document.querySelectorAll('.magnetic');

  magneticElements.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(el, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.4,
        ease: 'power2.out',
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1, 0.4)',
      });
    });
  });

  // =========================================================================
  // 8. FLUID CUSTOM CURSOR
  // =========================================================================
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursorDot) {
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }
  });

  // Cursor interpolation loop
  function renderCursor() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;

    if (cursorRing) {
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
    }

    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Hover states for cursor
  const interactiveElements = document.querySelectorAll('a, button, input, .stack-card, .lab-card, .light-lab-card, .light-feat-card, .light-action-btn, .portal-card');
  interactiveElements.forEach((target) => {
    target.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
    target.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
  });

  // =========================================================================
  // 9. FOOTER ACTIONS & CLOCK
  // =========================================================================
  // Copy Email with Toast
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const copyToast = document.getElementById('copyToast');

  if (copyEmailBtn && copyToast) {
    copyEmailBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('guhan6575@gmail.com');
        copyToast.classList.add('show');
        setTimeout(() => copyToast.classList.remove('show'), 2000);
      } catch (err) {
        copyToast.textContent = 'GUHAN6575@GMAIL.COM';
        copyToast.classList.add('show');
        setTimeout(() => copyToast.classList.remove('show'), 2000);
      }
    });
  }

  // Smooth Back to Top
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      lenis.scrollTo(0, {
        duration: 1.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    });
  }

  // Smooth Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        lenis.scrollTo(targetEl, {
          offset: -60,
          duration: 1.4,
        });
      }
    });
  });

  // Local Time Clock
  const localTimeEl = document.getElementById('localTime');
  function updateClock() {
    if (!localTimeEl) return;
    const now = new Date();
    const utcString = now.toUTCString().split(' ')[4];
    localTimeEl.textContent = `UTC TIME: ${utcString} | IST: ${now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  console.log('%c[GUHAN.N] Lenis Interaction Engine Online', 'color: #ff4400; font-family: monospace; font-weight: bold;');
})();
