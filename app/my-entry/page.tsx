import { Suspense } from "react";
import { MyEntryClient } from "@/app/my-entry/my-entry-client";

export default function MyEntryPage() {
  return (
    <Suspense fallback={<div className="container text-slate-500">Loading roster...</div>}>
      <MyEntryClient />
    </Suspense>
  );
}
