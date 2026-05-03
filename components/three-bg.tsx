"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBg() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.z = 4;

    // Floating particles
    const COUNT = 280;
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const offsets = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      speeds[i] = 0.003 + Math.random() * 0.006;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Primary color from CSS variable — fallback to pink
    const primaryHex = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#e91e63";

    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(primaryHex),
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Thin connection lines (icosahedron wireframe)
    const icoGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryHex),
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    let raf: number;
    let t = 0;

    function animate() {
      raf = requestAnimationFrame(animate);
      t += 0.008;

      // Bob particles
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        pos.setY(i, positions[i * 3 + 1] + Math.sin(t * speeds[i] * 120 + offsets[i]) * 0.12);
      }
      pos.needsUpdate = true;

      // Slowly rotate wireframe
      ico.rotation.x = t * 0.12;
      ico.rotation.y = t * 0.09;

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      if (!el) return;
      const nw = el.clientWidth;
      const nh = el.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}
