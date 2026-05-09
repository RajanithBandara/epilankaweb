'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    // Don't render on mobile — saves resources and GPU
    if (window.innerWidth < 768) return;
    const container = containerRef.current;

    // ── Scene ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ─────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 28;

    // ── Renderer ────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced from 2 for better performance
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Globe group (everything rotates together) ───────────────────────
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const R = 8; // globe radius

    // ── 1. Inner subtle sphere (adds slight depth without blocking gradient) ──
    const innerGeo = new THREE.SphereGeometry(R * 0.98, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      transparent: true,
      opacity: 0.18,
    });
    globeGroup.add(new THREE.Mesh(innerGeo, innerMat));

    // ── 2. Wireframe globe shell ─────────────────────────────────────────
    const wireGeo = new THREE.SphereGeometry(R, 24, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e40af,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    globeGroup.add(new THREE.Mesh(wireGeo, wireMat));

    // ── 3. Lat / Lon grid lines ──────────────────────────────────────────
    const gridMat = () =>
      new THREE.LineBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.18,
      });

    // Latitude parallels
    for (let deg = -75; deg <= 75; deg += 15) {
      const lat = (deg * Math.PI) / 180;
      const r = Math.cos(lat) * R;
      const y = Math.sin(lat) * R;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 64; j++) {
        const θ = (j / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(θ), y, r * Math.sin(θ)));
      }
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat()));
    }

    // Longitude meridians
    for (let i = 0; i < 18; i++) {
      const lon = (i / 18) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 32; j++) {
        const lat = (j / 32) * Math.PI - Math.PI / 2;
        pts.push(new THREE.Vector3(
          R * Math.cos(lat) * Math.cos(lon),
          R * Math.sin(lat),
          R * Math.cos(lat) * Math.sin(lon)
        ));
      }
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat()));
    }

    // ── 4. Atmosphere glow (two layers) ─────────────────────────────────
    const atmoGeo1 = new THREE.SphereGeometry(R * 1.08, 32, 32);
    const atmoMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(atmoGeo1, atmoMat1));

    const atmoGeo2 = new THREE.SphereGeometry(R * 1.18, 32, 32);
    const atmoMat2 = new THREE.MeshBasicMaterial({
      color: 0x0ea5a4,
      transparent: true,
      opacity: 0.035,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(atmoGeo2, atmoMat2));

    // ── 5. City nodes ─────────────────────────────────────────────────────
    const cities = [
      { lat: 40.7,   lon: -74.0,  label: 'New York' },
      { lat: 51.5,   lon: -0.1,   label: 'London' },
      { lat: 35.7,   lon: 139.7,  label: 'Tokyo' },
      { lat: -33.9,  lon: 151.2,  label: 'Sydney' },
      { lat: 1.3,    lon: 103.8,  label: 'Singapore' },
      { lat: -23.5,  lon: -46.6,  label: 'São Paulo' },
      { lat: 19.4,   lon: -99.1,  label: 'Mexico City' },
      { lat: 55.8,   lon: 37.6,   label: 'Moscow' },
      { lat: 28.6,   lon: 77.2,   label: 'Delhi' },
      { lat: -1.3,   lon: 36.8,   label: 'Nairobi' },
      { lat: 6.5,    lon: 3.4,    label: 'Lagos' },
      { lat: -34.6,  lon: -58.4,  label: 'Buenos Aires' },
      // Sri Lanka — highlighted (special)
      { lat: 7.9,    lon: 80.8,   label: 'Sri Lanka', highlight: true },
    ];

    const latlonToVec = (lat: number, lon: number, r: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta)
      );
    };

    const nodePositions: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const rings: THREE.Mesh[] = [];

    cities.forEach((city) => {
      const pos = latlonToVec(city.lat, city.lon, R);
      nodePositions.push(pos);

      const isHL = (city as { highlight?: boolean }).highlight === true;

      // Core dot
      const dotGeo = new THREE.SphereGeometry(isHL ? 0.28 : 0.16, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: isHL ? 0x22d3ee : 0x67e8f9,
        transparent: true,
        opacity: isHL ? 1.0 : 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      globeGroup.add(dot);
      nodeMeshes.push(dot);

      // Pulsing ring halo
      const ringGeo = new THREE.RingGeometry(isHL ? 0.35 : 0.22, isHL ? 0.55 : 0.36, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isHL ? 0x22d3ee : 0x0ea5a4,
        transparent: true,
        opacity: isHL ? 0.6 : 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      globeGroup.add(ring);
      rings.push(ring);

      // Outer soft halo (extra for Sri Lanka)
      if (isHL) {
        const haloGeo = new THREE.RingGeometry(0.6, 1.0, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.copy(pos);
        halo.lookAt(0, 0, 0);
        globeGroup.add(halo);
        rings.push(halo);
      }
    });

    // ── 6. Arc connections ────────────────────────────────────────────────
    const arcPairs = [
      [0, 1], [1, 2], [2, 4], [4, 8], [8, 12],   // Sri Lanka connected
      [12, 9], [12, 3], [12, 7],                   // Sri Lanka hub
      [0, 6], [6, 5], [5, 11],
      [1, 7], [2, 3],
      [0, 2], [1, 4], [9, 10],
    ];

    const arcMaterials: THREE.LineBasicMaterial[] = [];

    arcPairs.forEach((pair, idx) => {
      const p0 = nodePositions[pair[0]];
      const p1 = nodePositions[pair[1]];
      // Elevate the midpoint above the surface for a visible arc
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const lift = 1.3 + (idx % 3) * 0.15; // vary the arc height
      mid.normalize().multiplyScalar(R * lift);

      const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
      const pts = curve.getPoints(80);

      const isSriLanka = pair.includes(12);
      const mat = new THREE.LineBasicMaterial({
        color: isSriLanka ? 0x22d3ee : 0x38bdf8,
        transparent: true,
        opacity: isSriLanka ? 0.55 : 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      arcMaterials.push(mat);
      globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    });

    // ── 7. Particle field ─────────────────────────────────────────────────
    const makeParticles = (
      count: number,
      rMin: number,
      rMax: number,
      size: number,
      opacity: number,
      color: number
    ) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const θ = Math.random() * Math.PI * 2;
        const φ = Math.acos(Math.random() * 2 - 1);
        const r = rMin + Math.random() * (rMax - rMin);
        pos[i * 3]     = r * Math.sin(φ) * Math.cos(θ);
        pos[i * 3 + 1] = r * Math.sin(φ) * Math.sin(θ);
        pos[i * 3 + 2] = r * Math.cos(φ);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return { geo, mat, pts };
    };

    const stars      = makeParticles(1500, R + 3,  R + 22, 0.06, 0.55, 0xffffff);
    const innerDust  = makeParticles(400,  R + 1,  R + 4,  0.05, 0.35, 0x7dd3fc);
    const outerRing  = makeParticles(200,  R + 0.5, R + 2,  0.04, 0.5,  0x22d3ee);

    // ── Mouse & scroll ────────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const handleScroll = () => {
      const scrollH = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = Math.min(
        (window.scrollY || document.documentElement.scrollTop) / Math.max(scrollH, 1),
        1
      );
    };
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // ── Animation loop ────────────────────────────────────────────────────
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.008;

      const sp = scrollProgressRef.current;

      // Continuous slow auto-rotation + scroll-driven tilt
      globeGroup.rotation.y = time * 0.18 + sp * Math.PI * 2;
      globeGroup.rotation.x = Math.sin(sp * Math.PI) * 0.25;

      // Scroll: move globe up & recede
      globeGroup.position.y = sp * 6 - 3;
      globeGroup.position.z = -sp * 12;

      // Scroll: shrink globe slightly
      const sc = 1 + (1 - sp) * 0.3;
      globeGroup.scale.setScalar(sc);

      // Pulse nodes & rings
      nodeMeshes.forEach((dot, i) => {
        const pulse = 1 + Math.sin(time * 2.2 + i * 0.7) * 0.28;
        dot.scale.setScalar(pulse);
      });
      rings.forEach((ring, i) => {
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = (0.25 + Math.sin(time * 1.8 + i * 0.5) * 0.2) *
          (mat.color.getHex() === 0x22d3ee ? 1.8 : 1.0);
      });

      // Animate arc opacity (data-flow shimmer)
      arcMaterials.forEach((mat, i) => {
        mat.opacity = 0.22 + Math.sin(time * 1.5 + i * 0.6) * 0.25;
      });

      // Slowly rotate the separate particle systems
      stars.pts.rotation.y = time * 0.04;
      stars.pts.rotation.x = time * 0.02;
      innerDust.pts.rotation.y = -time * 0.12;
      innerDust.pts.rotation.z =  time * 0.06;
      outerRing.pts.rotation.y =  time * 0.2;

      // Mouse parallax (subtle)
      camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.025;
      camera.position.y += (mouseY * 2.5 - camera.position.y) * 0.025;
      camera.position.z = 28 + sp * 8;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
      // Dispose particle systems
      [stars, innerDust, outerRing].forEach(({ geo, mat }) => { geo.dispose(); mat.dispose(); });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none hidden md:block"
      style={{ zIndex: 0 }}
    />
  );
}
