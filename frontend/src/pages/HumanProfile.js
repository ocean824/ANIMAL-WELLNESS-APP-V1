import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PageHeader, SliderField } from "@/components/shared";

const BLANK = { displayName: "", currentMood: "", stressLevel: 5, emotionalGoals: "", preferredRoutines: "", notes: "" };

export default function HumanProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/human-profiles?limit=1");
        if (data[0]) {
          setProfile(data[0]);
          setForm({
            displayName: data[0].displayName || "",
            currentMood: data[0].currentMood || "",
            stressLevel: data[0].stressLevel ?? 5,
            emotionalGoals: (data[0].emotionalGoals || []).join(", "),
            preferredRoutines: (data[0].preferredRoutines || []).join(", "),
            notes: data[0].notes || "",
          });
        }
      } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
    };
    load();
  }, []);

  const save = async () => {
    if (!form.displayName) { toast.error("Display name is required."); return; }
    setBusy(true);
    const payload = {
      displayName: form.displayName, currentMood: form.currentMood, stressLevel: form.stressLevel,
      emotionalGoals: form.emotionalGoals.split(",").map((s) => s.trim()).filter(Boolean),
      preferredRoutines: form.preferredRoutines.split(",").map((s) => s.trim()).filter(Boolean),
      notes: form.notes,
    };
    try {
      if (profile) { await api.patch(`/human-profiles/${profile.id}`, payload); }
      else { const { data } = await api.post("/human-profiles", payload); setProfile(data); }
      toast.success("Your profile is saved.");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="My Human Profile" subtitle="Soula Paws tracks both sides of the bond — your emotional context matters too." />
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5"><Label>Display name *</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} data-testid="human-name-input" /></div>
          <div className="space-y-1.5"><Label>Current mood</Label><Input placeholder="hopeful, tired, grounded..." value={form.currentMood} onChange={(e) => setForm({ ...form, currentMood: e.target.value })} data-testid="human-mood-input" /></div>
          <SliderField label="Baseline stress level" value={form.stressLevel} onChange={(v) => setForm({ ...form, stressLevel: v })} testId="human-stress-slider" />
          <div className="space-y-1.5">
            <Label>Emotional goals (comma-separated)</Label>
            <Input placeholder="reduce anxiety together, build trust with my rescue" value={form.emotionalGoals} onChange={(e) => setForm({ ...form, emotionalGoals: e.target.value })} data-testid="human-goals-input" />
            <p className="text-xs text-muted-foreground">e.g. "I want to reduce anxiety with my dog", "track grief and senior-pet support"</p>
          </div>
          <div className="space-y-1.5"><Label>Preferred routines (comma-separated)</Label><Input placeholder="morning walk, evening decompression" value={form.preferredRoutines} onChange={(e) => setForm({ ...form, preferredRoutines: e.target.value })} data-testid="human-routines-input" /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="human-notes-input" /></div>
          <Button onClick={save} disabled={busy} className="rounded-xl" data-testid="human-save-button">{busy ? "Saving..." : "Save profile"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
