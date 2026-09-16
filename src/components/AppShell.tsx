"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login";

  return (
    <div className="flex min-h-screen">
      {!isAuthRoute && <Sidebar />}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
