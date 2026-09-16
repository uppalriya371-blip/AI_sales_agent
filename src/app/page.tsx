import LeadsTable from "@/components/LeadsTable";

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Overview</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Sales pipeline</h1>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
          12 leads this week
        </div>
      </div>

      <LeadsTable />
    </div>
  );
}
