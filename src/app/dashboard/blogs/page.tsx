"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bold, Italic, List, Loader2, Newspaper, Plus, RefreshCw, X } from "lucide-react";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { blogService, getCustomerBlogId, getCustomerBlogUserId, type CustomerBlog } from "@/services/blog.service";
import { getPublicLocationId, locationService, type PublicLocation } from "@/services/location.service";

type StoryForm = { title: string; content: string; location_ids: string[] };
type StoryErrors = Partial<Record<keyof StoryForm, string>>;
const emptyForm: StoryForm = { title: "", content: "", location_ids: [] };

export default function CustomerBlogsPage() {
  const [items, setItems] = useState<CustomerBlog[]>([]);
  const [locations, setLocations] = useState<PublicLocation[]>([]);
  const [userId, setUserId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const showToast = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [blogs, locationList, profileResponse] = await Promise.all([blogService.list(), locationService.list(), authService.getProfile()]);
      const profile = profileResponse.data?.data ?? profileResponse.data;
      const currentUserId = Number(profile?.user_id ?? profile?.id ?? 0);
      setUserId(currentUserId);
      setItems(blogs.filter((blog) => getCustomerBlogUserId(blog) === currentUserId));
      setLocations(locationList);
    } catch (err) {
      const message = getApiError(err, "Cannot load your travel stories.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createStory(form: StoryForm) {
    setSaving(true);
    setError("");
    try {
      const created = await blogService.create({ user_id: userId, title: form.title.trim(), content: form.content, location_ids: form.location_ids.map(Number) });
      if (created) setItems((current) => [created, ...current]);
      setCreating(false);
      showToast({ variant: "success", title: "Story submitted", description: form.title });
    } catch (err) {
      const message = getApiError(err, "Cannot create this travel story.");
      setError(message);
      showToast({ variant: "error", title: "Create failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold">My Travel Stories</h1><p className="mt-1 text-sm text-slate-500">Write and share a blog about places you have visited.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button><Button onClick={() => setCreating(true)} disabled={loading || !userId}><Plus size={17} /> Write Story</Button></div></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">{loading ? <div className="col-span-full p-10 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading stories...</div> : items.length === 0 ? <div className="col-span-full rounded-lg bg-slate-50 p-10 text-center text-slate-500">You have not written any travel stories yet.</div> : items.map((blog) => <article key={getCustomerBlogId(blog)} className="rounded-lg border border-slate-200 p-5"><Newspaper className="size-6 text-brand-600" /><h2 className="mt-3 text-lg font-bold">{blog.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{plainText(blog.content)}</p><p className="mt-4 text-xs font-semibold text-slate-400">{blog.status ?? "Submitted"}</p></article>)}</div>
    </div>
    {creating ? <StoryModal locations={locations} saving={saving} onClose={() => setCreating(false)} onSave={createStory} /> : null}
  </>;
}

function StoryModal({ locations, saving, onClose, onSave }: { locations: PublicLocation[]; saving: boolean; onClose: () => void; onSave: (form: StoryForm) => Promise<void> }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<StoryErrors>({});
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); const next = validateStory(form); setErrors(next); if (!Object.keys(next).length) void onSave(form); }}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Write Blog / Travel Story</h2><p className="mt-1 text-sm text-slate-500">Tell other travelers about your experience.</p></div><button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div><div className="mt-6 grid gap-4"><Field label="Title" message={errors.title}><input value={form.title} onChange={(event) => { setForm({ ...form, title: event.target.value }); setErrors((current) => ({ ...current, title: undefined })); }} className="input" /></Field><StoryEditor value={form.content} message={errors.content} onChange={(content) => { setForm((current) => ({ ...current, content })); setErrors((current) => ({ ...current, content: undefined })); }} /><fieldset><legend className="text-sm font-semibold">Related Locations</legend><div className={`mt-2 grid max-h-48 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2 ${errors.location_ids ? "border-rose-500" : "border-slate-200"}`}>{locations.map((location) => { const id = String(getPublicLocationId(location)); return <label key={id} className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={form.location_ids.includes(id)} onChange={() => { setForm((current) => ({ ...current, location_ids: current.location_ids.includes(id) ? current.location_ids.filter((item) => item !== id) : [...current.location_ids, id] })); setErrors((current) => ({ ...current, location_ids: undefined })); }} />{location.name}</label>; })}</div>{errors.location_ids ? <p className="mt-2 text-xs font-semibold text-rose-600">{errors.location_ids}</p> : null}</fieldset></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Publish Story</Button></div></form></div>;
}

function StoryEditor({ value, message, onChange }: { value: string; message?: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  function command(name: string) { ref.current?.focus(); document.execCommand(name); if (ref.current) onChange(ref.current.innerHTML); }
  return <div><p className="text-sm font-semibold">Content</p><div className={`mt-2 overflow-hidden rounded-lg border ${message ? "border-rose-500" : "border-slate-200"}`}><div className="flex gap-1 border-b bg-slate-50 p-2"><button type="button" onMouseDown={(event) => { event.preventDefault(); command("bold"); }} className="grid size-8 place-items-center rounded hover:bg-white" aria-label="Bold"><Bold size={16} /></button><button type="button" onMouseDown={(event) => { event.preventDefault(); command("italic"); }} className="grid size-8 place-items-center rounded hover:bg-white" aria-label="Italic"><Italic size={16} /></button><button type="button" onMouseDown={(event) => { event.preventDefault(); command("insertUnorderedList"); }} className="grid size-8 place-items-center rounded hover:bg-white" aria-label="List"><List size={16} /></button></div><div ref={ref} contentEditable suppressContentEditableWarning data-placeholder="Write your story..." onInput={(event) => onChange(event.currentTarget.innerHTML)} className="min-h-48 p-4 text-sm leading-7 outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]" /></div>{message ? <p className="mt-2 text-xs font-semibold text-rose-600">{message}</p> : null}</div>;
}

function Field({ label, message, children }: { label: string; message?: string; children: React.ReactNode }) { return <label className={`block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:px-3 ${message ? "[&_.input]:border-rose-500" : "[&_.input]:border-slate-200"}`}>{label}{children}{message ? <span className="mt-2 block text-xs text-rose-600">{message}</span> : null}</label>; }
function validateStory(form: StoryForm) { const errors: StoryErrors = {}; if (!form.title.trim()) errors.title = "Title is required."; if (!plainText(form.content)) errors.content = "Content is required."; if (!form.location_ids.length) errors.location_ids = "Select at least one location."; return errors; }
function plainText(value?: string) { return (value ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
