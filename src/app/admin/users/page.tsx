"use client";

import { useState } from "react";
import { Pencil, Plus, Search, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type UserRole = "Admin" | "User" | "Editor";
type UserStatus = "Active" | "Inactive";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

const initialUsers: ManagedUser[] = [
  { id: 1001, name: "Sophie Martin", email: "sophie@example.com", role: "User", status: "Active" },
  { id: 1002, name: "David Lee", email: "david@example.com", role: "Editor", status: "Active" },
  { id: 1003, name: "Emma Johnson", email: "emma@example.com", role: "User", status: "Inactive" },
  { id: 1004, name: "Michael Brown", email: "michael@example.com", role: "Admin", status: "Active" }
];

const emptyUser: Omit<ManagedUser, "id"> = {
  name: "",
  email: "",
  role: "User",
  status: "Active"
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [creating, setCreating] = useState(false);

  const visibleUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase())
  );

  function saveUser(payload: Omit<ManagedUser, "id">) {
    if (editingUser) {
      setUsers((current) => current.map((user) => user.id === editingUser.id ? { ...payload, id: editingUser.id } : user));
    } else {
      setUsers((current) => [...current, { ...payload, id: Math.max(...current.map((user) => user.id), 1000) + 1 }]);
    }

    setEditingUser(null);
    setCreating(false);
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="mt-1 text-sm text-slate-500">Create users, update profiles, roles and account status.</p>
          </div>
          <Button onClick={() => setCreating(true)}><Plus size={17} /> Create User</Button>
        </div>

        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-3 size-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
            placeholder="Search users..."
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["ID", "User", "Email", "Role", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="p-3 font-bold">#{user.id}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-600"><UserRound size={16} /></span>
                      {user.name}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{user.email}</td>
                  <td className="p-3">{user.role}</td>
                  <td className="p-3">
                    <span className={user.status === "Active" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <Button variant="outline" className="h-9 px-3" onClick={() => setEditingUser(user)}>
                      <Pencil size={15} /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating || editingUser ? (
        <UserForm
          initialValue={editingUser ?? emptyUser}
          title={editingUser ? "Edit User" : "Create User"}
          onClose={() => {
            setEditingUser(null);
            setCreating(false);
          }}
          onSave={saveUser}
        />
      ) : null}
    </>
  );
}

function UserForm({
  title,
  initialValue,
  onClose,
  onSave
}: {
  title: string;
  initialValue: Omit<ManagedUser, "id">;
  onClose: () => void;
  onSave: (payload: Omit<ManagedUser, "id">) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
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

        <div className="mt-6 grid gap-4">
          <label className="text-sm font-semibold">Full Name
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-600" placeholder="Enter full name" />
          </label>
          <label className="text-sm font-semibold">Email
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-600" placeholder="Enter email address" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3">
                <option>User</option><option>Editor</option><option>Admin</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Status
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as UserStatus })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3">
                <option>Active</option><option>Inactive</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save User</Button>
        </div>
      </form>
    </div>
  );
}
