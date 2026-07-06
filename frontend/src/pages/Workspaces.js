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
import { HeartHandshake, Pencil, Trash2 } from "lucide-react";

const MODES = ["household", "rescue", "foster", "senior", "grief_support", "training"];
const PRIVACY = ["private", "care_circle", "provider_ready"];
const BLANK = { name: "", description: "", mode: "household", petIds: [], goals: "", privacyLevel: "private", status: "active" };

export default function Workspaces() {
  const [pods, setPods] = useState([]);
  const [pets, setPets] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [p, petsRes] = await Promise.all([api.get("/relationship-pods"), api.get("/pet-profiles")]);
      setPods(p.data); setPets(petsRes.data);
    } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLANK); setEditId(null); setOpen(true); };
  const openEdit = (p) => { setForm({ ...p, goals: (p.goals || []).join(", "), petIds: p.petIds || [] }); setEditId(p.id); setOpen(true); };

  const togglePet = (id) => setForm((f) => ({ ...f, petIds: f.petIds.includes(id) ? f.petIds.filter((x) => x !== id) : [...f.petIds, id] }));

  const save = async () => {
    if (!form.name) { toast.error("Workspace name is required."); return; }
    setBusy(true);
    const payload = { name: form.name, description: form.description, mode: form.mode, petIds: form.petIds, goals: form.goals.split(",").map((s) => s.trim()).filter(Boolean), privacyLevel: form.privacyLevel, status: form.status || "active", humanProfileIds: form.humanProfileIds || [] };
    try {
      if (editId) await api.patch(`/relationship-pods/${editId}`, payload);
      else await api.post("/relationship-pods", payload);
      toast.success("Workspace saved."); setOpen(false); load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Archive workspace "${p.name}"?`)) return;
    try { await api.delete(`/relationship-pods/${p.id}`); toast.success("Workspace archived."); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Relationship Workspaces" subtitle="Tie pets, humans, goals, and privacy together — for households, rescues, fosters, senior care, and grief support.">
        <Button onClick={openCreate} className="rounded-xl" data-testid="add-workspace-button">New workspace</Button>
      </PageHeader>

      {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : !pods.length ? (
        <EmptyState icon={HeartHandshake} title="No workspaces yet" hint="Create a workspace to organize a bond journey around shared goals." action={<Button onClick={openCreate} className="rounded-xl">Create workspace</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {pods.map((p) => (
            <Card key={p.id} className="rounded-2xl" data-testid={`workspace-card-${p.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{p.name}</p>
                  <div className="flex gap-1.5">
                    <Badge variant="secondary" className="capitalize border-0">{p.mode?.replace("_", " ")}</Badge>
                    <Badge variant="secondary" className="capitalize border-0 bg-[hsl(var(--accent)/0.4)]">{p.privacyLevel?.replace("_", " ")}</Badge>
                  </div>
                </div>
                {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
                <p className="text-xs text-muted-foreground mt-2">Pets: {(p.petIds || []).map((id) => pets.find((x) => x.id === id)?.name || "?").join(", ") || "none"}</p>
                {p.goals?.length > 0 && <p className="text-xs mt-1"><span className="text-muted-foreground">Goals:</span> {p.goals.join(", ")}</p>}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => openEdit(p)} data-testid={`edit-workspace-button-${p.id}`}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => remove(p)}><Trash2 className="w-3.5 h-3.5 mr-1" /> Archive</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-testid="workspace-dialog">
          <DialogHeader><DialogTitle>{editId ? "Edit workspace" : "New relationship workspace"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="workspace-name-input" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="workspace-description-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                  <SelectTrigger data-testid="workspace-mode-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{MODES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Privacy level</Label>
                <Select value={form.privacyLevel} onValueChange={(v) => setForm({ ...form, privacyLevel: v })}>
                  <SelectTrigger data-testid="workspace-privacy-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIVACY.map((m) => <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Pets in this workspace</Label>
              <div className="flex flex-wrap gap-2">
                {pets.map((p) => (
                  <button key={p.id} type="button" onClick={() => togglePet(p.id)} data-testid={`workspace-pet-toggle-${p.id}`}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${form.petIds.includes(p.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary"}`}>
                    {p.name}
                  </button>
                ))}
                {!pets.length && <p className="text-xs text-muted-foreground">Add a pet first.</p>}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Goals (comma-separated)</Label><Input value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} placeholder="increase calm connection, prepare vet summaries" data-testid="workspace-goals-input" /></div>
          </div>
          <DialogFooter><Button onClick={save} disabled={busy} className="rounded-xl" data-testid="workspace-save-button">{busy ? "Saving..." : "Save workspace"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
