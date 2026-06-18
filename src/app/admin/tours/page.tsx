"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import {
  adminTourService,
  getAdminTourCategoryId,
  getAdminTourCategoryName,
  getAdminTourDestinationId,
  getAdminTourDestinationName,
  getAdminTourDestinations,
  getAdminTourId,
  getAdminTourName,
  getAdminTourThumbnail,
  type AdminTour,
  type AdminTourPayload
} from "@/services/admin-tour.service";
import { adminTourCategoryService, getTourCategoryId, type AdminTourCategory } from "@/services/admin-tour-category.service";
import {
  adminTravelDestinationService,
  getTravelDestinationId,
  type AdminTravelDestination
} from "@/services/admin-travel-destination.service";

type TourFormValue = AdminTourPayload & {
  preview: string;
};

const emptyTour: TourFormValue = {
  tour_category_id: "",
  name: "",
  description: "",
  price: "",
  schedule: "",
  capacity: "",
  status: "draft",
  destination_ids: [],
  thumbnail_file: null,
  preview: ""
};

const statuses = ["active", "inactive", "draft"];
const pageSize = 10;

export default function AdminToursPage() {
  const [items, setItems] = useState<AdminTour[]>([]);
  const [categories, setCategories] = useState<AdminTourCategory[]>([]);
  const [destinations, setDestinations] = useState<AdminTravelDestination[]>([]);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingTour, setEditingTour] = useState<AdminTour | null>(null);
  const [deletingTour, setDeletingTour] = useState<AdminTour | null>(null);
  const showToast = useToast();

  const loadData = useCallback(async (
    nextPage: number,
    search: string,
    tourCategoryId: string,
    destinationId: string,
    status: string
  ) => {
    setLoading(true);
    setError("");
    try {
      const [tourResult, categoryResult, destinationResult] = await Promise.all([
        adminTourService.list({
          page: nextPage,
          limit: pageSize,
          search,
          tour_category_id: tourCategoryId || undefined,
          destination_id: destinationId || undefined,
          status: status || undefined,
          sortBy: "created_at",
          sortOrder: "DESC"
        }),
        adminTourCategoryService.list(),
        adminTravelDestinationService.list({ page: 1, limit: 100 })
      ]);
      const total = tourResult.pagination?.total ?? tourResult.data?.length ?? 0;
      setItems(tourResult.data ?? []);
      setCategories(Array.isArray(categoryResult) ? categoryResult : []);
      setDestinations(destinationResult.data ?? []);
      setTotalItems(total);
      setPageCount(tourResult.pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)));
    } catch (err) {
      setError("Cannot load tours from API.");
      showToast({ variant: "error", title: "Load failed", description: "Cannot load tours from API." });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData(1, "", "", "", "");
  }, [loadData]);

  const editingInitialValue = useMemo<TourFormValue>(() => {
    if (!editingTour) return emptyTour;
    return {
      tour_category_id: String(getAdminTourCategoryId(editingTour) ?? ""),
      name: getAdminTourName(editingTour),
      description: editingTour.description ?? "",
      price: editingTour.price == null ? "" : String(editingTour.price),
      schedule: editingTour.schedule ?? editingTour.duration ?? "",
      capacity: editingTour.capacity == null ? "" : String(editingTour.capacity),
      status: editingTour.status ?? "active",
      destination_ids: getAdminTourDestinations(editingTour).map((destination) => String(getAdminTourDestinationId(destination))).filter((id) => id !== "0"),
      thumbnail_file: null,
      preview: resolveBackendAssetUrl(getAdminTourThumbnail(editingTour))
    };
  }, [editingTour]);

  function getDisplayedCategoryName(tour: AdminTour) {
    const categoryName = getAdminTourCategoryName(tour);
    const categoryId = String(getAdminTourCategoryId(tour) ?? "");
    const matchedCategory = categories.find((category) => String(getTourCategoryId(category)) === categoryId);

    if (matchedCategory?.name) return matchedCategory.name;
    return categoryName || "-";
  }

  async function handleSearch() {
    const value = searchInput.trim();
    setQuery(value);
    setPage(1);
    await loadData(1, value, categoryFilter, destinationFilter, statusFilter);
  }

  async function handleCategoryFilter(value: string) {
    setCategoryFilter(value);
    setPage(1);
    await loadData(1, query, value, destinationFilter, statusFilter);
  }

  async function handleDestinationFilter(value: string) {
    setDestinationFilter(value);
    setPage(1);
    await loadData(1, query, categoryFilter, value, statusFilter);
  }

  async function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
    await loadData(1, query, categoryFilter, destinationFilter, value);
  }

  async function handlePageChange(nextPage: number) {
    setPage(nextPage);
    await loadData(nextPage, query, categoryFilter, destinationFilter, statusFilter);
  }

  async function saveTour(payload: TourFormValue) {
    setSaving(true);
    setError("");
    try {
      const requestPayload: AdminTourPayload = {
        tour_category_id: payload.tour_category_id,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        schedule: payload.schedule,
        capacity: payload.capacity,
        status: payload.status,
        destination_ids: payload.destination_ids,
        thumbnail_file: payload.thumbnail_file
      };

      if (editingTour) {
        await adminTourService.update(getAdminTourId(editingTour), requestPayload);
        showToast({ variant: "success", title: "Tour updated", description: payload.name });
      } else {
        await adminTourService.create(requestPayload);
        showToast({ variant: "success", title: "Tour created", description: payload.name });
      }

      setEditingTour(null);
      setCreating(false);
      await loadData(page, query, categoryFilter, destinationFilter, statusFilter);
    } catch (err) {
      setError("Cannot save tour. Please check required fields, duplicate name, category, destinations, or permission.");
      showToast({ variant: "error", title: "Save failed", description: "Please check required fields or permission." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteTour() {
    if (!deletingTour) return;
    setSaving(true);
    setError("");
    try {
      await adminTourService.remove(getAdminTourId(deletingTour));
      showToast({ variant: "success", title: "Tour deleted", description: getAdminTourName(deletingTour) });
      setDeletingTour(null);
      await loadData(page, query, categoryFilter, destinationFilter, statusFilter);
    } catch (err) {
      setError("Cannot delete this tour. It may still have active bookings.");
      showToast({ variant: "error", title: "Delete failed", description: "This tour may still have active bookings." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tour Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage bookable tour packages and their TravelDestination itinerary.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadData(page, query, categoryFilter, destinationFilter, statusFilter)} disabled={loading}>
              <RefreshCw size={17} /> Refresh
            </Button>
            <Button onClick={() => setCreating(true)}><Plus size={17} /> Create Tour</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-3 xl:grid-cols-[minmax(240px,1fr)_120px_180px_220px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
              placeholder="Search tours..."
            />
          </div>
          <Button type="button" onClick={() => void handleSearch()} disabled={loading} className="h-11 justify-center"><Search size={17} /> Search</Button>
          <select value={categoryFilter} onChange={(event) => void handleCategoryFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All categories</option>
            {categories.map((category) => <option key={getTourCategoryId(category)} value={getTourCategoryId(category)}>{category.name}</option>)}
          </select>
          <select value={destinationFilter} onChange={(event) => void handleDestinationFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All destinations</option>
            {destinations.map((destination) => <option key={getTravelDestinationId(destination)} value={getTravelDestinationId(destination)}>{destination.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => void handleStatusFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["ID", "Tour", "Travel Destinations", "Category", "Schedule", "Capacity", "Price", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">Loading tours...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">No tours found.</td></tr>
              ) : items.map((item) => {
                const thumbnail = resolveBackendAssetUrl(getAdminTourThumbnail(item));
                const tourName = getAdminTourName(item);
                const destinationNames = getAdminTourDestinations(item).map(getAdminTourDestinationName);

                return (
                  <tr key={getAdminTourId(item)} className="border-t border-slate-100">
                    <td className="p-3 font-bold">#{getAdminTourId(item)}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-3 font-semibold">
                        {thumbnail ? <img src={thumbnail} alt="" className="size-11 rounded-md object-cover" /> : <span className="grid size-11 place-items-center rounded-md bg-brand-50 text-brand-600"><ImagePlus size={17} /></span>}
                        {tourName}
                      </span>
                    </td>
                    <td className="max-w-64 p-3 text-slate-600">{destinationNames.length > 0 ? destinationNames.join(" -> ") : "-"}</td>
                    <td className="p-3">{getDisplayedCategoryName(item)}</td>
                    <td className="p-3">{item.schedule ?? item.duration ?? "-"}</td>
                    <td className="p-3">{item.capacity ?? "-"}</td>
                    <td className="p-3 font-semibold">{formatPrice(item.price)}</td>
                    <td className="p-3"><StatusBadge value={item.status ?? "draft"} /></td>
                    <td className="p-3">
                      <span className="flex gap-2">
                        <Button variant="outline" className="h-9 px-3" onClick={() => setEditingTour(item)}>
                          <Pencil size={15} /> Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => setDeletingTour(item)}
                          className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                          aria-label={`Delete ${tourName}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="tours" onPageChange={(nextPage) => void handlePageChange(nextPage)} />
      </div>

      {creating || editingTour ? (
        <TourForm
          key={editingTour ? getAdminTourId(editingTour) : "create"}
          initialValue={editingTour ? editingInitialValue : emptyTour}
          title={editingTour ? "Edit Tour" : "Create Tour"}
          categories={categories}
          destinations={destinations}
          saving={saving}
          onClose={() => {
            setEditingTour(null);
            setCreating(false);
          }}
          onSave={saveTour}
        />
      ) : null}

      {deletingTour ? (
        <ConfirmDialog
          title="Delete Tour"
          message={`Are you sure you want to delete "${getAdminTourName(deletingTour)}"?`}
          onCancel={() => setDeletingTour(null)}
          onConfirm={deleteTour}
        />
      ) : null}
    </>
  );
}

function TourForm({
  title,
  initialValue,
  categories,
  destinations,
  saving,
  onClose,
  onSave
}: {
  title: string;
  initialValue: TourFormValue;
  categories: AdminTourCategory[];
  destinations: AdminTravelDestination[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: TourFormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);

  useEffect(() => {
    return () => {
      if (form.preview.startsWith("blob:")) {
        URL.revokeObjectURL(form.preview);
      }
    };
  }, [form.preview]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Tour Name"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Saigon One Day Tour" /></Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" placeholder="Tour description" /></Field>
          </div>
          <Field label="Tour Category">
            <select required value={form.tour_category_id} onChange={(event) => setForm({ ...form, tour_category_id: event.target.value })} className="input">
              <option value="">Select category</option>
              {categories.map((category) => <option key={getTourCategoryId(category)} value={getTourCategoryId(category)}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="input">
              {statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
            </select>
          </Field>
          <Field label="Schedule"><input required value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} className="input" placeholder="Daily 08:00 - 17:00" /></Field>
          <Field label="Capacity"><input required min="1" type="number" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} className="input" /></Field>
          <Field label="Price"><input required min="0" type="number" step="any" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="input" /></Field>

          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">Travel Destinations</p>
            <p className="mt-1 text-xs text-slate-500">Select one or more destinations included in the tour itinerary.</p>
            <div className="mt-3 grid max-h-64 gap-2 overflow-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
              {destinations.map((destination) => {
                const id = String(getTravelDestinationId(destination));
                return (
                  <label key={id} className="flex items-center gap-2 rounded-md p-2 text-sm font-semibold hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={form.destination_ids.includes(id)}
                      onChange={(event) => setForm({
                        ...form,
                        destination_ids: event.target.checked
                          ? [...form.destination_ids, id]
                          : form.destination_ids.filter((item) => item !== id)
                      })}
                    />
                    {destination.name}
                  </label>
                );
              })}
            </div>
            {form.destination_ids.length === 0 ? <p className="mt-2 text-xs font-semibold text-rose-600">Select at least one destination.</p> : null}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">
              Tour Thumbnail
              <span className="mt-2 grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-[140px_1fr] sm:items-center">
                <span className="grid h-28 place-items-center overflow-hidden rounded-lg bg-slate-50 text-slate-400">
                  {form.preview ? <img src={form.preview} alt="Tour preview" className="h-full w-full object-cover" /> : <ImagePlus size={28} />}
                </span>
                <span>
                  <span className="block text-sm font-normal text-slate-500">Upload thumbnail_file for this tour.</span>
                  <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700">
                    <Upload size={16} /> Choose Image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) setForm({ ...form, thumbnail_file: file, preview: URL.createObjectURL(file) });
                      }}
                    />
                  </span>
                  {form.preview ? <button type="button" onClick={() => setForm({ ...form, thumbnail_file: null, preview: "" })} className="ml-3 text-sm font-bold text-rose-600">Remove</button> : null}
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || form.destination_ids.length === 0}>{saving ? "Saving..." : "Save Tour"}</Button>
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

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const style = normalized === "active"
    ? "bg-emerald-50 text-emerald-700"
    : normalized === "deleted" || normalized === "inactive"
      ? "bg-rose-50 text-rose-700"
      : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{formatLabel(value)}</span>;
}

function formatLabel(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

function formatPrice(value: AdminTour["price"]) {
  if (value === undefined || value === null || value === "") return "-";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(numberValue);
}
