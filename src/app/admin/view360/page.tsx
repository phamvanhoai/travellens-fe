"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Headphones, ImagePlus, Languages, Music, Pencil, Plus, RefreshCw, Search, Trash2, Upload, Video, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { adminLocationService, getLocationId, type AdminLocation } from "@/services/admin-location.service";
import {
  adminView360Service,
  getView360Audio,
  getView360Id,
  getView360ImageId,
  getView360ImageSrc,
  type AdminView360,
  type AdminView360Image,
  type AdminView360Payload
} from "@/services/admin-view360.service";

type View360Row = AdminView360 & {
  location_id: number;
  location_name: string;
  images: AdminView360Image[];
};

type ImageDraft = {
  id?: number;
  src: string;
  file?: File;
  removed?: boolean;
};

type FormValue = AdminView360Payload & {
  location_id: string;
  audioPreview: string;
  images: ImageDraft[];
};

const emptyForm: FormValue = {
  location_id: "",
  title: "",
  description: "",
  audio_file: null,
  audioPreview: "",
  language: "Vietnamese",
  order_index: "0",
  images: []
};

export default function AdminView360Page() {
  const [items, setItems] = useState<View360Row[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<View360Row | null>(null);
  const [deleting, setDeleting] = useState<View360Row | null>(null);
  const showToast = useToast();
  const pageSize = 10;

  useEffect(() => {
    const locationId = new URLSearchParams(window.location.search).get("locationId");
    if (locationId) setLocationFilter(locationId);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const locationResult = await adminLocationService.list({ page: 1, limit: 100 });
      const locationList = locationResult.data ?? [];
      const sceneGroups = await Promise.all(locationList.map(async (location) => {
        const locationId = getLocationId(location);
        if (!locationId) return [];
        try {
          const scenes = await adminView360Service.listByLocation(locationId);
          const scenesWithImages = await Promise.all(scenes.map(async (scene) => {
            const viewId = getView360Id(scene);
            const images = viewId ? await adminView360Service.listImages(viewId).catch(() => []) : [];
            return {
              ...scene,
              location_id: locationId,
              location_name: location.name,
              images
            };
          }));
          return scenesWithImages;
        } catch {
          return [];
        }
      }));

      setLocations(locationList);
      setItems(sceneGroups.flat());
    } catch (err) {
      setError("Cannot load View360 scenes from API.");
      showToast({ variant: "error", title: "Load failed", description: "Cannot load View360 scenes from API." });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesLocation = !locationFilter || String(item.location_id) === locationFilter;
    const matchesQuery = `${item.title} ${item.location_name} ${item.language ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesLocation && matchesQuery;
  }), [items, locationFilter, query]);
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const editingInitialValue = useMemo<FormValue>(() => {
    if (!editing) return emptyForm;
    return {
      location_id: String(editing.location_id),
      title: editing.title ?? "",
      description: editing.description ?? "",
      audio_file: null,
      audioPreview: getView360Audio(editing),
      language: editing.language ?? "Vietnamese",
      order_index: editing.order_index == null ? "0" : String(editing.order_index),
      images: editing.images.map((image) => ({
        id: getView360ImageId(image),
        src: getView360ImageSrc(image)
      })).filter((image) => image.src || image.id)
    };
  }, [editing]);

  const createInitialValue = useMemo<FormValue>(() => ({
    ...emptyForm,
    location_id: locationFilter
  }), [locationFilter]);

  const selectedLocationName = useMemo(() => {
    if (!locationFilter) return "";
    return locations.find((location) => String(getLocationId(location)) === locationFilter)?.name ?? "";
  }, [locationFilter, locations]);

  function handleSearch() {
    setQuery(searchInput.trim());
    setPage(1);
  }

  async function save(payload: FormValue) {
    setSaving(true);
    setError("");
    try {
      const requestPayload: AdminView360Payload = {
        title: payload.title,
        description: payload.description,
        audio_file: payload.audio_file,
        language: payload.language,
        order_index: payload.order_index
      };

      const newImages = payload.images.filter((image) => image.file && !image.removed);
      const removedImages = payload.images.filter((image) => image.id && image.removed);
      let viewId = editing ? getView360Id(editing) : 0;

      if (editing) {
        await adminView360Service.update(viewId, requestPayload);
        showToast({ variant: "success", title: "View360 updated", description: payload.title });
      } else {
        const created = await adminView360Service.create(Number(payload.location_id), requestPayload);
        viewId = getView360Id(created as AdminView360);
        showToast({ variant: "success", title: "View360 created", description: payload.title });
      }

      if (viewId) {
        await Promise.all(removedImages.map((image) => image.id ? adminView360Service.removeImage(image.id) : Promise.resolve()));
        await Promise.all(newImages.map((image, index) => image.file ? adminView360Service.addImage(viewId, image.file, index + 1) : Promise.resolve()));
      }

      setCreating(false);
      setEditing(null);
      await loadData();
    } catch (err) {
      setError("Cannot save View360. Please check required fields, files, or permission.");
      showToast({ variant: "error", title: "Save failed", description: "Please check required fields, files, or permission." });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await adminView360Service.remove(getView360Id(deleting));
      showToast({ variant: "success", title: "View360 deleted", description: deleting.title });
      setDeleting(null);
      await loadData();
    } catch (err) {
      setError("Cannot delete View360.");
      showToast({ variant: "error", title: "Delete failed", description: "Cannot delete View360." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">View360 Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              {selectedLocationName ? `Managing View360 scenes for ${selectedLocationName}.` : "Create and update virtual scenes, narration audio, and ordered panorama images."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</Button>
            <Button onClick={() => setCreating(true)}><Plus size={17} /> Create View360</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
          <form className="grid max-w-xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); handleSearch(); }}>
            <div className="relative">
              <Search className="absolute left-3 top-3 size-5 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
                placeholder="Search View360 experiences..."
              />
            </div>
            <Button type="submit" disabled={loading} className="h-11 justify-center"><Search size={17} /> Search</Button>
          </form>
          <select
            value={locationFilter}
            onChange={(event) => {
              setLocationFilter(event.target.value);
              setPage(1);
              const url = new URL(window.location.href);
              if (event.target.value) url.searchParams.set("locationId", event.target.value);
              else url.searchParams.delete("locationId");
              window.history.replaceState(null, "", url.toString());
            }}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
          >
            <option value="">All locations</option>
            {locations.map((location) => <option key={getLocationId(location)} value={getLocationId(location)}>{location.name}</option>)}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["ID", "View360", "Location", "Language", "Images", "Audio", "Order", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-6 text-center text-slate-500">Loading View360 scenes...</td></tr>
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-slate-500">No View360 scenes found.</td></tr>
              ) : paginatedItems.map((item) => (
                <tr key={`${item.location_id}-${getView360Id(item)}`} className="border-t border-slate-100">
                  <td className="p-3 font-bold">#{getView360Id(item)}</td>
                  <td className="p-3 font-semibold"><Video className="mr-2 inline size-4 text-brand-600" />{item.title}</td>
                  <td className="p-3 text-slate-600">{item.location_name}</td>
                  <td className="p-3"><Languages className="mr-2 inline size-4 text-brand-600" />{item.language || "-"}</td>
                  <td className="p-3 font-semibold">{item.images.length} images</td>
                  <td className="p-3">{getView360Audio(item) ? <span className="text-brand-600"><Headphones className="mr-2 inline size-4" />Attached</span> : <span className="text-slate-400">Not attached</span>}</td>
                  <td className="p-3 text-slate-600">{item.order_index ?? "-"}</td>
                  <td className="p-3">
                    <span className="flex gap-2">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button>
                      <DeleteButton label={item.title} onClick={() => setDeleting(item)} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="View360 experiences" onPageChange={setPage} />
      </div>

      {creating || editing ? (
        <ExperienceForm
          key={editing ? getView360Id(editing) : "create"}
          initialValue={editing ? editingInitialValue : createInitialValue}
          title={editing ? "Edit View360" : "Create View360"}
          locations={locations}
          saving={saving}
          editing={Boolean(editing)}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      ) : null}

      {deleting ? <ConfirmDialog title="Delete View360" message={`Are you sure you want to delete "${deleting.title}" and its View360 images?`} onCancel={() => setDeleting(null)} onConfirm={remove} /> : null}
    </>
  );
}

function ExperienceForm({
  title,
  initialValue,
  locations,
  saving,
  editing,
  onClose,
  onSave
}: {
  title: string;
  initialValue: FormValue;
  locations: AdminLocation[];
  saving: boolean;
  editing: boolean;
  onClose: () => void;
  onSave: (payload: FormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="mt-6 grid gap-4">
          <Field label="Location">
            <select required disabled={editing} value={form.location_id} onChange={(event) => setForm({ ...form, location_id: event.target.value })} className="input disabled:bg-slate-50 disabled:text-slate-500">
              <option value="">Select location</option>
              {locations.map((location) => <option key={getLocationId(location)} value={getLocationId(location)}>{location.name}</option>)}
            </select>
          </Field>
          <Field label="View360 Title"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" placeholder="Conference Hall 360" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Language"><select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} className="input"><option>Vietnamese</option><option>English</option><option>Japanese</option></select></Field>
            <Field label="Order Index"><input type="number" min="0" value={form.order_index} onChange={(event) => setForm({ ...form, order_index: event.target.value })} className="input" /></Field>
          </div>
          <Field label="Description"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" /></Field>
          <UploadAudio value={form.audioPreview} onChange={(audioPreview, audioFile) => setForm({ ...form, audioPreview, audio_file: audioFile })} />
          <UploadImages images={form.images} onChange={(images) => setForm({ ...form, images })} />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save View360"}</Button>
        </div>
      </form>
    </div>
  );
}

function UploadAudio({ value, onChange }: { value: string; onChange: (preview: string, file: File | null) => void }) {
  return (
    <label className="block text-sm font-semibold">
      Audio Narration
      <span className="mt-2 block rounded-lg border border-dashed border-slate-300 p-4">
        <Music className="inline size-5 text-brand-600" /> <span className="ml-2 text-sm font-normal text-slate-500">Upload audio_file narration.</span>
        {value ? <audio controls src={value} className="mt-3 w-full" /> : null}
        <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
          <Upload size={16} /> Choose Audio
          <input type="file" accept="audio/*" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onChange(URL.createObjectURL(file), file);
          }} />
        </span>
        {value ? <button type="button" onClick={() => onChange("", null)} className="ml-3 text-sm font-bold text-rose-600">Remove</button> : null}
      </span>
    </label>
  );
}

function UploadImages({ images, onChange }: { images: ImageDraft[]; onChange: (images: ImageDraft[]) => void }) {
  const visibleImages = images.filter((image) => !image.removed);

  return (
    <label className="block text-sm font-semibold">
      View360 Images
      <span className="mt-2 block rounded-lg border border-dashed border-slate-300 p-4">
        <span className="block text-sm font-normal text-slate-500">Upload panorama image_file records. Their order follows this list.</span>
        <span className="mt-3 flex flex-wrap gap-2">
          {visibleImages.map((image, index) => (
            <span key={`${image.id ?? image.src}-${index}`} className="relative">
              <span className="grid size-16 place-items-center overflow-hidden rounded-md bg-slate-50 text-xs text-slate-500">
                {image.src ? <img src={image.src} alt="" className="h-full w-full object-cover" /> : index + 1}
              </span>
              <button
                type="button"
                onClick={() => onChange(images.map((item) => item === image ? { ...item, removed: true } : item))}
                className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-600 text-white"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </span>
        <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
          <ImagePlus size={16} /> Choose Images
          <input type="file" multiple accept="image/*" className="hidden" onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            onChange([...images, ...files.map((file) => ({ file, src: URL.createObjectURL(file) }))]);
          }} />
        </span>
      </span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none [&_.input:focus]:border-brand-600">{label}{children}</label>;
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${label}`}><Trash2 size={15} /></button>;
}
