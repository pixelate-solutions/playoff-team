import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const offensiveScoring = [
  { label: "FG (0-39)", value: "3" },
  { label: "FG (40-49)", value: "4" },
  { label: "FG (50-59)", value: "5" },
  { label: "FG (60+)", value: "6" },
  { label: "XP", value: "1" },
  { label: "Passing 2PT", value: "2" },
  { label: "Passing TD", value: "6" },
  { label: "Passing Yards", value: "1 / 20" },
  { label: "Receiving 2PT", value: "2" },
  { label: "Receiving TD", value: "6" },
  { label: "Receiving Yards", value: "1 / 10" },
  { label: "Receptions", value: "1" },
  { label: "Rushing 2PT", value: "2" },
  { label: "Rushing TD", value: "6" },
  { label: "Rushing Yards", value: "1 / 10" },
];

const defenseScoring = [
  { label: "Fumble Recovery", value: "2" },
  { label: "Def/ST TD", value: "9" },
  { label: "Interception", value: "2" },
  { label: "Sack", value: "1" },
  { label: "Safety", value: "2" },
  { label: "Fum2PK", value: "2" },
  { label: "Fum2PT", value: "2" },
  { label: "Int2PK", value: "2" },
  { label: "Int2PT", value: "2" },
];

export default function RulesPage() {
  return (
    <div className="container space-y-10">
      <div className="space-y-4">
        <Badge variant="secondary">Rules & Scoring</Badge>
        <h1 className="font-display text-4xl text-slate-900 md:text-5xl">Playoff Challenge Rules</h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Draft one player from every playoff team. When that NFL team is eliminated, you lose the player.
          The last two players standing (Super Bowl teams) decide the champion.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Entry & Payouts</CardTitle>
            <CardDescription>Entry fee and prize breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Entry Fee</span>
              <span className="font-medium text-slate-900">$100</span>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span>1st Place</span>
                <span className="font-medium text-slate-900">70% of total pot</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2nd Place</span>
                <span className="font-medium text-slate-900">15% of total pot</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3rd Place</span>
                <span className="font-medium text-slate-900">10% of total pot</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Commissioner</span>
                <span className="font-medium text-slate-900">5% of total pot</span>
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-500">
              Tie rule: If teams tie, split the combined payouts for those finishing positions.
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Roster Construction</CardTitle>
            <CardDescription>14 total players, one per playoff team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Quarterbacks</span>
              <span className="font-medium text-slate-900">4</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Running Backs</span>
              <span className="font-medium text-slate-900">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Wide Receivers</span>
              <span className="font-medium text-slate-900">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Flex (RB/WR/TE)</span>
              <span className="font-medium text-slate-900">1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tight End</span>
              <span className="font-medium text-slate-900">1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Kicker</span>
              <span className="font-medium text-slate-900">1</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Defense (DST)</span>
              <span className="font-medium text-slate-900">1</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Offensive Scoring</CardTitle>
            <CardDescription>All points per stat (yardage floors).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-600">
            {offensiveScoring.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span>{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Defensive / ST Scoring</CardTitle>
            <CardDescription>Defense, special teams, and conversion returns.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-slate-600">
            {defenseScoring.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span>{item.label}</span>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
