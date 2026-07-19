"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Images, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { MediaLibrary, RichTextEditor } from "@/components/admin/rich-text-editor";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { Button } from "@/components/ui/button";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import { adminMediaService, getAdminMediaName, getAdminMediaUrl } from "@/services/admin-media.service";
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
  type AdminTourFaq,
  type AdminTourGalleryItem,
  type AdminTourPayload
} from "@/services/admin-tour.service";
import { adminTourCategoryService, getTourCategoryId, type AdminTourCategory } from "@/services/admin-tour-category.service";
import { adminTourContentItemService, getTourContentItemId, type AdminTourContentItem, type TourContentItemType } from "@/services/admin-tour-content-item.service";
import {
  adminTravelDestinationService,
  getTravelDestinationId,
  type AdminTravelDestination
} from "@/services/admin-travel-destination.service";

type TourFormValue = AdminTourPayload & {
  preview: string;
};

type TourFieldName =
  | "name"
  | "content_items"
  | "description"
  | "tour_category_id"
  | "status"
  | "schedule"
  | "capacity"
  | "price"
  | "child_price"
  | "infant_price"
  | "languages"
  | "destinations"
  | "thumbnail_file";

type TourFieldErrors = Partial<Record<TourFieldName, string>>;

const emptyTour: TourFormValue = {
  content_items: [],
  tour_category_id: "",
  name: "",
  slug: "",
  short_description: "",
  duration_days: "1",
  duration_nights: "0",
  start_time: "08:00",
  end_time: "17:00",
  tour_type: "group",
  languages: ["vi"],
  difficulty: "easy",
  minimum_participants: "1",
  minimum_booking: "1",
  maximum_booking: "",
  meeting_point: "",
  pickup_available: false,
  pickup_description: "",
  description: "",
  price: "",
  child_price: "",
  infant_price: "0",
  currency: "VND",
  schedule: "",
  capacity: "",
  status: "draft",
  video_url: "",
  highlights: [],
  inclusions: [],
  exclusions: [],
  requirements: [],
  cancellation_policy: "",
  booking_policy: "",
  additional_information: "",
  faqs: [],
  gallery: [],
  destinations: [],
  thumbnail_file: null,
  preview: ""
};

const statuses = ["active", "inactive", "draft"];
const pageSize = 10;

type ScheduleParts = {
  days: number;
  startTime: string;
  endTime: string;
};

