"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/components/common/toast";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import { authService } from "@/services/auth.service";
import { getTravelStoryAuthor, getTravelStoryAvatar, getTravelStoryId, getTravelStoryMedia, getTravelStoryUserId, travelStoryService, type TravelStory } from "@/services/travel-story.service";
import { useAuthStore } from "@/store/use-auth-store";

export function TravelStoriesBar() {
  const user = useAuthStore((state) => state.user) as { user_id?: number; id?: number; name?: string; role?: string } | null;
  const [stories, setStories] = useState<TravelStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [sessionUserId, setSessionUserId] = useState(0);
  const [sessionRole, setSessionRole] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [loadError, setLoadError] = useState("");
  const currentUserId = Number(user?.user_id ?? user?.id ?? sessionUserId ?? 0);
  const currentRole = String(user?.role ?? sessionRole).toLowerCase();
  const canCreateStory = currentRole === "customer";

  useEffect(() => {
    const storeId = Number(user?.user_id ?? user?.id ?? 0);
    if (storeId) { setHasSession(true); setSessionUserId(storeId); setSessionRole(user?.role ?? ""); return; }
    const token = localStorage.getItem("travel360_token") ?? localStorage.getItem("token");
    if (!token) { setHasSession(false); setSessionUserId(0); setSessionRole(""); return; }
    setHasSession(true);
    try {
      const stored = JSON.parse(localStorage.getItem("user") ?? "{}") as { user_id?: number; id?: number; role?: string };
      const storedId = Number(stored.user_id ?? stored.id ?? 0);
      if (storedId) { setSessionUserId(storedId); setSessionRole(stored.role ?? ""); return; }
    } catch { /* Resolve the account from the profile API below. */ }
    void authService.getProfile().then((response) => {
      const body = response.data?.data ?? response.data;
      const profile = body?.user ?? body;
      setSessionUserId(Number(profile?.user_id ?? profile?.id ?? 0));
      setSessionRole(String(profile?.role ?? ""));
    }).catch(() => {
      setHasSession(false);
      setSessionUserId(0);
      setSessionRole("");
    });
  }, [user]);

  async function load() {
    setLoading(true); setLoadError("");
    try { setStories(await travelStoryService.feed({ page: 1, limit: 100 })); } catch (error) { const status = (error as { response?: { status?: number } }).response?.status; if (status === 401) setHasSession(false); const message = getStoryLoadError(error); console.warn("Cannot load Travel Stories feed:", error); setLoadError(message); setStories([]); } finally { setLoading(false); }
  }
  useEffect(() => {
    if (!hasSession) {
      setStories([]);
      setLoading(false);
      return;
    }
    void load();
  }, [hasSession, currentUserId, currentRole]);

  const groups = useMemo(() => {
    const map = new Map<number, TravelStory[]>();
    stories.forEach((story) => { const id = getTravelStoryUserId(story); map.set(id, [...(map.get(id) ?? []), story]); });
    return [...map.values()];
  }, [stories]);
  const orderedStories = groups.flatMap((group) => group);

  if (!hasSession) return null;

  return <>
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between"><div><h2 className="font-bold text-ink">Travel Stories</h2><p className="text-xs text-slate-500">Photos and videos shared in the last 24 hours.</p></div>{canCreateStory ? <button type="button" onClick={() => setCreating(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-bold text-white"><Plus size={16} />Add story</button> : null}</div>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {loading ? Array.from({ length: 6 }, (_, index) => <div key={index} className="shrink-0 animate-pulse"><div className="size-16 rounded-full bg-slate-200" /><div className="mx-auto mt-2 h-3 w-14 rounded bg-slate-100" /></div>) : groups.map((group) => { const first = group[0]; const firstIndex = orderedStories.findIndex((story) => getTravelStoryId(story) === getTravelStoryId(first)); const viewed = group.every((story) => story.is_viewed || getTravelStoryUserId(story) === currentUserId); return <button key={getTravelStoryUserId(first)} type="button" onClick={() => setActiveIndex(firstIndex)} className="w-20 shrink-0 text-center"><span className={`mx-auto block size-16 rounded-full p-0.5 ${viewed ? "bg-slate-300" : "bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400"}`}><span className="grid size-full place-items-center overflow-hidden rounded-full border-2 border-white bg-brand-50 font-bold text-brand-700">{getTravelStoryAvatar(first) ? <img src={resolveBackendAssetUrl(getTravelStoryAvatar(first))} alt="" className="size-full object-cover" /> : getTravelStoryAuthor(first).charAt(0).toUpperCase()}</span></span><span className="mt-1 block truncate text-xs font-semibold">{getTravelStoryUserId(first) === currentUserId ? "Your story" : getTravelStoryAuthor(first)}</span></button>; })}
        {!loading && loadError ? <div className="flex min-w-full items-center justify-between gap-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700"><span>{loadError}</span><button type="button" onClick={() => void load()} className="rounded-lg bg-white px-3 py-2">Retry</button></div> : null}
        {!loading && !loadError && !groups.length ? <p className="py-4 text-sm text-slate-500">No active stories yet. Be the first to share one.</p> : null}
      </div>
    </section>
    {creating && canCreateStory ? <CreateStoryModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); void load(); }} /> : null}
    {activeIndex !== null && orderedStories[activeIndex] ? <StoryViewer stories={orderedStories} index={activeIndex} currentUserId={currentUserId} canRecordView={currentRole === "customer"} onIndex={setActiveIndex} onClose={() => setActiveIndex(null)} onDeleted={() => { setActiveIndex(null); void load(); }} onViewed={(id) => setStories((current) => current.map((story) => getTravelStoryId(story) === id ? { ...story, is_viewed: true } : story))} /> : null}
  </>;
}

