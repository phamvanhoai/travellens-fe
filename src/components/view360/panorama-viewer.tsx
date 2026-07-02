"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { View360Hotspot } from "@/services/view360.service";

export function PanoramaViewer({
  imageUrl,
  autoRotate,
  hotspots = [],
  onHotspotClick,
  onLoadingChange,
  onError
}: {
  imageUrl: string;
  autoRotate: boolean;
  hotspots?: View360Hotspot[];
  onHotspotClick?: (hotspot: View360Hotspot) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef(autoRotate);
  const hotspotsRef = useRef(hotspots);
  const [hotspotPositions, setHotspotPositions] = useState<Array<{ id: number; x: number; y: number; visible: boolean }>>([]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    hotspotsRef.current = hotspots;
  }, [hotspots]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const viewerContainer = container;

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
    let hotspotFrameCount = 0;

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
      camera.updateMatrixWorld();
      hotspotFrameCount += 1;
      if (hotspotFrameCount % 2 === 0) updateHotspotPositions();
      renderer.render(scene, camera);
    }

    function updateHotspotPositions() {
      const width = viewerContainer.clientWidth;
      const height = Math.max(viewerContainer.clientHeight, 1);
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      setHotspotPositions(hotspotsRef.current.map((hotspot) => {
        const hotspotPhi = THREE.MathUtils.degToRad(90 - hotspot.pitch);
        const hotspotTheta = THREE.MathUtils.degToRad(hotspot.yaw);
        const worldPosition = new THREE.Vector3(
          100 * Math.sin(hotspotPhi) * Math.cos(hotspotTheta),
          100 * Math.cos(hotspotPhi),
          100 * Math.sin(hotspotPhi) * Math.sin(hotspotTheta)
        );
        const direction = worldPosition.clone().normalize();
        const projected = worldPosition.clone().project(camera);
        const visible = cameraDirection.dot(direction) > 0 && projected.x >= -1.08 && projected.x <= 1.08 && projected.y >= -1.08 && projected.y <= 1.08;

        return {
          id: hotspot.id,
          x: ((projected.x + 1) / 2) * width,
          y: ((-projected.y + 1) / 2) * height,
          visible
        };
      }));
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

  return (
    <div ref={containerRef} className="absolute inset-0 bg-black">
      <div className="pointer-events-none absolute inset-0">
        {hotspots.map((hotspot) => {
          const position = hotspotPositions.find((item) => item.id === hotspot.id);
          if (!position?.visible) return null;
          return (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => onHotspotClick?.(hotspot)}
              className="pointer-events-auto absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-brand-600 text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)] ring-4 ring-white/20 transition hover:scale-110 hover:bg-brand-500"
              style={{ left: position.x, top: position.y }}
              title={hotspot.title}
              aria-label={hotspot.title}
            >
              <MapPin size={19} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
