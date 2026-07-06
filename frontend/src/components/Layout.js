import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell, Bot, Brain, CalendarCheck, FileText, Gauge, HandHeart, Heart, HeartHandshake,
  LayoutDashboard, LogOut, Menu, Mic, PawPrint, Settings, Shield, ShieldCheck, Sparkles, User, Users,
} from "lucide-react";

const NAV = [
  { section: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]},
  { section: "Profiles", items: [
    { to: "/profile", label: "My Human Profile", icon: User },
    { to: "/pets", label: "My Pets", icon: PawPrint },
    { to: "/workspaces", label: "Workspaces", icon: HeartHandshake },
    { to: "/care-circle", label: "Care Circle", icon: Users },
  ]},
  { section: "Daily Wellness", items: [
    { to: "/check-ins", label: "Daily Check-In", icon: CalendarCheck },
    { to: "/wellness", label: "Wellness Logs", icon: Heart },
    { to: "/rituals", label: "Rituals", icon: HandHeart },
  ]},
  { section: "Intelligence", items: [
    { to: "/bond-score", label: "Bond Score", icon: Gauge },
    { to: "/intelligence", label: "Relationship Intelligence", icon: Brain },
    { to: "/coach", label: "AI Bond Coach", icon: Sparkles },
    { to: "/reports", label: "Reports", icon: FileText },
  ]},
  { section: "Support", items: [
    { to: "/voice-support", label: "Voice Support", icon: Mic },
    { to: "/agents", label: "Agent Center", icon: Bot },
    { to: "/privacy", label: "Privacy & Consent", icon: Shield },
  ]},
];

const SidebarNav = ({ onNavigate }) => {
  const location = useLocation();
  const { user } = useAuth();
  return (
    <div className="flex flex-col h-full">
      <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5" data-testid="sidebar-logo-link" onClick={onNavigate}>
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <PawPrint className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display text-lg font-semibold">Soula Paws</span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} onClick={onNavigate}
                    data-testid={`nav-link-${item.to.replace("/", "")}`}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-200 ${
                      active ? "bg-secondary font-medium text-foreground border-l-2 border-primary" : "text-muted-foreground hover:bg-[hsl(var(--secondary)/0.6)] hover:text-foreground"
                    }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {user?.role === "admin" && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 mb-1.5">Admin</p>
            <Link to="/admin" onClick={onNavigate} data-testid="nav-link-admin"
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-200 ${
                location.pathname === "/admin" ? "bg-secondary font-medium border-l-2 border-primary" : "text-muted-foreground hover:bg-[hsl(var(--secondary)/0.6)] hover:text-foreground"
              }`}>
              <ShieldCheck className="w-4 h-4" />
              Admin Dashboard
            </Link>
          </div>
        )}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground">Not a veterinary service. For emergencies, contact a vet or emergency clinic.</p>
      </div>
    </div>
  );
};

const NotificationsBell = () => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.readAt).length;

  const load = async () => {
    try { const { data } = await api.get("/notifications?limit=20"); setItems(data); } catch (_) { /* silent */ }
  };
  useEffect(() => { load(); }, []);

  const markRead = async (n) => {
    if (n.readAt) return;
    try { await api.patch(`/notifications/${n.id}`, { readAt: new Date().toISOString() }); load(); } catch (_) { /* silent */ }
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) load(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notifications-bell-button">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center" data-testid="notifications-unread-count">{unread}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border font-medium text-sm">Notifications</div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && <p className="text-sm text-muted-foreground px-4 py-6 text-center">No notifications yet.</p>}
          {items.map((n) => (
            <button key={n.id} onClick={() => markRead(n)} data-testid={`notification-item-${n.id}`}
              className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${!n.readAt ? "bg-[hsl(var(--accent)/0.25)]" : ""}`}>
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ChangePasswordDialog = ({ open, onOpenChange }) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/auth/change-password", { currentPassword: current, newPassword: next });
      toast.success("Password changed successfully.");
      onOpenChange(false); setCurrent(""); setNext("");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="change-password-dialog">
        <DialogHeader><DialogTitle>Change password</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} data-testid="change-password-current-input" />
          <Input type="password" placeholder="New password (min 8 characters)" value={next} onChange={(e) => setNext(e.target.value)} data-testid="change-password-new-input" />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || next.length < 8} data-testid="change-password-submit-button">{busy ? "Saving..." : "Change password"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-card border-r border-border flex-col z-30">
        <SidebarNav />
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-[hsl(var(--background)/0.92)] backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" data-testid="mobile-menu-button"><Menu className="w-5 h-5" /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-card">
                  <SidebarNav onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <Badge variant="secondary" className="hidden sm:inline-flex border-0 bg-[hsl(var(--accent)/0.4)] text-accent-foreground font-normal">
                Privacy-first · Observation-based · Never a diagnosis
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3" data-testid="user-menu-button">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user?.email} · {user?.role}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setPwOpen(true)} data-testid="user-menu-change-password">
                    <Settings className="w-4 h-4 mr-2" /> Change password
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/privacy")} data-testid="user-menu-privacy">
                    <Shield className="w-4 h-4 mr-2" /> Privacy & Consent
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive" data-testid="user-menu-logout">
                    <LogOut className="w-4 h-4 mr-2" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="px-4 md:px-6 py-6 max-w-6xl mx-auto">{children}</main>
      </div>
      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </div>
  );
};
