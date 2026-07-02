"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Droplets,
  Headphones,
  Languages,
  Loader2,
  MapPin,
  Maximize,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  RotateCcw,
  Thermometer,
  Volume2,
  VolumeX,
  Wind
} from "lucide-react";
import { PanoramaViewer } from "@/components/view360/panorama-viewer";
import { view360Service, type View360Experience, type View360Weather } from "@/services/view360.service";

export default function View360Page() {
  const rootRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const autoplayAttemptedRef = useRef(new Set<number>());
  const [experiences, setExperiences] = useState<View360Experience[]>([]);
  const [activeSceneId, setActiveSceneId] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [destinationId, setDestinationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [panoramaLoading, setPanoramaLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [weather, setWeather] = useState<View360Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [sceneNavigationCollapsed, setSceneNavigationCollapsed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDestinationId = params.get("destinationId") ?? "";
    const requestedSceneId = Number(params.get("sceneId") ?? 0);
    setDestinationId(requestedDestinationId);

    async function loadExperiences() {
      setLoading(true);
      setError("");
      try {
        const result = await view360Service.list(requestedDestinationId || undefined);
        setExperiences(result);
        setActiveSceneId(result.some((scene) => scene.id === requestedSceneId) ? requestedSceneId : result[0]?.id ?? 0);
      } catch (loadError) {
        console.error("Failed to load View360 experiences:", loadError);
        setError("The 360 experiences could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    void loadExperiences();
  }, []);

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const activeScene = useMemo(
    () => experiences.find((scene) => scene.id === activeSceneId) ?? experiences[0],
    [activeSceneId, experiences]
  );
  const activeImage = activeScene?.images[activeImageIndex] ?? activeScene?.images[0];
  const scenePosition = activeScene ? experiences.findIndex((scene) => scene.id === activeScene.id) : -1;

  useEffect(() => {
    setActiveImageIndex(0);
    setPanoramaLoading(true);
    setError("");
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.load();
    }
    setAudioPlaying(false);
  }, [activeSceneId]);

  const handlePanoramaLoading = useCallback((value: boolean) => setPanoramaLoading(value), []);
  const handlePanoramaError = useCallback((message: string) => setError(message), []);

  useEffect(() => {
    if (!activeScene?.locationId) {
      setWeather(null);
      setWeatherError("");
      return;
    }

    let cancelled = false;
    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError("");
      try {
        const result = await view360Service.getWeather(activeScene.locationId);
        if (!cancelled) setWeather(result);
      } catch {
        if (!cancelled) {
          setWeather(null);
          setWeatherError("Weather unavailable");
        }
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }

    void loadWeather();
    return () => {
      cancelled = true;
    };
  }, [activeScene?.locationId]);

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio || !activeScene?.audioUrl) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setError("Audio narration could not be played.");
    }
  }

  async function tryAutoplay() {
    const audio = audioRef.current;
    if (!audio || !activeScene?.audioUrl || autoplayAttemptedRef.current.has(activeScene.id)) return;
    autoplayAttemptedRef.current.add(activeScene.id);
    try {
      await audio.play();
    } catch {
      // Browsers may block audible autoplay until the first user interaction.
    }
  }

  async function toggleFullscreen() {
    if (!rootRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await rootRef.current.requestFullscreen();
  }

  function selectScene(sceneId: number) {
    setActiveSceneId(sceneId);
  }

  function moveScene(direction: -1 | 1) {
    if (!experiences.length) return;
    const nextIndex = (Math.max(scenePosition, 0) + direction + experiences.length) % experiences.length;
    selectScene(experiences[nextIndex].id);
  }

  if (loading) {
    return (
      <section className="grid min-h-[calc(100vh-80px)] place-items-center bg-black text-white">
        <div className="text-center">
          <Loader2 className="mx-auto size-9 animate-spin" />
          <p className="mt-4 text-sm text-white/65">Loading 360 experiences...</p>
        </div>
      </section>
    );
  }

  if (!activeScene || !activeImage) {
    return (
      <section className="grid min-h-[calc(100vh-80px)] place-items-center bg-slate-950 px-5 text-white">
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-lg border border-white/15 bg-white/10"><RotateCcw /></span>
          <h1 className="mt-5 text-2xl font-bold">No 360 experience available</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">No published panorama is connected to this destination yet.</p>
          <Link href={destinationId ? `/destinations/${destinationId}` : "/destinations"} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950">
            <ArrowLeft size={17} /> Back to destinations
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section ref={rootRef} className="relative h-[calc(100vh-80px)] min-h-[620px] overflow-hidden bg-black text-white">
      <PanoramaViewer
        key={activeImage.id || activeImage.src}
        imageUrl={activeImage.src}
        autoRotate={autoRotate}
        onLoadingChange={handlePanoramaLoading}
        onError={handlePanoramaError}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.48),transparent_28%,transparent_55%,rgba(0,0,0,0.82))]" />

      {panoramaLoading ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45">
          <Loader2 className="size-10 animate-spin" />
        </div>
      ) : null}

      <header className="absolute left-0 top-0 h-20 w-screen max-w-full sm:h-24">
        <Link
          href={destinationId ? `/destinations/${destinationId}` : "/destinations"}
          className="absolute left-4 top-4 inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-black/45 px-3 text-sm font-semibold backdrop-blur-md transition hover:bg-black/65 sm:left-6 sm:top-6 sm:h-11 sm:px-4"
        >
          <ArrowLeft size={17} /> <span className="hidden sm:inline">Back</span>
        </Link>

        <div className="absolute right-4 top-4 flex items-center gap-1.5 sm:right-6 sm:top-6 sm:gap-2">
          {activeScene.audioUrl ? (
            <button type="button" onClick={() => void toggleAudio()} title={audioPlaying ? "Pause narration" : "Play narration"} aria-label={audioPlaying ? "Pause narration" : "Play narration"} className="grid size-10 place-items-center rounded-lg border border-white/15 bg-black/45 backdrop-blur-md transition hover:bg-black/65 sm:size-11">
              {audioPlaying ? <Pause size={18} /> : <Headphones size={18} />}
            </button>
          ) : null}
          <button type="button" onClick={() => setMuted((value) => !value)} title={muted ? "Unmute" : "Mute"} aria-label={muted ? "Unmute" : "Mute"} className="hidden size-11 place-items-center rounded-lg border border-white/15 bg-black/45 backdrop-blur-md transition hover:bg-black/65 sm:grid">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button type="button" onClick={() => setAutoRotate((value) => !value)} title={autoRotate ? "Pause rotation" : "Start rotation"} aria-label={autoRotate ? "Pause rotation" : "Start rotation"} className="grid size-10 place-items-center rounded-lg border border-white/15 bg-black/45 backdrop-blur-md transition hover:bg-black/65 sm:size-11">
            {autoRotate ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button type="button" onClick={() => void toggleFullscreen()} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} className="grid size-10 place-items-center rounded-lg border border-white/15 bg-black/45 backdrop-blur-md transition hover:bg-black/65 sm:size-11">
            <Maximize size={18} />
          </button>
        </div>
      </header>

      <div className={`absolute inset-x-0 bottom-0 p-4 sm:p-6 ${sceneNavigationCollapsed ? "lg:pr-24" : "lg:pr-[390px]"}`}>
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/75">
            <span className="rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur-md">Scene {String(scenePosition + 1).padStart(2, "0")}</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur-md"><Languages size={13} /> {activeScene.language}</span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur-md"><MapPin size={13} /> Location #{activeScene.locationId}</span>
            <WeatherBadge weather={weather} loading={weatherLoading} error={weatherError} />
          </div>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{activeScene.title}</h1>
          <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">{activeScene.description}</p>

          {activeScene.images.length > 1 ? (
            <div className="mt-4 flex gap-2">
              {activeScene.images.map((image, index) => (
                <button key={image.id || image.src} type="button" onClick={() => setActiveImageIndex(index)} aria-label={`Open panorama ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === activeImageIndex ? "w-10 bg-white" : "w-5 bg-white/35 hover:bg-white/65"}`} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {sceneNavigationCollapsed ? (
        <button
          type="button"
          onClick={() => setSceneNavigationCollapsed(false)}
          title="Open scene navigation"
          aria-label="Open scene navigation"
          className="absolute right-5 top-24 hidden h-12 w-12 place-items-center rounded-lg border border-white/15 bg-black/45 backdrop-blur-xl transition hover:bg-black/65 lg:grid"
        >
          <PanelRightOpen size={18} />
        </button>
      ) : null}

      <aside className={`absolute bottom-5 right-5 top-20 hidden w-[340px] flex-col overflow-hidden rounded-lg border border-white/15 bg-black/45 p-4 backdrop-blur-xl transition-all duration-300 lg:flex ${sceneNavigationCollapsed ? "pointer-events-none translate-x-[calc(100%+2rem)] opacity-0" : "translate-x-0 opacity-100"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-white/50">Virtual tour</p>
            <h2 className="mt-1 font-bold">Scene Navigation</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/55">{experiences.length} scenes</span>
            <button
              type="button"
              onClick={() => setSceneNavigationCollapsed(true)}
              title="Collapse scene navigation"
              aria-label="Collapse scene navigation"
              className="grid size-9 place-items-center rounded-lg border border-white/15 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <PanelRightClose size={16} />
            </button>
          </div>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {experiences.map((scene, index) => (
            <button key={scene.id} type="button" onClick={() => selectScene(scene.id)} className={`grid w-full grid-cols-[96px_1fr] overflow-hidden rounded-lg border text-left transition ${scene.id === activeScene.id ? "border-white/55 bg-white/15" : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/10"}`}>
              <img src={scene.images[0].src} alt="" className="h-20 w-24 object-cover" />
              <span className="min-w-0 p-3">
                <span className="block text-[11px] font-semibold text-white/50">SCENE {String(index + 1).padStart(2, "0")}</span>
                <span className="mt-1 block truncate text-sm font-bold">{scene.title}</span>
                <span className="mt-1 block truncate text-xs text-white/55">{scene.language}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => moveScene(-1)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-semibold hover:bg-white/10"><ChevronLeft size={17} /> Previous</button>
          <button type="button" onClick={() => moveScene(1)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-semibold hover:bg-white/10">Next <ChevronRight size={17} /></button>
        </div>
      </aside>

      <div className="absolute bottom-44 left-4 right-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {experiences.map((scene, index) => (
          <button key={scene.id} type="button" onClick={() => selectScene(scene.id)} className={`shrink-0 overflow-hidden rounded-lg border bg-black/50 backdrop-blur-md ${scene.id === activeScene.id ? "border-white" : "border-white/15"}`}>
            <img src={scene.images[0].src} alt="" className="h-16 w-24 object-cover" />
            <span className="block max-w-24 truncate px-2 py-1.5 text-left text-xs font-semibold">{index + 1}. {scene.title}</span>
          </button>
        ))}
      </div>

      {error ? <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded-lg border border-rose-300/30 bg-rose-950/80 px-4 py-3 text-sm font-semibold backdrop-blur-md">{error}</div> : null}
      <audio
        ref={audioRef}
        src={activeScene.audioUrl || undefined}
        muted={muted}
        preload="metadata"
        playsInline
        autoPlay
        onCanPlay={() => void tryAutoplay()}
        onPlay={() => { setAudioPlaying(true); setError(""); }}
        onPause={() => setAudioPlaying(false)}
        onEnded={() => setAudioPlaying(false)}
        onError={() => { setAudioPlaying(false); setError("Audio narration could not be loaded."); }}
      />
    </section>
  );
}

function WeatherBadge({ weather, loading, error }: { weather: View360Weather | null; loading: boolean; error: string }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur-md">
        <Loader2 className="size-3.5 animate-spin" /> Weather
      </span>
    );
  }

  if (!weather) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 text-white/55 backdrop-blur-md">
        <CloudSun size={13} /> {error || "Weather unavailable"}
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-white/15 bg-black/35 px-2.5 py-1.5 backdrop-blur-md">
      <span className="inline-flex items-center gap-1.5 text-white"><CloudSun size={13} /> {weather.condition}</span>
      {weather.temperature !== null ? <span className="inline-flex items-center gap-1"><Thermometer size={13} /> {Math.round(weather.temperature)}°C</span> : null}
      {weather.feelsLike !== null ? <span className="hidden items-center gap-1 sm:inline-flex">Feels {Math.round(weather.feelsLike)}°C</span> : null}
      {weather.humidity !== null ? <span className="hidden items-center gap-1 sm:inline-flex"><Droplets size={13} /> {Math.round(weather.humidity)}%</span> : null}
      {weather.windSpeed !== null ? <span className="hidden items-center gap-1 sm:inline-flex"><Wind size={13} /> {Math.round(weather.windSpeed)} km/h</span> : null}
    </span>
  );
}
