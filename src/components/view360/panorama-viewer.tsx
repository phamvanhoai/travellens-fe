"use client";

import { ExternalLink, Info, MapPin, Navigation, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { View360Hotspot } from "@/services/view360.service";

const hotspotAppearance: Record<View360Hotspot["type"], {
  icon: LucideIcon;
  label: string;
  className: string;
}> = {
  navigation: {
    icon: Navigation,
    label: "Navigation",
    className: "bg-amber-500 hover:bg-amber-400 ring-amber-200/30"
  },
  info: {
    icon: Info,
    label: "Information",
    className: "bg-blue-600 hover:bg-blue-500 ring-blue-200/30"
  },
  link: {
    icon: ExternalLink,
    label: "External link",
    className: "bg-violet-600 hover:bg-violet-500 ring-violet-200/30"
  },
  location: {
    icon: MapPin,
    label: "Location",
    className: "bg-emerald-600 hover:bg-emerald-500 ring-emerald-200/30"
  }
};

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
  onHotspotClick?: (hotspot: View360Hotspot, position: { x: number; y: number }) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string) => void;
}) {
  const reduceMotion = useReducedMotion();
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
    let cancelled = false;
    let hotspotFrameCount = 0;

    onLoadingChange(true);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const proxyUrl = `/api/view360/image?url=${encodeURIComponent(imageUrl)}`;
    let attemptedProxy = false;

    const loadTexture = (sourceUrl: string) => loader.load(
      sourceUrl,
      (loadedTexture) => {
        if (cancelled) {
          loadedTexture.dispose();
          return;
        }

        try {
          const source = loadedTexture.image as CanvasImageSource;
          const canvas = document.createElement("canvas");
          canvas.width = 2048;
          canvas.height = 1024;
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Canvas 2D is unavailable.");
          context.drawImage(source, 0, 0, canvas.width, canvas.height);

          texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = false;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          material.map = texture;
          material.color.set(0xffffff);
          material.needsUpdate = true;
          loadedTexture.dispose();
          onLoadingChange(false);
        } catch {
          loadedTexture.dispose();
          onLoadingChange(false);
          onError("This panorama image could not be prepared for 360 viewing.");
        }
      },
      undefined,
      () => {
        if (cancelled) return;
        if (!attemptedProxy && /^https:\/\//i.test(imageUrl)) {
          attemptedProxy = true;
          loadTexture(proxyUrl);
          return;
        }
        onLoadingChange(false);
        onError("This panorama image could not be loaded.");
      }
    );
    loadTexture(imageUrl);

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
      cancelled = true;
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
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [imageUrl, onError, onLoadingChange]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-black">
      <div className="pointer-events-none absolute inset-0">
        {hotspots.map((hotspot) => {
          const position = hotspotPositions.find((item) => item.id === hotspot.id);
          if (!position?.visible) return null;
          const appearance = hotspotAppearance[hotspot.type] ?? hotspotAppearance.info;
          const HotspotIcon = appearance.icon;
          return (
            <motion.button
              key={hotspot.id}
              type="button"
              onClick={() => onHotspotClick?.(hotspot, { x: position.x, y: position.y })}
              className={`group pointer-events-auto absolute grid size-11 place-items-center rounded-full border border-white/60 text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)] ring-4 transition-colors ${appearance.className}`}
              style={{ left: position.x - 22, top: position.y - 22 }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.35, ease: "backOut" }}
              whileHover={reduceMotion ? undefined : { scale: 1.12 }}
              whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              title={`${appearance.label}: ${hotspot.title}`}
              aria-label={`${appearance.label}: ${hotspot.title}`}
            >
              <HotspotIcon size={19} strokeWidth={2.4} />
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] w-max max-w-48 -translate-x-1/2 rounded-md border border-white/15 bg-black/80 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="block text-[10px] uppercase tracking-wide text-white/60">{appearance.label}</span>
                <span className="block max-w-44 truncate">{hotspot.title}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
