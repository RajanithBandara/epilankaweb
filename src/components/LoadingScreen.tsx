'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface LoadingScreenProps {
  isLoading: boolean;
}

// ── Mini Three.js globe (same design language as home page globe) ──────────
function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 240, H = 240;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 22;

    const R = 7;
    const group = new THREE.Group();
    scene.add(group);

    // Inner depth sphere
    const innerGeo = new THREE.SphereGeometry(R * 0.98, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a, transparent: true, opacity: 0.2 });
    group.add(new THREE.Mesh(innerGeo, innerMat));

    // Wireframe shell
    const wireGeo = new THREE.SphereGeometry(R, 28, 28);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x1e40af, wireframe: true, transparent: true, opacity: 0.14 });
    group.add(new THREE.Mesh(wireGeo, wireMat));

    // Grid lines
    const lineMat = () =>
      new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.22 });

    for (let deg = -75; deg <= 75; deg += 15) {
      const lat = (deg * Math.PI) / 180;
      const r = Math.cos(lat) * R, y = Math.sin(lat) * R;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 96; j++) {
        const theta = (j / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat()));
    }
    for (let i = 0; i < 16; i++) {
      const lon = (i / 16) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 48; j++) {
        const lat = (j / 48) * Math.PI - Math.PI / 2;
        pts.push(new THREE.Vector3(R * Math.cos(lat) * Math.cos(lon), R * Math.sin(lat), R * Math.cos(lat) * Math.sin(lon)));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat()));
    }

    // Atmosphere glow
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.07,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    group.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 32, 32), atmoMat));

    // Sri Lanka node
    const sriLankaPhi = (90 - 7.9) * (Math.PI / 180);
    const sriLankaTheta = (80.8 + 180) * (Math.PI / 180);
    const slPos = new THREE.Vector3(
      -R * Math.sin(sriLankaPhi) * Math.cos(sriLankaTheta),
       R * Math.cos(sriLankaPhi),
       R * Math.sin(sriLankaPhi) * Math.sin(sriLankaTheta)
    );

    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), dotMat);
    dot.position.copy(slPos);
    group.add(dot);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.56, 32), ringMat);
    ring.position.copy(slPos);
    ring.lookAt(0, 0, 0);
    group.add(ring);

    // A few other city nodes
    const cities = [
      { lat: 40.7, lon: -74 }, { lat: 51.5, lon: -0.1 }, { lat: 35.7, lon: 139.7 },
      { lat: 1.3, lon: 103.8 }, { lat: 28.6, lon: 77.2 }, { lat: -1.3, lon: 36.8 },
    ];
    const cityNodes: THREE.Mesh[] = [];
    const cityMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    cities.forEach(({ lat, lon }) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const pos = new THREE.Vector3(
        -R * Math.sin(phi) * Math.cos(theta),
         R * Math.cos(phi),
         R * Math.sin(phi) * Math.sin(theta)
      );
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), cityMat);
      node.position.copy(pos);
      group.add(node);
      cityNodes.push(node);
    });

    // Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = R + 1.5 + Math.random() * 6;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMesh = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.06, color: 0xffffff, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(pMesh);

    let time = 0;
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      time += 0.01;
      group.rotation.y = time * 0.25;
      group.rotation.x = Math.sin(time * 0.3) * 0.12;
      const p = 1 + Math.sin(time * 2.2) * 0.28;
      dot.scale.setScalar(p);
      ringMat.opacity = 0.3 + Math.sin(time * 1.8) * 0.25;
      cityNodes.forEach((n, i) => {
        n.scale.setScalar(1 + Math.sin(time * 2 + i * 0.8) * 0.25);
      });
      pMesh.rotation.y = time * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} width={240} height={240} />;
}

// ── Main Loading Screen ────────────────────────────────────────────────────
export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [shouldRender, setShouldRender] = useState(isLoading);

  // Progress simulation
  useEffect(() => {
    if (isLoading) {
      // Defer reset to avoid sync setState in effect body.
      const reset = setTimeout(() => setProgress(0), 0);
      const iv = setInterval(() => {
        setProgress(prev => {
          if (prev >= 88) { clearInterval(iv); return 88; }
          return prev + Math.random() * 12 + 4;
        });
      }, 180);
      return () => {
        clearTimeout(reset);
        clearInterval(iv);
      };
    } else {
      const t = setTimeout(() => setProgress(100), 80);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  // Visibility lifecycle
  useEffect(() => {
    if (!isLoading && progress === 100) {
      const t = setTimeout(() => setShouldRender(false), 900);
      return () => clearTimeout(t);
    }
    if (isLoading && !shouldRender) {
      // Defer mount restore to avoid sync setState in effect body.
      const t = setTimeout(() => setShouldRender(true), 0);
      return () => clearTimeout(t);
    }
  }, [isLoading, progress, shouldRender]);

  if (!shouldRender) return null;

  const isExiting = !isLoading && progress === 100;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #0c7490 100%)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.08)' : 'scale(1)',
        transition: 'opacity 0.85s cubic-bezier(0.4,0,0.2,1), transform 0.85s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Subtle mesh grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient corner glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0EA5A4]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Globe */}
      <div
        className="relative mb-6"
        style={{
          filter: 'drop-shadow(0 0 32px rgba(34,211,238,0.35))',
          transform: isExiting ? 'scale(1.15)' : 'scale(1)',
          transition: 'transform 0.85s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Outer glow ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-64 h-64 rounded-full border border-[#67e8f9]/20"
            style={{ animation: 'spin 12s linear infinite' }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-56 h-56 rounded-full border border-[#0ea5a4]/15"
            style={{ animation: 'spin 8s linear infinite reverse' }}
          />
        </div>

        <GlobeCanvas />
      </div>

      {/* Brand name */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-1">
          EpiWatch{' '}
          <span className="bg-gradient-to-r from-[#7dd3fc] to-[#67e8f9] bg-clip-text text-transparent">
            Lanka
          </span>
        </h1>
        <p className="text-white/50 text-sm tracking-widest uppercase">
          Disease Surveillance Platform
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-52 flex flex-col items-center gap-2">
        <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: 'linear-gradient(90deg, #7dd3fc, #22d3ee)',
              transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 8px rgba(34,211,238,0.6)',
            }}
          />
        </div>
        <span className="text-white/40 text-xs tabular-nums">
          {Math.min(Math.round(progress), 100)}%
        </span>
      </div>

      {/* Keyframe for the slow spin rings */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
