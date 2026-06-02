"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

type CategoryStatus = "Active" | "Draft";
type Category = { id: string; name: string; description: string; itemCount: number; status: CategoryStatus };

export function CategoryManagement({ title, description, noun, initialItems }: { title: string; description: string; noun: string; initialItems: Category[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const pageSize = 5;
  const visibleItems = items.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function save(payload: Category) {
    setItems((current) => editing ? current.map((item) => item.id === editing.id ? payload : item) : [...current, { ...payload, id: createSlug(payload.name) }]);
    setEditing(null); setCreating(false);
  }
  function remove() { if (!deleting) return; setItems((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Category</Button></div>
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search categories..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Category", "Description", `Total ${noun}`, "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {paginatedItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-semibold"><Tag className="mr-2 inline size-4 text-brand-600" />{item.name}</td><td className="p-3 text-slate-600">{item.description}</td><td className="p-3 font-semibold">{item.itemCount}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button><button type="button" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.name}`}><Trash2 size={15} /></button></span></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="categories" onPageChange={setPage} />
    </div>
    {creating || editing ? <CategoryForm key={editing?.id ?? "create"} title={editing ? "Edit Category" : "Create Category"} initialValue={editing ?? { id: "", name: "", description: "", itemCount: 0, status: "Draft" }} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}
    {deleting ? <ConfirmDialog title="Delete Category" message={`Are you sure you want to delete "${deleting.name}"?`} onCancel={() => setDeleting(null)} onConfirm={remove} /> : null}
  </>;
}

function CategoryForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: Category; onClose: () => void; onSave: (payload: Category) => void }) {
  const [form, setForm] = useState(initialValue);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSave(form); }}><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 grid gap-4"><Field label="Category Name"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" /></Field><Field label="Description"><textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" /></Field><Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CategoryStatus })} className="input"><option>Active</option><option>Draft</option></select></Field></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save Category</Button></div></form></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Status({ value }: { value: CategoryStatus }) { return <span className={value === "Active" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"}>{value}</span>; }
function createSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
