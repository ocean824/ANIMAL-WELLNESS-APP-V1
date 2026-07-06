import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/shared";
import { PawPrint, Pencil, Trash2 } from "lucide-react";

const BLANK = { name: "", species: "Dog", breed: "", age: "", sex: "", weight: "", status: "owned", traits: "", triggers: "", comfortRituals: "", medicalNotes: "", vetContact: "" };
const STATUSES = ["owned", "foster", "rescue", "senior", "other"];

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/pet-profiles"); setPets(data); } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLANK); setEditId(null); setOpen(true); };
  const openEdit = (p) => {
    setForm({ ...p, age: p.age ?? "", weight: p.weight ?? "", traits: (p.traits || []).join(", "), triggers: (p.triggers || []).join(", "), comfortRituals: (p.comfortRituals || []).join(", ") });
    setEditId(p.id); setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.species) { toast.error("Name and species are required."); return; }
    setBusy(true);
    const payload = {
      name: form.name, species: form.species, breed: form.breed, sex: form.sex, status: form.status,
      age: form.age === "" ? null : Number(form.age), weight: form.weight === "" ? null : Number(form.weight),
      traits: form.traits.split(",").map((s) => s.trim()).filter(Boolean),
      triggers: form.triggers.split(",").map((s) => s.trim()).filter(Boolean),
      comfortRituals: form.comfortRituals.split(",").map((s) => s.trim()).filter(Boolean),
      medicalNotes: form.medicalNotes, vetContact: form.vetContact,
    };
    try {
      if (editId) { await api.patch(`/pet-profiles/${editId}`, payload); toast.success("Pet profile updated."); }
      else { await api.post("/pet-profiles", payload); toast.success(`${form.name} added. Welcome!`); }
      setOpen(false); load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Archive ${p.name}'s profile? (soft delete)`)) return;
    try { await api.delete(`/pet-profiles/${p.id}`); toast.success("Profile archived."); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageHeader title="My Pets" subtitle="Profiles power the Bond Score, rituals, and vet-ready reports.">
        <Button onClick={openCreate} className="rounded-xl" data-testid="add-pet-button">Add pet</Button>
      </PageHeader>

      {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : !pets.length ? (
        <EmptyState icon={PawPrint} title="No pets yet" hint="Add your first pet to begin." action={<Button onClick={openCreate} className="rounded-xl">Add my pet</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {pets.map((p) => (
            <Card key={p.id} className="rounded-2xl hover:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)] transition-shadow duration-200" data-testid={`pet-card-${p.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><PawPrint className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.species}{p.breed ? ` · ${p.breed}` : ""}{p.age ? ` · ${p.age} yrs` : ""}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize border-0">{p.status}</Badge>
                </div>
                {(p.traits?.length > 0 || p.triggers?.length > 0) && (
                  <div className="mt-3 space-y-1.5">
                    {p.traits?.length > 0 && <p className="text-xs"><span className="text-muted-foreground">Traits:</span> {p.traits.join(", ")}</p>}
                    {p.triggers?.length > 0 && <p className="text-xs"><span className="text-muted-foreground">Triggers:</span> {p.triggers.join(", ")}</p>}
                    {p.comfortRituals?.length > 0 && <p className="text-xs"><span className="text-muted-foreground">Comforts:</span> {p.comfortRituals.join(", ")}</p>}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => openEdit(p)} data-testid={`edit-pet-button-${p.id}`}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => remove(p)} data-testid={`delete-pet-button-${p.id}`}><Trash2 className="w-3.5 h-3.5 mr-1" /> Archive</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="pet-dialog">
          <DialogHeader><DialogTitle>{editId ? "Edit pet profile" : "Add a pet"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>Name *</Label><Input value={form.name} onChange={set("name")} data-testid="pet-name-input" /></div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1"><Label>Species *</Label><Input value={form.species} onChange={set("species")} data-testid="pet-species-input" /></div>
            <div className="space-y-1.5"><Label>Breed</Label><Input value={form.breed} onChange={set("breed")} data-testid="pet-breed-input" /></div>
            <div className="space-y-1.5"><Label>Sex</Label><Input value={form.sex} onChange={set("sex")} data-testid="pet-sex-input" /></div>
            <div className="space-y-1.5"><Label>Age (years)</Label><Input type="number" value={form.age} onChange={set("age")} data-testid="pet-age-input" /></div>
            <div className="space-y-1.5"><Label>Weight (lbs)</Label><Input type="number" value={form.weight} onChange={set("weight")} data-testid="pet-weight-input" /></div>
            <div className="space-y-1.5 col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger data-testid="pet-status-select"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2"><Label>Traits (comma-separated)</Label><Input value={form.traits} onChange={set("traits")} placeholder="gentle, food motivated" data-testid="pet-traits-input" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Triggers (comma-separated)</Label><Input value={form.triggers} onChange={set("triggers")} placeholder="thunder, vacuum" data-testid="pet-triggers-input" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Comfort rituals (comma-separated)</Label><Input value={form.comfortRituals} onChange={set("comfortRituals")} placeholder="soft blanket, quiet corner" data-testid="pet-comforts-input" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Medical notes (observations only)</Label><Textarea rows={2} value={form.medicalNotes} onChange={set("medicalNotes")} data-testid="pet-medical-input" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Vet contact</Label><Input value={form.vetContact} onChange={set("vetContact")} data-testid="pet-vet-input" /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={busy} className="rounded-xl" data-testid="pet-save-button">{busy ? "Saving..." : "Save pet"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
