"use client";

import { Button, Input, Label } from "@/components/ui";
import {
  createUser,
  fetchUsers,
  updateUser,
  type ApiUser,
} from "@/lib/api/series-api";
import { useEffect, useMemo, useState } from "react";

function addMonthsIso(months: number): string | null {
  if (months <= 0) return null;
  const now = new Date();
  const next = new Date(now);
  next.setMonth(next.getMonth() + months);
  return next.toISOString();
}

function isMemberByExpiredDate(expiredDate: string | null): boolean {
  if (!expiredDate) return false;
  const exp = new Date(expiredDate);
  if (Number.isNaN(exp.getTime())) return false;
  return exp.getTime() > Date.now();
}

function monthsUntil(expiredDate: string | null): string {
  if (!expiredDate) return "0";
  const exp = new Date(expiredDate);
  if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) return "0";
  const now = new Date();
  const months =
    (exp.getFullYear() - now.getFullYear()) * 12 +
    (exp.getMonth() - now.getMonth()) +
    (exp.getDate() >= now.getDate() ? 0 : -1);
  if (months >= 12) return "12";
  if (months >= 6) return "6";
  if (months >= 3) return "3";
  return "1";
}

type FormState = {
  name: string;
  email: string;
  password: string;
  profile: string;
  isAdmin: boolean;
  memberMonths: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  profile: "",
  isAdmin: false,
  memberMonths: "0",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<ApiUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    const nextSearch = search.trim();
    const timer = window.setTimeout(() => {
      if (nextSearch !== debouncedSearch) {
        setLoading(true);
        setDebouncedSearch(nextSearch);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    let mounted = true;
    fetchUsers(debouncedSearch || undefined)
      .then((rows) => {
        if (mounted) setUsers(rows);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [debouncedSearch]);

  const memberPreview = useMemo(() => {
    const months = Number(form.memberMonths) || 0;
    const iso = addMonthsIso(months);
    return iso ? new Date(iso).toLocaleDateString("th-TH") : "ไม่เป็นสมาชิก";
  }, [form.memberMonths]);

  async function reloadUsers() {
    setLoading(true);
    const rows = await fetchUsers(debouncedSearch || undefined).catch(() => []);
    setUsers(rows);
    setLoading(false);
  }

  function openCreateModal() {
    setMode("create");
    setActiveUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(user: ApiUser) {
    setMode("edit");
    setActiveUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      profile: "",
      isAdmin: user.isAdmin,
      memberMonths: monthsUntil(user.expiredDate),
    });
    setModalOpen(true);
  }

  async function submitForm() {
    if (!form.email.trim() || (mode === "create" && !form.password.trim())) {
      alert("กรุณากรอก email และ password");
      return;
    }
    if (mode === "edit" && !activeUser?.id) {
      alert("ไม่พบรหัสผู้ใช้สำหรับแก้ไข");
      return;
    }

    const months = Math.max(0, Number(form.memberMonths) || 0);
    const expiredDate = addMonthsIso(months);
    const isMember = isMemberByExpiredDate(expiredDate);

    setSubmitting(true);
    const ok =
      mode === "create"
        ? await createUser({
            name: form.name.trim() || form.email.trim().split("@")[0] || "ผู้ใช้",
            email: form.email.trim(),
            password: form.password.trim(),
            profile: form.profile.trim() || undefined,
            isAdmin: form.isAdmin,
            isActive: isMember,
            expiredDate,
          }).catch(() => false)
        : await updateUser(activeUser!.id, {
            name: form.name.trim() || form.email.trim().split("@")[0] || "ผู้ใช้",
            email: form.email.trim(),
            password: form.password.trim() || undefined,
            profile: form.profile.trim() || undefined,
            isAdmin: form.isAdmin,
            isActive: isMember,
            expiredDate,
          }).catch(() => false);
    setSubmitting(false);

    if (!ok) {
      alert(mode === "create" ? "สร้างผู้ใช้ไม่สำเร็จ" : "อัปเดตผู้ใช้ไม่สำเร็จ");
      return;
    }

    setModalOpen(false);
    setForm(emptyForm);
    setActiveUser(null);
    await reloadUsers();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">ผู้ใช้</h1>
          <p className="text-sm text-[var(--foreground-muted)]">รายการผู้ใช้จาก API</p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          + สร้างผู้ใช้ใหม่
        </Button>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="ค้นหาชื่อหรืออีเมล..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--muted)] text-xs font-bold uppercase tracking-wide text-[var(--foreground-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">แพ็กเกจ</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-3 text-[var(--foreground-muted)]" colSpan={4}>
                  กำลังโหลด...
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => {
                const isMember = isMemberByExpiredDate(u.expiredDate);
                return (
                  <tr
                    key={u.id || u.email}
                    className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50"
                    onClick={() => openEditModal(u)}
                  >
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{u.email}</td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">
                      {u.expiredDate ? `ถึง ${new Date(u.expiredDate).toLocaleDateString("th-TH")}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 text-xs font-medium">
                        {u.isAdmin ? "แอดมิน" : isMember ? "สมาชิก" : "ยังไม่เป็นสมาชิก"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            {!loading && users.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-[var(--foreground-muted)]" colSpan={4}>
                  ไม่พบข้อมูลผู้ใช้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => setModalOpen(false)}>
          <div
            className="mx-auto mt-10 w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {mode === "create" ? "สร้างผู้ใช้ใหม่" : "แก้ไขผู้ใช้"}
            </h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {mode === "create"
                ? "กำหนดสมาชิกแบบรายเดือน ระบบจะคำนวณวันหมดอายุให้อัตโนมัติ"
                : "ปรับข้อมูลผู้ใช้ แล้วกดบันทึก"}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="nu-name">ชื่อ</Label>
                <Input
                  id="nu-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="nu-email">Email</Label>
                <Input
                  id="nu-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="nu-password">
                  Password {mode === "edit" ? "(ถ้าไม่เปลี่ยนปล่อยว่างได้)" : ""}
                </Label>
                <Input
                  id="nu-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="nu-profile">Profile (optional)</Label>
                <Input
                  id="nu-profile"
                  value={form.profile}
                  onChange={(e) => setForm((f) => ({ ...f, profile: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="nu-months">สมาชิกกี่เดือน</Label>
                <select
                  id="nu-months"
                  value={form.memberMonths}
                  onChange={(e) => setForm((f) => ({ ...f, memberMonths: e.target.value }))}
                  className="min-h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-3.5 text-sm text-[var(--foreground)] outline-none"
                >
                  <option value="0">0 เดือน (ยังไม่เป็นสมาชิก)</option>
                  <option value="1">1 เดือน</option>
                  <option value="3">3 เดือน</option>
                  <option value="6">6 เดือน</option>
                  <option value="12">12 เดือน</option>
                </select>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  วันหมดอายุที่จะส่ง: {memberPreview}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.isAdmin}
                  onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                />
                ให้สิทธิ์แอดมิน
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <Button type="button" onClick={submitForm} disabled={submitting}>
                {submitting
                  ? mode === "create"
                    ? "กำลังสร้าง..."
                    : "กำลังบันทึก..."
                  : mode === "create"
                    ? "สร้างผู้ใช้"
                    : "บันทึกการแก้ไข"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
