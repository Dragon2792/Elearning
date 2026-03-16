"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./users.module.css";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const refetch = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUsers(data);
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    setUpdating(userId);
    const newRole = currentRole === "admin" ? "student" : "admin";
    const supabase = createClient();
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    await refetch();
    setUpdating(null);
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Kelola Users</h1>
        <p className={styles.pageSubtitle}>Manage semua pengguna platform</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.totalBadge}>Total: {filtered.length} user</div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Bergabung</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={styles.loadingRow}>
                  Memuat data...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.loadingRow}>
                  Tidak ada user ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {user.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      {user.full_name || "-"}
                    </div>
                  </td>
                  <td className={styles.emailCell}>{user.email}</td>
                  <td>
                    <span
                      className={`${styles.roleBadge} ${user.role === "admin" ? styles.adminRole : styles.studentRole}`}
                    >
                      {user.role === "admin" ? "⚙️ Admin" : "🎓 Student"}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(user.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      disabled={updating === user.id}
                      className={`${styles.roleBtn} ${user.role === "admin" ? styles.demoteBtn : styles.promoteBtn}`}
                    >
                      {updating === user.id
                        ? "⏳"
                        : user.role === "admin"
                          ? "⬇️ Jadikan Student"
                          : "⬆️ Jadikan Admin"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
