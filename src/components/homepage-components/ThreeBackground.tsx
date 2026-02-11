'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // ===== CREATE THE CONNECTED GLOBE =====
    const globeRadius = 8;

    // Main globe wireframe (representing Earth)
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 32, 32);
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Create latitude lines (parallels)
    const latLines: THREE.Line[] = [];
    for (let i = -60; i <= 60; i += 30) {
      const lat = (i * Math.PI) / 180;
      const r = Math.cos(lat) * globeRadius;
      const y = Math.sin(lat) * globeRadius;

      const points = [];
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(
          r * Math.cos(theta),
          y,
          r * Math.sin(theta)
        ));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x0EA5A4,
        transparent: true,
        opacity: 0.3,
      });
      const line = new THREE.Line(geometry, material);
      latLines.push(line);
      scene.add(line);
    }

    // Create longitude lines (meridians)
    const lonLines: THREE.Line[] = [];
    for (let i = 0; i < 12; i++) {
      const points = [];
      const lon = (i / 12) * Math.PI * 2;

      for (let j = 0; j <= 32; j++) {
        const lat = ((j / 32) * Math.PI) - (Math.PI / 2);
        const x = globeRadius * Math.cos(lat) * Math.cos(lon);
        const y = globeRadius * Math.sin(lat);
        const z = globeRadius * Math.cos(lat) * Math.sin(lon);
        points.push(new THREE.Vector3(x, y, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x0EA5A4,
        transparent: true,
        opacity: 0.3,
      });
      const line = new THREE.Line(geometry, material);
      lonLines.push(line);
      scene.add(line);
    }

    // ===== CREATE CONNECTION NODES (Disease Awareness Points) =====
    // Simulate major cities/regions around the world
    const nodeLocations = [
      { lat: 40.7, lon: -74 },   // New York
      { lat: 51.5, lon: -0.1 },  // London
      { lat: 35.7, lon: 139.7 }, // Tokyo
      { lat: -33.9, lon: 151.2 },// Sydney
      { lat: 1.3, lon: 103.8 },  // Singapore
      { lat: -23.5, lon: -46.6 },// São Paulo
      { lat: 19.4, lon: -99.1 }, // Mexico City
      { lat: 55.8, lon: 37.6 },  // Moscow
      { lat: 28.6, lon: 77.2 },  // Delhi
      { lat: -1.3, lon: 36.8 },  // Nairobi
      { lat: 6.5, lon: 3.4 },    // Lagos
      { lat: -34.6, lon: -58.4 },// Buenos Aires
    ];

    const nodes: THREE.Mesh[] = [];
    const nodePositions: THREE.Vector3[] = [];

    nodeLocations.forEach((loc) => {
      const phi = (90 - loc.lat) * (Math.PI / 180);
      const theta = (loc.lon + 180) * (Math.PI / 180);

      const x = -(globeRadius * Math.sin(phi) * Math.cos(theta));
      const z = (globeRadius * Math.sin(phi) * Math.sin(theta));
      const y = (globeRadius * Math.cos(phi));

      const position = new THREE.Vector3(x, y, z);
      nodePositions.push(position);

      // Create pulsing node
      const nodeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.8,
      });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.copy(position);
      nodes.push(node);
      scene.add(node);

      // Add glow ring around each node
      const glowGeometry = new THREE.RingGeometry(0.25, 0.3, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8888,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(position);
      glow.lookAt(0, 0, 0);
      scene.add(glow);
    });

    // ===== CREATE CONNECTION LINES BETWEEN NODES =====
    const connections: THREE.Line[] = [];
    const connectionMaterials: THREE.LineBasicMaterial[] = [];

    // Connect some nodes to show global network
    const connectionPairs = [
      [0, 1], [1, 2], [2, 4], [4, 9], [9, 10],
      [0, 6], [6, 5], [5, 11], [1, 7], [7, 8],
      [2, 3], [4, 8], [0, 2], [1, 4], [8, 10]
    ];

    connectionPairs.forEach((pair) => {
      const start = nodePositions[pair[0]];
      const end = nodePositions[pair[1]];

      // Create curved connection line
      const curve = new THREE.QuadraticBezierCurve3(
        start,
        new THREE.Vector3(
          (start.x + end.x) * 0.6,
          (start.y + end.y) * 0.6,
          (start.z + end.z) * 0.6
        ),
        end
      );

      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4,
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      connections.push(line);
      connectionMaterials.push(material);
      scene.add(line);
    });

    // ===== AMBIENT PARTICLES (Data/Information Flow) =====
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = globeRadius + 1 + Math.random() * 8;

      posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      posArray[i * 3 + 2] = radius * Math.cos(phi);
    }

    particlesGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(posArray, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Mouse movement
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    // Scroll effect
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgressRef.current = Math.min(scrollTop / Math.max(scrollHeight, 1), 1);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      const scrollProgress = scrollProgressRef.current;

      // Rotate the globe based on scroll (simulating Earth rotation)
      globe.rotation.y = scrollProgress * Math.PI * 3;
      globe.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.3;

      // Rotate lat/lon lines with globe
      [...latLines, ...lonLines].forEach((line) => {
        line.rotation.y = globe.rotation.y;
        line.rotation.x = globe.rotation.x;
      });

      // Rotate nodes with globe
      nodes.forEach((node, index) => {
        node.rotation.y = globe.rotation.y;
        node.rotation.x = globe.rotation.x;

        // Pulsing effect
        const pulse = 1 + Math.sin(time * 2 + index) * 0.3;
        node.scale.set(pulse, pulse, pulse);
      });

      // Animate connection lines (data flow effect)
      connectionMaterials.forEach((material, index) => {
        material.opacity = 0.3 + Math.sin(time * 2 + index * 0.5) * 0.3;
      });

      // Scale globe based on scroll
      const scale = 1 + (1 - scrollProgress) * 0.4;
      globe.scale.set(scale, scale, scale);

      [...latLines, ...lonLines].forEach((line) => {
        line.scale.set(scale, scale, scale);
      });

      // Move globe position based on scroll
      globe.position.y = scrollProgress * 8 - 4;
      globe.position.z = -scrollProgress * 15;

      [...latLines, ...lonLines].forEach((line) => {
        line.position.copy(globe.position);
      });

      // Rotate particles slowly
      particlesMesh.rotation.y = time * 0.1;
      particlesMesh.rotation.x = time * 0.05;

      // Mouse parallax
      camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 3 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      // Camera zoom based on scroll
      camera.position.z = 30 + scrollProgress * 10;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose of Three.js resources
      globeGeometry.dispose();
      globeMaterial.dispose();
      latLines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      lonLines.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      nodes.forEach(node => {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      });
      connections.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}


