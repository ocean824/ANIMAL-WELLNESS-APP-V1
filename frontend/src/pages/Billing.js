import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared";
import { Check, CreditCard, Crown, Sparkles } from "lucide-react";

const UsageBar = ({ label, used, limit, testId }) => {
  const unlimited = limit === null || limit === undefined;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div data-testid={testId}>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground text-xs">{used} / {unlimited ? "Unlimited" : limit}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? "bg-[hsl(var(--destructive))]" : pct >= 70 ? "bg-[hsl(var(--warning))]" : "bg-primary"}`} style={{ width: unlimited ? "6%" : `${pct}%` }} />
      </div>
    </div>
  );
};

const FREE_FEATURES = ["3 pet profiles", "100 AI assistant calls / month", "10 reports / month", "30 agent runs / month", "Full Bond Score & Intelligence", "Voice support agent"];
const PREMIUM_FEATURES = ["Unlimited pet profiles", "Unlimited AI coach, rituals & voice", "Unlimited vet-ready reports", "Unlimited agent runs", "Priority human support", "Everything in Free"];

export default function Billing() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const { data: d } = await api.get("/billing/plan"); setData(d); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, []);

  const upgrade = async () => {
    setBusy(true);
    try {
      const { data: r } = await api.post("/billing/upgrade");
      toast.info(r.message);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  if (!data) return <p className="text-sm text-muted-foreground">Loading plan...</p>;
  const isPremium = data.plan === "premium";

  return (
    <div className="max-w-3xl">
      <PageHeader title="Plan & Billing" subtitle="Your plan, monthly usage, and upgrade options.">
        <Badge variant="secondary" className={`border-0 capitalize ${isPremium ? "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]" : ""}`} data-testid="billing-plan-badge">
          {isPremium && <Crown className="w-3 h-3 mr-1" />} {data.plan} plan
        </Badge>
      </PageHeader>

      <Card className="rounded-2xl mb-6" data-testid="billing-usage-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Usage this month</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <UsageBar label="AI assistant calls (coach, rituals, voice)" used={data.usage.aiCallsThisMonth} limit={data.limits.aiCallsPerMonth} testId="usage-ai" />
          <UsageBar label="Reports generated" used={data.usage.reportsThisMonth} limit={data.limits.reportsPerMonth} testId="usage-reports" />
          <UsageBar label="Agent runs" used={data.usage.agentRunsThisMonth} limit={data.limits.agentRunsPerMonth} testId="usage-agents" />
          <UsageBar label="Active pet profiles" used={data.usage.activePets} limit={data.limits.maxPets} testId="usage-pets" />
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className={`rounded-2xl ${!isPremium ? "border-primary" : ""}`} data-testid="billing-free-card">
          <CardContent className="p-6">
            <p className="font-semibold">Free</p>
            <p className="text-2xl font-bold mt-1">$0<span className="text-sm text-muted-foreground font-normal"> / month</span></p>
            <ul className="mt-4 space-y-2">
              {FREE_FEATURES.map((f) => <li key={f} className="text-sm flex gap-2"><Check className="w-4 h-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            {!isPremium && <Badge variant="secondary" className="border-0 mt-4">Current plan</Badge>}
          </CardContent>
        </Card>
        <Card className={`rounded-2xl ${isPremium ? "border-primary" : "border-[hsl(var(--warning)/0.4)]"}`} data-testid="billing-premium-card">
          <CardContent className="p-6">
            <p className="font-semibold flex items-center gap-1.5"><Crown className="w-4 h-4 text-[hsl(var(--warning))]" /> Premium</p>
            <p className="text-2xl font-bold mt-1">$9<span className="text-sm text-muted-foreground font-normal"> / month</span></p>
            <ul className="mt-4 space-y-2">
              {PREMIUM_FEATURES.map((f) => <li key={f} className="text-sm flex gap-2"><Check className="w-4 h-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            {isPremium ? (
              <Badge variant="secondary" className="border-0 mt-4">Current plan</Badge>
            ) : (
              <Button className="w-full rounded-xl mt-4" onClick={upgrade} disabled={busy} data-testid="billing-upgrade-button">
                <CreditCard className="w-4 h-4 mr-2" /> {busy ? "Recording..." : "Upgrade to Premium"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4" data-testid="billing-note">
        {data.note} No card is charged — your upgrade interest is saved and checkout will activate once payments are connected.
      </p>
    </div>
  );
}
