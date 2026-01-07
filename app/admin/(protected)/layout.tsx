import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (!session) {
    redirect("/admin/login");
  }

  return <div className="container">{children}</div>;
}
