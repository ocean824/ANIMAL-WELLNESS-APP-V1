import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ConfidenceBadge, EmptyState, PageHeader, PetSelect, TrendChip } from "@/components/shared";
import { AlertTriangle, Brain, CheckCircle2 } from "lucide-react";

const DIM_LABELS = {
  connection: "Connection",
  wellnessStability: "Wellness stability",
  ritualConsistency: "Ritual consistency",
  careCircleReadiness: "Care circle readiness",
  dataCompleteness: "Data completeness",
};

export default function Intelligence() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [insights, setInsights] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => { setPets(data); if (data.length) setPetId(data[0].id); }).catch(() => {});
  }, []);

  const load = async () => {
    try { const { data } = await api.get("/relationship-insights?limit=10"); setInsights(data); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setBusy(true);
    try {
      await api.post("/intelligence/relationship-insight", { petId });
      toast.success("Relationship intelligence snapshot generated.");
      load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const latest = insights[0];

  return (
    <div>
      <PageHeader title="Relationship Intelligence" subtitle="Explainable snapshots: five dimensions, honest risks, and next best actions.">
        <PetSelect pets={pets} value={petId} onChange={setPetId} testId="intelligence-pet-select" />
        <Button onClick={generate} disabled={busy || !petId} className="rounded-xl" data-testid="intelligence-generate-button">{busy ? "Analyzing..." : "Generate snapshot"}</Button>
      </PageHeader>

      {!latest ? (
        <EmptyState icon={Brain} title="No snapshots yet" hint="Generate your first relationship intelligence snapshot from your logged data." action={pets.length ? <Button onClick={generate} disabled={busy} className="rounded-xl">Generate now</Button> : null} />
      ) : (
        <div className="grid md:grid-cols-12 gap-6">
          <Card className="md:col-span-5 rounded-2xl" data-testid="intelligence-score-card">
            <CardContent className="p-6">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold text-primary">{latest.score}</span>
                <span className="text-muted-foreground text-sm pb-1.5">/ 100</span>
              </div>
              <div className="flex gap-2 mt-3"><TrendChip trend={latest.trend} /><ConfidenceBadge level={latest.confidence} /></div>
              <div className="mt-5 space-y-3">
                {Object.entries(latest.dimensions || {}).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1"><span>{DIM_LABELS[k] || k}</span><span className="font-semibold">{v}/100</span></div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground italic mt-4">{latest.safetyDisclaimer}</p>
            </CardContent>
          </Card>
          <div className="md:col-span-7 space-y-4">
            <Card className="rounded-2xl" data-testid="intelligence-risks-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" /> Risk notices</CardTitle></CardHeader>
              <CardContent>
                {latest.risks?.length ? (
                  <ul className="space-y-2">{latest.risks.map((r, i) => <li key={i} className="text-sm flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--warning))] mt-1.5 shrink-0" />{r}</li>)}</ul>
                ) : <p className="text-sm text-muted-foreground">No risk notices in this snapshot.</p>}
              </CardContent>
            </Card>
            <Card className="rounded-2xl" data-testid="intelligence-actions-card">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" /> Next best actions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">{(latest.nextBestActions || []).map((a, i) => <li key={i} className="text-sm flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] mt-1.5 shrink-0" />{a}</li>)}</ul>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Signals reviewed</CardTitle></CardHeader>
              <CardContent><ul className="grid sm:grid-cols-2 gap-1.5">{(latest.signals || []).map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}</ul></CardContent>
            </Card>
          </div>
          {insights.length > 1 && (
            <Card className="md:col-span-12 rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Previous snapshots</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {insights.slice(1, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="text-muted-foreground">{new Date(s.generatedAt || s.createdAt).toLocaleString()}</span>
                    <div className="flex items-center gap-3"><span className="font-semibold">{s.score}/100</span><TrendChip trend={s.trend} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
