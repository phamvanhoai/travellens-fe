"use client";

import { useState } from "react";
import { Headphones, ImagePlus, Languages, Music, Pencil, Plus, Search, Trash2, Upload, Video, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

type View360Status = "Active" | "Draft";
type ManagedView360 = { id: string; title: string; location: string; language: string; audioUrl: string; description: string; images: string[]; status: View360Status };

const initialExperiences: ManagedView360[] = [
  { id: "conference-hall-360", title: "Conference Hall 360", location: "Conference Hall", language: "Vietnamese", audioUrl: "/audio/conference-hall.mp3", description: "Virtual visit through the main conference hall.", images: ["/360/hall-1.jpg", "/360/hall-2.jpg", "/360/hall-3.jpg"], status: "Active" },
  { id: "stage-area-360", title: "Stage Area 360", location: "Conference Hall", language: "English", audioUrl: "/audio/stage-area.mp3", description: "Stage and seating area experience.", images: ["/360/stage-1.jpg", "/360/stage-2.jpg"], status: "Active" },
  { id: "command-room-360", title: "Command Room 360", location: "Command Bunker", language: "Vietnamese", audioUrl: "/audio/command-room.mp3", description: "Underground command room virtual visit.", images: ["/360/command-1.jpg", "/360/command-2.jpg"], status: "Active" },
  { id: "main-gate-360", title: "Main Gate 360", location: "Main Gate", language: "English", audioUrl: "", description: "Entrance and visitor checkpoint experience.", images: ["/360/gate-1.jpg"], status: "Draft" },
  { id: "market-hall-360", title: "Market Hall 360", location: "Main Hall", language: "Vietnamese", audioUrl: "/audio/market.mp3", description: "Walk through the market shopping aisles.", images: ["/360/market-1.jpg", "/360/market-2.jpg"], status: "Active" },
  { id: "halong-wharf-360", title: "Visitor Wharf 360", location: "Visitor Wharf", language: "English", audioUrl: "", description: "Wharf and boat departure point preview.", images: ["/360/wharf-1.jpg"], status: "Draft" }
];
const emptyExperience: ManagedView360 = { id: "", title: "", location: "", language: "Vietnamese", audioUrl: "", description: "", images: [], status: "Draft" };

export default function AdminView360Page() {
  const [items, setItems] = useState(initialExperiences);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedView360 | null>(null);
  const [deleting, setDeleting] = useState<ManagedView360 | null>(null);
  const pageSize = 5;
  const visibleItems = items.filter((item) => `${item.title} ${item.location} ${item.language}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function save(payload: ManagedView360) {
    setItems((current) => editing ? current.map((item) => item.id === editing.id ? payload : item) : [...current, { ...payload, id: createSlug(`${payload.location}-${payload.title}`) }]);
    setEditing(null); setCreating(false);
  }
  function remove() { if (!deleting) return; setItems((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">View360 Management</h1><p className="mt-1 text-sm text-slate-500">Manage virtual experiences by Location. Each View360 contains multiple ordered images.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create View360</Button></div>
        <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search View360 experiences..." /></div>
        <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["View360", "Location", "Language", "View360 Images", "Audio", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
          {paginatedItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-semibold"><Video className="mr-2 inline size-4 text-brand-600" />{item.title}</td><td className="p-3 text-slate-600">{item.location}</td><td className="p-3"><Languages className="mr-2 inline size-4 text-brand-600" />{item.language}</td><td className="p-3 font-semibold">{item.images.length} images</td><td className="p-3">{item.audioUrl ? <span className="text-brand-600"><Headphones className="mr-2 inline size-4" />Attached</span> : <span className="text-slate-400">Not attached</span>}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button><DeleteButton label={item.title} onClick={() => setDeleting(item)} /></span></td></tr>)}
        </tbody></table></div>
        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="View360 experiences" onPageChange={setPage} />
      </div>
      {creating || editing ? <ExperienceForm key={editing?.id ?? "create"} initialValue={editing ?? emptyExperience} title={editing ? "Edit View360" : "Create View360"} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}
      {deleting ? <ConfirmDialog title="Delete View360" message={`Are you sure you want to delete "${deleting.title}" and its View360 images?`} onCancel={() => setDeleting(null)} onConfirm={remove} /> : null}
    </>
  );
}

function ExperienceForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: ManagedView360; onClose: () => void; onSave: (payload: ManagedView360) => void }) {
  const [form, setForm] = useState(initialValue);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4">
      <Field label="View360 Title"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" placeholder="Conference Hall 360" /></Field>
      <Field label="Location"><input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="input" placeholder="Conference Hall" /></Field>
      <Field label="Language"><select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} className="input"><option>Vietnamese</option><option>English</option><option>Japanese</option></select></Field>
      <Field label="Description"><textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" /></Field>
      <UploadAudio value={form.audioUrl} onChange={(audioUrl) => setForm({ ...form, audioUrl })} />
      <UploadImages images={form.images} onChange={(images) => setForm({ ...form, images })} />
      <Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as View360Status })} className="input"><option>Active</option><option>Draft</option></select></Field>
    </div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save View360</Button></div>
  </form></div>;
}

function UploadAudio({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-semibold">Audio Narration<span className="mt-2 block rounded-lg border border-dashed border-slate-300 p-4"><Music className="inline size-5 text-brand-600" /> <span className="ml-2 text-sm font-normal text-slate-500">MP3, WAV or M4A narration file.</span>{value ? <audio controls src={value} className="mt-3 w-full" /> : null}<span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white"><Upload size={16} /> Choose Audio<input type="file" accept="audio/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onChange(URL.createObjectURL(file)); }} /></span>{value ? <button type="button" onClick={() => onChange("")} className="ml-3 text-sm font-bold text-rose-600">Remove</button> : null}</span></label>; }
function UploadImages({ images, onChange }: { images: string[]; onChange: (images: string[]) => void }) { return <label className="block text-sm font-semibold">View360 Images<span className="mt-2 block rounded-lg border border-dashed border-slate-300 p-4"><span className="block text-sm font-normal text-slate-500">Upload multiple panorama images. Their list order becomes order_index.</span><span className="mt-3 flex flex-wrap gap-2">{images.map((image, index) => <span key={`${image}-${index}`} className="relative"><span className="grid size-16 place-items-center overflow-hidden rounded-md bg-slate-50 text-xs text-slate-500">{image.startsWith("blob:") ? <img src={image} alt="" className="h-full w-full object-cover" /> : index + 1}</span><button type="button" onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))} className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white"><X size={12} /></button></span>)}</span><span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white"><ImagePlus size={16} /> Choose Images<input type="file" multiple accept="image/*" className="hidden" onChange={(event) => onChange([...images, ...Array.from(event.target.files ?? []).map((file) => URL.createObjectURL(file))])} /></span></span></label>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Status({ value }: { value: View360Status }) { return <span className={value === "Active" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"}>{value}</span>; }
function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${label}`}><Trash2 size={15} /></button>; }
function createSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
