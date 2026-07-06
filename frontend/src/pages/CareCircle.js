import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState, PageHeader, PetSelect } from "@/components/shared";
import { Trash2, Users } from "lucide-react";

const BLANK = { name: "", email: "", role: "", permissions: "" };

export default function CareCircle() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => { setPets(data); if (data.length) setPetId(data[0].id); }).catch(() => {});
  }, []);

  const load = async (pid) => {
    try { const { data } = await api.get(`/care-circle-members?petId=${pid}`); setMembers(data); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { if (petId) load(petId); }, [petId]);

  const invite = async () => {
    if (!form.name || !form.email || !form.role) { toast.error("Name, email, and role are required."); return; }
    setBusy(true);
    try {
      await api.post("/care-circle-members", {
        petId, name: form.name, email: form.email, role: form.role,
        permissions: form.permissions.split(",").map((s) => s.trim()).filter(Boolean),
        status: "invited",
      });
      toast.success(`${form.name} invited to the care circle.`);
      setOpen(false); setForm(BLANK); load(petId);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const activate = async (m) => {
    try { await api.patch(`/care-circle-members/${m.id}`, { status: m.status === "active" ? "paused" : "active" }); load(petId); } catch (e) { toast.error(errMsg(e)); }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name} from the care circle?`)) return;
    try { await api.delete(`/care-circle-members/${m.id}`); toast.success("Member removed."); load(petId); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Care Circle" subtitle="Caregivers, sitters, fosters, and providers — with explicit, scoped permissions.">
        <PetSelect pets={pets} value={petId} onChange={setPetId} testId="care-circle-pet-select" />
        <Button onClick={() => setOpen(true)} disabled={!petId} className="rounded-xl" data-testid="invite-member-button">Invite member</Button>
      </PageHeader>

      {!members.length ? (
        <EmptyState icon={Users} title="No care circle members yet" hint="Invite a trusted caregiver or provider viewer with limited permissions." action={petId ? <Button onClick={() => setOpen(true)} className="rounded-xl">Invite someone</Button> : null} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {members.map((m) => (
            <Card key={m.id} className="rounded-2xl" data-testid={`care-member-card-${m.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                    <p className="text-xs mt-1">{m.role}</p>
                  </div>
                  <Badge variant="secondary" className={`capitalize border-0 ${m.status === "active" ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]" : ""}`}>{m.status}</Badge>
                </div>
                {m.permissions?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {m.permissions.map((p) => <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary">{p}</span>)}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => activate(m)} data-testid={`toggle-member-button-${m.id}`}>{m.status === "active" ? "Pause access" : "Activate"}</Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => remove(m)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="invite-member-dialog">
          <DialogHeader><DialogTitle>Invite to care circle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="member-name-input" /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="member-email-input" /></div>
            <div className="space-y-1.5"><Label>Role *</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Evening caregiver, Vet viewer, Foster coordinator..." data-testid="member-role-input" /></div>
            <div className="space-y-1.5"><Label>Permissions (comma-separated)</Label><Input value={form.permissions} onChange={(e) => setForm({ ...form, permissions: e.target.value })} placeholder="log wellness, complete rituals, view reports" data-testid="member-permissions-input" /></div>
          </div>
          <DialogFooter><Button onClick={invite} disabled={busy} className="rounded-xl" data-testid="member-invite-submit-button">{busy ? "Inviting..." : "Send invite"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
