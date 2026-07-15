"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Plus, RefreshCw, Search, Trash2, Upload, UserRound, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { getAvatarImageSrc } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import {
  adminUserService,
  getAdminUserId,
  type AdminUser,
  type AdminUserCreatePayload,
  type AdminUserPayload,
  type AdminUserRole,
  type AdminUserUpdatePayload
} from "@/services/admin-user.service";

type UserFormValue = Omit<AdminUserPayload, "password"> & {
  password: string;
  avatarPreview: string;
};

type ValidationTone = "neutral" | "valid" | "invalid";
type FieldName = "name" | "email" | "password" | "phone" | "avatar";

const emptyUser: UserFormValue = {
  name: "",
  email: "",
  password: "",
  role: "customer",
  status: "active",
  phone: "",
  avatar_file: null,
  avatarPreview: ""
};

const roles: AdminUserRole[] = ["customer", "staff", "admin"];
const statuses = ["active", "inactive", "blocked"];

function formatLabel(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
}

function getStatusClass(status: string) {
  if (status === "active") return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700";
  if (status === "blocked" || status === "deleted") return "rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700";
  return "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600";
}

function validateName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Name is required.";
  const pattern = /^[\p{L}\p{M}\p{N}]+(?:\s+[\p{L}\p{M}\p{N}]+)+$/u;
  if (!pattern.test(trimmed)) {
    return "Name must contain at least 2 words and only use letters, numbers, spaces, and Vietnamese characters. Special characters are not allowed.";
  }
  return "";
}

function validateEmail(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(trimmed)) return "Email format is invalid.";
  return "";
}

