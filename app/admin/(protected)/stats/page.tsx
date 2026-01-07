import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminStatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="secondary">Admin</Badge>
        <h1 className="font-display text-4xl text-slate-900">Stats Import</h1>
        <p className="text-slate-600">Use the dashboard to fetch external stats and recalculate scores.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>Manual stat entry is disabled in this view.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Use the "Fetch & Recalculate" control on the admin dashboard. You can still edit player overrides from the
          scoreboard.
        </CardContent>
      </Card>
    </div>
  );
}
