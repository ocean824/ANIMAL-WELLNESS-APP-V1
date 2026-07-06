import { useEffect, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared";
import { Download, Shield, Trash2 } from "lucide-react";

const CONSENT_TYPES = [
  { type: "ai_wellness_assistance", label: "AI wellness assistance", desc: "Allow the AI Bond Coach and intelligence engine to analyze your logs and generate insights. The AI never diagnoses or replaces a veterinarian." },
  { type: "report_sharing", label: "Report sharing", desc: "Allow reports to be marked as shared with vets, caregivers, or providers you name. Nothing leaves your account without this consent." },
  { type: "care_circle_visibility", label: "Care circle visibility", desc: "Allow invited care circle members to be listed on your pet's records with the permissions you set." },
  { type: "anonymous_product_analytics", label: "Anonymous product analytics", desc: "Allow anonymized usage patterns to improve Soula Paws. Never includes your notes, logs, or identity." },
];

export default function Privacy() {
  const [records, setRecords] = useState([]);
  const [busyType, setBusyType] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try { const { data } = await api.get("/consent-records?limit=100"); setRecords(data); } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, []);

  const currentFor = (type) => records.find((r) => r.consentType === type);

  const toggle = async (type, granted) => {
    setBusyType(type);
    try {
      const existing = currentFor(type);
      if (existing) await api.patch(`/consent-records/${existing.id}`, { granted });
      else await api.post("/consent-records", { consentType: type, granted, details: `User ${granted ? "granted" : "revoked"} via Privacy & Consent page.` });
      toast.success(`Consent ${granted ? "granted" : "revoked"}.`);
      load();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusyType(null); }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/privacy/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soula-paws-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data export downloaded. The export was recorded in your audit log.");
    } catch (e) { toast.error(errMsg(e)); } finally { setExporting(false); }
  };

  const requestDeletion = async () => {
    if (!window.confirm("Request account deletion? A privacy team member will verify your identity before anything is removed.")) return;
    setDeleting(true);
    try {
      const { data } = await api.post("/privacy/delete-request");
      toast.success(data.message);
    } catch (e) { toast.error(errMsg(e)); } finally { setDeleting(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Privacy & Consent" subtitle="You control what's shared. Every change here is recorded with a timestamp." />
      <div className="space-y-4">
        {CONSENT_TYPES.map((c) => {
          const rec = currentFor(c.type);
          const granted = rec?.granted || false;
          return (
            <Card key={c.type} className="rounded-2xl" data-testid={`consent-card-${c.type}`}>
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</p>
                  {rec && <p className="text-[10px] text-muted-foreground mt-2">Last updated {new Date(rec.updatedAt).toLocaleString()}</p>}
                </div>
                <Switch checked={granted} disabled={busyType === c.type} onCheckedChange={(v) => toggle(c.type, v)} data-testid={`privacy-consent-toggle-${c.type}`} />
              </CardContent>
            </Card>
          );
        })}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Data requests</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Export my data</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download a complete JSON copy of everything in your account — profiles, logs, scores, conversations, reports, and consent history.</p>
              </div>
              <Button variant="secondary" className="rounded-xl shrink-0" onClick={exportData} disabled={exporting} data-testid="privacy-export-button">
                <Download className="w-4 h-4 mr-1.5" /> {exporting ? "Preparing..." : "Export JSON"}
              </Button>
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
              <div>
                <p className="text-sm font-medium">Request account deletion</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deletion goes through a verified human review workflow to protect you. A high-priority privacy ticket is created and our team will contact you before anything is removed.</p>
              </div>
              <Button variant="ghost" className="rounded-xl shrink-0 text-destructive hover:text-destructive" onClick={requestDeletion} disabled={deleting} data-testid="privacy-delete-request-button">
                <Trash2 className="w-4 h-4 mr-1.5" /> {deleting ? "Sending..." : "Request deletion"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
