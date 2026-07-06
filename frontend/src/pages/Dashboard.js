import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ConfidenceBadge, DisclaimerNote, EmptyState, PetSelect, ScoreGauge, SliderField, TrendChip,
} from "@/components/shared";
import { CalendarCheck, FileText, Gauge, HandHeart, Heart, PawPrint, Sparkles, User, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [score, setScore] = useState(null);
  const [rituals, setRituals] = useState([]);
  const [wellness, setWellness] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [careCircle, setCareCircle] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcBusy, setCalcBusy] = useState(false);
  const [coachPrompt, setCoachPrompt] = useState("");
  const [ci, setCi] = useState({ humanMood: "", petMood: "", stressLevel: 5, connectionQuality: 7, notes: "" });
  const [ciBusy, setCiBusy] = useState(false);

  const pet = useMemo(() => pets.find((p) => p.id === petId), [pets, petId]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/pet-profiles");
        setPets(data);
        if (data.length) setPetId(data[0].id);
      } catch (e) { toast.error(errMsg(e)); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!petId) return;
    const load = async () => {
      try {
        const [s, r, w, c, cc, rp] = await Promise.all([
          api.get(`/bond-scores?petId=${petId}&limit=1`),
          api.get(`/rituals?petId=${petId}&status=active&limit=3`),
          api.get(`/wellness-logs?petId=${petId}&limit=5`),
          api.get(`/daily-checkins?petId=${petId}&limit=5`),
          api.get(`/care-circle-members?petId=${petId}&limit=5`),
          api.get(`/reports?petId=${petId}&limit=3`),
        ]);
        setScore(s.data[0] || null);
        setRituals(r.data);
        setWellness(w.data);
        setCheckins(c.data);
        setCareCircle(cc.data);
        setReports(rp.data);
      } catch (e) { toast.error(errMsg(e)); }
    };
    load();
  }, [petId]);

  const calcScore = async () => {
    setCalcBusy(true);
    try {
      const { data } = await api.post("/bond-scores/calculate", { petId });
      setScore(data);
      toast.success(`Bond Score updated: ${data.score}/100`);
    } catch (e) { toast.error(errMsg(e)); } finally { setCalcBusy(false); }
  };

  const submitCheckin = async () => {
    if (!ci.humanMood || !ci.petMood) { toast.error("Please describe both moods."); return; }
    setCiBusy(true);
    try {
      await api.post("/daily-checkins", { ...ci, petId, date: new Date().toISOString().slice(0, 10) });
      toast.success("Check-in saved. Recalculating Bond Score...");
      setCi({ humanMood: "", petMood: "", stressLevel: 5, connectionQuality: 7, notes: "" });
      const { data } = await api.post("/bond-scores/calculate", { petId });
      setScore(data);
      const c = await api.get(`/daily-checkins?petId=${petId}&limit=5`);
      setCheckins(c.data);
    } catch (e) { toast.error(errMsg(e)); } finally { setCiBusy(false); }
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground" data-testid="dashboard-loading">Loading your dashboard...</div>;

  if (!pets.length) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <EmptyState
          icon={PawPrint}
          title="Let's meet your animal"
          hint="Add your first pet profile to unlock check-ins, rituals, the Bond Score, and the AI coach."
          action={<Link to="/pets"><Button className="rounded-xl" data-testid="dashboard-add-pet-button">Add my pet</Button></Link>}
        />
      </div>
    );
  }

  const latestWellness = wellness[0];
  const latestCheckin = checkins[0];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Good to see you, {user?.name?.split(" ")[0]}.</h1>
          <p className="text-sm text-muted-foreground mt-0.5">One small step today keeps the bond growing.</p>
        </div>
        <PetSelect pets={pets} value={petId} onChange={setPetId} testId="dashboard-pet-select" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Bond Score */}
        <Card className="md:col-span-7 rounded-2xl" data-testid="dashboard-bond-score-card">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Gauge className="w-4 h-4 text-primary" /> Bond Score {pet ? `· ${pet.name}` : ""}</CardTitle>
            <Link to="/bond-score" className="text-xs text-primary hover:underline">History →</Link>
          </CardHeader>
          <CardContent>
            {score ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreGauge score={score.score} />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2 flex-wrap"><TrendChip trend={score.trend} /><ConfidenceBadge level={score.confidence} /></div>
                  <p className="text-sm text-muted-foreground">{score.explanation}</p>
                  <Button size="sm" variant="secondary" className="rounded-lg" onClick={calcScore} disabled={calcBusy} data-testid="dashboard-recalculate-score-button">
                    {calcBusy ? "Calculating..." : "Recalculate"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 gap-3">
                <p className="text-sm text-muted-foreground">No Bond Score yet — want to generate the first one?</p>
                <Button onClick={calcScore} disabled={calcBusy} className="rounded-xl" data-testid="dashboard-calculate-score-button">{calcBusy ? "Calculating..." : "Calculate Bond Score"}</Button>
              </div>
            )}
            <div className="mt-3"><DisclaimerNote /></div>
          </CardContent>
        </Card>

        {/* Today's Ritual */}
        <Card className="md:col-span-5 rounded-2xl" data-testid="dashboard-ritual-card">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><HandHeart className="w-4 h-4 text-primary" /> Today's Ritual</CardTitle>
            <Link to="/rituals" className="text-xs text-primary hover:underline">All rituals →</Link>
          </CardHeader>
          <CardContent>
            {rituals[0] ? (
              <div className="space-y-2">
                <p className="font-medium text-sm">{rituals[0].title}</p>
                <p className="text-sm text-muted-foreground line-clamp-3">{rituals[0].description}</p>
                <p className="text-xs text-muted-foreground">{rituals[0].durationMinutes} min · {rituals[0].category}{rituals[0].aiGenerated ? " · AI-generated" : ""}</p>
                <Link to="/rituals"><Button size="sm" className="rounded-lg mt-1" data-testid="dashboard-complete-ritual-button">Complete this ritual</Button></Link>
              </div>
            ) : (
              <EmptyState icon={HandHeart} title="No active rituals" hint="Generate a gentle, AI-tailored ritual for your pet." action={<Link to="/rituals"><Button size="sm" variant="secondary" className="rounded-lg">Create ritual</Button></Link>} />
            )}
          </CardContent>
        </Card>

        {/* Pet Wellness Snapshot */}
        <Card className="md:col-span-4 rounded-2xl" data-testid="dashboard-wellness-snapshot-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Pet Wellness Snapshot</CardTitle></CardHeader>
          <CardContent>
            {latestWellness ? (
              <div className="space-y-1.5 text-sm">
                {[["Appetite", latestWellness.appetite], ["Energy", latestWellness.energy], ["Sleep", latestWellness.sleep], ["Anxiety", latestWellness.anxiety]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${v * 10}%` }} /></div>
                      <span className="text-xs font-semibold w-8 text-right">{v}/10</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">Bathroom: {latestWellness.bathroom} · {latestWellness.date}</p>
              </div>
            ) : <EmptyState icon={Heart} title="No wellness logs yet" hint="Log appetite, energy, sleep and anxiety to feed the Bond Score." action={<Link to="/wellness"><Button size="sm" variant="secondary" className="rounded-lg">Add log</Button></Link>} />}
          </CardContent>
        </Card>

        {/* Human Mood Snapshot */}
        <Card className="md:col-span-4 rounded-2xl" data-testid="dashboard-mood-snapshot-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Human Mood Snapshot</CardTitle></CardHeader>
          <CardContent>
            {latestCheckin ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">You felt:</span> <span className="font-medium">{latestCheckin.humanMood}</span></p>
                <p><span className="text-muted-foreground">{pet?.name || "Pet"} seemed:</span> <span className="font-medium">{latestCheckin.petMood}</span></p>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Stress</span><span className="text-xs font-semibold">{latestCheckin.stressLevel}/10</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Connection</span><span className="text-xs font-semibold">{latestCheckin.connectionQuality}/10</span></div>
                <p className="text-xs text-muted-foreground">{latestCheckin.date}</p>
              </div>
            ) : <EmptyState icon={User} title="No check-ins yet" hint="A 30-second check-in captures both sides of the bond." />}
          </CardContent>
        </Card>

        {/* Quick Daily Check-In */}
        <Card className="md:col-span-4 rounded-2xl" data-testid="dashboard-checkin-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" /> Quick Check-In</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="How do you feel today?" value={ci.humanMood} onChange={(e) => setCi({ ...ci, humanMood: e.target.value })} data-testid="dashboard-checkin-human-mood-input" />
            <Input placeholder={`How does ${pet?.name || "your pet"} seem?`} value={ci.petMood} onChange={(e) => setCi({ ...ci, petMood: e.target.value })} data-testid="dashboard-checkin-pet-mood-input" />
            <SliderField label="Your stress" value={ci.stressLevel} onChange={(v) => setCi({ ...ci, stressLevel: v })} testId="dashboard-checkin-stress-slider" />
            <SliderField label="Connection quality" value={ci.connectionQuality} onChange={(v) => setCi({ ...ci, connectionQuality: v })} testId="dashboard-checkin-connection-slider" />
            <Button className="w-full rounded-xl" onClick={submitCheckin} disabled={ciBusy} data-testid="dashboard-checkin-submit-button">{ciBusy ? "Saving..." : "Save check-in"}</Button>
          </CardContent>
        </Card>

        {/* AI Coach Prompt */}
        <Card className="md:col-span-7 rounded-2xl" data-testid="dashboard-coach-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Ask the AI Bond Coach</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={2} placeholder={`e.g. "How can I help ${pet?.name || "my pet"} feel calmer during storms?"`} value={coachPrompt} onChange={(e) => setCoachPrompt(e.target.value)} data-testid="dashboard-coach-input" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted-foreground">Non-diagnostic guidance with safety labels. Emergencies go to your vet.</p>
              <Button className="rounded-xl shrink-0" disabled={!coachPrompt.trim()} onClick={() => navigate("/coach", { state: { prompt: coachPrompt, petId } })} data-testid="dashboard-coach-ask-button">Ask coach</Button>
            </div>
          </CardContent>
        </Card>

        {/* Care Circle Activity */}
        <Card className="md:col-span-5 rounded-2xl" data-testid="dashboard-care-circle-card">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Care Circle</CardTitle>
            <Link to="/care-circle" className="text-xs text-primary hover:underline">Manage →</Link>
          </CardHeader>
          <CardContent>
            {careCircle.length ? (
              <div className="space-y-2">
                {careCircle.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <div><p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.role}</p></div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">{m.status}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={Users} title="No care circle yet" hint="Invite a trusted caregiver or provider with scoped permissions." />}
          </CardContent>
        </Card>

        {/* Recent Wellness Logs */}
        <Card className="md:col-span-8 rounded-2xl" data-testid="dashboard-recent-logs-card">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Recent Wellness Logs</CardTitle>
            <Link to="/wellness" className="text-xs text-primary hover:underline">All logs →</Link>
          </CardHeader>
          <CardContent>
            {wellness.length ? (
              <div className="space-y-2">
                {wellness.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="text-muted-foreground">{w.date}</span>
                    <span className="text-xs">appetite {w.appetite} · energy {w.energy} · sleep {w.sleep} · anxiety {w.anxiety}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground py-2">No logs yet — want to start with a 30-second wellness log?</p>}
          </CardContent>
        </Card>

        {/* Reports Ready */}
        <Card className="md:col-span-4 rounded-2xl" data-testid="dashboard-reports-card">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Reports Ready</CardTitle>
            <Link to="/reports" className="text-xs text-primary hover:underline">All →</Link>
          </CardHeader>
          <CardContent>
            {reports.length ? (
              <div className="space-y-2">
                {reports.map((r) => (
                  <Link key={r.id} to="/reports" className="block text-sm hover:text-primary transition-colors">
                    <p className="font-medium capitalize">{r.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground py-2">No reports yet. Generate a vet-ready report before your next visit.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
