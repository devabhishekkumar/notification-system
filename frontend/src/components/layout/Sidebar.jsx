import {
  Bell,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  ChevronRight,
} from "lucide-react";

import { NavLink } from "react-router-dom";

/* ============================================================
   NAVIGATION
============================================================ */

const navigation = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Notification Settings",
    path: "/settings",
    icon: Settings,
  },
  {
    label: "Templates",
    path: "/templates",
    icon: FileText,
  },
  {
    label: "Notification Logs",
    path: "/logs",
    icon: ScrollText,
  },
];

/* ============================================================
   SIDEBAR
============================================================ */

function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-800 bg-[#111827] text-white lg:flex lg:flex-col">

      {/* ======================================================
          BRAND
      ====================================================== */}

      <div className="flex h-24 items-center gap-4 border-b border-slate-800 px-7">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
          <Bell size={24} />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">
            NotifyHub
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Notification System
          </p>
        </div>
      </div>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <div className="flex-1 overflow-y-auto px-5 py-8">
        <p className="mb-4 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Main Menu
        </p>

        <nav className="space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={20}
                      strokeWidth={
                        isActive ? 2.4 : 2
                      }
                      className="shrink-0"
                    />

                    <span className="flex-1">
                      {item.label}
                    </span>

                    <ChevronRight
                      size={16}
                      className={[
                        "transition-all",
                        isActive
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50",
                      ].join(" ")}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ======================================================
          SYSTEM STATUS
      ====================================================== */}

      <div className="m-5 rounded-2xl border border-slate-700/50 bg-slate-800/70 p-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>

          <span className="text-sm font-semibold text-white">
            System Online
          </span>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          All notification services are operational.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;