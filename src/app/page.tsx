import { ACCOUNTS } from "@/lib/data";
import { buildPriorityQueue, buildPortfolioStats } from "@/lib/priority";
import PortfolioOverview from "@/components/PortfolioOverview";
import PriorityQueue from "@/components/PriorityQueue";
import RiskDetection from "@/components/RiskDetection";
import ExpansionDetection from "@/components/ExpansionDetection";
import OnboardingMonitoring from "@/components/OnboardingMonitoring";

export default function DashboardPage() {
  const queue = buildPriorityQueue(ACCOUNTS);
  const stats = buildPortfolioStats(queue);

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#1a1a1a] tracking-tight">
              Didask <span className="text-[#f9b494]">CSM</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 border border-slate-200 rounded-full px-2.5 py-0.5">
              Intelligence Dashboard
            </span>
          </div>
          <div className="text-xs text-slate-400 capitalize">{today}</div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        <PortfolioOverview stats={stats} />
        <PriorityQueue entries={queue} />
        <RiskDetection entries={queue} />
        <ExpansionDetection entries={queue} />
        <OnboardingMonitoring entries={queue} />
      </main>

      <footer className="text-center text-xs text-slate-300 py-8">
        Didask CSM Dashboard · données mock MVP
      </footer>
    </div>
  );
}
