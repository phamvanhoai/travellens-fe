"use client";

import { useState } from "react";
import { ImagePlus, Newspaper, Pencil, Plus, Search, Upload, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

type BlogStatus = "Pending" | "Approved" | "Rejected";
type ManagedBlog = { id: string; title: string; author: string; destination: string; excerpt: string; content: string; coverImage: string; status: BlogStatus };

const initialBlogs: ManagedBlog[] = [
  { id: "independence-palace-guide", title: "A First-Timer Guide to Independence Palace", author: "Sophie Martin", destination: "Independence Palace", excerpt: "Plan a smooth visit through the historic halls and bunker.", content: "Start at the main gate, then follow the visitor route through the conference hall and underground bunker.", coverImage: "", status: "Approved" },
  { id: "ben-thanh-food-walk", title: "What to Eat at Ben Thanh Market", author: "David Lee", destination: "Ben Thanh Market", excerpt: "A short guide to local dishes and the best aisles.", content: "Visit early in the morning for a quieter walk and try regional dishes from the central food court.", coverImage: "", status: "Approved" },
  { id: "cu-chi-history", title: "Understanding the Cu Chi Tunnels", author: "Emma Johnson", destination: "Cu Chi Tunnels", excerpt: "History, practical tips and respectful visitor guidance.", content: "Wear comfortable clothing and follow the local guide through the preserved historical route.", coverImage: "", status: "Pending" },
  { id: "halong-weekend", title: "A Weekend in Ha Long Bay", author: "Michael Brown", destination: "Ha Long Bay", excerpt: "Boat routes, viewpoints and overnight planning.", content: "Choose a route that includes quieter islands and allow time at the visitor wharf before departure.", coverImage: "", status: "Approved" },
  { id: "cathedral-walk", title: "Walking Around Notre-Dame Cathedral", author: "Anna Wilson", destination: "Notre-Dame Cathedral", excerpt: "A compact city walk around nearby landmarks.", content: "Pair the cathedral front yard with nearby historic buildings and a relaxed coffee stop.", coverImage: "", status: "Rejected" },
  { id: "museum-route", title: "Museum Route for a Rainy Afternoon", author: "Minh Nguyen", destination: "War Remnants Museum", excerpt: "A thoughtful cultural route for city visitors.", content: "Set aside two hours and read the visitor notes before entering the exhibition rooms.", coverImage: "", status: "Pending" }
];
const emptyBlog: ManagedBlog = { id: "", title: "", author: "", destination: "", excerpt: "", content: "", coverImage: "", status: "Pending" };

export default function AdminBlogsPage() {
  const [items, setItems] = useState(initialBlogs);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedBlog | null>(null);
  const pageSize = 5;
  const visibleItems = items.filter((item) => `${item.title} ${item.author} ${item.destination} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function save(payload: ManagedBlog) {
    setItems((current) => editing ? current.map((item) => item.id === editing.id ? payload : item) : [...current, { ...payload, id: createSlug(payload.title) }]);
    setEditing(null); setCreating(false);
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Blog Management</h1><p className="mt-1 text-sm text-slate-500">Create travel articles and moderate submitted blog content.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Blog</Button></div>
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search blogs..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Blog", "Author", "Travel Destination", "Excerpt", "Approval", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {paginatedItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-semibold"><Newspaper className="mr-2 inline size-4 text-brand-600" />{item.title}</td><td className="p-3">{item.author}</td><td className="p-3 text-slate-600">{item.destination}</td><td className="max-w-64 truncate p-3 text-slate-600">{item.excerpt}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="blogs" onPageChange={setPage} />
    </div>
    {creating || editing ? <BlogForm key={editing?.id ?? "create"} title={editing ? "Edit Blog" : "Create Blog"} initialValue={editing ?? emptyBlog} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}
  </>;
}

function BlogForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: ManagedBlog; onClose: () => void; onSave: (payload: ManagedBlog) => void }) {
  const [form, setForm] = useState(initialValue);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4">
      <Field label="Title"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Author"><input required value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="input" /></Field><Field label="Travel Destination"><input required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} className="input" /></Field></div>
      <Field label="Excerpt"><textarea required value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} className="input min-h-20 py-3" /></Field>
      <Field label="Content"><textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="input min-h-32 py-3" /></Field>
      <label className="block text-sm font-semibold">Cover Image<span className="mt-2 grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-[120px_1fr] sm:items-center"><span className="grid h-24 place-items-center overflow-hidden rounded-lg bg-slate-50 text-slate-400">{form.coverImage ? <img src={form.coverImage} alt="Cover preview" className="h-full w-full object-cover" /> : <ImagePlus size={26} />}</span><span><span className="block text-sm font-normal text-slate-500">Upload JPG, PNG or WEBP cover artwork.</span><span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white"><Upload size={16} /> Choose Image<input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setForm({ ...form, coverImage: URL.createObjectURL(file) }); }} /></span></span></span></label>
      <Field label="Approval Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BlogStatus })} className="input"><option>Pending</option><option>Approved</option><option>Rejected</option></select></Field>
    </div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save Blog</Button></div>
  </form></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Status({ value }: { value: BlogStatus }) { const style = value === "Approved" ? "bg-emerald-50 text-emerald-700" : value === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
function createSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
