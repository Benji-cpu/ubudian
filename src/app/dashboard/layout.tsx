import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-brand-off-white to-brand-cream">
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <DashboardNav />
        <div className="py-8">{children}</div>
      </div>
    </div>
  );
}
