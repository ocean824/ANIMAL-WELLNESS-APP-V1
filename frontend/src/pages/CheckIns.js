import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmptyState, PageHeader, PetSelect, SliderField } from "@/components/shared";
import { CalendarCheck, Trash2 } from "lucide-react";

export default function CheckIns() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ humanMood: "", petMood: "", stressLevel: 5, connectionQuality: 7, notes: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => { setPets(data); if (data.length) setPetId(data[0].id); }).catch(() => {});
  }, []);

  const load = async (pid) => {
    try { const { data } = await api.get(`/daily-checkins?petId=${pid}&limit=30`); setItems(data); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { if (petId) load(petId); }, [petId]);

  const submit = async () => {
    if (!form.humanMood || !form.petMood) { toast.error("Please describe both moods."); return; }
    setBusy(true);
    try {
      await api.post("/daily-checkins", { ...form, petId, date: new Date().toISOString().slice(0, 10) });
      await api.post("/bond-scores/calculate", { petId }).catch(() => {});
      toast.success("Check-in saved — Bond Score refreshed.");
      setForm({ humanMood: "", petMood: "", stressLevel: 5, connectionQuality: 7, notes: "" });
      load(petId);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const remove = async (id) => {
    try { await api.delete(`/daily-checkins/${id}`); toast.success("Check-in archived."); load(petId); } catch (e) { toast.error(errMsg(e)); }
  };

  const pet = pets.find((p) => p.id === petId);

  return (
    <div>
      <PageHeader title="Daily Check-In" subtitle="30 seconds a day — both sides of the bond.">
        <PetSelect pets={pets} value={petId} onChange={setPetId} testId="checkins-pet-select" />
      </PageHeader>
      {!pets.length ? <EmptyState icon={CalendarCheck} title="Add a pet first" hint="Check-ins are linked to a pet profile." /> : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-2xl h-fit">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5"><Label>How do you feel today? *</Label><Input value={form.humanMood} onChange={(e) => setForm({ ...form, humanMood: e.target.value })} placeholder="grounded, stretched thin, hopeful..." data-testid="checkin-human-mood-input" /></div>
              <div className="space-y-1.5"><Label>How does {pet?.name || "your pet"} seem? *</Label><Input value={form.petMood} onChange={(e) => setForm({ ...form, petMood: e.target.value })} placeholder="calm, playful, withdrawn..." data-testid="checkin-pet-mood-input" /></div>
              <SliderField label="Your stress level" value={form.stressLevel} onChange={(v) => setForm({ ...form, stressLevel: v })} testId="checkin-stress-slider" />
              <SliderField label="Connection quality you felt" value={form.connectionQuality} onChange={(v) => setForm({ ...form, connectionQuality: v })} testId="checkin-connection-slider" />
              <div className="space-y-1.5"><Label>Notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="checkin-notes-input" /></div>
              <Button className="w-full rounded-xl" onClick={submit} disabled={busy} data-testid="checkin-submit-button">{busy ? "Saving..." : "Save today's check-in"}</Button>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <p className="text-sm font-medium">Recent check-ins</p>
            {!items.length && <p className="text-sm text-muted-foreground">No check-ins yet — your first one takes 30 seconds.</p>}
            {items.map((c) => (
              <Card key={c.id} className="rounded-2xl" data-testid={`checkin-item-${c.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-muted-foreground">{c.date}</p>
                    <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive transition-colors" data-testid={`checkin-delete-${c.id}`}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="text-sm mt-1">You: <span className="font-medium">{c.humanMood}</span> · Pet: <span className="font-medium">{c.petMood}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">stress {c.stressLevel}/10 · connection {c.connectionQuality}/10</p>
                  {c.notes && <p className="text-xs mt-1 italic">{c.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
