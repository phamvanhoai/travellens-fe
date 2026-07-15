"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImagePlus, Map, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, Upload, Video, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { MapLocationPicker } from "@/components/admin/map-location-picker";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { Button } from "@/components/ui/button";
import {
  adminLocationService,
  getLocationDestinationId,
  getLocationDestinationName,
  getLocationId,
  getLocationThumbnail,
  type AdminLocation,
  type AdminLocationPayload
} from "@/services/admin-location.service";
import {
  adminTravelDestinationService,
  getTravelDestinationId,
  type AdminTravelDestination
} from "@/services/admin-travel-destination.service";

type FormValue = AdminLocationPayload & {
  preview: string;
};

const emptyForm: FormValue = {
  travel_destination_id: "",
  name: "",
  description: "",
  latitude: "",
  longitude: "",
  thumbnail_file: null,
  preview: ""
};

export default function AdminLocationsPage() {
  const [items, setItems] = useState<AdminLocation[]>([]);
  const [destinations, setDestinations] = useState<AdminTravelDestination[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminLocation | null>(null);
  const [deleting, setDeleting] = useState<AdminLocation | null>(null);
  const showToast = useToast();
  const pageSize = 10;

  const loadData = useCallback(async (nextPage: number, search: string) => {
    setLoading(true);
    setError("");
    try {
      const [locationResult, destinationResult] = await Promise.all([
        adminLocationService.list({ page: nextPage, limit: pageSize, search }),
        adminTravelDestinationService.list({ page: 1, limit: 100 })
      ]);
      const total = locationResult.pagination?.total ?? locationResult.data?.length ?? 0;
      setItems(locationResult.data ?? []);
      setDestinations(destinationResult.data ?? []);
      setTotalItems(total);
      setPageCount(locationResult.pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)));
    } catch (err) {
      setError("Cannot load locations from API.");
      showToast({ variant: "error", title: "Load failed", description: "Cannot load locations from API." });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData(1, "");
  }, [loadData]);

  const editingInitialValue = useMemo<FormValue>(() => {
    if (!editing) return emptyForm;
    return {
      travel_destination_id: String(getLocationDestinationId(editing) ?? ""),
      name: editing.name ?? "",
      description: editing.description ?? "",
      latitude: editing.latitude == null ? "" : String(editing.latitude),
      longitude: editing.longitude == null ? "" : String(editing.longitude),
      thumbnail_file: null,
      preview: getLocationThumbnail(editing)
    };
  }, [editing]);

  async function handleSearch() {
    const value = searchInput.trim();
    setQuery(value);
    setPage(1);
    await loadData(1, value);
  }

  async function handlePageChange(nextPage: number) {
    setPage(nextPage);
    await loadData(nextPage, query);
  }

  async function saveLocation(payload: FormValue) {
    setSaving(true);
    setError("");
    try {
      const requestPayload: AdminLocationPayload = {
        travel_destination_id: payload.travel_destination_id,
        name: payload.name,
        description: payload.description,
        latitude: payload.latitude,
        longitude: payload.longitude,
        thumbnail_file: payload.thumbnail_file
      };

      if (editing) {
        await adminLocationService.update(getLocationId(editing), requestPayload);
        showToast({ variant: "success", title: "Location updated", description: payload.name });
      } else {
        await adminLocationService.create(requestPayload);
        showToast({ variant: "success", title: "Location created", description: payload.name });
      }

      setCreating(false);
      setEditing(null);
      await loadData(page, query);
    } catch (err) {
      setError("Cannot save location. Please check required fields, duplicate name, or permission.");
      showToast({ variant: "error", title: "Save failed", description: "Please check required fields, duplicate name, or permission." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteLocation() {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await adminLocationService.remove(getLocationId(deleting));
      showToast({ variant: "success", title: "Location deleted", description: deleting.name });
      setDeleting(null);
      await loadData(page, query);
    } catch (err) {
      setError("Cannot delete this location. It may still have related View360, map, review, or blog data.");
      showToast({ variant: "error", title: "Delete failed", description: "This location may still have related data." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Location Management</h1>
            <p className="mt-1 text-sm text-slate-500">Create and update internal areas that belong to a travel destination.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadData(page, query)} disabled={loading}><RefreshCw size={17} /> Refresh</Button>
            <Button onClick={() => setCreating(true)}><Plus size={17} /> Create Location</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <form className="mt-6 grid max-w-xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); void handleSearch(); }}>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
              placeholder="Search locations..."
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11 justify-center"><Search size={17} /> Search</Button>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["Location", "Travel Destination", "Maps", "View360", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <AdminTableSkeleton columns={5} rows={10} />
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No locations found.</td></tr>
              ) : items.map((item) => (
                <tr key={getLocationId(item)} className="border-t border-slate-100">
                  <td className="p-3">
                    <span className="flex items-start gap-3">
                      {getLocationThumbnail(item) ? <img src={getLocationThumbnail(item)} alt="" className="size-11 rounded-md object-cover" /> : <span className="grid size-11 place-items-center rounded-md bg-brand-50 text-brand-600"><MapPin size={17} /></span>}
                      <span className="min-w-0">
                        <span className="block font-semibold">{item.name}</span>
                        <span className="mt-1 block max-w-80 truncate text-xs font-medium text-slate-500">{item.description || "No description"}</span>
                        <span className="mt-1 block text-xs text-slate-400">#{getLocationId(item)} · {item.latitude ?? "-"}, {item.longitude ?? "-"}</span>
                      </span>
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{getLocationDestinationName(item)}</td>
                  <td className="p-3">
                    <Link
                      href={`/admin/maps?locationId=${getLocationId(item)}`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-brand-100 px-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                    >
                      <Map size={15} /> {item.map_count ?? item.maps_count ?? 0}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/view360?locationId=${getLocationId(item)}`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-brand-100 px-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                    >
                      <Video size={15} /> {item.view360_count ?? item.view360s_count ?? 0}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="flex gap-2">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button>
                      <button type="button" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50" aria-label={`Delete ${item.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="locations" onPageChange={(nextPage) => void handlePageChange(nextPage)} />
      </div>

      {creating || editing ? (
        <LocationForm
          key={editing ? getLocationId(editing) : "create"}
          title={editing ? "Edit Location" : "Create Location"}
          destinations={destinations}
          initialValue={editing ? editingInitialValue : emptyForm}
          saving={saving}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={saveLocation}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete Location"
          message={`Are you sure you want to delete "${deleting.name}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={deleteLocation}
        />
      ) : null}
    </>
  );
}

function LocationForm({
  title,
  destinations,
  initialValue,
  saving,
  onClose,
  onSave
}: {
  title: string;
  destinations: AdminTravelDestination[];
  initialValue: FormValue;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: FormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Travel Destination">
              <select
                required
                value={form.travel_destination_id}
                onChange={(event) => setForm({ ...form, travel_destination_id: event.target.value })}
                className="input"
              >
                <option value="">Select destination</option>
                {destinations.map((destination) => <option key={getTravelDestinationId(destination)} value={getTravelDestinationId(destination)}>{destination.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Location Name"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Main Gate" /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" placeholder="Location description..." /></Field>
          </div>
          <div className="sm:col-span-2">
            <MapLocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(latitude, longitude) => setForm({ ...form, latitude, longitude })}
            />
          </div>
          <Field label="Latitude"><input readOnly value={form.latitude} className="input bg-slate-50 text-slate-600" placeholder="Select on map" /></Field>
          <Field label="Longitude"><input readOnly value={form.longitude} className="input bg-slate-50 text-slate-600" placeholder="Select on map" /></Field>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">
              Thumbnail
              <span className="mt-2 grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-[140px_1fr] sm:items-center">
                <span className="grid h-28 place-items-center overflow-hidden rounded-lg bg-slate-50 text-slate-400">
                  {form.preview ? <img src={form.preview} alt="Location preview" className="h-full w-full object-cover" /> : <ImagePlus size={28} />}
                </span>
                <span>
                  <span className="block text-sm font-normal text-slate-500">Upload thumbnail_file for this location.</span>
                  <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
                    <Upload size={16} /> Choose Image
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) setForm({ ...form, thumbnail_file: file, preview: URL.createObjectURL(file) });
                    }} />
                  </span>
                  {form.preview ? <button type="button" onClick={() => setForm({ ...form, thumbnail_file: null, preview: "" })} className="ml-3 text-sm font-bold text-rose-600">Remove</button> : null}
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Location"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none [&_.input:focus]:border-brand-600">
      {label}
      {children}
    </label>
  );
}
