"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mail, Settings, Zap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Leads", icon: LayoutDashboard },
  { href: "/settings", label: "Gmail Connection", icon: Mail },
  { href: "/settings#account", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold text-slate-900">AI Sales Agent</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">workspace</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href === "/" && pathname === "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4 text-xs text-slate-400">
        AI Sales Agent · v1.0
      </div>
    </aside>
  );
}
