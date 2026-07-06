import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PawPrint } from "lucide-react";

export const SafetyBadge = ({ level }) => {
  const map = {
    low: { label: "Safety: Low risk", cls: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.25)]" },
    medium: { label: "Safety: Caution", cls: "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.25)]" },
    high: { label: "Safety: Escalate", cls: "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.25)]" },
  };
  const m = map[level] || map.low;
  return <Badge variant="outline" className={`${m.cls} font-medium`} data-testid="safety-badge">{m.label}</Badge>;
};

export const ConfidenceBadge = ({ level }) => {
  const map = {
    low: "bg-[hsl(var(--confidence-low)/0.12)] text-[hsl(var(--confidence-low))]",
    medium: "bg-[hsl(var(--confidence-med)/0.12)] text-[hsl(var(--confidence-med))]",
    high: "bg-[hsl(var(--confidence-high)/0.12)] text-[hsl(var(--confidence-high))]",
  };
  return (
    <Badge variant="secondary" className={`${map[level] || map.low} font-medium border-0`} data-testid="confidence-badge">
      Confidence: {level ? level[0].toUpperCase() + level.slice(1) : "Low"}
    </Badge>
  );
};

export const TrendChip = ({ trend }) => {
  const map = {
    improving: { label: "Improving", cls: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]" },
    stable: { label: "Stable", cls: "bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))]" },
    needs_attention: { label: "Needs attention", cls: "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]" },
  };
  const m = map[trend] || map.stable;
  return <Badge variant="secondary" className={`${m.cls} border-0 font-medium`} data-testid="trend-chip">{m.label}</Badge>;
};

export const scoreColor = (score) =>
  score >= 70 ? "hsl(var(--bond-high))" : score >= 40 ? "hsl(var(--bond-mid))" : "hsl(var(--bond-low))";

export const ScoreGauge = ({ score = 0, size = 180 }) => {
  const r = size / 2 - 14;
  const circumference = Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative inline-flex flex-col items-center" data-testid="score-gauge">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M 14 ${size / 2 + 6} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2 + 6}`}
          fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round"
        />
        <path
          d={`M 14 ${size / 2 + 6} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2 + 6}`}
          fill="none" stroke={scoreColor(score)} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color: scoreColor(score) }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

export const EmptyState = ({ icon: Icon = PawPrint, title, hint, action }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center" data-testid="empty-state">
    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="font-medium text-sm">{title}</p>
    {hint && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
  </div>
);

export const PetSelect = ({ pets, value, onChange, testId = "pet-select" }) => (
  <Select value={value || ""} onValueChange={onChange}>
    <SelectTrigger className="w-[200px] bg-card" data-testid={testId}>
      <SelectValue placeholder="Select a pet" />
    </SelectTrigger>
    <SelectContent>
      {pets.map((p) => (
        <SelectItem key={p.id} value={p.id} data-testid={`pet-option-${p.id}`}>
          {p.name} ({p.species})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const SliderField = ({ label, value, onChange, min = 1, max = 10, testId }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <span className="text-xs font-semibold bg-secondary rounded-full px-2 py-0.5">{value}</span>
    </div>
    <input
      type="range" min={min} max={max} step={1} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[hsl(var(--primary))] cursor-pointer"
      data-testid={testId}
    />
    <div className="flex justify-between text-[10px] text-muted-foreground"><span>{min}</span><span>{Math.round((min + max) / 2)}</span><span>{max}</span></div>
  </div>
);

export const DisclaimerNote = ({ text }) => (
  <p className="text-[11px] text-muted-foreground italic" data-testid="disclaimer-note">
    {text || "Soula Paws provides observation-based wellness support only. It does not diagnose, prescribe, or replace veterinary care."}
  </p>
);
