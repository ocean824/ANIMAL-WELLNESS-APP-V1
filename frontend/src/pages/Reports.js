import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState, PageHeader, PetSelect } from "@/components/shared";
import { Download, FileText, Share2, Trash2 } from "lucide-react";

const TYPES = [
  { value: "vet_ready", label: "Vet-ready report" },
  { value: "user_wellness", label: "User wellness report" },
  { value: "caregiver", label: "Caregiver handoff report" },
  { value: "pod_intelligence", label: "Workspace intelligence report" },
];

export default function Reports() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [type, setType] = useState("vet_ready");
  const [reports, setReports] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(null);
  const [shareWith, setShareWith] = useState("");

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => { setPets(data); if (data.length) setPetId(data[0].id); }).catch(() => {});
  }, []);

  const load = async () => {
    try { const { data } = await api.get("/reports?limit=50"); setReports(data); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/reports/generate", { petId, type });
      toast.success("Report generated with AI narrative.");
      setViewing(data);
      load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const download = (r) => {
    const blob = new Blob([r.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title.replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (!shareWith.trim()) { toast.error("Enter who to share with."); return; }
    try {
      await api.post(`/reports/${shareOpen.id}/share`, { sharedWith: shareWith });
      toast.success(`Report marked shared with ${shareWith}.`);
      setShareOpen(null); setShareWith(""); load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const remove = async (r) => {
    if (!window.confirm("Archive this report?")) return;
    try { await api.delete(`/reports/${r.id}`); toast.success("Report archived."); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  const renderMarkdown = (md) => md.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i}>{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
    if (line.startsWith("- ")) return <li key={i} className="ml-4 list-disc text-sm">{line.slice(2)}</li>;
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i}>{line}</p>;
  });

  return (
    <div>
      <PageHeader title="Reports" subtitle="Vet-ready, wellness, caregiver, and workspace reports — shared only with your consent." />
      <Card className="rounded-2xl mb-6">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="space-y-1.5">
            <Label>Pet</Label>
            <PetSelect pets={pets} value={petId} onChange={setPetId} testId="reports-pet-select" />
          </div>
          <div className="space-y-1.5">
            <Label>Report type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[240px]" data-testid="reports-type-select"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={busy || !petId} className="rounded-xl" data-testid="reports-generate-button">{busy ? "Generating (AI narrative)..." : "Generate report"}</Button>
        </CardContent>
      </Card>

      {!reports.length ? <EmptyState icon={FileText} title="No reports yet" hint="Generate a vet-ready report before your next appointment." /> : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="rounded-2xl" data-testid={`report-card-${r.id}`}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm capitalize">{r.title}</p>
                    <Badge variant="secondary" className="border-0 capitalize">{r.status}</Badge>
                    {r.sharedWith && <Badge variant="secondary" className="border-0 bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))]">shared: {r.sharedWith}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.summary}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="secondary" className="rounded-lg" onClick={() => setViewing(r)} data-testid={`view-report-button-${r.id}`}>View</Button>
                  <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => download(r)} data-testid={`download-report-button-${r.id}`}><Download className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setShareOpen(r)} data-testid={`share-report-button-${r.id}`}><Share2 className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive" onClick={() => remove(r)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="report-view-dialog">
          <DialogHeader><DialogTitle className="capitalize">{viewing?.title}</DialogTitle></DialogHeader>
          <div className="markdown-body">{viewing && renderMarkdown(viewing.content)}</div>
          <DialogFooter><Button variant="secondary" className="rounded-xl" onClick={() => download(viewing)}>Download .md</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareOpen} onOpenChange={(o) => !o && setShareOpen(null)}>
        <DialogContent data-testid="report-share-dialog">
          <DialogHeader><DialogTitle>Share report</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Sharing requires the "Report sharing" consent in Privacy & Consent. The share is recorded in your audit log.</p>
          <div className="space-y-1.5">
            <Label>Share with (name or email)</Label>
            <Input value={shareWith} onChange={(e) => setShareWith(e.target.value)} placeholder="Dr. Rivera, City Vet Clinic" data-testid="report-share-input" />
          </div>
          <DialogFooter><Button onClick={share} className="rounded-xl" data-testid="report-share-confirm-button">Share with consent</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
