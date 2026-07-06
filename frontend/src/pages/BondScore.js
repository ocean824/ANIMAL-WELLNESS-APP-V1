import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ConfidenceBadge, DisclaimerNote, EmptyState, PageHeader, PetSelect, ScoreGauge, TrendChip } from "@/components/shared";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge } from "lucide-react";

export default function BondScore() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [scores, setScores] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => { setPets(data); if (data.length) setPetId(data[0].id); }).catch(() => {});
  }, []);

  const load = async (pid) => {
    try { const { data } = await api.get(`/bond-scores?petId=${pid}&limit=60`); setScores(data); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { if (petId) load(petId); }, [petId]);

  const calc = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/bond-scores/calculate", { petId });
      toast.success(`Bond Score: ${data.score}/100 (${data.confidence} confidence)`);
      load(petId);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const latest = scores[0];
  const chartData = [...scores].reverse().map((s) => ({ date: (s.calculatedAt || s.createdAt || "").slice(5, 10), score: s.score }));

  return (
    <div>
      <PageHeader title="Bond Score" subtitle="An explainable 0-100 relationship wellness indicator — never a diagnosis.">
        <PetSelect pets={pets} value={petId} onChange={setPetId} testId="bond-pet-select" />
        <Button onClick={calc} disabled={busy || !petId} className="rounded-xl" data-testid="bond-calculate-button">{busy ? "Calculating..." : "Calculate now"}</Button>
      </PageHeader>

      {!pets.length ? <EmptyState icon={Gauge} title="Add a pet first" hint="The Bond Score needs a pet profile and some logs." /> : !latest ? (
        <EmptyState icon={Gauge} title="No Bond Score yet" hint="Log a check-in or wellness entry, then calculate your first score." action={<Button onClick={calc} disabled={busy} className="rounded-xl">Calculate first score</Button>} />
      ) : (
        <div className="grid md:grid-cols-12 gap-6">
          <Card className="md:col-span-5 rounded-2xl">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <ScoreGauge score={latest.score} size={220} />
              <div className="flex gap-2 mt-4"><TrendChip trend={latest.trend} /><ConfidenceBadge level={latest.confidence} /></div>
              <p className="text-sm text-muted-foreground mt-3">{latest.explanation}</p>
              <p className="text-xs text-muted-foreground mt-2">Calculated {new Date(latest.calculatedAt || latest.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-7 rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Score history</CardTitle></CardHeader>
            <CardContent>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="bondFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(174 38% 28%)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="hsl(174 38% 28%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(28 18% 90%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(24 10% 55%)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(24 10% 55%)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(28 18% 86%)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="score" stroke="hsl(174 38% 28%)" strokeWidth={2} fill="url(#bondFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground py-8 text-center">Calculate a few scores over time to see your trend line here.</p>}
            </CardContent>
          </Card>
          <Card className="md:col-span-12 rounded-2xl" data-testid="bond-factors-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Why this score?</CardTitle></CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 gap-2">
                {(latest.factors || []).map((f, i) => (
                  <li key={i} className="text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{f}</li>
                ))}
              </ul>
              <div className="mt-4"><DisclaimerNote /></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
