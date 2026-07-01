"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function PanoramaViewer({
  imageUrl,
  autoRotate,
  onLoadingChange,
  onError
}: {
  imageUrl: string;
  autoRotate: boolean;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      onError("Your browser could not start the 360 viewer.");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "h-full w-full cursor-grab touch-none active:cursor-grabbing";
    renderer.domElement.setAttribute("aria-label", "Interactive 360 panorama. Drag to look around and scroll to zoom.");
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 200);
    camera.position.set(0, 0, 0.01);
    const geometry = new THREE.SphereGeometry(100, 72, 48);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    let longitude = 90;
    let latitude = 0;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    let startLongitude = 0;
    let startLatitude = 0;
    let frameId = 0;
    let texture: THREE.Texture | null = null;

    onLoadingChange(true);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      imageUrl,
      (loadedTexture) => {
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        onLoadingChange(false);
      },
      undefined,
      () => {
        onLoadingChange(false);
        onError("This panorama image could not be loaded.");
      }
    );

    function render() {
      frameId = window.requestAnimationFrame(render);
      if (autoRotateRef.current && !dragging) longitude += 0.025;
      latitude = Math.max(-75, Math.min(75, latitude));
      const phi = THREE.MathUtils.degToRad(90 - latitude);
      const theta = THREE.MathUtils.degToRad(longitude);
      camera.lookAt(
        100 * Math.sin(phi) * Math.cos(theta),
        100 * Math.cos(phi),
        100 * Math.sin(phi) * Math.sin(theta)
      );
      renderer.render(scene, camera);
    }

    function onPointerDown(event: PointerEvent) {
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      startLongitude = longitude;
      startLatitude = latitude;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: PointerEvent) {
      if (!dragging) return;
      longitude = startLongitude + (pointerX - event.clientX) * 0.12;
      latitude = startLatitude + (event.clientY - pointerY) * 0.12;
    }

    function onPointerUp(event: PointerEvent) {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();
      camera.fov = Math.max(35, Math.min(90, camera.fov + event.deltaY * 0.035));
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    render();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      geometry.dispose();
      material.dispose();
      texture?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [imageUrl, onError, onLoadingChange]);

  return <div ref={containerRef} className="absolute inset-0 bg-black" />;
}
