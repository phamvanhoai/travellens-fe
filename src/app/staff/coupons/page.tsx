"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Percent, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  getStaffCouponId,
  staffCouponService,
  type StaffCoupon,
  type StaffCouponDiscountType,
  type StaffCouponPayload,
  type StaffCouponStatus
} from "@/services/staff-coupon.service";

type CouponFormValue = StaffCouponPayload;
type CouponFieldName = keyof CouponFormValue;
type CouponFieldErrors = Partial<Record<CouponFieldName, string>>;

const statuses: StaffCouponStatus[] = ["active", "inactive", "expired", "deleted"];
const discountTypes: StaffCouponDiscountType[] = ["percentage", "fixed"];
const pageSize = 10;

const emptyCoupon: CouponFormValue = {
  code: "",
  name: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  max_discount_amount: "",
  min_order_amount: "",
  usage_limit: "",
  start_date: "",
  end_date: "",
  status: "active"
};

export default function StaffCouponsPage() {
  const [items, setItems] = useState<StaffCoupon[]>([]);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [discountTypeFilter, setDiscountTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CouponFieldErrors>({});
  const [editing, setEditing] = useState<StaffCoupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<StaffCoupon | null>(null);
  const showToast = useToast();

  const loadData = useCallback(async (nextPage: number, search: string, status: string, discountType: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await staffCouponService.list({
        page: nextPage,
        limit: pageSize,
        search,
        status: status || undefined,
        discount_type: discountType || undefined
      });
      const total = result.pagination?.total ?? result.data?.length ?? 0;
      setItems(result.data ?? []);
      setTotalItems(total);
      setPageCount(result.pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)));
    } catch (err) {
      setError("Cannot load coupons from API.");
      showToast({ variant: "error", title: "Load failed", description: "Cannot load coupons from API." });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData(1, "", "", "");
  }, [loadData]);

  const editingInitialValue = useMemo<CouponFormValue>(() => {
    if (!editing) return emptyCoupon;
    return {
      code: editing.code ?? "",
      name: editing.name ?? "",
      description: editing.description ?? "",
      discount_type: editing.discount_type ?? "percentage",
      discount_value: editing.discount_value == null ? "" : String(editing.discount_value),
      max_discount_amount: editing.max_discount_amount == null ? "" : String(editing.max_discount_amount),
      min_order_amount: editing.min_order_amount == null ? "" : String(editing.min_order_amount),
      usage_limit: editing.usage_limit == null ? "" : String(editing.usage_limit),
      start_date: toDateInput(editing.start_date),
      end_date: toDateInput(editing.end_date),
      status: editing.status ?? "active"
    };
  }, [editing]);

  async function handleSearch() {
    const value = searchInput.trim();
    setQuery(value);
    setPage(1);
    await loadData(1, value, statusFilter, discountTypeFilter);
  }

  async function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
    await loadData(1, query, value, discountTypeFilter);
  }

  async function handleDiscountTypeFilter(value: string) {
    setDiscountTypeFilter(value);
    setPage(1);
    await loadData(1, query, statusFilter, value);
  }

  async function handlePageChange(nextPage: number) {
    setPage(nextPage);
    await loadData(nextPage, query, statusFilter, discountTypeFilter);
  }

  async function save(payload: CouponFormValue) {
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      if (editing) {
        await staffCouponService.update(getStaffCouponId(editing), payload);
        showToast({ variant: "success", title: "Coupon updated", description: payload.name });
      } else {
        await staffCouponService.create(payload);
        showToast({ variant: "success", title: "Coupon created", description: payload.code });
      }

      setEditing(null);
      setCreating(false);
      setFieldErrors({});
      await loadData(page, query, statusFilter, discountTypeFilter);
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot save coupon. Please check required fields, duplicate code, or permission.");
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
      await staffCouponService.remove(getStaffCouponId(deleting));
      showToast({ variant: "success", title: "Coupon deleted", description: deleting.code });
      setDeleting(null);
      await loadData(page, query, statusFilter, discountTypeFilter);
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot delete coupon.");
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
            <h1 className="text-2xl font-bold">Coupon Management</h1>
            <p className="mt-1 text-sm text-slate-500">Create and maintain staff coupon campaigns.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => loadData(page, query, statusFilter, discountTypeFilter)} disabled={loading}><RefreshCw size={17} /> Refresh</Button>
            <Button onClick={() => {
              setFieldErrors({});
              setCreating(true);
            }}><Plus size={17} /> Create Coupon</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_120px_180px_180px]">
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
              placeholder="Search coupons..."
            />
          </div>
          <Button type="button" onClick={() => void handleSearch()} disabled={loading} className="h-11 justify-center"><Search size={17} /> Search</Button>
          <select value={statusFilter} onChange={(event) => void handleStatusFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={discountTypeFilter} onChange={(event) => void handleDiscountTypeFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All types</option>
            {discountTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Code", "Name", "Discount", "Max", "Min Order", "Usage", "Dates", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">Loading coupons...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">No coupons found.</td></tr>
              ) : items.map((item) => (
                <tr key={getStaffCouponId(item)} className="border-t border-slate-100">
                  <td className="p-3 font-bold"><Percent className="mr-2 inline size-4 text-brand-600" />{item.code}</td>
                  <td className="max-w-56 truncate p-3">{item.name}</td>
                  <td className="p-3">{formatDiscount(item)}</td>
                  <td className="p-3">{formatMoney(item.max_discount_amount)}</td>
                  <td className="p-3">{formatMoney(item.min_order_amount)}</td>
                  <td className="p-3">{item.usage_limit ?? "-"}</td>
                  <td className="p-3 text-slate-600">{toDateInput(item.start_date) || "-"} - {toDateInput(item.end_date) || "-"}</td>
                  <td className="p-3"><Status value={item.status} /></td>
                  <td className="p-3">
                    <Actions
                      onEdit={() => {
                        setFieldErrors({});
                        setEditing(item);
                      }}
                      onDelete={() => setDeleting(item)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="coupons" onPageChange={(nextPage) => void handlePageChange(nextPage)} />
      </div>

      {creating || editing ? (
        <CouponForm
          initialValue={editing ? editingInitialValue : emptyCoupon}
          title={editing ? "Edit Coupon" : "Create Coupon"}
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
          onSave={save}
        />
      ) : null}

      {deleting ? <ConfirmDialog title="Delete Coupon" message={`Delete coupon "${deleting.code}"?`} onCancel={() => setDeleting(null)} onConfirm={remove} /> : null}
    </>
  );
}

function CouponForm({
  title,
  initialValue,
  saving,
  editing,
  fieldErrors,
  onSetFieldErrors,
  onClearFieldError,
  onClose,
  onSave
}: {
  title: string;
  initialValue: CouponFormValue;
  saving: boolean;
  editing: boolean;
  fieldErrors: CouponFieldErrors;
  onSetFieldErrors: (errors: CouponFieldErrors) => void;
  onClearFieldError: (field: CouponFieldName) => void;
  onClose: () => void;
  onSave: (payload: CouponFormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <Modal
      title={title}
      saving={saving}
      onClose={onClose}
      onSubmit={() => {
        const nextErrors = validateCouponForm(form, editing);
        onSetFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSave(form);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" message={fieldErrors.code} tone={fieldErrors.code ? "invalid" : "neutral"}>
          <input disabled={editing} value={form.code} onChange={(event) => {
            onClearFieldError("code");
            setForm({ ...form, code: event.target.value.toUpperCase() });
          }} className="input disabled:bg-slate-50 disabled:text-slate-500" />
        </Field>
        <Field label="Name" message={fieldErrors.name} tone={fieldErrors.name ? "invalid" : "neutral"}>
          <input value={form.name} onChange={(event) => {
            onClearFieldError("name");
            setForm({ ...form, name: event.target.value });
          }} className="input" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" message={fieldErrors.description} tone={fieldErrors.description ? "invalid" : "neutral"}>
            <textarea value={form.description} onChange={(event) => {
              onClearFieldError("description");
              setForm({ ...form, description: event.target.value });
            }} className="input min-h-24 py-3" />
          </Field>
        </div>
        <Field label="Discount Type" message={fieldErrors.discount_type} tone={fieldErrors.discount_type ? "invalid" : "neutral"}>
          <select value={form.discount_type} onChange={(event) => {
            onClearFieldError("discount_type");
            setForm({ ...form, discount_type: event.target.value as StaffCouponDiscountType });
          }} className="input">
            {discountTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Discount Value" message={fieldErrors.discount_value} tone={fieldErrors.discount_value ? "invalid" : "neutral"}>
          <input type="number" min="0" value={form.discount_value} onChange={(event) => {
            onClearFieldError("discount_value");
            setForm({ ...form, discount_value: event.target.value });
          }} className="input" />
        </Field>
        <Field label="Max Discount Amount" message={fieldErrors.max_discount_amount} tone={fieldErrors.max_discount_amount ? "invalid" : "neutral"}>
          <input type="number" min="0" value={form.max_discount_amount} onChange={(event) => {
            onClearFieldError("max_discount_amount");
            setForm({ ...form, max_discount_amount: event.target.value });
          }} className="input" />
        </Field>
        <Field label="Min Order Amount" message={fieldErrors.min_order_amount} tone={fieldErrors.min_order_amount ? "invalid" : "neutral"}>
          <input type="number" min="0" value={form.min_order_amount} onChange={(event) => {
            onClearFieldError("min_order_amount");
            setForm({ ...form, min_order_amount: event.target.value });
          }} className="input" />
        </Field>
        <Field label="Usage Limit" message={fieldErrors.usage_limit} tone={fieldErrors.usage_limit ? "invalid" : "neutral"}>
          <input type="number" min="0" value={form.usage_limit} onChange={(event) => {
            onClearFieldError("usage_limit");
            setForm({ ...form, usage_limit: event.target.value });
          }} className="input" />
        </Field>
        <Field label="Start Date" message={fieldErrors.start_date} tone={fieldErrors.start_date ? "invalid" : "neutral"}>
          <input type="date" value={form.start_date} onChange={(event) => {
            onClearFieldError("start_date");
            setForm({ ...form, start_date: event.target.value });
          }} className="input" />
        </Field>
        <Field label="End Date" message={fieldErrors.end_date} tone={fieldErrors.end_date ? "invalid" : "neutral"}>
          <input type="date" value={form.end_date} onChange={(event) => {
            onClearFieldError("end_date");
            setForm({ ...form, end_date: event.target.value });
          }} className="input" />
        </Field>
        <Field label="Status" message={fieldErrors.status} tone={fieldErrors.status ? "invalid" : "neutral"}>
          <select value={form.status} onChange={(event) => {
            onClearFieldError("status");
            setForm({ ...form, status: event.target.value as StaffCouponStatus });
          }} className="input">
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
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

function Modal({
  title,
  children,
  saving,
  onClose,
  onSubmit
}: {
  title: string;
  children: React.ReactNode;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form noValidate className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="mt-6">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </form>
    </div>
  );
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <span className="flex gap-2">
      <Button variant="outline" className="h-9 px-3" onClick={onEdit}><Pencil size={15} /> Edit</Button>
      <button type="button" onClick={onDelete} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label="Delete coupon"><Trash2 size={15} /></button>
    </span>
  );
}

function Status({ value }: { value: string }) {
  const style = value === "active" ? "bg-emerald-50 text-emerald-700" : value === "deleted" ? "bg-rose-50 text-rose-700" : value === "expired" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}

function validateCouponForm(form: CouponFormValue, editing: boolean): CouponFieldErrors {
  const errors: CouponFieldErrors = {};
  if (!editing && !form.code.trim()) errors.code = "Coupon code is required.";
  if (!form.name.trim()) errors.name = "Coupon name is required.";
  if (!form.discount_type) errors.discount_type = "Discount type is required.";
  if (!form.status) errors.status = "Status is required.";

  const discountValue = Number(form.discount_value);
  if (!form.discount_value) errors.discount_value = "Discount value is required.";
  else if (!Number.isFinite(discountValue) || discountValue <= 0) errors.discount_value = "Discount value must be greater than 0.";
  else if (form.discount_type === "percentage" && discountValue > 100) errors.discount_value = "Percentage discount cannot exceed 100.";

  for (const field of ["max_discount_amount", "min_order_amount", "usage_limit"] as const) {
    const value = form[field];
    if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      errors[field] = "Value must be 0 or greater.";
    }
  }

  if (!form.start_date) errors.start_date = "Start date is required.";
  if (!form.end_date) errors.end_date = "End date is required.";
  if (form.start_date && form.end_date && form.end_date < form.start_date) {
    errors.end_date = "End date must be after start date.";
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

function getBackendFieldErrors(err: unknown): CouponFieldErrors {
  const errors: CouponFieldErrors = {};

  for (const message of getBackendValidationMessages(err)) {
    const fieldPath = message.match(/"([^"]+)"/)?.[1] ?? "";
    const field = mapBackendFieldToCouponField(fieldPath, message);
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

function mapBackendFieldToCouponField(fieldPath: string, message: string): CouponFieldName | null {
  const normalized = fieldPath.toLowerCase();
  const lowerMessage = message.toLowerCase();

  if (normalized.includes("code") || lowerMessage.includes("duplicate coupon")) return "code";
  if (normalized.includes("name")) return "name";
  if (normalized.includes("description")) return "description";
  if (normalized.includes("discount_type")) return "discount_type";
  if (normalized.includes("discount_value")) return "discount_value";
  if (normalized.includes("max_discount")) return "max_discount_amount";
  if (normalized.includes("min_order")) return "min_order_amount";
  if (normalized.includes("usage")) return "usage_limit";
  if (normalized.includes("start")) return "start_date";
  if (normalized.includes("end")) return "end_date";
  if (normalized.includes("status")) return "status";
  return null;
}

function formatDiscount(coupon: StaffCoupon) {
  return coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : formatMoney(coupon.discount_value);
}

function formatMoney(value: StaffCoupon["discount_value"] | StaffCoupon["max_discount_amount"]) {
  if (value === undefined || value === null || value === "") return "-";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);
  return `${numberValue.toLocaleString()} VND`;
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}
