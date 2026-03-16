"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./dash.module.css";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Beranda" },
  { href: "/dashboard/modules", icon: "📚", label: "Modul Materi" },
  { href: "/dashboard/chat", icon: "🤖", label: "AI Tutor" },
  { href: "/dashboard/exam", icon: "📝", label: "Ujian" },
  { href: "/dashboard/progress", icon: "📊", label: "Progress" },
  { href: "/dashboard/code", icon: "💻", label: "Code Runner" },
];

export default function DashboardLayout({
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUser(data.user);
    });
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className={styles.layout}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>⚡</span>
          <span className={styles.sidebarBrand}>CodeLearn AI</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className={styles.userDetail}>
              <span className={styles.userName}>
                {user?.user_metadata?.full_name || "Mahasiswa"}
              </span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <div className={styles.topbarTitle}>
            {navItems.find((i) => i.href === pathname)?.label || "Dashboard"}
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.topbarUser}>
              👤 {user?.user_metadata?.full_name || "Mahasiswa"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