export default function AdminToursPage() {
  const [items, setItems] = useState<AdminTour[]>([]);
  const [categories, setCategories] = useState<AdminTourCategory[]>([]);
  const [destinations, setDestinations] = useState<AdminTravelDestination[]>([]);
  const [contentItems, setContentItems] = useState<AdminTourContentItem[]>([]);
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
  const [fieldErrors, setFieldErrors] = useState<TourFieldErrors>({});
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
      const [tourResult, categoryResult, destinationResult, contentItemResult] = await Promise.all([
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
        adminTravelDestinationService.list({ page: 1, limit: 100 }),
        adminTourContentItemService.list({ status: "active", page: 1, limit: 100, sort: "type", order: "asc" })
      ]);
      const total = tourResult.pagination?.total ?? tourResult.data?.length ?? 0;
      setItems(tourResult.data ?? []);
      setCategories(Array.isArray(categoryResult) ? categoryResult : []);
      setDestinations(destinationResult.data ?? []);
      setContentItems(contentItemResult);
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
      content_items: [],
      tour_category_id: String(getAdminTourCategoryId(editingTour) ?? ""),
      name: getAdminTourName(editingTour),
      slug: editingTour.slug ?? "",
      short_description: editingTour.short_description ?? "",
      duration_days: String(editingTour.duration_days ?? parseSchedule(editingTour.schedule ?? "").days ?? 1),
      duration_nights: String(editingTour.duration_nights ?? 0),
      start_time: editingTour.start_time ?? parseSchedule(editingTour.schedule ?? "").startTime,
      end_time: editingTour.end_time ?? parseSchedule(editingTour.schedule ?? "").endTime,
      tour_type: editingTour.tour_type ?? "group",
      languages: Array.isArray(editingTour.languages) ? editingTour.languages : ["vi"],
      difficulty: editingTour.difficulty ?? "easy",
      minimum_participants: String(editingTour.minimum_participants ?? 1),
      minimum_booking: String(editingTour.minimum_booking ?? 1),
      maximum_booking: editingTour.maximum_booking == null ? "" : String(editingTour.maximum_booking),
      meeting_point: editingTour.meeting_point ?? "",
      pickup_available: Boolean(editingTour.pickup_available),
      pickup_description: editingTour.pickup_description ?? "",
      description: editingTour.description ?? "",
      price: editingTour.price == null ? "" : String(editingTour.price),
      child_price: editingTour.child_price == null ? "" : String(editingTour.child_price),
      infant_price: editingTour.infant_price == null ? "0" : String(editingTour.infant_price),
      currency: editingTour.currency ?? "VND",
      schedule: editingTour.schedule ?? editingTour.duration ?? "",
      capacity: editingTour.capacity == null ? "" : String(editingTour.capacity),
      status: editingTour.status ?? "active",
      video_url: editingTour.video_url ?? "",
      highlights: editingTour.highlights ?? [],
      inclusions: editingTour.inclusions ?? [],
      exclusions: editingTour.exclusions ?? [],
      requirements: editingTour.requirements ?? [],
      cancellation_policy: editingTour.cancellation_policy ?? "",
      booking_policy: editingTour.booking_policy ?? "",
      additional_information: editingTour.additional_information ?? "",
      faqs: editingTour.faqs ?? [],
      gallery: editingTour.gallery ?? [],
      destinations: getAdminTourDestinations(editingTour)
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((destination) => ({
          destination_id: String(getAdminTourDestinationId(destination)),
          estimated_time: destination.estimated_time ?? "",
          note: destination.note ?? ""
        }))
        .filter((destination) => destination.destination_id !== "0"),
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
    setFieldErrors({});
    try {
      const requestPayload: AdminTourPayload = {
        content_items: payload.content_items,
        tour_category_id: payload.tour_category_id,
        name: payload.name,
        slug: payload.slug,
        short_description: payload.short_description,
        duration_days: payload.duration_days,
        duration_nights: payload.duration_nights,
        start_time: payload.start_time,
        end_time: payload.end_time,
        tour_type: payload.tour_type,
        languages: payload.languages,
        difficulty: payload.difficulty,
        minimum_participants: payload.minimum_participants,
        minimum_booking: payload.minimum_booking,
        maximum_booking: payload.maximum_booking,
        meeting_point: payload.meeting_point,
        pickup_available: payload.pickup_available,
        pickup_description: payload.pickup_description,
        description: payload.description,
        price: payload.price,
        child_price: payload.child_price,
        infant_price: payload.infant_price,
        currency: payload.currency,
        schedule: payload.schedule,
        capacity: payload.capacity,
        status: payload.status,
        video_url: payload.video_url,
        highlights: payload.highlights,
        inclusions: payload.inclusions,
        exclusions: payload.exclusions,
        requirements: payload.requirements,
        cancellation_policy: payload.cancellation_policy,
        booking_policy: payload.booking_policy,
        additional_information: payload.additional_information,
        faqs: payload.faqs,
        gallery: payload.gallery,
        destinations: payload.destinations,
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
      setFieldErrors({});
      await loadData(page, query, categoryFilter, destinationFilter, statusFilter);
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot save tour. Please check required fields, duplicate name, category, destinations, or permission.");
      const nextFieldErrors = getBackendFieldErrors(err);
      setError(message);
      setFieldErrors(nextFieldErrors);
      showToast({ variant: "error", title: "Save failed", description: message });
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
      const message = getBackendErrorMessage(err, "Cannot delete this tour. It may still have active bookings.");
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
            <h1 className="text-2xl font-bold">Tour Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage bookable tour packages and their TravelDestination itinerary.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadData(page, query, categoryFilter, destinationFilter, statusFilter)} disabled={loading}>
              <RefreshCw size={17} /> Refresh
            </Button>
            <Button onClick={() => {
              setFieldErrors({});
              setCreating(true);
            }}><Plus size={17} /> Create Tour</Button>
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
                <AdminTableSkeleton columns={9} rows={10} />
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
                        <Button variant="outline" className="h-9 px-3" onClick={async () => {
                          setFieldErrors({});
                          try {
                            setEditingTour(await adminTourService.get(getAdminTourId(item)));
                          } catch {
                            setEditingTour(item);
                            showToast({ variant: "error", title: "Detail unavailable", description: "Using the tour data from the list." });
                          }
                        }}>
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
          contentItems={contentItems}
          isEditing={Boolean(editingTour)}
          saving={saving}
          fieldErrors={fieldErrors}
          onSetFieldErrors={setFieldErrors}
          onClearFieldError={(field) => setFieldErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
          })}
          onClose={() => {
            setEditingTour(null);
            setCreating(false);
            setFieldErrors({});
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
  contentItems,
  isEditing,
  saving,
  fieldErrors,
  onSetFieldErrors,
  onClearFieldError,
  onClose,
  onSave
}: {
  title: string;
  initialValue: TourFormValue;
  categories: AdminTourCategory[];
  destinations: AdminTravelDestination[];
  contentItems: AdminTourContentItem[];
  isEditing: boolean;
  saving: boolean;
  fieldErrors: TourFieldErrors;
  onSetFieldErrors: (errors: TourFieldErrors) => void;
  onClearFieldError: (field: TourFieldName) => void;
  onClose: () => void;
  onSave: (payload: TourFormValue) => void;
}) {
  const parsedSchedule = parseSchedule(initialValue.schedule);
  const initialSchedule = {
    days: Number(initialValue.duration_days) || parsedSchedule.days,
    startTime: initialValue.start_time || parsedSchedule.startTime,
    endTime: initialValue.end_time || parsedSchedule.endTime
  };
  const [form, setForm] = useState<TourFormValue>({
    ...initialValue,
    schedule: buildSchedule(initialSchedule.days, initialSchedule.startTime, initialSchedule.endTime)
  });
  const [scheduleDays, setScheduleDays] = useState(initialSchedule.days);
  const [startTime, setStartTime] = useState(initialSchedule.startTime);
  const [endTime, setEndTime] = useState(initialSchedule.endTime);
  function updateSchedule(next: Partial<ScheduleParts>) {
    const days = next.days ?? scheduleDays;
    const start = next.startTime ?? startTime;
    const end = next.endTime ?? endTime;

    setScheduleDays(days);
    setStartTime(start);
    setEndTime(end);
    onClearFieldError("schedule");
    setForm((current) => ({
      ...current,
      duration_days: String(days),
      start_time: start,
      end_time: end,
      schedule: buildSchedule(days, start, end)
    }));
  }

  function applySelectedContentItems(selectedIds: string[]) {
    const selectedItems = contentItems.filter((item) => selectedIds.includes(String(getTourContentItemId(item))));
    const values = (type: TourContentItemType) => selectedItems.filter((item) => item.type === type).map((item) => item.content.trim()).filter(Boolean);
    setForm((current) => ({
      ...current,
      content_items: selectedIds.map((id, index) => ({ id: Number(id), sort_order: index + 1 })),
      highlights: mergeUnique(current.highlights, values("highlight")),
      requirements: mergeUnique(current.requirements, values("requirement")),
      inclusions: mergeUnique(current.inclusions, values("inclusion")),
      exclusions: mergeUnique(current.exclusions, values("exclusion")),
      booking_policy: values("booking_policy").at(-1) ?? current.booking_policy,
      cancellation_policy: values("cancellation_policy").at(-1) ?? current.cancellation_policy,
      additional_information: values("additional_information").at(-1) ?? current.additional_information
    }));
    onClearFieldError("content_items");
  }

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
        noValidate
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          const nextFieldErrors = validateTourForm(form, { days: scheduleDays, startTime, endTime });
          onSetFieldErrors(nextFieldErrors);
          if (Object.keys(nextFieldErrors).length > 0) return;
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
          {!isEditing ? <div className="sm:col-span-2"><ContentItemSelector items={contentItems} selectedIds={form.content_items.map((item) => String(item.id))} onChange={applySelectedContentItems} /></div> : null}
          <div className="sm:col-span-2">
            <Field label="Tour Name" message={fieldErrors.name} tone={fieldErrors.name ? "invalid" : "neutral"}>
              <input required value={form.name} onChange={(event) => {
                onClearFieldError("name");
                setForm({ ...form, name: event.target.value });
              }} className="input" placeholder="Saigon One Day Tour" />
            </Field>
          </div>
          <Field label="Slug (optional)">
            <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} className="input" placeholder="saigon-one-day-tour" />
          </Field>
          <Field label="Short Description">
            <input value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} className="input" maxLength={500} placeholder="Short summary displayed on tour cards" />
          </Field>
          <div className="sm:col-span-2">
            <RichTextEditor
              label="Description"
              placeholder="Write tour description..."
              value={form.description}
              message={fieldErrors.description}
              onChange={(description) => {
                onClearFieldError("description");
                setForm((current) => ({ ...current, description }));
              }}
            />
          </div>
          <Field label="Tour Category" message={fieldErrors.tour_category_id} tone={fieldErrors.tour_category_id ? "invalid" : "neutral"}>
            <select required value={form.tour_category_id} onChange={(event) => {
              onClearFieldError("tour_category_id");
              setForm({ ...form, tour_category_id: event.target.value });
            }} className="input">
              <option value="">Select category</option>
              {categories.map((category) => <option key={getTourCategoryId(category)} value={getTourCategoryId(category)}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Status" message={fieldErrors.status} tone={fieldErrors.status ? "invalid" : "neutral"}>
            <select value={form.status} onChange={(event) => {
              onClearFieldError("status");
              setForm({ ...form, status: event.target.value });
            }} className="input">
              {statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
            </select>
          </Field>
          <Field label="Tour Type">
            <select value={form.tour_type} onChange={(event) => setForm({ ...form, tour_type: event.target.value })} className="input">
              <option value="group">Group</option><option value="private">Private</option><option value="self_guided">Self guided</option>
            </select>
          </Field>
          <Field label="Difficulty">
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })} className="input">
              {["easy", "moderate", "challenging", "difficult"].map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">Languages</p>
            <div className="mt-2 flex flex-wrap gap-4 rounded-lg border border-slate-200 p-3">
              {[["vi", "Vietnamese"], ["en", "English"], ["fr", "French"], ["zh", "Chinese"], ["ja", "Japanese"], ["ko", "Korean"]].map(([code, label]) => (
                <label key={code} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.languages.includes(code)} onChange={(event) => { onClearFieldError("languages"); setForm({ ...form, languages: event.target.checked ? [...form.languages, code] : form.languages.filter((item) => item !== code) }); }} />{label}</label>
              ))}
            </div>
            {fieldErrors.languages ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.languages}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">Schedule</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <label className="block text-xs font-semibold text-slate-500">
                Number of days
                <input
                  required
                  min="1"
                  max="30"
                  type="number"
                  value={scheduleDays}
                  onChange={(event) => updateSchedule({ days: Math.max(1, Number(event.target.value) || 1) })}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-500">
                Start time
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(event) => updateSchedule({ startTime: event.target.value })}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-500">
                End time
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={(event) => updateSchedule({ endTime: event.target.value })}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"
                />
              </label>
            </div>
            {fieldErrors.schedule ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.schedule}</p> : null}
            <input type="hidden" value={form.schedule} readOnly />
          </div>
          <Field label="Number of nights">
            <input min="0" max="30" type="number" value={form.duration_nights} onChange={(event) => setForm({ ...form, duration_nights: event.target.value })} className="input" />
          </Field>
          <Field label="Meeting Point">
            <input value={form.meeting_point} onChange={(event) => setForm({ ...form, meeting_point: event.target.value })} className="input" placeholder="Address or meeting instructions" />
          </Field>
          <div className="sm:col-span-2 rounded-lg border border-slate-200 p-4">
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.pickup_available} onChange={(event) => setForm({ ...form, pickup_available: event.target.checked })} />Pickup available</label>
            {form.pickup_available ? <textarea value={form.pickup_description} onChange={(event) => setForm({ ...form, pickup_description: event.target.value })} className="input mt-3 min-h-20 py-3" placeholder="Describe pickup areas and conditions" /> : null}
          </div>
          <Field label="Capacity" message={fieldErrors.capacity} tone={fieldErrors.capacity ? "invalid" : "neutral"}>
            <input required min="1" type="number" value={form.capacity} onChange={(event) => {
              onClearFieldError("capacity");
              setForm({ ...form, capacity: event.target.value });
            }} className="input" />
          </Field>
          <Field label="Price" message={fieldErrors.price} tone={fieldErrors.price ? "invalid" : "neutral"}>
            <input required min="0" type="number" step="any" value={form.price} onChange={(event) => {
              onClearFieldError("price");
              setForm({ ...form, price: event.target.value });
            }} className="input" />
          </Field>
          <Field label="Child Price" message={fieldErrors.child_price} tone={fieldErrors.child_price ? "invalid" : "neutral"}>
            <input required min="0" type="number" step="any" value={form.child_price} onChange={(event) => {
              onClearFieldError("child_price");
              setForm({ ...form, child_price: event.target.value });
            }} className="input" />
          </Field>
          <Field label="Infant Price" message={fieldErrors.infant_price} tone={fieldErrors.infant_price ? "invalid" : "neutral"}>
            <input min="0" type="number" step="any" value={form.infant_price} onChange={(event) => { onClearFieldError("infant_price"); setForm({ ...form, infant_price: event.target.value }); }} className="input" />
          </Field>
          <Field label="Currency">
            <select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="input"><option value="VND">VND</option><option value="USD">USD</option></select>
          </Field>
          <Field label="Minimum Participants">
            <input min="1" type="number" value={form.minimum_participants} onChange={(event) => setForm({ ...form, minimum_participants: event.target.value })} className="input" />
          </Field>
          <Field label="Minimum Booking">
            <input min="1" type="number" value={form.minimum_booking} onChange={(event) => setForm({ ...form, minimum_booking: event.target.value })} className="input" />
          </Field>
          <Field label="Maximum Booking (optional)">
            <input min="1" type="number" value={form.maximum_booking} onChange={(event) => setForm({ ...form, maximum_booking: event.target.value })} className="input" />
          </Field>
          <Field label="Video URL">
            <input type="url" value={form.video_url} onChange={(event) => setForm({ ...form, video_url: event.target.value })} className="input" placeholder="https://youtube.com/..." />
          </Field>

          <div className="sm:col-span-2 grid gap-4 md:grid-cols-2">
            <StringListEditor title="Highlights" items={form.highlights} placeholder="Add a tour highlight" onChange={(highlights) => setForm({ ...form, highlights })} />
            <StringListEditor title="Requirements" items={form.requirements} placeholder="Add a requirement" onChange={(requirements) => setForm({ ...form, requirements })} />
            <StringListEditor title="Inclusions" items={form.inclusions} placeholder="Add an included item" onChange={(inclusions) => setForm({ ...form, inclusions })} />
            <StringListEditor title="Exclusions" items={form.exclusions} placeholder="Add an excluded item" onChange={(exclusions) => setForm({ ...form, exclusions })} />
          </div>

          <div className="sm:col-span-2 grid gap-4 md:grid-cols-2">
            <Field label="Booking Policy"><textarea value={form.booking_policy} onChange={(event) => setForm({ ...form, booking_policy: event.target.value })} className="input min-h-28 py-3" /></Field>
            <Field label="Cancellation Policy"><textarea value={form.cancellation_policy} onChange={(event) => setForm({ ...form, cancellation_policy: event.target.value })} className="input min-h-28 py-3" /></Field>
            <div className="md:col-span-2"><Field label="Additional Information"><textarea value={form.additional_information} onChange={(event) => setForm({ ...form, additional_information: event.target.value })} className="input min-h-24 py-3" /></Field></div>
          </div>

          <div className="sm:col-span-2"><FaqEditor items={form.faqs} onChange={(faqs) => setForm({ ...form, faqs })} /></div>
          <div className="sm:col-span-2"><GalleryEditor items={form.gallery} onChange={(gallery) => setForm({ ...form, gallery })} /></div>

          <div className="sm:col-span-2">
            <p className="text-sm font-semibold">Travel Destinations</p>
            <p className="mt-1 text-xs text-slate-500">Select destinations, arrange their order, and add the estimated time and notes for each stop.</p>
            <div className="mt-3 grid max-h-48 gap-2 overflow-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
              {destinations.map((destination) => {
                const id = String(getTravelDestinationId(destination));
                return (
                  <label key={id} className="flex items-center gap-2 rounded-md p-2 text-sm font-semibold hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={form.destinations.some((item) => item.destination_id === id)}
                      onChange={(event) => setForm({
                        ...form,
                        destinations: event.target.checked
                          ? [...form.destinations, { destination_id: id, estimated_time: "", note: "" }]
                          : form.destinations.filter((item) => item.destination_id !== id)
                      })}
                      onClick={() => onClearFieldError("destinations")}
                    />
                    {destination.name}
                  </label>
                );
              })}
            </div>
            {form.destinations.length > 0 ? (
              <div className="mt-3 space-y-3">
                {form.destinations.map((stop, index) => {
                  const destination = destinations.find((item) => String(getTravelDestinationId(item)) === stop.destination_id);
                  return (
                    <div key={stop.destination_id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold"><span className="mr-2 text-brand-600">{index + 1}</span>{destination?.name ?? `Destination #${stop.destination_id}`}</p>
                        <span className="flex gap-1">
                          <button type="button" disabled={index === 0} onClick={() => setForm({ ...form, destinations: moveItem(form.destinations, index, index - 1) })} className="grid size-8 place-items-center rounded border border-slate-200 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
                          <button type="button" disabled={index === form.destinations.length - 1} onClick={() => setForm({ ...form, destinations: moveItem(form.destinations, index, index + 1) })} className="grid size-8 place-items-center rounded border border-slate-200 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input value={stop.estimated_time} onChange={(event) => setForm({ ...form, destinations: updateStop(form.destinations, index, "estimated_time", event.target.value) })} className="input" placeholder="Estimated time (e.g. 90 minutes)" />
                        <input value={stop.note} onChange={(event) => setForm({ ...form, destinations: updateStop(form.destinations, index, "note", event.target.value) })} className="input" placeholder="Note for this stop" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {fieldErrors.destinations ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.destinations}</p> : null}
            {form.destinations.length === 0 ? <p className="mt-2 text-xs font-semibold text-rose-600">Select at least one destination.</p> : null}
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
                        onClearFieldError("thumbnail_file");
                        if (file) setForm({ ...form, thumbnail_file: file, preview: URL.createObjectURL(file) });
                      }}
                    />
                  </span>
                  {form.preview ? <button type="button" onClick={() => {
                    onClearFieldError("thumbnail_file");
                    setForm({ ...form, thumbnail_file: null, preview: "" });
                  }} className="ml-3 text-sm font-bold text-rose-600">Remove</button> : null}
                  {fieldErrors.thumbnail_file ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.thumbnail_file}</span> : null}
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || form.destinations.length === 0}>{saving ? "Saving..." : "Save Tour"}</Button>
        </div>
      </form>
    </div>
  );
}

