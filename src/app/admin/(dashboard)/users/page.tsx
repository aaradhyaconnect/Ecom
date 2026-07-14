"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Search, Plus, Shield, Key, Trash2, Edit, Users } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { StaffUser, Permissions, PermissionModule, PermissionAction, StaffRole } from "@/types";
import { DEFAULT_PERMISSIONS } from "@/types";

const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
};

const ROLE_BADGE_VARIANT: Record<StaffRole, "best" | "success" | "default"> = {
  super_admin: "best",
  admin: "success",
  staff: "default",
};

const MODULES: PermissionModule[] = [
  "products",
  "orders",
  "customers",
  "inventory",
  "marketing",
  "reports",
  "settings",
  "users",
  "categories",
];

const ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete"];

const MODULE_LABELS: Record<PermissionModule, string> = {
  products: "Products",
  orders: "Orders",
  customers: "Customers",
  inventory: "Inventory",
  marketing: "Marketing",
  reports: "Reports",
  settings: "Settings",
  users: "Users",
  categories: "Categories",
};

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

interface StaffUserWithEmail extends StaffUser {
  email?: string;
}

interface AddUserForm {
  email: string;
  password: string;
  display_name: string;
  username: string;
  role: StaffRole;
  permissions: Permissions;
}

interface EditUserForm {
  display_name: string;
  role: StaffRole;
  permissions: Permissions;
  is_active: boolean;
}

const defaultAddForm: AddUserForm = {
  email: "",
  password: "",
  display_name: "",
  username: "",
  role: "staff",
  permissions: { ...DEFAULT_PERMISSIONS },
};

const defaultEditForm: EditUserForm = {
  display_name: "",
  role: "staff",
  permissions: { ...DEFAULT_PERMISSIONS },
  is_active: true,
};

