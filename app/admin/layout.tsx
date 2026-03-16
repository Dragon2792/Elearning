"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./admin.module.css";

const navItems = [
  { href: "/admin", icon: "📊", label: "Overview" },
  { href: "/admin/users", icon: "👥", label: "Kelola Users" },
  { href: "/admin/modules", icon: "📚", label: "Kelola Modul" },
  { href: "/admin/exams", icon: "📝", label: "Kelola Ujian" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: { full_name?: string };
  } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      // Cek apakah role = admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setUser(data.user);
      setChecking(false);
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (checking) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memverifikasi akses admin...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>⚡</span>
          <div>
            <span className={styles.sidebarBrand}>CodeLearn AI</span>
            <span className={styles.adminBadge}>ADMIN</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className={styles.userDetail}>
              <span className={styles.userName}>
                {user?.user_metadata?.full_name || "Admin"}
              </span>
              <span className={styles.userRole}>Administrator</span>
            </div>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/dashboard" className={styles.switchBtn}>
              🎓 Student View
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            {navItems.find((i) => i.href === pathname)?.label || "Admin"}
          </div>
          <div className={styles.adminTag}>⚙️ Admin Panel</div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
