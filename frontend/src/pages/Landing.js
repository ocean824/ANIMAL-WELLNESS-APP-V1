import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Brain, CalendarCheck, FileText, Gauge, HandHeart, Heart, HeartHandshake,
  Mic, PawPrint, Shield, ShieldCheck, Sparkles, Users,
} from "lucide-react";

const FEATURES = [
  { icon: Gauge, title: "Explainable Bond Score", text: "A 0-100 relationship wellness indicator with trend, confidence labels, and the exact factors behind it. Never a diagnosis." },
  { icon: CalendarCheck, title: "Dual Check-Ins", text: "Track both sides of the bond — your mood and your animal's — in 30 seconds a day." },
  { icon: HandHeart, title: "Gentle Rituals", text: "Low-pressure, consent-based bonding routines. Let the AI craft one tailored to your pet's triggers and comforts." },
  { icon: Brain, title: "Relationship Intelligence", text: "Five explainable dimensions, honest risk notices, and next best actions — with data limits stated plainly." },
  { icon: Sparkles, title: "AI Bond Coach", text: "A safety-guarded coach that summarizes trends and suggests safe next steps. It escalates to professionals when needed." },
  { icon: FileText, title: "Vet-Ready Reports", text: "Organized observation timelines your veterinarian can scan in minutes. Shared only with your consent." },
  { icon: Users, title: "Care Circle", text: "Coordinate caregivers, sitters, fosters, and providers with scoped permissions." },
  { icon: Mic, title: "Voice Support", text: "Hands-free support agent with human escalation for emergencies, billing, and privacy requests." },
  { icon: Bot, title: "AI Agent Workforce", text: "14 role-limited AI employees with risk labels, audit trails, and human approval gates." },
];

const SAFETY = [
  "Never diagnoses medical conditions",
  "Never prescribes medication",
  "Never replaces your veterinarian",
  "Escalates emergencies to professionals",
  "States confidence and data limits honestly",
  "Shares nothing without your consent",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-[hsl(var(--background)/0.92)] backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center"><PawPrint className="w-4 h-4 text-primary-foreground" /></div>
            <span className="font-display text-lg font-semibold">Soula Paws</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" data-testid="landing-login-button">Log in</Button></Link>
            <Link to="/register"><Button className="rounded-xl" data-testid="landing-register-button">Start gently</Button></Link>
          </div>
        </div>
      </header>

      <section className="noise-overlay bg-[radial-gradient(1200px_circle_at_20%_10%,hsl(18_42%_90%)_0%,transparent_55%),radial-gradient(900px_circle_at_80%_0%,hsl(174_38%_90%)_0%,transparent_50%)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="secondary" className="mb-5 border-0 bg-[hsl(var(--accent)/0.5)]">The relationship intelligence layer for you and your animal</Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.08]">
              Care for the bond,<br />not just the pet.
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg">
              Soula Paws is a privacy-first AI wellness OS for the emotional, physical, and behavioral bond between people and their animals — for owners, caregivers, fosters, rescues, and senior-pet families.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register"><Button size="lg" className="rounded-xl shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]" data-testid="landing-primary-cta-button">Start gently — it's free</Button></Link>
              <a href="#safety"><Button size="lg" variant="secondary" className="rounded-xl" data-testid="landing-safety-cta-button">See safety commitments</Button></a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">You control what's shared. Every AI output carries a confidence label.</p>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1606231108210-d9407465881f?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"
              alt="A person gently bonding with their dog at home"
              className="rounded-3xl border border-border shadow-[0_30px_80px_-40px_rgba(0,0,0,0.4)] w-full object-cover aspect-[4/3]"
            />
            <Card className="absolute -bottom-6 -left-4 md:-left-8 rounded-2xl shadow-lg">
              <CardContent className="p-4 flex items-center gap-3">
                <Gauge className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Bond Score 82 · Improving</p>
                  <p className="text-xs text-muted-foreground">Confidence: High · Why? 14 check-ins, 5 rituals</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-center">Not another pet tracker.</h2>
          <p className="text-center text-muted-foreground mt-2 max-w-xl mx-auto">Trackers count steps. Soula Paws understands the relationship — human emotional context, animal wellness, rituals, and care-circle coordination in one intelligence layer.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {FEATURES.map((f) => (
              <Card key={f.title} className="rounded-2xl hover:shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)] transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center mb-3"><f.icon className="w-4.5 h-4.5 text-primary w-5 h-5" /></div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{f.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="py-14 md:py-20 bg-secondary/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4"><ShieldCheck className="w-6 h-6 text-primary" /><h2 className="font-display text-2xl md:text-3xl font-semibold">Our safety commitments</h2></div>
            <p className="text-muted-foreground leading-relaxed">Soula Paws is a wellness support platform — not a veterinarian, therapist, or emergency service. Every AI feature is bounded by non-negotiable guardrails and audit logs.</p>
            <div className="mt-6 space-y-2.5">
              {SAFETY.map((s) => (
                <div key={s} className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[hsl(var(--success))]" />
                  <span className="text-sm">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Example AI insight</p>
              <p className="text-sm leading-relaxed">"Bond Score decreased from 78 to 64 this week. Main factors: ritual completion dropped from 5 days to 1, pet anxiety logs increased, owner stress increased. Suggested next step: try a 5-minute calm connection ritual tonight."</p>
              <p className="text-xs text-muted-foreground italic mt-4">This is not a diagnosis. If symptoms worsen or urgent signs appear, contact a veterinarian.</p>
              <div className="flex gap-2 mt-4">
                <Badge variant="secondary" className="border-0 bg-[hsl(var(--confidence-med)/0.12)] text-[hsl(var(--confidence-med))]">Confidence: Medium</Badge>
                <Badge variant="secondary" className="border-0 bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]">Needs attention</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 md:py-24 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <HeartHandshake className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-display text-3xl md:text-4xl font-semibold">One small step tonight.</h2>
          <p className="text-muted-foreground mt-3">Start with a 30-second check-in and a 5-minute calm connection ritual. You're not alone in this.</p>
          <Link to="/register"><Button size="lg" className="mt-7 rounded-xl" data-testid="landing-footer-cta-button">Create your free account</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2"><PawPrint className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Soula Paws</span></div>
          <p className="text-xs text-muted-foreground text-center">Observation-based wellness support only. Not a veterinary provider. For emergencies, contact a veterinarian or emergency clinic.</p>
        </div>
      </footer>
    </div>
  );
}