function getStoryLoadError(error: unknown) {
  const value = error as { response?: { status?: number; data?: { message?: string; error?: string } } };
  const status = value.response?.status;
  const message = value.response?.data?.message ?? value.response?.data?.error;
  if (status === 401) return message || "Please sign in again to view Travel Stories.";
  if (status === 403) return message || "This account is not allowed to view Travel Stories.";
  return message || "Cannot load Travel Stories. Please try again.";
}

function CreateStoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [file, setFile] = useState<File | null>(null); const [caption, setCaption] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]); const showToast = useToast();
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function submit() { if (!file) { setError("Choose an image or video."); return; } if (file.size > 50 * 1024 * 1024) { setError("Story media must not exceed 50 MB."); return; } setSaving(true); try { await travelStoryService.create(file, caption); showToast({ variant: "success", title: "Story published", description: "Your story will expire after 24 hours." }); onCreated(); } catch { setError("Cannot publish this story."); } finally { setSaving(false); } }
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6"><div className="flex justify-between"><div><h2 className="text-xl font-bold">Create Travel Story</h2><p className="mt-1 text-sm text-slate-500">Share an image or video for 24 hours.</p></div><button onClick={onClose} disabled={saving}><X /></button></div><label className="mt-5 grid min-h-64 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">{preview ? file?.type.startsWith("video/") ? <video src={preview} controls className="max-h-80 w-full" /> : <img src={preview} alt="Preview" className="max-h-80 w-full object-contain" /> : <span className="text-center text-sm text-slate-500"><Upload className="mx-auto mb-2" />Choose JPG, PNG, WebP, MP4, WebM or MOV</span>}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => { setError(""); setFile(event.target.files?.[0] ?? null); }} /></label><textarea value={caption} onChange={(event) => setCaption(event.target.value.slice(0, 1000))} className="mt-4 min-h-24 w-full rounded-lg border border-slate-200 p-3" placeholder="Add a caption..." maxLength={1000} />{error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}<button onClick={() => void submit()} disabled={saving} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="size-4 animate-spin" /> : null}Publish Story</button></div></div>;
}

function StoryViewer({ stories, index, currentUserId, canRecordView, onIndex, onClose, onViewed, onDeleted }: { stories: TravelStory[]; index: number; currentUserId: number; canRecordView: boolean; onIndex: (index: number | null) => void; onClose: () => void; onViewed: (id: number) => void; onDeleted: () => void }) {
  const story = stories[index]; const timer = useRef<number | null>(null); const [deleting, setDeleting] = useState(false); const id = getTravelStoryId(story); const isOwner = getTravelStoryUserId(story) === currentUserId; const duration = story.media_type === "video" ? 15000 : 6000;
  useEffect(() => { if (canRecordView && getTravelStoryUserId(story) !== currentUserId) { void travelStoryService.markViewed(id).then(() => onViewed(id)).catch(() => undefined); } timer.current = window.setTimeout(() => index < stories.length - 1 ? onIndex(index + 1) : onClose(), duration); return () => { if (timer.current) window.clearTimeout(timer.current); }; }, [canRecordView, id, index]);
  const media = resolveBackendAssetUrl(getTravelStoryMedia(story));
  async function removeStory() { if (!isOwner || deleting || !window.confirm("Delete this story?")) return; setDeleting(true); if (timer.current) window.clearTimeout(timer.current); try { await travelStoryService.remove(id); onDeleted(); } finally { setDeleting(false); } }
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-4"><div className="relative flex h-[min(86vh,760px)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-black"><div className="absolute left-3 right-3 top-3 z-10 flex gap-1">{stories.map((_, itemIndex) => <span key={itemIndex} className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/70 ring-1 ring-white/30">{itemIndex < index ? <span className="block size-full bg-cyan-400" /> : itemIndex === index ? <StoryProgressFill key={id} duration={duration} /> : null}</span>)}</div><div className="absolute left-4 right-4 top-7 z-10 flex items-center justify-between text-white"><p className="rounded-md bg-black/40 px-2 py-1 font-bold">{getTravelStoryAuthor(story)}</p><span className="flex items-center gap-2">{isOwner ? <button onClick={() => void removeStory()} disabled={deleting} className="grid size-9 place-items-center rounded-full bg-black/55 text-rose-200" aria-label="Delete story">{deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 size={17} />}</button> : null}<button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-black/55"><X /></button></span></div>{story.media_type === "video" ? <video key={id} src={media} autoPlay controls className="h-full w-full object-contain" /> : <img src={media} alt={story.caption ?? "Travel story"} className="h-full w-full object-contain" />}{story.caption ? <p className="absolute bottom-5 left-4 right-4 rounded-lg bg-black/50 p-3 text-center text-sm text-white">{story.caption}</p> : null}<button onClick={() => onIndex(Math.max(0, index - 1))} disabled={index === 0} className="absolute left-2 top-1/2 grid size-10 place-items-center rounded-full bg-black/40 text-white disabled:hidden"><ChevronLeft /></button><button onClick={() => index < stories.length - 1 ? onIndex(index + 1) : onClose()} className="absolute right-2 top-1/2 grid size-10 place-items-center rounded-full bg-black/40 text-white"><ChevronRight /></button></div></div>;
}

function StoryProgressFill({ duration }: { duration: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const animation = ref.current?.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration, easing: "linear", fill: "forwards" }
    );
    return () => animation?.cancel();
  }, [duration]);
  return <span ref={ref} className="block size-full origin-left bg-cyan-400" />;
}