function ContentItemSelector({ items, selectedIds, onChange }: { items: AdminTourContentItem[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const types: TourContentItemType[] = ["highlight", "requirement", "inclusion", "exclusion", "booking_policy", "cancellation_policy", "additional_information"];
  const [filter, setFilter] = useState<TourContentItemType | "all">("all");
  const [draftIds, setDraftIds] = useState(selectedIds);
  const visibleItems = filter === "all" ? items : items.filter((item) => item.type === filter);
  const hasChanges = draftIds.length !== selectedIds.length || draftIds.some((id) => !selectedIds.includes(id));
  function toggle(id: string) { setDraftIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  return <section className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-brand-900">Reusable Content Items</h3><p className="mt-1 text-xs text-brand-700">Select items, then confirm to insert them into the editable fields below.</p></div><span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">{draftIds.length} selected</span></div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button type="button" onClick={() => setFilter("all")} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${filter === "all" ? "bg-brand-600 text-white" : "bg-white text-slate-600"}`}>All</button>{types.map((type) => <button key={type} type="button" onClick={() => setFilter(type)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${filter === type ? "bg-brand-600 text-white" : "bg-white text-slate-600"}`}>{formatLabel(type.replaceAll("_", " "))}</button>)}</div>
    <div className="mt-3 grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
      {visibleItems.map((item) => { const id = String(getTourContentItemId(item)); const selected = draftIds.includes(id); return <button key={id} type="button" onClick={() => toggle(id)} aria-pressed={selected} className={`rounded-lg border p-3 text-left transition ${selected ? "border-brand-500 bg-white ring-2 ring-brand-100" : "border-slate-200 bg-white/70 hover:border-brand-300"}`}><span className="text-[11px] font-bold uppercase text-brand-600">{item.type.replaceAll("_", " ")}</span><p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-slate-700">{item.content}</p></button>; })}
      {!visibleItems.length ? <p className="col-span-full rounded-lg bg-white p-5 text-center text-sm text-slate-500">No active content items found. Create them from Tour Content Items.</p> : null}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
      {hasChanges ? <button type="button" onClick={() => setDraftIds(selectedIds)} className="h-9 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-white">Reset selection</button> : null}
      <button type="button" onClick={() => onChange(draftIds)} disabled={!draftIds.length || !hasChanges} className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Confirm & insert into fields</button>
    </div>
  </section>;
}

function mergeUnique(current: string[], incoming: string[]) {
  const seen = new Set(current.map((item) => item.trim().toLocaleLowerCase()));
  return [...current, ...incoming.filter((item) => {
    const key = item.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  })];
}

function StringListEditor({ title, items, placeholder, onChange }: { title: string; items: string[]; placeholder: string; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function addItem() {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  }
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3 flex gap-2">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addItem(); } }} className="input" placeholder={placeholder} />
        <button type="button" onClick={addItem} className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-600 text-white" aria-label={"Add " + title}><Plus size={16} /></button>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => <div key={index} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm"><span>{item}</span><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-rose-600" aria-label={"Remove " + item}><X size={15} /></button></div>)}
        {!items.length ? <p className="text-xs text-slate-400">No items added.</p> : null}
      </div>
    </section>
  );
}

function FaqEditor({ items, onChange }: { items: AdminTourFaq[]; onChange: (items: AdminTourFaq[]) => void }) {
  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between"><div><h3 className="font-bold">Frequently Asked Questions</h3><p className="mt-1 text-xs text-slate-500">Questions are displayed in this order on Tour Detail.</p></div><button type="button" onClick={() => onChange([...items, { question: "", answer: "", order_index: items.length + 1 }])} className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700"><Plus size={15} /> Add FAQ</button></div>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => <div key={index} className="rounded-lg bg-slate-50 p-3"><div className="flex gap-2"><input value={item.question} onChange={(event) => onChange(items.map((faq, faqIndex) => faqIndex === index ? { ...faq, question: event.target.value } : faq))} className="input" placeholder="Question" /><button type="button" onClick={() => onChange(items.filter((_, faqIndex) => faqIndex !== index))} className="grid size-11 shrink-0 place-items-center text-rose-600"><Trash2 size={16} /></button></div><textarea value={item.answer} onChange={(event) => onChange(items.map((faq, faqIndex) => faqIndex === index ? { ...faq, answer: event.target.value } : faq))} className="input mt-2 min-h-20 py-3" placeholder="Answer" /></div>)}
        {!items.length ? <p className="text-sm text-slate-400">No FAQs added.</p> : null}
      </div>
    </section>
  );
}

