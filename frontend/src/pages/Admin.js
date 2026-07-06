import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared";
import { Activity, BookOpen, Bot, FileSearch, Ticket, Users } from "lucide-react";

const StatCard = ({ label, value, testId }) => (
  <Card className="rounded-2xl"><CardContent className="p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold mt-1" data-testid={testId}>{value ?? "—"}</p>
  </CardContent></Card>
);

export default function Admin() {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [runs, setRuns] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [kb, setKb] = useState([]);
  const [health, setHealth] = useState(null);
  const [kbOpen, setKbOpen] = useState(false);
  const [kbForm, setKbForm] = useState({ title: "", category: "general", content: "" });

  const load = async () => {
    try {
      const [m, u, a, r, h, k, t] = await Promise.all([
        api.get("/admin/metrics"), api.get("/admin/users"), api.get("/audit-logs?limit=100"),
        api.get("/agents/runs"), api.get("/admin/system-health"), api.get("/knowledge-articles?limit=100"),
        api.get("/support-tickets?limit=100"),
      ]);
      setMetrics(m.data); setUsers(u.data); setAudit(a.data); setRuns(r.data); setHealth(h.data); setKb(k.data); setTickets(t.data);
    } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (u) => {
    try { await api.patch(`/admin/users/${u.id}`, { isActive: !u.isActive }); toast.success(`${u.name} ${u.isActive ? "disabled" : "enabled"}.`); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const changeRole = async (u, role) => {
    try { await api.patch(`/admin/users/${u.id}`, { role }); toast.success("Role updated."); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const changePlan = async (u, plan) => {
    try { await api.patch(`/admin/users/${u.id}`, { plan }); toast.success(`Plan set to ${plan}.`); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const updateTicket = async (t, status) => {
    try { await api.patch(`/admin/tickets/${t.id}`, { status }); toast.success("Ticket updated."); load(); } catch (e) { toast.error(errMsg(e)); }
  };
  const saveKb = async () => {
    if (!kbForm.title || !kbForm.content) { toast.error("Title and content required."); return; }
    try { await api.post("/knowledge-articles", kbForm); toast.success("Article added."); setKbOpen(false); setKbForm({ title: "", category: "general", content: "" }); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Users, AI usage, escalations, audit trail, and system health.">
        {health && <Badge variant="secondary" className={`border-0 ${health.status === "ok" ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]" : "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]"}`} data-testid="admin-health-badge">System {health.status} · DB {health.database} · AI {health.aiProvider}</Badge>}
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active users" value={metrics?.activeUsers} testId="admin-stat-users" />
        <StatCard label="Pets" value={metrics?.totalPets} testId="admin-stat-pets" />
        <StatCard label="AI usage calls" value={metrics?.aiUsageCalls} testId="admin-stat-ai" />
        <StatCard label="Open tickets" value={metrics?.openTickets} testId="admin-stat-tickets" />
        <StatCard label="Agent runs" value={metrics?.agentRuns} testId="admin-stat-runs" />
        <StatCard label="Pending approvals" value={metrics?.pendingApprovals} testId="admin-stat-approvals" />
        <StatCard label="Reports" value={metrics?.reports} testId="admin-stat-reports" />
        <StatCard label="Audit entries" value={metrics?.auditLogEntries} testId="admin-stat-audit" />
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="users" data-testid="admin-users-tab"><Users className="w-3.5 h-3.5 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="tickets" data-testid="admin-tickets-tab"><Ticket className="w-3.5 h-3.5 mr-1" /> Tickets</TabsTrigger>
          <TabsTrigger value="audit" data-testid="admin-audit-tab"><FileSearch className="w-3.5 h-3.5 mr-1" /> Audit Logs</TabsTrigger>
          <TabsTrigger value="runs" data-testid="admin-runs-tab"><Bot className="w-3.5 h-3.5 mr-1" /> Agent Runs</TabsTrigger>
          <TabsTrigger value="kb" data-testid="admin-kb-tab"><BookOpen className="w-3.5 h-3.5 mr-1" /> Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="rounded-2xl"><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} data-testid={`admin-user-row-${u.id}`}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => changeRole(u, v)}>
                        <SelectTrigger className="w-[130px] h-8" data-testid={`admin-role-select-${u.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{["owner", "caregiver", "provider", "admin"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={u.plan || "free"} onValueChange={(v) => changePlan(u, v)}>
                        <SelectTrigger className="w-[110px] h-8" data-testid={`admin-plan-select-${u.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{["free", "premium"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className={`border-0 ${u.isActive ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]" : "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]"}`}>{u.isActive ? "active" : "disabled"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => toggleActive(u)} data-testid={`admin-toggle-user-${u.id}`}>{u.isActive ? "Disable" : "Enable"}</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="tickets">
          <div className="space-y-3">
            {!tickets.length && <p className="text-sm text-muted-foreground">No support tickets.</p>}
            {tickets.map((t) => (
              <Card key={t.id} className="rounded-2xl" data-testid={`admin-ticket-${t.id}`}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <p className="font-medium text-sm">{t.subject}</p>
                      <Badge variant="secondary" className={`border-0 capitalize ${t.priority === "urgent" ? "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]" : t.priority === "high" ? "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]" : ""}`}>{t.priority}</Badge>
                      <Badge variant="secondary" className="border-0 capitalize">{t.status?.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t.description?.slice(0, 140)} · {new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {t.status === "open" && <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => updateTicket(t, "in_progress")} data-testid={`admin-ticket-progress-${t.id}`}>Take</Button>}
                    {t.status !== "resolved" && t.status !== "closed" && <Button size="sm" className="rounded-lg" onClick={() => updateTicket(t, "resolved")} data-testid={`admin-ticket-resolve-${t.id}`}>Resolve</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="rounded-2xl"><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>User</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
              <TableBody>
                {audit.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-xs">{a.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.entityType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.userId?.slice(0, 12) || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="runs">
          <div className="space-y-3">
            {!runs.length && <p className="text-sm text-muted-foreground">No agent runs yet.</p>}
            {runs.map((r) => (
              <Card key={r.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex gap-1.5 items-center flex-wrap">
                    <Badge variant="secondary" className="border-0 capitalize">{r.agentKey?.replace(/_/g, " ")}</Badge>
                    <Badge variant="secondary" className="border-0 capitalize">{r.status?.replace(/_/g, " ")}</Badge>
                    <Badge variant="secondary" className="border-0">confidence: {r.confidence}</Badge>
                    <Badge variant="secondary" className="border-0">risk: {r.riskLevel}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Input: {r.input?.slice(0, 160)}</p>
                  <p className="text-sm mt-1 line-clamp-3">{r.output}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kb">
          <div className="flex justify-end mb-3"><Button onClick={() => setKbOpen(true)} className="rounded-xl" data-testid="admin-add-kb-button">Add article</Button></div>
          <div className="grid sm:grid-cols-2 gap-4">
            {kb.map((a) => (
              <Card key={a.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between"><p className="font-medium text-sm">{a.title}</p><Badge variant="secondary" className="border-0 capitalize">{a.category}</Badge></div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{a.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={kbOpen} onOpenChange={setKbOpen}>
        <DialogContent data-testid="admin-kb-dialog">
          <DialogHeader><DialogTitle>New knowledge article</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={kbForm.title} onChange={(e) => setKbForm({ ...kbForm, title: e.target.value })} data-testid="kb-title-input" /></div>
            <div className="space-y-1.5"><Label>Category</Label><Input value={kbForm.category} onChange={(e) => setKbForm({ ...kbForm, category: e.target.value })} data-testid="kb-category-input" /></div>
            <div className="space-y-1.5"><Label>Content *</Label><Textarea rows={5} value={kbForm.content} onChange={(e) => setKbForm({ ...kbForm, content: e.target.value })} data-testid="kb-content-input" /></div>
          </div>
          <DialogFooter><Button onClick={saveKb} className="rounded-xl" data-testid="kb-save-button">Save article</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
