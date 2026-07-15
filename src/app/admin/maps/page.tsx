"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ImagePlus, Map, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import {
  adminLocationService,
  getLocationDestinationId,
  getLocationDestinationName,
  getLocationId,
  type AdminLocation
} from "@/services/admin-location.service";
import {
  adminMapService,
  getAdminMapFile,
  getAdminMapId,
  type AdminMap,
  type AdminMapPayload
} from "@/services/admin-map.service";

type MapFormValue = AdminMapPayload & {
  travel_destination_id: string;
  preview: string;
};
type MapFieldName = keyof Omit<MapFormValue, "preview">;
type MapFieldErrors = Partial<Record<MapFieldName, string>>;

const pageSize = 10;
const emptyMap: MapFormValue = {
  travel_destination_id: "",
  location_id: "",
  title: "",
  description: "",
  display_order: "",
  map_file: null,
  preview: ""
};

export default function AdminMapsPage() {
  const [items, setItems] = useState<AdminMap[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<MapFieldErrors>({});
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminMap | null>(null);
  const [deleting, setDeleting] = useState<AdminMap | null>(null);
  const showToast = useToast();

  const loadMaps = useCallback(async (nextPage: number, search: string, locationId: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await adminMapService.list({
        page: nextPage,
        limit: pageSize,
        search: search || undefined,
        location_id: locationId || undefined
      });
      const total = result.pagination?.total ?? result.data?.length ?? 0;
      setItems(result.data ?? []);
      setTotalItems(total);
      setPageCount(result.pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)));
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot load maps from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const locationId = new URLSearchParams(window.location.search).get("locationId") ?? "";
    setLocationFilter(locationId);
    void Promise.all([
      loadMaps(1, "", locationId),
      adminLocationService.list({ page: 1, limit: 100 }).then((result) => setLocations(result.data ?? [])).catch(() => {
        showToast({ variant: "error", title: "Locations unavailable", description: "Cannot load the location selection." });
      })
    ]);
  }, [loadMaps, showToast]);

  const editingInitialValue = useMemo<MapFormValue>(() => {
    if (!editing) return emptyMap;
    const selectedLocation = locations.find((location) => getLocationId(location) === Number(editing.location_id));
    return {
      travel_destination_id: selectedLocation ? String(getLocationDestinationId(selectedLocation)) : "",
      location_id: String(editing.location_id ?? ""),
      title: editing.title ?? "",
      description: editing.description ?? "",
      display_order: editing.display_order == null ? "" : String(editing.display_order),
      map_file: null,
      preview: getAdminMapFile(editing)
    };
  }, [editing, locations]);

  const creatingInitialValue = useMemo<MapFormValue>(() => {
    const selectedLocation = locations.find((location) => getLocationId(location) === Number(locationFilter));
    return {
      ...emptyMap,
      travel_destination_id: selectedLocation ? String(getLocationDestinationId(selectedLocation)) : "",
      location_id: locationFilter
    };
  }, [locationFilter, locations]);

  async function handleSearch() {
    const value = searchInput.trim();
    setQuery(value);
    setPage(1);
    await loadMaps(1, value, locationFilter);
  }

  async function handleLocationFilter(value: string) {
    setLocationFilter(value);
    setPage(1);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("locationId", value);
    else url.searchParams.delete("locationId");
    window.history.replaceState({}, "", url);
    await loadMaps(1, query, value);
  }

  async function handlePageChange(nextPage: number) {
    setPage(nextPage);
    await loadMaps(nextPage, query, locationFilter);
  }

  async function saveMap(payload: MapFormValue) {
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const requestPayload: AdminMapPayload = {
        location_id: payload.location_id,
        title: payload.title.trim(),
        description: payload.description.trim(),
        display_order: payload.display_order,
        map_file: payload.map_file
      };

      if (editing) {
        await adminMapService.update(getAdminMapId(editing), requestPayload);
        showToast({ variant: "success", title: "Map updated", description: requestPayload.title });
      } else {
        await adminMapService.create(requestPayload);
        showToast({ variant: "success", title: "Map created", description: requestPayload.title });
      }

      setCreating(false);
      setEditing(null);
      await loadMaps(page, query, locationFilter);
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot save map. Please check the required fields, file type, or permission.");
      setError(message);
      setFieldErrors(getBackendFieldErrors(err));
      showToast({ variant: "error", title: "Save failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteMap() {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await adminMapService.remove(getAdminMapId(deleting));
      showToast({ variant: "success", title: "Map deleted", description: deleting.title });
      setDeleting(null);
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadMaps(nextPage, query, locationFilter);
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot delete map.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Map Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage visitor diagrams assigned to each location.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadMaps(page, query, locationFilter)} disabled={loading}><RefreshCw size={17} /> Refresh</Button>
            <Button onClick={() => {
              setFieldErrors({});
              setCreating(true);
            }}><Plus size={17} /> Create Map</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <form className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto_260px]" onSubmit={(event) => {
          event.preventDefault();
          void handleSearch();
        }}>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search map titles..." />
          </div>
          <Button type="submit" className="h-11 justify-center" disabled={loading}><Search size={17} /> Search</Button>
          <select value={locationFilter} onChange={(event) => void handleLocationFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={getLocationId(location)} value={getLocationId(location)}>
                {getLocationOptionLabel(location)}
              </option>
            ))}
          </select>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Map</th>
                <th className="p-3">Location</th>
                <th className="p-3">Description</th>
                <th className="p-3">Order</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <AdminTableSkeleton columns={5} rows={10} />
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No maps found.</td></tr>
              ) : items.map((item) => (
                <tr key={getAdminMapId(item)} className="border-t border-slate-100">
                  <td className="p-3">
                    <span className="flex items-center gap-3">
                      {getAdminMapFile(item) ? <img src={getAdminMapFile(item)} alt="" className="size-12 rounded-md object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600"><Map size={18} /></span>}
                      <span className="min-w-0">
                        <span className="block max-w-52 truncate font-semibold" title={item.title}>{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-400">#{getAdminMapId(item)}</span>
                      </span>
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">
                    <span className="block font-medium text-slate-700">{item.location_name || `Location #${item.location_id ?? "-"}`}</span>
                    <span className="mt-1 block text-xs text-slate-400">{getMapLocationContext(item, locations)}</span>
                  </td>
                  <td className="max-w-64 truncate p-3 text-slate-600" title={item.description ?? ""}>{item.description || "No description"}</td>
                  <td className="p-3">{item.display_order ?? "-"}</td>
                  <td className="p-3">
                    <span className="flex gap-2">
                      <Button variant="outline" className="h-9 px-3" onClick={() => {
                        setFieldErrors({});
                        setEditing(item);
                      }}><Pencil size={15} /> Edit</Button>
                      <button type="button" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.title}`} title="Delete map"><Trash2 size={15} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="maps" onPageChange={(nextPage) => void handlePageChange(nextPage)} />
      </div>

      {creating || editing ? (
        <MapForm
          key={editing ? getAdminMapId(editing) : "create"}
          title={editing ? "Edit Map" : "Create Map"}
          initialValue={editing ? editingInitialValue : creatingInitialValue}
          locations={locations}
          editing={Boolean(editing)}
          saving={saving}
          fieldErrors={fieldErrors}
          onSetFieldErrors={setFieldErrors}
          onClearFieldError={(field) => setFieldErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
          })}
          onClose={() => {
            setCreating(false);
            setEditing(null);
            setFieldErrors({});
          }}
          onSave={saveMap}
        />
      ) : null}

      {deleting ? <ConfirmDialog title="Delete Map" message={`Are you sure you want to delete "${deleting.title}"? The backend will keep its audit record.`} onCancel={() => setDeleting(null)} onConfirm={deleteMap} /> : null}
    </>
  );
}

function MapForm({
  title,
  initialValue,
  locations,
  editing,
  saving,
  fieldErrors,
  onSetFieldErrors,
  onClearFieldError,
  onClose,
  onSave
}: {
  title: string;
  initialValue: MapFormValue;
  locations: AdminLocation[];
  editing: boolean;
  saving: boolean;
  fieldErrors: MapFieldErrors;
  onSetFieldErrors: (errors: MapFieldErrors) => void;
  onClearFieldError: (field: MapFieldName) => void;
  onClose: () => void;
  onSave: (payload: MapFormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);
  const destinations = useMemo(() => {
    const unique = new globalThis.Map<string, string>();
    for (const location of locations) {
      const id = String(getLocationDestinationId(location) ?? "");
      if (id) unique.set(id, String(getLocationDestinationName(location)));
    }
    return Array.from(unique, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);
  const availableLocations = useMemo(
    () => locations.filter((location) => String(getLocationDestinationId(location) ?? "") === form.travel_destination_id),
    [form.travel_destination_id, locations]
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form noValidate className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => {
        event.preventDefault();
        const errors = validateMapForm(form, editing);
        onSetFieldErrors(errors);
        if (Object.keys(errors).length === 0) onSave(form);
      }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Travel Destination" message={fieldErrors.travel_destination_id}>
              <select disabled={editing} value={form.travel_destination_id} onChange={(event) => {
                onClearFieldError("travel_destination_id");
                onClearFieldError("location_id");
                setForm({ ...form, travel_destination_id: event.target.value, location_id: "" });
              }} className="input disabled:bg-slate-50 disabled:text-slate-500">
                <option value="">Select destination</option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>{destination.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Location" message={fieldErrors.location_id}>
              <select disabled={editing || !form.travel_destination_id} value={form.location_id} onChange={(event) => {
                onClearFieldError("location_id");
                setForm({ ...form, location_id: event.target.value });
              }} className="input disabled:bg-slate-50 disabled:text-slate-500">
                <option value="">{form.travel_destination_id ? "Select location" : "Select destination first"}</option>
                {availableLocations.map((location) => (
                  <option key={getLocationId(location)} value={getLocationId(location)}>
                    {location.name} (#{getLocationId(location)})
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Title" message={fieldErrors.title}>
              <input value={form.title} onChange={(event) => {
                onClearFieldError("title");
                setForm({ ...form, title: event.target.value });
              }} className="input" placeholder="Ground Floor Map" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" message={fieldErrors.description}>
              <textarea value={form.description} onChange={(event) => {
                onClearFieldError("description");
                setForm({ ...form, description: event.target.value });
              }} className="input min-h-24 py-3" placeholder="Map description..." />
            </Field>
          </div>
          <Field label="Display Order" message={fieldErrors.display_order}>
            <input type="number" min="0" step="1" value={form.display_order} onChange={(event) => {
              onClearFieldError("display_order");
              setForm({ ...form, display_order: event.target.value });
            }} className="input" placeholder="1" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={editing ? "Map Image (optional)" : "Map Image"} message={fieldErrors.map_file}>
              <span className="input mt-2 grid h-auto min-h-36 gap-4 border-dashed p-4 sm:grid-cols-[160px_1fr] sm:items-center">
                <span className="grid h-28 place-items-center overflow-hidden rounded-lg bg-slate-50 text-slate-400">
                  {form.preview ? <img src={form.preview} alt="Map preview" className="h-full w-full object-cover" /> : <ImagePlus size={28} />}
                </span>
                <span>
                  <span className="block text-sm font-normal text-slate-500">JPG, JPEG, PNG, WEBP or SVG.</span>
                  <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
                    <Upload size={16} /> Choose Image
                    <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      onClearFieldError("map_file");
                      setForm({ ...form, map_file: file, preview: URL.createObjectURL(file) });
                    }} />
                  </span>
                </span>
              </span>
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Map"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, message }: { label: string; children: React.ReactNode; message?: string }) {
  return (
    <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none [&_input.input]:h-11 [&_select.input]:h-11 [&_.input:focus]:border-brand-600">
      {label}
      {children}
      {message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}
    </label>
  );
}

function validateMapForm(form: MapFormValue, editing: boolean): MapFieldErrors {
  const errors: MapFieldErrors = {};
  if (!editing && !form.travel_destination_id) errors.travel_destination_id = "Travel destination is required.";
  if (!editing && !form.location_id) errors.location_id = "Location is required.";
  if (!form.title.trim()) errors.title = "Title is required.";
  if (!editing && !form.map_file) errors.map_file = "Map image is required.";
  if (form.display_order && (!Number.isInteger(Number(form.display_order)) || Number(form.display_order) < 0)) {
    errors.display_order = "Display order must be a non-negative integer.";
  }
  return errors;
}

function getLocationOptionLabel(location: AdminLocation) {
  return `${location.name} - ${getLocationDestinationName(location)} (#${getLocationId(location)})`;
}

function getMapLocationContext(map: AdminMap, locations: AdminLocation[]) {
  const location = locations.find((item) => getLocationId(item) === Number(map.location_id));
  if (!location) return `Location ID: ${map.location_id ?? "-"}`;
  return `${getLocationDestinationName(location)} · Location ID: ${getLocationId(location)}`;
}

function getBackendErrorMessage(err: unknown, fallback: string) {
  const messages = getBackendValidationMessages(err);
  if (messages.length > 0) return messages.join("\n");
  const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return error.response?.data?.message || error.response?.data?.error || error.message || fallback;
}

function getBackendFieldErrors(err: unknown): MapFieldErrors {
  const errors: MapFieldErrors = {};
  for (const message of getBackendValidationMessages(err)) {
    const value = message.toLowerCase();
    if (value.includes("location")) errors.location_id = message;
    else if (value.includes("title")) errors.title = message;
    else if (value.includes("description")) errors.description = message;
    else if (value.includes("display_order") || value.includes("display order")) errors.display_order = message;
    else if (value.includes("map_file") || value.includes("file") || value.includes("format")) errors.map_file = message;
  }
  return errors;
}

function getBackendValidationMessages(err: unknown) {
  const error = err as {
    response?: {
      data?: {
        details?: { body?: string[] | string } | string[] | string;
      };
    };
  };
  const details = error.response?.data?.details;
  const body = details && typeof details === "object" && !Array.isArray(details) ? details.body : details;
  if (Array.isArray(body)) return body;
  return typeof body === "string" && body ? [body] : [];
}