function GalleryEditor({ items, onChange }: { items: AdminTourGalleryItem[]; onChange: (items: AdminTourGalleryItem[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);

  function toggleGalleryImage(url: string, alt: string, mediaId?: number) {
    const resolvedUrl = resolveBackendAssetUrl(url);
    if (!resolvedUrl) return;
    const existingIndex = items.findIndex((item) => resolveBackendAssetUrl(item.url) === resolvedUrl);
    if (existingIndex >= 0) {
      onChange(items.filter((_, index) => index !== existingIndex));
      return;
    }
    onChange([...items, {
      media_id: mediaId,
      type: "image",
      url: resolvedUrl,
      alt,
      order_index: items.length + 1
    }]);
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length || uploading) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => adminMediaService.upload(file)));
      const nextItems = uploaded
        .map((media, index) => ({
          media_id: media.media_id ?? media.id,
          type: "image",
          url: resolveBackendAssetUrl(getAdminMediaUrl(media)),
          alt: getAdminMediaName(media),
          order_index: items.length + index + 1
        }))
        .filter((item) => item.url);
      onChange([...items, ...nextItems]);
    } catch {
      setError("Cannot upload gallery images. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-bold">Gallery</h3><p className="mt-1 text-xs text-slate-500">Upload images from your computer. Files are stored in the backend media library.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setMediaOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700"><Images size={15} /> Media Library</button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading..." : "Upload Images"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple disabled={uploading} className="hidden" onChange={(event) => { void uploadImages(event.target.files); event.target.value = ""; }} />
          </label>
        </div>
      </div>
      {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => <div key={`gallery-${item.media_id ?? item.id ?? "new"}-${item.url}-${index}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="relative h-36 bg-slate-100"><img src={resolveBackendAssetUrl(item.url)} alt={item.alt || "Tour gallery image"} className="h-full w-full object-cover" /><button type="button" onClick={() => onChange(items.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-rose-600 shadow" aria-label="Remove gallery image"><Trash2 size={15} /></button></div><input value={item.alt ?? ""} onChange={(event) => onChange(items.map((image, imageIndex) => imageIndex === index ? { ...image, alt: event.target.value } : image))} className="h-10 w-full border-t border-slate-200 px-3 text-sm outline-none" placeholder="Alternative text" /></div>)}
        {!items.length ? <div className="col-span-full rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400"><ImagePlus className="mx-auto mb-2 size-7" />No gallery images uploaded.</div> : null}
      </div>
      {mediaOpen ? <MediaLibrary
        onClose={() => setMediaOpen(false)}
        actionLabel="Add to gallery"
        selectedUrls={items.map((item) => item.url)}
        onInsert={(media) => toggleGalleryImage(getAdminMediaUrl(media), getAdminMediaName(media), media.media_id ?? media.id)}
        onInsertUrl={(url) => toggleGalleryImage(url, "Tour gallery image")}
      /> : null}
    </section>
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

function parseSchedule(value?: string): ScheduleParts {
  const fallback = { days: 1, startTime: "08:00", endTime: "17:00" };
  if (!value) return fallback;

  const match = value.match(/(\d+)\s*days?\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/i);
  if (!match) return fallback;

  return {
    days: Math.max(1, Number(match[1]) || 1),
    startTime: match[2],
    endTime: match[3]
  };
}

function buildSchedule(days: number, startTime: string, endTime: string) {
  const dayLabel = days === 1 ? "day" : "days";
  return `${days} ${dayLabel} ${startTime} - ${endTime}`;
}

function validateTourForm(form: TourFormValue, schedule: ScheduleParts): TourFieldErrors {
  const errors: TourFieldErrors = {};

  if (!form.name.trim()) errors.name = "Tour name is required.";
  if (!form.tour_category_id) errors.tour_category_id = "Tour category is required.";
  if (!form.status) errors.status = "Status is required.";

  if (!Number.isFinite(schedule.days) || schedule.days < 1) {
    errors.schedule = "Number of days must be at least 1.";
  } else if (schedule.days > 30) {
    errors.schedule = "Number of days cannot exceed 30.";
  } else if (!schedule.startTime) {
    errors.schedule = "Start time is required.";
  } else if (!schedule.endTime) {
    errors.schedule = "End time is required.";
  }

  const capacity = Number(form.capacity);
  if (!form.capacity) {
    errors.capacity = "Capacity is required.";
  } else if (!Number.isFinite(capacity) || capacity < 1) {
    errors.capacity = "Capacity must be at least 1.";
  }

  const price = Number(form.price);
  if (!form.price) {
    errors.price = "Price is required.";
  } else if (!Number.isFinite(price) || price < 0) {
    errors.price = "Price must be 0 or greater.";
  }

  const childPrice = Number(form.child_price);
  if (!form.child_price) {
    errors.child_price = "Child price is required.";
  } else if (!Number.isFinite(childPrice) || childPrice < 0) {
    errors.child_price = "Child price must be 0 or greater.";
  }

  const infantPrice = Number(form.infant_price);
  if (form.infant_price === "") {
    errors.infant_price = "Infant price is required.";
  } else if (!Number.isFinite(infantPrice) || infantPrice < 0) {
    errors.infant_price = "Infant price must be 0 or greater.";
  }

  if (form.languages.length === 0) {
    errors.languages = "Select at least one tour language.";
  }

  if (form.destinations.length === 0) {
    errors.destinations = "Select at least one destination.";
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

function getBackendFieldErrors(err: unknown): TourFieldErrors {
  const errors: TourFieldErrors = {};

  for (const message of getBackendValidationMessages(err)) {
    const fieldPath = message.match(/"([^"]+)"/)?.[1] ?? "";
    const field = mapBackendFieldToTourField(fieldPath, message);
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

function mapBackendFieldToTourField(fieldPath: string, message: string): TourFieldName | null {
  const normalized = fieldPath.toLowerCase();
  const lowerMessage = message.toLowerCase();

  if (normalized.includes("destination") || lowerMessage.includes("destination")) return "destinations";
  if (normalized.includes("thumbnail")) return "thumbnail_file";
  if (normalized.includes("tour_category") || normalized.includes("category")) return "tour_category_id";
  if (normalized.includes("name") || lowerMessage.includes("duplicate tour")) return "name";
  if (normalized.includes("description")) return "description";
  if (normalized.includes("schedule")) return "schedule";
  if (normalized.includes("capacity")) return "capacity";
  if (normalized.includes("child_price") || lowerMessage.includes("child price")) return "child_price";
  if (normalized.includes("price")) return "price";
  if (normalized.includes("status")) return "status";
  return null;
}

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function updateStop(
  stops: AdminTourPayload["destinations"],
  index: number,
  field: "estimated_time" | "note",
  value: string
) {
  return stops.map((stop, stopIndex) => stopIndex === index ? { ...stop, [field]: value } : stop);
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
