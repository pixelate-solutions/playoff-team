"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <Button className="bg-gray-100/60" variant="ghost" size="sm" onClick={handleLogout}>
      Log Out
    </Button>
  );
}
