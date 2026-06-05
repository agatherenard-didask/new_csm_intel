import { ACCOUNTS } from "@/lib/data";
import { buildPriorityQueue } from "@/lib/priority";
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  const allEntries = buildPriorityQueue(ACCOUNTS);

  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f2f4f8]">
      <DashboardClient allEntries={allEntries} today={today} />
    </div>
  );
}
