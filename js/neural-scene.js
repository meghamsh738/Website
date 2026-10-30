import * as THREE from 'three';

// A decorative, seeded constellation — not a rendering of scientific data.
export function initNeuralScene(host, onUnavailable) {
  const canvasHost = host.querySelector('.scene-canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    onUnavailable();
    return null;
  }
  renderer.setClearColor(0x090e15, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  canvasHost.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.z = 8.6;
  const constellation = new THREE.Group();
  scene.add(constellation);
  const teal = new THREE.Color('#82ead0');
  const violet = new THREE.Color('#b7a0f9');
  let seed = 3847;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const points = [];
  const segments = [];
  const pointColors = [];
  const lineColors = [];
  const addPoint = (point, color) => {
    points.push(point);
    pointColors.push(color.r, color.g, color.b);
    return points.length - 1;
  };
  const connect = (a, b, color) => {
    segments.push(...points[a].toArray(), ...points[b].toArray());
    lineColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  };

  // Branching paths give the scene depth without an expensive model or texture.
  for (let branch = 0; branch < 16; branch++) {
    const angle = branch / 16 * Math.PI * 2;
    const color = teal.clone().lerp(violet, (Math.sin(angle) + 1) / 2);
    let previous = addPoint(new THREE.Vector3((random() - 0.5) * 0.7, (random() - 0.5) * 0.7, (random() - 0.5) * 1.2), color);
    for (let step = 1; step <= 11; step++) {
      const radius = step * 0.24;
      const bend = angle + Math.sin(step * 0.4 + branch) * 0.24;
      const point = new THREE.Vector3(
        Math.cos(bend) * radius * 1.02,
        Math.sin(bend) * radius * 0.9 + 0.22,
        Math.sin(angle * 3 + step * 0.38) * 0.75 + (random() - 0.5) * 0.3,
      );
      point.x += (random() - 0.5) * 0.26;
      point.y += (random() - 0.5) * 0.26;
      const index = addPoint(point, color);
      connect(previous, index, color);
      if (step > 2 && step % 2 === 0) {
        const twig = point.clone().add(new THREE.Vector3((random() - 0.5) * 0.95, (random() - 0.5) * 0.8, (random() - 0.5) * 0.9));
        connect(index, addPoint(twig, color), color);
      }
      previous = index;
    }
  }
  // Sparse cross-connections keep the silhouette open and readable.
  for (let a = 0; a < points.length; a += 3) {
    for (let b = a + 8; b < points.length; b += 7) {
      const distance = points[a].distanceTo(points[b]);
      if (distance > 0.3 && distance < 0.68 && random() > 0.5) connect(a, b, teal.clone().lerp(violet, random()));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap(point => point.toArray()), 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));
  const pointMaterial = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { pixelRatio: { value: 1 } },
    vertexShader: `uniform float pixelRatio;
      varying vec3 pointColor;
      void main() {
        pointColor = color;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(50.0 / -viewPosition.z, 3.0, 12.0) * pixelRatio;
      }`,
    fragmentShader: `varying vec3 pointColor;
      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        if (radius > 0.5) discard;
        float glow = pow(1.0 - radius * 2.0, 2.0);
        gl_FragColor = vec4(pointColor, glow * 0.9);
      }`,
  });
  constellation.add(new THREE.Points(geometry, pointMaterial));
  const linesGeometry = new THREE.BufferGeometry();
  linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
  linesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
  constellation.add(new THREE.LineSegments(linesGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.24, depthWrite: false })));

  const labels = [
    { name: 'research', point: new THREE.Vector3(-1.55, 1.15, 0.45) },
    { name: 'software', point: new THREE.Vector3(1.6, 0.15, 0.8) },
    { name: 'publication', point: new THREE.Vector3(-0.35, -1.45, 0.55) },
  ].map(item => ({ ...item, element: host.querySelector(`[data-scene-node="${item.name}"]`) }));
  const projected = new THREE.Vector3();
  let enabled = false;
  let visible = false;
  let failed = false;
  let frame = 0;
  let lastTime = 0;
  let phase = 0;
  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let pointer;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    host.dataset.animating = 'false';
  }
  function animate(time) {
    if (!enabled || !visible || document.hidden || failed) { stop(); return; }
    const elapsed = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    phase += elapsed;
    yaw += (targetYaw - yaw) * 0.045;
    pitch += (targetPitch - pitch) * 0.045;
    constellation.rotation.set(pitch + Math.sin(phase * 0.14) * 0.045, yaw + Math.sin(phase * 0.1) * 0.09, -0.09);
    constellation.updateMatrixWorld();
    for (const label of labels) {
      projected.copy(label.point).applyMatrix4(constellation.matrixWorld).project(camera);
      label.element.style.left = `${THREE.MathUtils.clamp((projected.x + 1) * 50, 19, 81)}%`;
      label.element.style.top = `${THREE.MathUtils.clamp((1 - projected.y) * 50, 17, 76)}%`;
    }
    renderer.render(scene, camera);
    host.dataset.animating = 'true';
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    if (enabled && visible && !document.hidden && !failed && !frame) frame = requestAnimationFrame(animate);
  }
  function resize() {
    const { width, height } = canvasHost.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, width < 600 ? 1 : 1.5);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    pointMaterial.uniforms.pixelRatio.value = ratio;
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 0.85 ? 10 : 8.6;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvasHost);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) resume(); else stop();
  }, { threshold: 0.05 }).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else resume(); });
  canvasHost.addEventListener('pointerdown', event => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: targetYaw, pitch: targetPitch };
    canvasHost.setPointerCapture(event.pointerId);
  });
  canvasHost.addEventListener('pointermove', event => {
    if (!enabled) return;
    if (pointer?.id === event.pointerId) {
      targetYaw = THREE.MathUtils.clamp(pointer.yaw + (event.clientX - pointer.x) * 0.004, -0.65, 0.65);
      targetPitch = THREE.MathUtils.clamp(pointer.pitch + (event.clientY - pointer.y) * 0.003, -0.3, 0.3);
    } else if (event.pointerType === 'mouse') {
      const rect = canvasHost.getBoundingClientRect();
      targetYaw = ((event.clientX - rect.left) / rect.width - 0.5) * 0.28;
      targetPitch = ((event.clientY - rect.top) / rect.height - 0.5) * 0.16;
    }
  });
  const endDrag = () => { pointer = null; };
  canvasHost.addEventListener('pointerup', endDrag);
  canvasHost.addEventListener('pointercancel', endDrag);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    failed = true;
    setMotion(false);
    onUnavailable();
  });
  function setMotion(value) {
    enabled = value && !failed;
    host.dataset.renderer = enabled ? 'webgl' : 'fallback';
    canvasHost.hidden = !enabled;
    if (enabled) { resize(); resume(); }
    else {
      stop();
      labels.forEach(({ element }) => { element.style.removeProperty('left'); element.style.removeProperty('top'); });
    }
  }
  resize();
  return { setMotion };
}
