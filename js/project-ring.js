import * as THREE from "../assets/vendor/three/three.module.min.js";

const CONFIG = {
  desktopCount: 14,
  mobileCount: 8,
  radiusDesktop: 2.55,
  radiusTablet: 2.15,
  radiusMobile: 1.72,
  cardWidth: 1.08,
  cardHeight: 1.44,
  sensitivity: 0.0032,
  dragSensitivity: 0.004,
  maxVelocity: 2.35,
  friction60: 0.94,
  snapDuration: 0.68,
  idleSpeed: 0.035,
  idleDelay: 1200,
  pointerThreshold: 0.7,
  swipeThreshold: 7
};

const viewport = document.getElementById("project-ring-viewport");
const fallback = document.getElementById("projectRingFallback");
const service = window.ProjectService;

if (viewport && fallback && service) {
  initProjectRing().catch((error) => {
    console.error("[Project Ring] Three.js initialization failed:", error);
    viewport.dataset.ringState = "error";
    showFallback();
  });
} else {
  console.error("[Project Ring] Required DOM or project service is missing.");
}

async function initProjectRing() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const allProjects = service.getProjects();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const isTablet = !isMobile && window.matchMedia("(max-width: 1100px)").matches;
  const projects = allProjects.slice(0, isMobile ? CONFIG.mobileCount : CONFIG.desktopCount);
  if (!projects.length) return;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "project-ring-canvas";
  viewport.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isMobile ? 42 : 37, 1, 0.1, 100);
  camera.position.set(0, isMobile ? 0.35 : 0.3, isMobile ? 5.9 : isTablet ? 6.7 : 7.35);
  camera.lookAt(0, 0, 0);

  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.set(
    THREE.MathUtils.degToRad(isMobile ? -13 : isTablet ? -19 : -24),
    THREE.MathUtils.degToRad(isMobile ? 8 : 12),
    THREE.MathUtils.degToRad(isMobile ? -25 : isTablet ? -34 : -41)
  );
  tiltGroup.position.set(isMobile ? 0 : 0.2, isMobile ? -0.04 : -0.12, 0);
  scene.add(tiltGroup);

  const spinGroup = new THREE.Group();
  tiltGroup.add(spinGroup);

  const textureLoader = new THREE.TextureLoader();
  const meshes = [];
  const geometryPool = [];
  const materialPool = [];
  const texturePool = [];
  const radius = isMobile ? CONFIG.radiusMobile : isTablet ? CONFIG.radiusTablet : CONFIG.radiusDesktop;
  const step = (Math.PI * 2) / projects.length;

  projects.forEach((project, index) => {
    const angle = index * step;
    const placeholder = new THREE.MeshBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide
    });
    const geometry = new THREE.PlaneGeometry(CONFIG.cardWidth, CONFIG.cardHeight);
    const mesh = new THREE.Mesh(geometry, placeholder);
    mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
    mesh.rotation.y = angle;
    mesh.userData = { projectId: project.id, index, angle };
    spinGroup.add(mesh);
    meshes.push(mesh);
    geometryPool.push(geometry);
    materialPool.push(placeholder);

    const source = getThumbnail(project);
    textureLoader.load(source, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texturePool.push(texture);
      configureCoverTexture(texture, CONFIG.cardWidth / CONFIG.cardHeight);
      placeholder.map = texture;
      placeholder.color.setHex(0xffffff);
      placeholder.needsUpdate = true;
      requestRender();
    }, undefined, (error) => {
      console.warn(`[Project Ring] Texture failed: ${source}`, error);
      requestRender();
    });
  });

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let rotation = 0;
  let velocity = 0;
  let lastPointerX = 0;
  let pointerDownX = 0;
  let pointerTravel = 0;
  let dragging = false;
  let interacting = false;
  let visible = true;
  let rafId = 0;
  let lastInputAt = performance.now();
  let snap = null;
  let disposed = false;
  let needsRender = true;

  const clampVelocity = () => {
    velocity = THREE.MathUtils.clamp(velocity, -CONFIG.maxVelocity, CONFIG.maxVelocity);
  };

  const requestRender = () => {
    needsRender = true;
    if (!rafId && visible && !document.hidden) {
      clock.start();
      rafId = requestAnimationFrame(tick);
    }
  };

  const nearestRotation = (value) => Math.round(value / step) * step;
  const nearestIndex = (value) => modulo(Math.round(-value / step), projects.length);

  const beginSnap = (target = nearestRotation(rotation), selectedIndex = null) => {
    if (reducedMotion) {
      rotation = target;
      spinGroup.rotation.y = rotation;
      updateDepth();
      renderer.render(scene, camera);
      if (selectedIndex !== null) selectProject(selectedIndex);
      return;
    }
    snap = {
      from: rotation,
      to: closestEquivalent(target, rotation),
      elapsed: 0,
      duration: CONFIG.snapDuration,
      selectedIndex
    };
    velocity = 0;
    requestRender();
  };

  const selectProject = (index) => {
    const project = projects[modulo(index, projects.length)];
    if (!project) return;
    window.dispatchEvent(new CustomEvent("projectringselect", { detail: { projectId: project.id } }));
  };

  const snapToIndex = (index) => {
    beginSnap(-index * step, index);
  };

  const updateDepth = () => {
    meshes.forEach((mesh) => {
      const worldAngle = mesh.userData.angle + rotation;
      const depth = (Math.cos(worldAngle) + 1) / 2;
      mesh.material.opacity = 0.22 + depth * 0.72;
      mesh.scale.setScalar(0.86 + depth * 0.14);
      mesh.renderOrder = Math.round(depth * 100);
    });
  };

  const tick = () => {
    rafId = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const now = performance.now();

    if (snap) {
      snap.elapsed += delta;
      const progress = Math.min(snap.elapsed / snap.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      rotation = THREE.MathUtils.lerp(snap.from, snap.to, eased);
      if (progress >= 1) {
        const selectedIndex = snap.selectedIndex ?? nearestIndex(rotation);
        snap = null;
        selectProject(selectedIndex);
        lastInputAt = now;
      }
      needsRender = true;
    } else if (!reducedMotion) {
      if (Math.abs(velocity) > 0.004) {
        rotation += velocity * delta;
        velocity *= Math.pow(CONFIG.friction60, delta * 60);
        needsRender = true;
      } else if (!interacting && now - lastInputAt > CONFIG.idleDelay) {
        rotation += CONFIG.idleSpeed * delta;
        needsRender = true;
      } else if (!interacting && now - lastInputAt > 240 && Math.abs(rotation - nearestRotation(rotation)) > 0.002) {
        beginSnap();
      }
    }

    if (needsRender) {
      spinGroup.rotation.y = rotation;
      updateDepth();
      renderer.render(scene, camera);
      needsRender = false;
    }
    if (snap || interacting || Math.abs(velocity) > 0.004 || (!reducedMotion && now - lastInputAt > CONFIG.idleDelay)) {
      rafId = requestAnimationFrame(tick);
    }
  };

  const onPointerEnter = (event) => {
    lastPointerX = event.clientX;
    requestRender();
  };

  const onPointerMove = (event) => {
    const dx = Number.isFinite(event.movementX) && event.pointerType === "mouse"
      ? event.movementX
      : event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    if (Math.abs(dx) < CONFIG.pointerThreshold) return;
    if (dragging) pointerTravel += Math.abs(dx);
    if (!dragging && event.pointerType !== "mouse") return;
    snap = null;
    velocity += -dx * (dragging ? CONFIG.dragSensitivity : CONFIG.sensitivity) * 12;
    clampVelocity();
    lastInputAt = performance.now();
    requestRender();
  };

  const onPointerDown = (event) => {
    dragging = true;
    interacting = true;
    pointerDownX = event.clientX;
    lastPointerX = event.clientX;
    pointerTravel = 0;
    snap = null;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
    lastInputAt = performance.now();
    requestRender();
  };

  const onPointerUp = (event) => {
    dragging = false;
    viewport.classList.remove("is-dragging");
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    const horizontalTravel = Math.abs(event.clientX - pointerDownX);
    if (pointerTravel < CONFIG.swipeThreshold && horizontalTravel < CONFIG.swipeThreshold) {
      const hitIndex = hitTest(event);
      if (hitIndex !== null) snapToIndex(hitIndex);
    }
    interacting = false;
    lastInputAt = performance.now();
    requestRender();
  };

  const onPointerLeave = () => {
    if (!dragging) interacting = false;
    lastInputAt = performance.now();
    requestRender();
  };

  const onWheel = (event) => {
    if (!visible || reducedMotion) return;
    velocity += THREE.MathUtils.clamp(-event.deltaY * 0.00045, -0.12, 0.12);
    clampVelocity();
    lastInputAt = performance.now();
    requestRender();
  };

  const onVisibilityChange = () => requestRender();
  const onSelectionChange = (event) => {
    const index = projects.findIndex((project) => project.id === event.detail?.projectId);
    if (index < 0) return;
    const target = closestEquivalent(-index * step, rotation);
    if (Math.abs(target - rotation) < 0.002) return;
    snapToIndex(index);
  };

  const hitTest = (event) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.index : null;
  };

  const resize = () => {
    const width = Math.max(viewport.clientWidth, 1);
    const height = Math.max(viewport.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestRender();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(viewport);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
    else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }, { threshold: 0.05 });
  visibilityObserver.observe(viewport);

  viewport.addEventListener("pointerenter", onPointerEnter);
  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("pointerup", onPointerUp);
  viewport.addEventListener("pointercancel", onPointerUp);
  viewport.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("wheel", onWheel, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("projectselectionchange", onSelectionChange);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    viewport.removeEventListener("pointerenter", onPointerEnter);
    viewport.removeEventListener("pointermove", onPointerMove);
    viewport.removeEventListener("pointerdown", onPointerDown);
    viewport.removeEventListener("pointerup", onPointerUp);
    viewport.removeEventListener("pointercancel", onPointerUp);
    viewport.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("wheel", onWheel);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("projectselectionchange", onSelectionChange);
    geometryPool.forEach((geometry) => geometry.dispose());
    materialPool.forEach((material) => material.dispose());
    texturePool.forEach((texture) => texture.dispose());
    renderer.dispose();
  };

  window.addEventListener("pagehide", dispose, { once: true });
  resize();
  spinGroup.rotation.y = rotation;
  updateDepth();
  renderer.render(scene, camera);
  viewport.dataset.ringState = "ready";
  requestRender();
}