function validatePassword(value: string) {
  if (!value) return "";
  if (value.length < 6) return "Password must be at least 6 characters long.";
  return "";
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function validatePhone(value: string, existingUsers: AdminUser[] = [], currentUserId = 0) {
  const trimmed = value.trim();
  if (!trimmed) return "Phone number is required.";
  if (!/^\d{10}$/.test(trimmed)) return "Phone number must contain exactly 10 digits.";
  const duplicated = existingUsers.some((user) => {
    const userId = getAdminUserId(user);
    return userId !== currentUserId && normalizePhone(user.phone ?? "") === trimmed;
  });
  if (duplicated) return "Phone number already exists.";
  return "";
}

function validateAvatar(file: File | null | undefined) {
  if (!file) return { tone: "neutral" as ValidationTone, message: "Avatar is optional." };
  if (!file.type.startsWith("image/")) return { tone: "invalid" as ValidationTone, message: "Please select a valid image file." };
  return { tone: "valid" as ValidationTone, message: "Avatar is valid." };
}

function hasUpdateChanges(payload: AdminUserUpdatePayload) {
  return Object.keys(payload).length > 0;
}

function getBackendErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;
  const bodyDetails = data?.details?.body;

  if (Array.isArray(bodyDetails) && bodyDetails.length > 0) {
    return bodyDetails.join("\n");
  }

  if (typeof bodyDetails === "string") {
    return bodyDetails;
  }

  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details.join("\n");
  }

  if (typeof data?.details === "string") {
    return data.details;
  }

  return data?.message || data?.error || err?.message || fallback;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const showToast = useToast();
  const pageSize = 10;

  async function loadUsers(nextPage = page, search = query, role = roleFilter, status = statusFilter) {
    setLoading(true);
    setError("");
    try {
      const result = await adminUserService.list({
        page: nextPage,
        limit: pageSize,
        search,
        role: role || undefined,
        status: status || undefined,
        sortBy: "created_at",
        sortOrder: "DESC"
      });
      setUsers(result.data ?? []);
      setTotalItems(result.pagination?.total ?? result.data?.length ?? 0);
      setPageCount(result.pagination?.totalPages ?? Math.max(1, Math.ceil((result.pagination?.total ?? result.data?.length ?? 0) / pageSize)));
    } catch (err) {
      setError("Cannot load users from API.");
      showToast({ variant: "error", title: "Load failed", description: "Cannot load users from API." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers(1, "", "", "");
  }, []);

  const editingInitialValue = useMemo<UserFormValue>(() => {
    if (!editingUser) return emptyUser;
    return {
      name: editingUser.name ?? "",
      email: editingUser.email ?? "",
      password: "",
      role: (editingUser.role as AdminUserRole) || "customer",
      status: editingUser.status || "active",
      phone: editingUser.phone ?? "",
      avatar_file: null,
      avatarPreview: getAvatarImageSrc(editingUser.avatar_url)
    };
  }, [editingUser]);

  async function handleSearch() {
    const value = searchInput.trim();
    setQuery(value);
    setPage(1);
    await loadUsers(1, value, roleFilter, statusFilter);
  }

  async function handleRoleFilter(value: string) {
    setRoleFilter(value);
    setPage(1);
    await loadUsers(1, query, value, statusFilter);
  }

  async function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
    await loadUsers(1, query, roleFilter, value);
  }

  async function handlePageChange(nextPage: number) {
    setPage(nextPage);
    await loadUsers(nextPage, query, roleFilter, statusFilter);
  }

  async function saveUser(payload: UserFormValue) {
    setSaving(true);
    setError("");
    try {
      if (editingUser) {
        const updatePayload: AdminUserUpdatePayload = {};

        if (payload.name !== (editingUser.name ?? "")) updatePayload.name = payload.name;
        if (payload.role !== editingUser.role) updatePayload.role = payload.role;
        if (payload.status !== (editingUser.status ?? "active")) updatePayload.status = payload.status;
        if ((payload.phone ?? "") !== (editingUser.phone ?? "")) updatePayload.phone = payload.phone ?? "";
        if (payload.password) updatePayload.password = payload.password;
        if (payload.avatar_file) updatePayload.avatar_file = payload.avatar_file;

        if (!hasUpdateChanges(updatePayload)) {
          showToast({ variant: "info", title: "No changes", description: "No user fields were changed." });
          setEditingUser(null);
          setCreating(false);
          return;
        }

        await adminUserService.update(getAdminUserId(editingUser), updatePayload);
        showToast({ variant: "success", title: "User updated", description: payload.email });
      } else {
        const requestPayload: AdminUserPayload = {
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          status: payload.status,
          phone: payload.phone,
          avatar_file: payload.avatar_file
        };
        const createPayload: AdminUserCreatePayload = {
          ...requestPayload,
          password: payload.password
        };
        await adminUserService.create(createPayload);
        showToast({ variant: "success", title: "User created", description: payload.email });
      }

      setEditingUser(null);
      setCreating(false);
      await loadUsers(page, query, roleFilter, statusFilter);
    } catch (err) {
      setError("Cannot save user. Please check required fields, duplicate email, or permission.");
      showToast({ variant: "error", title: "Save failed", description: "Please check required fields, duplicate email, or permission." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!deletingUser) return;
    if (deletingUser.role === "admin") {
      const message = "Admin users cannot be deleted.";
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
      setDeletingUser(null);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await adminUserService.remove(getAdminUserId(deletingUser));
      showToast({ variant: "success", title: "User deleted", description: deletingUser.email });
      setDeletingUser(null);
      await loadUsers(page, query, roleFilter, statusFilter);
    } catch (err) {
      const message = getBackendErrorMessage(
        err,
        "Cannot delete this user because they already have related service data."
      );
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
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="mt-1 text-sm text-slate-500">Create users, update profiles, roles and account status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void loadUsers(page, query, roleFilter, statusFilter)} disabled={loading}><RefreshCw size={17} /> Refresh</Button>
            <Button onClick={() => setCreating(true)}><Plus size={17} /> Create User</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_120px_180px_180px]">
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
              placeholder="Search users..."
            />
          </div>
          <Button type="button" onClick={() => void handleSearch()} disabled={loading} className="h-11 justify-center"><Search size={17} /> Search</Button>
          <select value={roleFilter} onChange={(event) => void handleRoleFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All roles</option>
            {roles.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => void handleStatusFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["ID", "User", "Email", "Phone", "Role", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <AdminTableSkeleton columns={7} rows={10} />
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">No users found.</td></tr>
              ) : users.map((user) => {
                const avatarSrc = getAvatarImageSrc(user.avatar_url);
                const isAdmin = user.role === "admin";

                return (
                  <tr key={getAdminUserId(user)} className="border-t border-slate-100">
                    <td className="p-3 font-bold">#{getAdminUserId(user)}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-2 font-semibold">
                        {avatarSrc ? <img src={avatarSrc} alt="" className="size-9 rounded-full object-cover" /> : <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-600"><UserRound size={16} /></span>}
                        {user.name}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{user.email}</td>
                    <td className="p-3 text-slate-600">{user.phone || "-"}</td>
                    <td className="p-3">{formatLabel(user.role)}</td>
                    <td className="p-3"><span className={getStatusClass(user.status)}>{formatLabel(user.status)}</span></td>
                    <td className="p-3">
                      <span className="flex gap-2">
                        <Button variant="outline" className="h-9 px-3" onClick={() => setEditingUser(user)}><Pencil size={15} /> Edit</Button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAdmin) setDeletingUser(user);
                          }}
                          disabled={isAdmin}
                          className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                          aria-label={isAdmin ? "Admin users cannot be deleted" : `Delete ${user.name}`}
                          title={isAdmin ? "Admin users cannot be deleted" : `Delete ${user.name}`}
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

        <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="users" onPageChange={(nextPage) => void handlePageChange(nextPage)} />
      </div>

      {creating || editingUser ? (
        <UserForm
          key={editingUser ? getAdminUserId(editingUser) : "create"}
          initialValue={editingUser ? editingInitialValue : emptyUser}
          title={editingUser ? "Edit User" : "Create User"}
          saving={saving}
          editing={Boolean(editingUser)}
          existingUsers={users}
          currentUserId={editingUser ? getAdminUserId(editingUser) : 0}
          onClose={() => {
            setEditingUser(null);
            setCreating(false);
          }}
          onSave={saveUser}
        />
      ) : null}

      {deletingUser ? (
        <ConfirmDialog title="Delete User" message={`Are you sure you want to delete "${deletingUser.name}"?`} onCancel={() => setDeletingUser(null)} onConfirm={deleteUser} />
      ) : null}
    </>
  );
}

function UserForm({
  title,
  initialValue,
  saving,
  editing,
  existingUsers,
  currentUserId,
  onClose,
  onSave
}: {
  title: string;
  initialValue: UserFormValue;
  saving: boolean;
  editing: boolean;
  existingUsers: AdminUser[];
  currentUserId: number;
  onClose: () => void;
  onSave: (payload: UserFormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    name: false,
    email: false,
    password: false,
    phone: false,
    avatar: false
  });
  const [submitted, setSubmitted] = useState(false);

  const nameError = validateName(form.name);
  const emailError = validateEmail(form.email);
  const passwordError = validatePassword(form.password);
  const phoneError = validatePhone(form.phone ?? "", existingUsers, currentUserId);
  const avatarState = validateAvatar(form.avatar_file);
  const show = (field: FieldName) => editing ? touched[field] : touched[field] || submitted;
  const showPassword = show("password") && form.password.length > 0;
  const fieldChanged = (field: FieldName) => {
    if (field === "name") return form.name !== initialValue.name;
    if (field === "email") return form.email !== initialValue.email;
    if (field === "password") return Boolean(form.password);
    if (field === "phone") return (form.phone ?? "") !== (initialValue.phone ?? "");
    return Boolean(form.avatar_file);
  };
  const shouldValidate = (field: FieldName) => !editing || fieldChanged(field);
  const nameBlockingError = shouldValidate("name") ? nameError : "";
  const emailBlockingError = shouldValidate("email") ? emailError : "";
  const phoneBlockingError = shouldValidate("phone") ? phoneError : "";
  const avatarBlockingError = shouldValidate("avatar") && avatarState.tone === "invalid";
  const hasBlockingError = Boolean(nameBlockingError || emailBlockingError || passwordError || phoneBlockingError || avatarBlockingError);

  useEffect(() => {
    return () => {
      if (form.avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(form.avatarPreview);
      }
    };
  }, [form.avatarPreview]);

  function inputTone(error: string, field: FieldName): ValidationTone {
    if (!show(field)) return "neutral";
    if (editing && !fieldChanged(field)) return "neutral";
    if (error) return "invalid";
    if (field === "password" && !form.password) return "neutral";
    return "valid";
  }

  function messageFor(field: FieldName) {
    if (field === "name") return nameError || "Name is valid.";
    if (field === "email") return emailError || "Email is valid.";
    if (field === "password") return passwordError || "Password is valid.";
    if (field === "phone") return phoneError || "Phone number is valid.";
    return avatarState.message;
  }

  function toneFor(field: FieldName) {
    if (field === "avatar") return editing && !fieldChanged("avatar") ? "neutral" : avatarState.tone;
    const error = field === "name" ? nameBlockingError : field === "email" ? emailBlockingError : field === "password" ? passwordError : phoneBlockingError;
    return inputTone(error, field);
  }

  function markTouched(field: FieldName) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          setTouched(editing ? {
            name: fieldChanged("name"),
            email: fieldChanged("email"),
            password: fieldChanged("password"),
            phone: fieldChanged("phone"),
            avatar: fieldChanged("avatar")
          } : {
            name: true,
            email: true,
            password: true,
            phone: true,
            avatar: true
          });
          if (hasBlockingError) return;
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <Field label="Full Name" tone={toneFor("name")} message={show("name") ? messageFor("name") : ""}>
            <input
              value={form.name}
              onBlur={() => markTouched("name")}
              onChange={(event) => {
                setForm({ ...form, name: event.target.value });
                if (submitted) markTouched("name");
              }}
              className={cn("input", toneFor("name") === "valid" && "border-emerald-300 focus:border-emerald-500", toneFor("name") === "invalid" && "border-rose-300 focus:border-rose-500")}
              placeholder="Nguyen Van A"
            />
          </Field>
          <Field label="Email" tone={toneFor("email")} message={show("email") ? messageFor("email") : ""}>
            <input
              type="email"
              value={form.email}
              disabled={editing}
              onBlur={() => markTouched("email")}
              onChange={(event) => {
                setForm({ ...form, email: event.target.value });
                if (submitted) markTouched("email");
              }}
              className={cn(
                "input",
                editing && "cursor-not-allowed bg-slate-50 text-slate-500",
                toneFor("email") === "valid" && "border-emerald-300 focus:border-emerald-500",
                toneFor("email") === "invalid" && "border-rose-300 focus:border-rose-500"
              )}
              placeholder="user@example.com"
            />
          </Field>
          <Field label={editing ? "Password (optional)" : "Password"} tone={toneFor("password")} message={showPassword ? messageFor("password") : ""}>
            <input
              type="password"
              value={form.password}
              onBlur={() => markTouched("password")}
              onChange={(event) => {
                setForm({ ...form, password: event.target.value });
                if (submitted) markTouched("password");
              }}
              className={cn("input", toneFor("password") === "valid" && "border-emerald-300 focus:border-emerald-500", toneFor("password") === "invalid" && "border-rose-300 focus:border-rose-500")}
              placeholder={editing ? "Leave blank to keep current password" : "Temporary password"}
            />
          </Field>
          <Field label="Phone" tone={toneFor("phone")} message={show("phone") ? messageFor("phone") : ""}>
            <input
              value={form.phone}
              onBlur={() => markTouched("phone")}
              onChange={(event) => {
                setForm({ ...form, phone: event.target.value });
                if (submitted) markTouched("phone");
              }}
              className={cn("input", toneFor("phone") === "valid" && "border-emerald-300 focus:border-emerald-500", toneFor("phone") === "invalid" && "border-rose-300 focus:border-rose-500")}
              placeholder="0901234567"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminUserRole })} className="input">
                {roles.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="input">
                {statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
              </select>
            </Field>
          </div>
          <label className="block text-sm font-semibold">
            Avatar
            <span className={cn("mt-2 grid gap-4 rounded-lg border border-dashed border-slate-300 p-4 sm:grid-cols-[96px_1fr] sm:items-center", avatarState.tone === "valid" && "border-emerald-300", avatarState.tone === "invalid" && "border-rose-300")}>
              <span className="grid size-24 place-items-center overflow-hidden rounded-full bg-slate-50 text-slate-400">
                {form.avatarPreview ? <img src={form.avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : <ImagePlus size={26} />}
              </span>
              <span>
                <span className="block text-sm font-normal text-slate-500">Upload avatar_file for this account.</span>
                <span className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
                  <Upload size={16} /> Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onBlur={() => markTouched("avatar")}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file) {
                        setForm({ ...form, avatar_file: file, avatarPreview: URL.createObjectURL(file) });
                      } else {
                        setForm({ ...form, avatar_file: null, avatarPreview: "" });
                      }
                      if (submitted) markTouched("avatar");
                    }}
                  />
                </span>
                {form.avatarPreview ? <button type="button" onClick={() => setForm({ ...form, avatar_file: null, avatarPreview: "" })} className="ml-3 text-sm font-bold text-rose-600">Remove</button> : null}
                <span className={cn("mt-2 block text-xs font-medium", avatarState.tone === "valid" && "text-emerald-600", avatarState.tone === "invalid" && "text-rose-600", avatarState.tone === "neutral" && "text-slate-500")}>
                  {avatarState.message}
                </span>
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save User"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  message,
  tone
}: {
  label: string;
  children: React.ReactNode;
  message?: string;
  tone?: ValidationTone;
}) {
  return (
    <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none [&_.input]:focus:border-brand-600">
      {label}
      {children}
      {message ? <span className={cn("mt-2 block text-xs font-medium", tone === "valid" && "text-emerald-600", tone === "invalid" && "text-rose-600", tone === "neutral" && "text-slate-500")}>{message}</span> : null}
    </label>
  );
}
