"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Headphones, ImagePlus, Languages, MapPin, Music, Pencil, Plus, RefreshCw, Save, Search, Trash2, Upload, Video, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { adminLocationService, getLocationId, type AdminLocation } from "@/services/admin-location.service";
import {
  adminView360Service,
  getView360Audio,
  getView360HotspotId,
  getView360Id,
  getView360ImageId,
  getView360ImageSrc,
  type AdminView360Hotspot,
  type AdminView360HotspotPayload,
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

type View360FieldName = "location_id" | "title" | "description" | "language" | "order_index" | "audio_file" | "images";
type View360FieldErrors = Partial<Record<View360FieldName, string>>;

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
  const [fieldErrors, setFieldErrors] = useState<View360FieldErrors>({});
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
    setFieldErrors({});
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
      setFieldErrors({});
      await loadData();
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot save View360. Please check required fields, files, or permission.");
      const nextFieldErrors = getBackendFieldErrors(err);
      setError(message);
      setFieldErrors(nextFieldErrors);
      showToast({ variant: "error", title: "Save failed", description: message });
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
            <Button onClick={() => {
              setFieldErrors({});
              setCreating(true);
            }}><Plus size={17} /> Create View360</Button>
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
                <AdminTableSkeleton columns={8} rows={10} />
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
                      <Button variant="outline" className="h-9 px-3" onClick={() => {
                        setFieldErrors({});
                        setEditing(item);
                      }}><Pencil size={15} /> Edit</Button>
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
          viewId={editing ? getView360Id(editing) : 0}
          title={editing ? "Edit View360" : "Create View360"}
          locations={locations}
          saving={saving}
          editing={Boolean(editing)}
          fieldErrors={fieldErrors}
          onSetFieldErrors={setFieldErrors}
          onClearFieldError={(field) => setFieldErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
          })}
          onClose={() => {
            setEditing(null);
            setCreating(false);
            setFieldErrors({});
          }}
          sceneOptions={items}
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
  viewId,
  locations,
  saving,
  editing,
  fieldErrors,
  onSetFieldErrors,
  onClearFieldError,
  onClose,
  sceneOptions,
  onSave
}: {
  title: string;
  initialValue: FormValue;
  viewId: number;
  locations: AdminLocation[];
  saving: boolean;
  editing: boolean;
  fieldErrors: View360FieldErrors;
  onSetFieldErrors: (errors: View360FieldErrors) => void;
  onClearFieldError: (field: View360FieldName) => void;
  onClose: () => void;
  sceneOptions: View360Row[];
  onSave: (payload: FormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        noValidate
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          const nextFieldErrors = validateView360Form(form);
          onSetFieldErrors(nextFieldErrors);
          if (Object.keys(nextFieldErrors).length > 0) return;
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="mt-6 grid gap-4">
          <Field label="Location" message={fieldErrors.location_id} tone={fieldErrors.location_id ? "invalid" : "neutral"}>
            <select disabled={editing} value={form.location_id} onChange={(event) => {
              onClearFieldError("location_id");
              setForm({ ...form, location_id: event.target.value });
            }} className="input disabled:bg-slate-50 disabled:text-slate-500">
              <option value="">Select location</option>
              {locations.map((location) => <option key={getLocationId(location)} value={getLocationId(location)}>{location.name}</option>)}
            </select>
          </Field>
          <Field label="View360 Title" message={fieldErrors.title} tone={fieldErrors.title ? "invalid" : "neutral"}>
            <input value={form.title} onChange={(event) => {
              onClearFieldError("title");
              setForm({ ...form, title: event.target.value });
            }} className="input" placeholder="Conference Hall 360" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Language" message={fieldErrors.language} tone={fieldErrors.language ? "invalid" : "neutral"}>
              <select value={form.language} onChange={(event) => {
                onClearFieldError("language");
                setForm({ ...form, language: event.target.value });
              }} className="input"><option>Vietnamese</option><option>English</option><option>Japanese</option></select>
            </Field>
            <Field label="Order Index" message={fieldErrors.order_index} tone={fieldErrors.order_index ? "invalid" : "neutral"}>
              <input type="number" min="0" value={form.order_index} onChange={(event) => {
                onClearFieldError("order_index");
                setForm({ ...form, order_index: event.target.value });
              }} className="input" />
            </Field>
          </div>
          <Field label="Description" message={fieldErrors.description} tone={fieldErrors.description ? "invalid" : "neutral"}>
            <textarea value={form.description} onChange={(event) => {
              onClearFieldError("description");
              setForm({ ...form, description: event.target.value });
            }} className="input min-h-24 py-3" />
          </Field>
          <UploadAudio value={form.audioPreview} message={fieldErrors.audio_file} onChange={(audioPreview, audioFile) => {
            onClearFieldError("audio_file");
            setForm({ ...form, audioPreview, audio_file: audioFile });
          }} />
          <UploadImages images={form.images} message={fieldErrors.images} onChange={(images) => {
            onClearFieldError("images");
            setForm({ ...form, images });
          }} />
          {editing ? <HotspotsEditor viewId={viewId} images={form.images.filter((image) => !image.removed)} sceneOptions={sceneOptions} /> : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Save this View360 first, then edit it again to add interactive hotspots.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save View360"}</Button>
        </div>
      </form>
    </div>
  );
}

const emptyHotspotForm = {
  type: "info",
  title: "",
  description: "",
  yaw: "0",
  pitch: "0",
  target_view360_id: "",
  target_url: "",
  order_index: "0",
  is_active: true
};

type HotspotFormValue = typeof emptyHotspotForm;

function HotspotsEditor({ viewId, images, sceneOptions }: { viewId: number; images: ImageDraft[]; sceneOptions: View360Row[] }) {
  const [hotspots, setHotspots] = useState<AdminView360Hotspot[]>([]);
  const [form, setForm] = useState<HotspotFormValue>(emptyHotspotForm);
  const [editingHotspotId, setEditingHotspotId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const showToast = useToast();

  const loadHotspots = useCallback(async () => {
    if (!viewId) return;
    setLoading(true);
    setMessage("");
    try {
      const result = await adminView360Service.listHotspots(viewId);
      setHotspots(result);
    } catch {
      setMessage("Cannot load hotspots for this View360.");
    } finally {
      setLoading(false);
    }
  }, [viewId]);

  useEffect(() => {
    void loadHotspots();
  }, [loadHotspots]);

  function resetForm() {
    setForm(emptyHotspotForm);
    setEditingHotspotId(0);
  }

  function changeType(type: string) {
    setForm({
      ...form,
      type,
      target_view360_id: type === "navigation" ? form.target_view360_id : "",
      target_url: type === "link" ? form.target_url : ""
    });
  }

  function editHotspot(hotspot: AdminView360Hotspot) {
    setEditingHotspotId(getView360HotspotId(hotspot));
    setForm({
      type: hotspot.type ?? "info",
      title: hotspot.title ?? "",
      description: hotspot.description ?? "",
      yaw: hotspot.yaw == null ? "0" : String(hotspot.yaw),
      pitch: hotspot.pitch == null ? "0" : String(hotspot.pitch),
      target_view360_id: hotspot.target_view360_id == null ? "" : String(hotspot.target_view360_id),
      target_url: hotspot.target_url ?? "",
      order_index: hotspot.order_index == null ? "0" : String(hotspot.order_index),
      is_active: hotspot.is_active !== false
    });
  }

  function toPayload(): AdminView360HotspotPayload | null {
    const yaw = Number(form.yaw);
    const pitch = Number(form.pitch);
    const orderIndex = Number(form.order_index || 0);
    if (!Number.isFinite(yaw) || yaw < -180 || yaw > 360) {
      setMessage("Yaw must be a number between -180 and 360.");
      return null;
    }
    if (!Number.isFinite(pitch) || pitch < -90 || pitch > 90) {
      setMessage("Pitch must be a number between -90 and 90.");
      return null;
    }
    return {
      type: form.type as AdminView360HotspotPayload["type"],
      title: form.title.trim() || null,
      description: form.description.trim() || null,
      yaw,
      pitch,
      target_view360_id: form.target_view360_id ? Number(form.target_view360_id) : null,
      target_url: form.target_url.trim() || null,
      order_index: Number.isFinite(orderIndex) ? orderIndex : 0,
      is_active: form.is_active
    };
  }

  async function saveHotspot() {
    const payload = toPayload();
    if (!payload) return;
    setSaving(true);
    setMessage("");
    try {
      if (editingHotspotId) {
        await adminView360Service.updateHotspot(editingHotspotId, payload);
        showToast({ variant: "success", title: "Hotspot updated", description: payload.title ?? "Interactive point" });
      } else {
        await adminView360Service.createHotspot(viewId, payload);
        showToast({ variant: "success", title: "Hotspot created", description: payload.title ?? "Interactive point" });
      }
      resetForm();
      await loadHotspots();
    } catch (err) {
      const errorMessage = getBackendErrorMessage(err, "Cannot save hotspot.");
      setMessage(errorMessage);
      showToast({ variant: "error", title: "Hotspot save failed", description: errorMessage });
    } finally {
      setSaving(false);
    }
  }

  async function deleteHotspot(hotspot: AdminView360Hotspot) {
    const hotspotId = getView360HotspotId(hotspot);
    if (!hotspotId) return;
    setSaving(true);
    setMessage("");
    try {
      await adminView360Service.removeHotspot(hotspotId);
      if (editingHotspotId === hotspotId) resetForm();
      await loadHotspots();
      showToast({ variant: "success", title: "Hotspot deleted", description: hotspot.title ?? "Interactive point" });
    } catch (err) {
      const errorMessage = getBackendErrorMessage(err, "Cannot delete hotspot.");
      setMessage(errorMessage);
      showToast({ variant: "error", title: "Delete failed", description: errorMessage });
    } finally {
      setSaving(false);
    }
  }

  function placeHotspot(event: React.MouseEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    const yaw = x * 360;
    const pitch = 90 - y * 180;
    setForm({
      ...form,
      yaw: yaw.toFixed(1),
      pitch: pitch.toFixed(1)
    });
  }

  const previewImage = images[0]?.src ?? "";
  const draftMarker = toMarkerPosition(Number(form.yaw), Number(form.pitch));

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Interactive Hotspots</h3>
          <p className="mt-1 text-xs font-normal text-slate-500">Use yaw and pitch to place pins inside the 360 scene.</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{hotspots.length} points</span>
      </div>

      {message ? <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs font-semibold text-amber-700">{message}</div> : null}

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold">Place on Panorama</p>
        {previewImage ? (
          <button
            type="button"
            onClick={placeHotspot}
            className="relative block aspect-[2/1] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-left"
          >
            <img src={previewImage} alt="" className="h-full w-full object-cover" />
            {hotspots.map((hotspot) => {
              const marker = toMarkerPosition(Number(hotspot.yaw ?? 0), Number(hotspot.pitch ?? 0));
              return (
                <span
                  key={getView360HotspotId(hotspot)}
                  className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-brand-600 text-white shadow-lg"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  title={hotspot.title ?? "Hotspot"}
                >
                  <MapPin size={14} />
                </span>
              );
            })}
            <span
              className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-rose-600 text-white shadow-lg ring-4 ring-rose-500/25"
              style={{ left: `${draftMarker.x}%`, top: `${draftMarker.y}%` }}
            >
              <MapPin size={15} />
            </span>
            <span className="absolute bottom-3 left-3 rounded-md bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              Click on the panorama to set yaw/pitch
            </span>
          </button>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Upload at least one View360 image to place hotspots visually.
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Type">
          <select value={form.type} onChange={(event) => changeType(event.target.value)} className="input">
            <option value="info">Info</option>
            <option value="navigation">Navigation</option>
            <option value="link">Link</option>
            <option value="location">Location</option>
          </select>
        </Field>
        <Field label="Title">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" placeholder="Main gate" />
        </Field>
        {form.type === "navigation" ? (
          <Field label="Target Scene">
            <select value={form.target_view360_id} onChange={(event) => setForm({ ...form, target_view360_id: event.target.value })} className="input">
              <option value="">Select scene to open</option>
              {sceneOptions.filter((scene) => getView360Id(scene) !== viewId).map((scene) => (
                <option key={getView360Id(scene)} value={getView360Id(scene)}>
                  #{getView360Id(scene)} · {scene.title}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {form.type === "link" ? (
          <Field label="Target URL">
            <input value={form.target_url} onChange={(event) => setForm({ ...form, target_url: event.target.value })} className="input" placeholder="https://example.com" />
          </Field>
        ) : null}
        <Field label="Order Index">
          <input type="number" min="0" value={form.order_index} onChange={(event) => setForm({ ...form, order_index: event.target.value })} className="input" />
        </Field>
        <Field label="Coordinates">
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input readOnly value={`Yaw ${form.yaw}`} className="input bg-slate-50 text-slate-500" />
            <input readOnly value={`Pitch ${form.pitch}`} className="input bg-slate-50 text-slate-500" />
          </div>
        </Field>
        <label className="mt-7 inline-flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="size-4 rounded border-slate-300" />
          Active
        </label>
      </div>
      <Field label="Description">
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-20 py-3" />
      </Field>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {editingHotspotId ? <Button type="button" variant="outline" onClick={resetForm}>New Hotspot</Button> : null}
        <Button type="button" disabled={saving} onClick={() => void saveHotspot()}><Save size={16} /> {saving ? "Saving..." : editingHotspotId ? "Update Hotspot" : "Add Hotspot"}</Button>
      </div>

      <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
        {loading ? <div className="grid gap-3 p-4" aria-label="Loading hotspots" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center justify-between gap-4"><div className="min-w-0 flex-1 space-y-2"><div className="h-3.5 w-2/5 animate-pulse rounded bg-slate-200" /><div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" /></div><div className="size-8 animate-pulse rounded-md bg-slate-100" /></div>)}</div> : null}
        {!loading && hotspots.length === 0 ? <p className="p-4 text-sm text-slate-500">No hotspots yet.</p> : null}
        {hotspots.map((hotspot) => (
          <div key={getView360HotspotId(hotspot)} className="flex items-center gap-3 p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600"><MapPin size={16} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{hotspot.title || "Untitled hotspot"}</p>
              <p className="text-xs text-slate-500">{hotspot.type ?? "info"} · yaw {hotspot.yaw ?? 0} · pitch {hotspot.pitch ?? 0}</p>
            </div>
            <Button type="button" variant="outline" className="h-9 px-3" onClick={() => editHotspot(hotspot)}><Pencil size={14} /> Edit</Button>
            <button type="button" onClick={() => void deleteHotspot(hotspot)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label="Delete hotspot"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function toMarkerPosition(yaw: number, pitch: number) {
  const safeYaw = Number.isFinite(yaw) ? yaw : 0;
  const safePitch = Number.isFinite(pitch) ? pitch : 0;
  const normalizedYaw = ((safeYaw % 360) + 360) % 360;
  const clampedPitch = Math.max(-90, Math.min(90, safePitch));
  return {
    x: (normalizedYaw / 360) * 100,
    y: ((90 - clampedPitch) / 180) * 100
  };
}

function UploadAudio({ value, message, onChange }: { value: string; message?: string; onChange: (preview: string, file: File | null) => void }) {
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
        {message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}
      </span>
    </label>
  );
}

function UploadImages({ images, message, onChange }: { images: ImageDraft[]; message?: string; onChange: (images: ImageDraft[]) => void }) {
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
        {message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}
      </span>
    </label>
  );
}

function Field({
  label,
  children,
  message,
  tone = "neutral"
}: {
  label: string;
  children: React.ReactNode;
  message?: string;
  tone?: "neutral" | "invalid";
}) {
  return (
    <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none [&_.input:focus]:border-brand-600">
      {label}
      {children}
      {message ? <span className={tone === "invalid" ? "mt-2 block text-xs font-semibold text-rose-600" : "mt-2 block text-xs font-medium text-slate-500"}>{message}</span> : null}
    </label>
  );
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${label}`}><Trash2 size={15} /></button>;
}

function validateView360Form(form: FormValue): View360FieldErrors {
  const errors: View360FieldErrors = {};

  if (!form.location_id) errors.location_id = "Location is required.";
  if (!form.title.trim()) errors.title = "View360 title is required.";
  if (!form.language) errors.language = "Language is required.";

  const orderIndex = Number(form.order_index);
  if (form.order_index === "") {
    errors.order_index = "Order index is required.";
  } else if (!Number.isFinite(orderIndex) || orderIndex < 0) {
    errors.order_index = "Order index must be 0 or greater.";
  }

  if (form.images.filter((image) => !image.removed).length === 0) {
    errors.images = "Upload at least one View360 image.";
  }

  return errors;
}

function getBackendErrorMessage(err: unknown, fallback: string) {
  const messages = getBackendValidationMessages(err);
  if (messages.length > 0) return messages.join("\n");

  const error = err as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };
    message?: string;
  };
  const data = error.response?.data;
  return data?.message || data?.error || error.message || fallback;
}

function getBackendFieldErrors(err: unknown): View360FieldErrors {
  const errors: View360FieldErrors = {};

  for (const message of getBackendValidationMessages(err)) {
    const fieldPath = message.match(/"([^"]+)"/)?.[1] ?? "";
    const field = mapBackendFieldToView360Field(fieldPath, message);
    if (!field) continue;
    errors[field] = errors[field] ? `${errors[field]}\n${message}` : message;
  }

  return errors;
}

function getBackendValidationMessages(err: unknown) {
  const error = err as {
    response?: {
      data?: {
        message?: string;
        error?: string;
        details?: {
          body?: string[] | string;
        } | string[] | string;
      };
    };
    message?: string;
  };
  const data = error.response?.data;
  const bodyDetails = typeof data?.details === "object" && !Array.isArray(data.details)
    ? data.details.body
    : undefined;

  if (Array.isArray(bodyDetails) && bodyDetails.length > 0) return bodyDetails;
  if (typeof bodyDetails === "string" && bodyDetails) return [bodyDetails];
  if (Array.isArray(data?.details) && data.details.length > 0) return data.details;
  if (typeof data?.details === "string" && data.details) return [data.details];
  return [];
}

function mapBackendFieldToView360Field(fieldPath: string, message: string): View360FieldName | null {
  const normalized = fieldPath.toLowerCase();
  const lowerMessage = message.toLowerCase();

  if (normalized.includes("location") || lowerMessage.includes("location")) return "location_id";
  if (normalized.includes("title")) return "title";
  if (normalized.includes("description")) return "description";
  if (normalized.includes("language")) return "language";
  if (normalized.includes("order")) return "order_index";
  if (normalized.includes("audio")) return "audio_file";
  if (normalized.includes("image") || lowerMessage.includes("image")) return "images";
  return null;
}
