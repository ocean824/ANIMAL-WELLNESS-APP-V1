import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState, PageHeader, PetSelect } from "@/components/shared";
import { HandHeart, Sparkles, CheckCircle2, Trash2 } from "lucide-react";

const BLANK = { title: "", description: "", durationMinutes: 5, category: "Calm Bonding", steps: "" };

export default function Rituals() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [rituals, setRituals] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [open, setOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [cForm, setCForm] = useState({ result: "completed", petResponse: "", emotionalResult: "" });
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [goal, setGoal] = useState("");

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => { setPets(data); if (data.length) setPetId(data[0].id); }).catch(() => {});
  }, []);

  const load = async (pid) => {
    try {
      const [r, c] = await Promise.all([api.get(`/rituals?petId=${pid}&limit=50`), api.get(`/ritual-completions?petId=${pid}&limit=20`)]);
      setRituals(r.data); setCompletions(c.data);
    } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { if (petId) load(petId); }, [petId]);

  const save = async () => {
    if (!form.title || !form.description) { toast.error("Title and description are required."); return; }
    setBusy(true);
    try {
      await api.post("/rituals", { ...form, petId, steps: form.steps.split("\n").map((s) => s.trim()).filter(Boolean), status: "active", aiGenerated: false, durationMinutes: Number(form.durationMinutes) || 5 });
      toast.success("Ritual created."); setOpen(false); setForm(BLANK); load(petId);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const generateAI = async () => {
    setAiBusy(true);
    try {
      const { data } = await api.post("/ai/generate-ritual", { petId, goal: goal || undefined });
      toast.success(`AI ritual created: "${data.title}"`);
      setGoal(""); load(petId);
    } catch (e) { toast.error(errMsg(e)); } finally { setAiBusy(false); }
  };

  const complete = async () => {
    if (!cForm.petResponse) { toast.error("Please describe how your pet responded."); return; }
    setBusy(true);
    try {
      await api.post("/ritual-completions", { ...cForm, ritualId: completeOpen.id, petId, completedAt: new Date().toISOString() });
      await api.post("/bond-scores/calculate", { petId }).catch(() => {});
      toast.success("Ritual completion logged — beautiful work.");
      setCompleteOpen(null); setCForm({ result: "completed", petResponse: "", emotionalResult: "" });
      load(petId);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const remove = async (r) => {
    if (!window.confirm(`Archive ritual "${r.title}"?`)) return;
    try { await api.delete(`/rituals/${r.id}`); toast.success("Ritual archived."); load(petId); } catch (e) { toast.error(errMsg(e)); }
  };

  const pet = pets.find((p) => p.id === petId);

  return (
    <div>
      <PageHeader title="Rituals" subtitle="Low-pressure, consent-based bonding routines.">
        <PetSelect pets={pets} value={petId} onChange={setPetId} testId="rituals-pet-select" />
        <Button variant="secondary" onClick={() => setOpen(true)} className="rounded-xl" data-testid="add-ritual-button">New ritual</Button>
      </PageHeader>

      {!pets.length ? <EmptyState icon={HandHeart} title="Add a pet first" hint="Rituals are tailored to a pet profile." /> : (
        <>
          <Card className="rounded-2xl mb-6 border-[hsl(var(--primary)/0.25)]" data-testid="ai-ritual-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-primary" /><p className="text-sm font-semibold">Generate an AI ritual for {pet?.name}</p></div>
              <p className="text-xs text-muted-foreground mb-3">The Care Plan Agent tailors it to {pet?.name}'s traits, triggers, and comforts. Always safe, never medical.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input placeholder='Optional goal, e.g. "reduce storm anxiety"' value={goal} onChange={(e) => setGoal(e.target.value)} data-testid="ai-ritual-goal-input" />
                <Button onClick={generateAI} disabled={aiBusy} className="rounded-xl shrink-0" data-testid="ai-ritual-generate-button">{aiBusy ? "Crafting ritual..." : "Generate with AI"}</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {rituals.map((r) => (
              <Card key={r.id} className="rounded-2xl" data-testid={`ritual-card-${r.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <div className="flex gap-1.5">
                      {r.aiGenerated && <Badge variant="secondary" className="border-0 bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))]">AI</Badge>}
                      <Badge variant="secondary" className="border-0">{r.durationMinutes} min</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5">{r.description}</p>
                  {r.steps?.length > 0 && (
                    <ol className="mt-2 space-y-1 text-xs list-decimal list-inside text-muted-foreground">
                      {r.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" className="rounded-lg" onClick={() => setCompleteOpen(r)} data-testid={`complete-ritual-button-${r.id}`}><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete</Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => remove(r)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!rituals.length && <p className="text-sm text-muted-foreground col-span-2">No rituals yet — generate one with AI above, or create your own.</p>}
          </div>

          {completions.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-medium mb-3">Recent completions</p>
              <div className="space-y-2">
                {completions.slice(0, 6).map((c) => (
                  <Card key={c.id} className="rounded-xl"><CardContent className="p-3.5 text-sm">
                    <p><span className="font-medium">{rituals.find((r) => r.id === c.ritualId)?.title || "Ritual"}</span> · <span className="text-xs text-muted-foreground">{new Date(c.completedAt || c.createdAt).toLocaleString()}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pet response: {c.petResponse} {c.emotionalResult ? `· You: ${c.emotionalResult}` : ""}</p>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="ritual-dialog">
          <DialogHeader><DialogTitle>New ritual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="ritual-title-input" /></div>
            <div className="space-y-1.5"><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="ritual-description-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} data-testid="ritual-duration-input" /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="ritual-category-input" /></div>
            </div>
            <div className="space-y-1.5"><Label>Steps (one per line)</Label><Textarea rows={4} value={form.steps} onChange={(e) => setForm({ ...form, steps: e.target.value })} data-testid="ritual-steps-input" /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={busy} className="rounded-xl" data-testid="ritual-save-button">{busy ? "Saving..." : "Create ritual"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeOpen} onOpenChange={(o) => !o && setCompleteOpen(null)}>
        <DialogContent data-testid="complete-ritual-dialog">
          <DialogHeader><DialogTitle>Complete: {completeOpen?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>How did {pet?.name} respond? *</Label><Textarea rows={2} value={cForm.petResponse} onChange={(e) => setCForm({ ...cForm, petResponse: e.target.value })} placeholder="chose to lie nearby, accepted gentle praise..." data-testid="completion-pet-response-input" /></div>
            <div className="space-y-1.5"><Label>How did it feel for you?</Label><Input value={cForm.emotionalResult} onChange={(e) => setCForm({ ...cForm, emotionalResult: e.target.value })} placeholder="calmer, more connected..." data-testid="completion-emotional-input" /></div>
          </div>
          <DialogFooter><Button onClick={complete} disabled={busy} className="rounded-xl" data-testid="completion-save-button">{busy ? "Saving..." : "Log completion"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
