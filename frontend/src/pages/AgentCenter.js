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
import { toast } from "sonner";
import { PageHeader } from "@/components/shared";
import { Bot, Play } from "lucide-react";

const RISK_CLS = {
  low: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
  medium: "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
  high: "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]",
};

export default function AgentCenter() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [runOpen, setRunOpen] = useState(null);
  const [form, setForm] = useState({ title: "", prompt: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const load = async () => {
    try {
      const [a, t, ap] = await Promise.all([api.get("/agents/registry"), api.get("/agents/tasks"), api.get("/agents/approvals")]);
      setAgents(a.data); setTasks(t.data); setApprovals(ap.data);
    } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, []);

  const run = async () => {
    if (!form.title || !form.prompt) { toast.error("Title and task prompt are required."); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/agents/run", { agentKey: runOpen.key, title: form.title, prompt: form.prompt });
      setResult(data);
      toast.success(data.requiresApproval ? "Run complete — pending your approval (high-risk agent)." : "Agent run complete.");
      setForm({ title: "", prompt: "" });
      load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const decide = async (approval, status) => {
    try {
      await api.post(`/agents/approvals/${approval.id}/decide`, { status });
      toast.success(`Approval ${status}.`);
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  return (
    <div>
      <PageHeader title="Agent Command Center" subtitle="14 role-limited AI employees with risk labels, audit trails, and human approval gates." />

      {pendingApprovals.length > 0 && (
        <Card className="rounded-2xl mb-6 border-[hsl(var(--warning)/0.4)]" data-testid="approvals-queue-card">
          <CardContent className="p-5">
            <p className="text-sm font-semibold mb-3">Pending approvals ({pendingApprovals.length})</p>
            <div className="space-y-3">
              {pendingApprovals.map((a) => (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border last:border-0 pb-3 last:pb-0">
                  <p className="text-sm">{a.action}</p>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" className="rounded-lg" onClick={() => decide(a, "approved")} data-testid={`approve-button-${a.id}`}>Approve</Button>
                    <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => decide(a, "rejected")} data-testid={`reject-button-${a.id}`}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="agents">
        <TabsList className="mb-4">
          <TabsTrigger value="agents" data-testid="agents-tab">Agents ({agents.length})</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tasks-tab">My tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="approvals" data-testid="approvals-tab">Approvals ({approvals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a) => (
              <Card key={a.id} className="rounded-2xl hover:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)] transition-shadow duration-200" data-testid={`agent-card-${a.key}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"><Bot className="w-4.5 h-4.5 text-primary w-5 h-5" /></div>
                    <Badge variant="secondary" className={`border-0 capitalize ${RISK_CLS[a.riskLevel]}`}>{a.riskLevel} risk</Badge>
                  </div>
                  <p className="font-semibold text-sm mt-3">{a.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Tools: {(a.tools || []).join(", ")}</p>
                  <Button size="sm" className="rounded-lg mt-3 w-full" onClick={() => { setRunOpen(a); setResult(null); }} data-testid={`run-agent-button-${a.key}`}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Run task
                  </Button>
                  {a.riskLevel === "high" && <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Requires human approval</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="space-y-3">
            {!tasks.length && <p className="text-sm text-muted-foreground">No agent tasks yet — run an agent to get started.</p>}
            {tasks.map((t) => (
              <Card key={t.id} className="rounded-2xl" data-testid={`task-card-${t.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-medium text-sm">{t.title}</p>
                    <div className="flex gap-1.5">
                      <Badge variant="secondary" className="border-0 capitalize">{t.assignedAgentKey?.replace(/_/g, " ")}</Badge>
                      <Badge variant="secondary" className={`border-0 capitalize ${t.status === "completed" ? RISK_CLS.low : t.status === "needs_approval" ? RISK_CLS.medium : ""}`}>{t.status?.replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.input}</p>
                  {t.result && <p className="text-sm mt-2 bg-secondary/50 rounded-xl p-3 whitespace-pre-wrap max-h-48 overflow-y-auto">{t.result}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <div className="space-y-3">
            {!approvals.length && <p className="text-sm text-muted-foreground">No approvals yet. High-risk agent runs will appear here for your review.</p>}
            {approvals.map((a) => (
              <Card key={a.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm">{a.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary" className={`border-0 capitalize ${a.status === "pending" ? RISK_CLS.medium : a.status === "approved" ? RISK_CLS.low : RISK_CLS.high}`}>{a.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!runOpen} onOpenChange={(o) => !o && setRunOpen(null)}>
        <DialogContent className="max-w-lg" data-testid="run-agent-dialog">
          <DialogHeader><DialogTitle>Run: {runOpen?.name}</DialogTitle></DialogHeader>
          {runOpen?.riskLevel === "high" && (
            <p className="text-xs bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] rounded-xl p-3">This is a high-risk agent. Its output will require your explicit approval before the task completes.</p>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Task title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="agent-task-title-input" /></div>
            <div className="space-y-1.5"><Label>Task prompt *</Label><Textarea rows={4} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="Describe what you want this agent to do..." data-testid="agent-task-prompt-input" /></div>
            {result && (
              <div className="bg-secondary/50 rounded-xl p-3 max-h-56 overflow-y-auto">
                <p className="text-xs font-semibold mb-1">Output {result.requiresApproval ? "(pending approval)" : ""}</p>
                <p className="text-sm whitespace-pre-wrap">{result.run?.output}</p>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={run} disabled={busy} className="rounded-xl" data-testid="agent-run-submit-button">{busy ? "Running agent..." : "Run agent"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
