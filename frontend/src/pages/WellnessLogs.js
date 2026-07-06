import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EmptyState, PageHeader, PetSelect, SliderField } from "@/components/shared";
import { Heart, Trash2 } from "lucide-react";

const BLANK = { appetite: 7, energy: 7, sleep: 7, anxiety: 3, bathroom: "normal", behaviorNotes: "", medicalObservations: "" };

export default function WellnessLogs() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => { setPets(data); if (data.length) setPetId(data[0].id); }).catch(() => {});
  }, []);

  const load = async (pid) => {
    try { const { data } = await api.get(`/wellness-logs?petId=${pid}&limit=30`); setItems(data); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { if (petId) load(petId); }, [petId]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/wellness-logs", { ...form, petId, date: new Date().toISOString().slice(0, 10) });
      await api.post("/bond-scores/calculate", { petId }).catch(() => {});
      toast.success("Wellness log saved — Bond Score refreshed.");
      setForm(BLANK);
      load(petId);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/wellness-logs/${id}`); toast.success("Log archived."); load(petId); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Wellness Logs" subtitle="Appetite, energy, sleep, anxiety, and observations — feeding the Bond Score and vet-ready reports.">
        <PetSelect pets={pets} value={petId} onChange={setPetId} testId="wellness-pet-select" />
      </PageHeader>
      {!pets.length ? <EmptyState icon={Heart} title="Add a pet first" hint="Wellness logs are linked to a pet profile." /> : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-2xl h-fit">
            <CardContent className="p-6 space-y-4">
              <SliderField label="Appetite" value={form.appetite} onChange={(v) => setForm({ ...form, appetite: v })} testId="wellness-appetite-slider" />
              <SliderField label="Energy" value={form.energy} onChange={(v) => setForm({ ...form, energy: v })} testId="wellness-energy-slider" />
              <SliderField label="Sleep quality" value={form.sleep} onChange={(v) => setForm({ ...form, sleep: v })} testId="wellness-sleep-slider" />
              <SliderField label="Anxiety" value={form.anxiety} onChange={(v) => setForm({ ...form, anxiety: v })} testId="wellness-anxiety-slider" />
              <div className="space-y-1.5">
                <Label>Bathroom</Label>
                <Select value={form.bathroom} onValueChange={(v) => setForm({ ...form, bathroom: v })}>
                  <SelectTrigger data-testid="wellness-bathroom-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["normal", "loose", "constipated", "frequent", "accidents", "other"].map((b) => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Behavior notes</Label><Textarea rows={2} value={form.behaviorNotes} onChange={(e) => setForm({ ...form, behaviorNotes: e.target.value })} placeholder="social behavior, play, avoidance..." data-testid="wellness-behavior-input" /></div>
              <div className="space-y-1.5">
                <Label>Medical observations (observations only)</Label>
                <Textarea rows={2} value={form.medicalObservations} onChange={(e) => setForm({ ...form, medicalObservations: e.target.value })} placeholder="limping, itching, coughing — as observed" data-testid="wellness-medical-input" />
                <p className="text-xs text-muted-foreground">If anything seems urgent or worsening, contact a veterinarian.</p>
              </div>
              <Button className="w-full rounded-xl" onClick={submit} disabled={busy} data-testid="wellness-submit-button">{busy ? "Saving..." : "Save wellness log"}</Button>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <p className="text-sm font-medium">Recent logs</p>
            {!items.length && <p className="text-sm text-muted-foreground">No logs yet — want to start with a 30-second log?</p>}
            {items.map((w) => (
              <Card key={w.id} className="rounded-2xl" data-testid={`wellness-item-${w.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-muted-foreground">{w.date}</p>
                    <button onClick={() => remove(w.id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`wellness-delete-${w.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-sm mt-1">appetite {w.appetite} · energy {w.energy} · sleep {w.sleep} · anxiety {w.anxiety} · {w.bathroom}</p>
                  {w.behaviorNotes && <p className="text-xs mt-1">{w.behaviorNotes}</p>}
                  {w.medicalObservations && <p className="text-xs text-muted-foreground italic mt-1">{w.medicalObservations}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
