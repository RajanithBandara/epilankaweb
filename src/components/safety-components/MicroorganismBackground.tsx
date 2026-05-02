'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MicroorganismBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;

    // scene
    const scene = new THREE.Scene();

    // camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 60;

    // renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0x0ea5a4, 3, 200);
    pointLight1.position.set(30, 30, 30);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x1e3a8a, 3, 200);
    pointLight2.position.set(-30, -30, 30);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 1.5, 150);
    pointLight3.position.set(0, 0, 50);
    scene.add(pointLight3);

    // Objects
    const organisms: { 
      group: THREE.Group; 
      speed: number; 
      offset: number;
      rotSpeed: { x: number, y: number, z: number };
      drift: THREE.Vector3;
    }[] = [];

    const createVirus = (color: number) => {
      const group = new THREE.Group();
      
      // Core - Icosahedron for virus-like geometric look
      const coreGeo = new THREE.IcosahedronGeometry(2, 1);
      const coreMat = new THREE.MeshPhongMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.6,
        shininess: 100,
        wireframe: false
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // Spikes
      const spikeGeo = new THREE.ConeGeometry(0.15, 1.5, 8);
      const spikeMat = new THREE.MeshPhongMaterial({ color });
      
      const vertices = (coreGeo as THREE.IcosahedronGeometry).attributes.position;
      const vertex = new THREE.Vector3();
      
      for (let i = 0; i < vertices.count; i++) {
        vertex.fromBufferAttribute(vertices, i);
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.copy(vertex);
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vertex.clone().normalize());
        group.add(spike);
      }
      
      return group;
    };

    const createBacteria = (color: number) => {
      const group = new THREE.Group();
      
      // Body - Capsule shape
      const bodyGeo = new THREE.CapsuleGeometry(1, 3, 4, 12);
      const bodyMat = new THREE.MeshPhongMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.5,
        shininess: 60 
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // Multiple small flagella
      for (let i = 0; i < 3; i++) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -2, 0),
          new THREE.Vector3(0.5 + Math.random(), -3.5, Math.random()),
          new THREE.Vector3(-0.5 - Math.random(), -5, -Math.random()),
          new THREE.Vector3(0, -6.5, 0),
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.08, 6, false);
        const tubeMat = new THREE.MeshBasicMaterial({ 
          color, 
          transparent: true, 
          opacity: 0.3 
        });
        const tail = new THREE.Mesh(tubeGeo, tubeMat);
        tail.position.x = (Math.random() - 0.5) * 0.5;
        group.add(tail);
      }

      return group;
    };

    // Add a mix of organisms
    const colors = [0x0ea5a4, 0x1e3a8a, 0x38bdf8, 0x0f766e];
    
    for (let i = 0; i < 45; i++) {
      const isVirus = Math.random() > 0.4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const group = isVirus ? createVirus(color) : createBacteria(color);
      
      group.position.set(
        (Math.random() - 0.5) * 140,
        (Math.random() - 0.5) * 140,
        (Math.random() - 0.5) * 60
      );
      
      group.rotation.set(
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      );
      
      const scale = 0.6 + Math.random() * 1.2;
      group.scale.set(scale, scale, scale);
      
      organisms.push({
        group,
        speed: 0.0005 + Math.random() * 0.001,
        offset: Math.random() * 100,
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        },
        drift: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.01
        )
      });
      
      scene.add(group);
    }

    // Floating micro-particles (dust/cells)
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 1500;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 200;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ 
      size: 0.3, 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Mouse movement influence
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 10;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 10;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    let time = 0;
    const animate = () => {
      time = Date.now();
      
      organisms.forEach((org) => {
        // Floating movement
        org.group.position.x += Math.sin(time * org.speed + org.offset) * 0.05 + org.drift.x;
        org.group.position.y += Math.cos(time * org.speed + org.offset) * 0.05 + org.drift.y;
        org.group.position.z += Math.sin(time * org.speed * 0.5 + org.offset) * 0.02 + org.drift.z;

        // Rotation
        org.group.rotation.x += org.rotSpeed.x;
        org.group.rotation.y += org.rotSpeed.y;
        org.group.rotation.z += org.rotSpeed.z;

        // Keep within bounds
        if (org.group.position.x > 80) org.group.position.x = -80;
        if (org.group.position.x < -80) org.group.position.x = 80;
        if (org.group.position.y > 80) org.group.position.y = -80;
        if (org.group.position.y < -80) org.group.position.y = 80;
      });

      // Dust rotation
      dust.rotation.y += 0.0005;
      dust.rotation.x += 0.0002;

      // Camera parallax
      camera.position.x += (mouseX - camera.position.x) * 0.02;
      camera.position.y += (-mouseY - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
      dustGeo.dispose();
      dustMat.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000" 
      style={{ background: 'transparent' }}
    />
  );
}