function configureCoverTexture(texture, frameAspect) {
  const imageWidth = texture.image?.width || 1;
  const imageHeight = texture.image?.height || 1;
  const imageAspect = imageWidth / imageHeight;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  if (imageAspect > frameAspect) {
    texture.repeat.x = frameAspect / imageAspect;
    texture.offset.x = (1 - texture.repeat.x) / 2;
  } else {
    texture.repeat.y = imageAspect / frameAspect;
    texture.offset.y = (1 - texture.repeat.y) / 2;
  }
  texture.needsUpdate = true;
}

function getThumbnail(project) {
  const file = project.files?.[0] || {};
  return project.listThumbnail || project.cover || file.thumbnail || file.src || "assets/images/placeholders/image-placeholder.png";
}

function closestEquivalent(target, current) {
  const full = Math.PI * 2;
  return target + Math.round((current - target) / full) * full;
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function showFallback() {
  if (!viewport || !fallback || !service) return;
  viewport.hidden = true;
  const projects = service.getProjects().slice(0, 8);
  fallback.hidden = false;
  fallback.innerHTML = projects.map((project, index) => `
    <button type="button" style="--ring-index:${index}" data-fallback-project="${project.id}" aria-label="${project.title} 선택">
      <img src="${getThumbnail(project)}" alt="" loading="lazy">
    </button>
  `).join("");
  fallback.querySelectorAll("[data-fallback-project]").forEach((button) => {
    button.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("projectringselect", { detail: { projectId: button.dataset.fallbackProject } }));
    });
  });
}
