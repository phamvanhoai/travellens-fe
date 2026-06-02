"use client";

import { useState } from "react";
import { ImagePlus, Map, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

type MapStatus = "Active" | "Draft";

type ManagedMap = {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  status: MapStatus;
};

const initialMaps: ManagedMap[] = [
  { id: "conference-ground-floor", name: "Ground Floor Diagram", location: "Conference Hall", description: "Visitor route for the ground floor.", image: "", status: "Active" },
  { id: "conference-first-floor", name: "First Floor Diagram", location: "Conference Hall", description: "Rooms and stairs on the first floor.", image: "", status: "Active" },
  { id: "conference-second-floor", name: "Second Floor Diagram", location: "Conference Hall", description: "Exhibition route on the second floor.", image: "", status: "Active" },
  { id: "bunker-level-one", name: "Bunker Level 1 Diagram", location: "Command Bunker", description: "Underground command room layout.", image: "", status: "Active" },
  { id: "bunker-level-two", name: "Bunker Level 2 Diagram", location: "Command Bunker", description: "Communication room layout.", image: "", status: "Draft" },
  { id: "market-main-hall", name: "Market Hall Diagram", location: "Main Hall", description: "Shopping zone and food aisle diagram.", image: "", status: "Active" }
];

const emptyMap: ManagedMap = { id: "", name: "", location: "", description: "", image: "", status: "Draft" };

export default function AdminMapsPage() {
  const [items, setItems] = useState(initialMaps);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingMap, setEditingMap] = useState<ManagedMap | null>(null);
  const [deletingMap, setDeletingMap] = useState<ManagedMap | null>(null);
  const pageSize = 5;
  const visibleItems = items.filter((item) => `${item.name} ${item.location}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function saveMap(payload: ManagedMap) {
    setItems((current) => editingMap
      ? current.map((item) => item.id === editingMap.id ? payload : item)
      : [...current, { ...payload, id: createSlug(`${payload.location}-${payload.name}`) }]);
    setEditingMap(null);
    setCreating(false);
  }

  function deleteMap() {
    if (!deletingMap) return;
    setItems((current) => current.filter((item) => item.id !== deletingMap.id));
    setDeletingMap(null);
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Map Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage visitor diagram images inside each location. These are not Google Maps.</p>
          </div>
          <Button onClick={() => setCreating(true)}><Plus size={17} /> Create Map</Button>
        </div>
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-3 size-5 text-slate-400" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search diagrams..." />
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["Diagram", "Location", "Description", "Image", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold"><Map className="mr-2 inline size-4 text-brand-600" />{item.name}</td>
                  <td className="p-3 text-slate-600">{item.location}</td>
                  <td className="max-w-56 truncate p-3 text-slate-600">{item.description}</td>
                  <td className="p-3">{item.image ? <img src={item.image} alt="" className="size-12 rounded-md object-cover" /> : <span className="text-slate-400">Not uploaded</span>}</td>
                  <td className="p-3"><Status value={item.status} /></td>
                  <td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setEditingMap(item)}><Pencil size={15} /> Edit</Button><DeleteButton label={item.name} onClick={() => setDeletingMap(item)} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="maps" onPageChange={setPage} />
      </div>
      {creating || editingMap ? <MapForm key={editingMap?.id ?? "create"} initialValue={editingMap ?? emptyMap} title={editingMap ? "Edit Map Diagram" : "Create Map Diagram"} onClose={() => { setEditingMap(null); setCreating(false); }} onSave={saveMap} /> : null}
      {deletingMap ? <ConfirmDialog title="Delete Map Diagram" message={`Are you sure you want to delete "${deletingMap.name}"?`} onCancel={() => setDeletingMap(null)} onConfirm={deleteMap} /> : null}
    </>
  );
}

function MapForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: ManagedMap; onClose: () => void; onSave: (payload: ManagedMap) => void }) {
  const [form, setForm] = useState(initialValue);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
        <div className="mt-6 grid gap-4">
          <Field label="Diagram Name"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Ground Floor Diagram" /></Field>
          <Field label="Location"><input required value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="input" placeholder="Conference Hall" /></Field>
          <Field label="Description"><textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" /></Field>
          <label className="block text-sm font-semibold">Diagram Image<span className="mt-2 grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-[120px_1fr] sm:items-center"><span className="grid h-24 place-items-center overflow-hidden rounded-lg bg-slate-50 text-slate-400">{form.image ? <img src={form.image} alt="Diagram preview" className="h-full w-full object-cover" /> : <ImagePlus size={26} />}</span><span><span className="block text-sm font-normal text-slate-500">Upload the visitor guidance diagram image.</span><span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white"><Upload size={16} /> Choose Image<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) setForm({ ...form, image: URL.createObjectURL(file) }); }} /></span></span></span></label>
          <Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MapStatus })} className="input"><option>Active</option><option>Draft</option></select></Field>
        </div>
        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save Map</Button></div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none">{label}{children}</label>; }
function Status({ value }: { value: MapStatus }) { return <span className={value === "Active" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"}>{value}</span>; }
function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${label}`}><Trash2 size={15} /></button>; }
function createSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
