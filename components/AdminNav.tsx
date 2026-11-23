"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_ITEMS, isAdminRouteActive } from "@/lib/admin-navigation";

export default function AdminNav({
  pendingScholarshipCount,
  pendingGradingCount = 0,
}: {
  pendingScholarshipCount: number;
  pendingGradingCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="admin-tabs" aria-label="Staff operations sections">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isAdminRouteActive(pathname, item.href);
        const count = item.href === "/admin/scholarships" ? pendingScholarshipCount : item.href === "/admin/grading" ? pendingGradingCount : 0;
        const showCount = count > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-tab${active ? " on" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
            {showCount ? (
              <span className="admin-tab-count">{count}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
