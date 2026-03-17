"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./overview.module.css";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  newUsersToday: number;
  totalModules: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAdmins: 0,
    newUsersToday: 0,
    totalModules: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { count: moduleCount } = await supabase
        .from("modules")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      if (profiles) {
        const today = new Date().toISOString().split("T")[0];
        setStats({
          totalUsers: profiles.filter((p) => p.role === "student").length,
          totalAdmins: profiles.filter((p) => p.role === "admin").length,
          newUsersToday: profiles.filter((p) => p.created_at?.startsWith(today))
            .length,
          totalModules: moduleCount || 0,
        });
        setRecentUsers(profiles.slice(0, 5));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    {
      icon: "👥",
      label: "Total Mahasiswa",
      value: stats.totalUsers,
      color: "#6366f1",
    },
    {
      icon: "⚙️",
      label: "Total Admin",
      value: stats.totalAdmins,
      color: "#8b5cf6",
    },
    {
      icon: "🆕",
      label: "User Baru Hari Ini",
      value: stats.newUsersToday,
      color: "#ec4899",
    },
    {
      icon: "📚",
      label: "Modul Dipublikasikan",
      value: stats.totalModules,
      color: "#f59e0b",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Overview Dashboard</h1>
        <p className={styles.pageSubtitle}>
          Pantau aktivitas platform CodeLearn AI
        </p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <div key={card.label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: card.color }}>
              {card.icon}
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {loading ? "..." : card.value}
              </div>
              <div className={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>User Terbaru</h2>
        </div>
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className={styles.loadingRow}>
                    Memuat data...
                  </td>
                </tr>
              ) : recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.loadingRow}>
                    Belum ada user
                  </td>
                </tr>
              ) : (
                recentUsers.map((user) => (
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
                        className={
                          user.role === "admin"
                            ? styles.adminRole
                            : styles.studentRole
                        }
                      >
                        {user.role === "admin" ? "⚙️ Admin" : "🎓 Student"}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(user.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