function PermissionsGrid({ permissions, onToggle }: { permissions: Permissions; onToggle: (mod: PermissionModule, action: PermissionAction) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ivory-dark/60">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-900">Module</th>
            {ACTIONS.map((a) => (
              <th key={a} className="text-center py-2 px-3 text-xs font-semibold text-gray-900">{ACTION_LABELS[a]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((mod) => (
            <tr key={mod} className="border-b border-ivory-dark/30 last:border-0">
              <td className="py-2.5 pr-4 text-sm font-medium text-charcoal">{MODULE_LABELS[mod]}</td>
              {ACTIONS.map((action) => (
                <td key={action} className="text-center py-2.5 px-3">
                  <input
                    type="checkbox"
                    checked={permissions[mod][action]}
                    onChange={() => onToggle(mod, action)}
                    className="h-4 w-4 rounded border-ivory-dark text-gold focus:ring-gold/30 cursor-pointer"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<StaffUserWithEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddUserForm>({ ...defaultAddForm });
  const [adding, setAdding] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState<StaffUserWithEmail | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({ ...defaultEditForm });
  const [editing, setEditing] = useState(false);

  const [resetModal, setResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setTotal(data.total);
        if (data.current_user_id) setCurrentUserId(data.current_user_id);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const openAdd = () => {
    setAddForm({ ...defaultAddForm });
    setAddModal(true);
  };

  const handleAdd = async () => {
    if (!addForm.email || !addForm.password || !addForm.display_name || !addForm.username) {
      toast.error("Email, password, display name, and username are required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User created");
        setAddModal(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch {
      toast.error("Failed to create user");
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (user: StaffUserWithEmail) => {
    setEditUser(user);
    setEditForm({
      display_name: user.display_name,
      role: user.role,
      permissions: { ...DEFAULT_PERMISSIONS, ...user.permissions },
      is_active: user.is_active,
    });
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User updated");
        setEditModal(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update user");
      }
    } catch {
      toast.error("Failed to update user");
    } finally {
      setEditing(false);
    }
  };

  const openResetPassword = (userId: string) => {
    setResetUserId(userId);
    setResetPassword("");
    setResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!resetUserId || !resetPassword) {
      toast.error("Password is required");
      return;
    }
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUserId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password reset");
        setResetModal(false);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async (user: StaffUserWithEmail) => {
    if (currentUserId && user.user_id === currentUserId) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm(`Delete ${user.display_name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("User deleted");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const togglePermission = (mod: PermissionModule, action: PermissionAction, form: "add" | "edit") => {
    if (form === "add") {
      setAddForm((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [mod]: {
            ...prev.permissions[mod],
            [action]: !prev.permissions[mod][action],
          },
        },
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [mod]: {
            ...prev.permissions[mod],
            [action]: !prev.permissions[mod][action],
          },
        },
      }));
    }
  };

  const getInitials = (name: string): string => {
    if (!name || !name.trim()) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark font-medium mb-1">Staff Management</p>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Users</h1>
          <p className="text-[13px] text-charcoal-muted mt-0.5">Manage staff users, roles, and permissions</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-ivory-dark/60 rounded-sm text-sm text-charcoal bg-white focus:border-gold focus:ring-0 transition-all duration-300"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <div className="bg-white border border-ivory-dark/60 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 bg-ivory-dark/20 text-left text-[11px] uppercase tracking-wider font-medium text-charcoal-muted">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Login</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-charcoal-muted">
                    <Users className="mx-auto mb-2 h-8 w-8" />
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-ivory-dark/40 last:border-0 hover:bg-ivory-dark/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-ivory-dark/60 border border-ivory-dark flex items-center justify-center text-sm font-medium text-charcoal">
                          {getInitials(user.display_name)}
                        </div>
                        <span className="font-medium text-charcoal">{user.display_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-charcoal-muted">@{user.username}</td>
                    <td className="px-5 py-3 text-charcoal-muted">{user.email || "-"}</td>
                    <td className="px-5 py-3">
                      <Badge variant={ROLE_BADGE_VARIANT[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium",
                        user.is_active ? "text-green-600" : "text-gray-400"
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", user.is_active ? "bg-green-500" : "bg-gray-400")} />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-charcoal-muted">
                      {user.last_login ? formatDate(user.last_login) : "Never"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-charcoal-muted hover:text-charcoal transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openResetPassword(user.id)}
                          className="p-1.5 rounded-lg hover:bg-ivory-dark/40 text-charcoal-muted hover:text-charcoal transition-colors"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className={cn(
                            "p-1.5 rounded-lg hover:bg-ivory-dark/40 transition-colors",
                            currentUserId && user.user_id === currentUserId
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-rose-500 hover:text-rose-600"
                          )}
                          title={currentUserId && user.user_id === currentUserId ? "Cannot delete yourself" : "Delete"}
                          disabled={!!(currentUserId && user.user_id === currentUserId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-charcoal-muted">Page {page} of {totalPages} ({total} users)</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Staff User" size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              placeholder="user@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display Name"
              value={addForm.display_name}
              onChange={(e) => setAddForm({ ...addForm, display_name: e.target.value })}
              placeholder="John Doe"
            />
            <Input
              label="Username"
              value={addForm.username}
              onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
              placeholder="johndoe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Role</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value as StaffRole })}
              className="w-full px-4 py-2.5 border border-ivory-dark/60 rounded-sm text-sm text-gray-900 bg-white focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] transition-all duration-300"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-gold-dark" />
              <label className="text-sm font-medium text-gray-900">Permissions</label>
            </div>
            <div className="border border-ivory-dark/60 rounded-lg p-4 bg-ivory-dark/20">
              <PermissionsGrid permissions={addForm.permissions} onToggle={(mod, action) => togglePermission(mod, action, "add")} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleAdd} isLoading={adding}>Create User</Button>
            <Button variant="outline" onClick={() => setAddModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Staff User" size="xl">
        {editUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-ivory-dark/60 border border-ivory-dark flex items-center justify-center text-lg font-bold text-charcoal">
                {getInitials(editUser.display_name)}
              </div>
              <div>
                <p className="font-medium text-charcoal">{editUser.display_name}</p>
                <p className="text-xs text-charcoal-muted">{editUser.email || `@${editUser.username}`}</p>
              </div>
            </div>
            <Input
              label="Display Name"
              value={editForm.display_name}
              onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as StaffRole })}
                  className="w-full px-4 py-2.5 border border-ivory-dark/60 rounded-sm text-sm text-gray-900 bg-white focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] transition-all duration-300"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Status</label>
                <select
                  value={editForm.is_active ? "active" : "inactive"}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "active" })}
                  className="w-full px-4 py-2.5 border border-ivory-dark/60 rounded-sm text-sm text-gray-900 bg-white focus:border-gold focus:ring-0 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)] transition-all duration-300"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-gold-dark" />
                <label className="text-sm font-medium text-gray-900">Permissions</label>
              </div>
              <div className="border border-ivory-dark/60 rounded-lg p-4 bg-ivory-dark/20">
                <PermissionsGrid permissions={editForm.permissions} onToggle={(mod, action) => togglePermission(mod, action, "edit")} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleEdit} isLoading={editing}>Save Changes</Button>
              <Button variant="outline" onClick={() => setEditModal(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={resetModal} onClose={() => setResetModal(false)} title="Reset Password" size="sm">
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            placeholder="Minimum 8 characters"
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleResetPassword} isLoading={resetting}>Reset Password</Button>
            <Button variant="outline" onClick={() => setResetModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
