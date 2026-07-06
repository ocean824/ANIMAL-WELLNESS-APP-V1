import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PawPrint, Shield, Gauge, HeartHandshake } from "lucide-react";

const BrandPanel = () => (
  <div className="hidden lg:flex flex-col justify-between noise-overlay bg-[linear-gradient(135deg,hsl(34_33%_97%)_0%,hsl(32_28%_92%)_55%,hsl(34_33%_97%)_100%)] p-10 border-r border-border">
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center"><PawPrint className="w-4 h-4 text-primary-foreground" /></div>
      <span className="font-display text-xl font-semibold">Soula Paws</span>
    </div>
    <div className="space-y-6 max-w-md">
      <h2 className="font-display text-3xl font-semibold leading-snug">The relationship intelligence layer between you and your animal.</h2>
      <div className="space-y-3">
        {[{ icon: Shield, t: "Privacy-first", d: "You control what's shared. Consent gates on every report." },
          { icon: Gauge, t: "Explainable bond scoring", d: "See exactly why the score changed, with honest confidence labels." },
          { icon: HeartHandshake, t: "Safety escalation", d: "The AI recommends professionals when it matters — never guesses." }].map((x) => (
          <div key={x.t} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0"><x.icon className="w-4 h-4 text-primary" /></div>
            <div><p className="text-sm font-semibold">{x.t}</p><p className="text-sm text-muted-foreground">{x.d}</p></div>
          </div>
        ))}
      </div>
    </div>
    <p className="text-xs text-muted-foreground italic">"Milo settled next to me during the calm ritual — first time since his adoption." — a foster caregiver</p>
  </div>
);

export default function AuthPage({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name}.`);
        navigate(user.role === "admin" ? "/admin" : "/dashboard");
      } else if (mode === "register") {
        await register(form.name, form.email, form.password);
        toast.success("Welcome to Soula Paws. Let's start gently.");
        navigate("/dashboard");
      } else if (mode === "forgot") {
        const { data } = await api.post("/auth/forgot-password", { email: form.email });
        setSent(true);
        if (data.devResetToken) setDevToken(data.devResetToken);
      } else if (mode === "reset") {
        if (form.password !== form.confirm) { toast.error("Passwords do not match."); setBusy(false); return; }
        await api.post("/auth/reset-password", { token, password: form.password });
        toast.success("Password reset. Please log in.");
        navigate("/login");
      }
    } catch (e2) {
      toast.error(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    login: ["Welcome back", "Log in to continue caring for the bond."],
    register: ["Start gently", "Create your free account — you control what's shared."],
    forgot: ["Reset my password", "Enter your email and we'll send a reset link."],
    reset: ["Choose a new password", "Make it at least 8 characters."],
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <BrandPanel />
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl shadow-[0_18px_50px_-30px_rgba(0,0,0,0.35)]">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center"><PawPrint className="w-4 h-4 text-primary-foreground" /></div>
              <span className="font-display text-lg font-semibold">Soula Paws</span>
            </div>
            <h1 className="text-xl font-semibold">{titles[mode][0]}</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-6">{titles[mode][1]}</p>

            {mode === "forgot" && sent ? (
              <div className="space-y-4" data-testid="forgot-password-success">
                <p className="text-sm">If an account exists for that email, a reset link has been sent.</p>
                {devToken && (
                  <div className="bg-secondary rounded-xl p-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Development mode — use this link:</p>
                    <Link to={`/reset-password/${devToken}`} className="text-sm text-primary underline break-all" data-testid="dev-reset-link">Open reset page</Link>
                  </div>
                )}
                <Link to="/login"><Button variant="secondary" className="w-full rounded-xl" data-testid="back-to-login-button">Back to login</Button></Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" value={form.name} onChange={set("name")} required placeholder="Alex Rivera" data-testid="auth-name-input" />
                  </div>
                )}
                {(mode === "login" || mode === "register" || mode === "forgot") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" data-testid="auth-email-input" />
                  </div>
                )}
                {(mode === "login" || mode === "register" || mode === "reset") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="password">{mode === "reset" ? "New password" : "Password"}</Label>
                    <Input id="password" type="password" value={form.password} onChange={set("password")} required minLength={8} placeholder="••••••••" data-testid="auth-password-input" />
                  </div>
                )}
                {mode === "reset" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <Input id="confirm" type="password" value={form.confirm} onChange={set("confirm")} required minLength={8} placeholder="••••••••" data-testid="auth-confirm-input" />
                  </div>
                )}
                <Button type="submit" className="w-full rounded-xl" disabled={busy} data-testid={`auth-${mode}-submit-button`}>
                  {busy ? "Please wait..." : mode === "login" ? "Log in" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Reset password"}
                </Button>
              </form>
            )}

            <div className="mt-6 space-y-2 text-center">
              {mode === "login" && (
                <>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline block" data-testid="forgot-password-link">Reset my password</Link>
                  <p className="text-sm text-muted-foreground">New here? <Link to="/register" className="text-primary hover:underline" data-testid="go-register-link">Create account</Link></p>
                </>
              )}
              {mode === "register" && <p className="text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline" data-testid="go-login-link">Log in</Link></p>}
              {(mode === "forgot" || mode === "reset") && !sent && <Link to="/login" className="text-sm text-primary hover:underline" data-testid="back-to-login-link">Back to login</Link>}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-6">Privacy-first: your profiles and logs stay private to your account.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
