import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import HumanProfile from "@/pages/HumanProfile";
import Pets from "@/pages/Pets";
import Workspaces from "@/pages/Workspaces";
import CheckIns from "@/pages/CheckIns";
import WellnessLogs from "@/pages/WellnessLogs";
import Rituals from "@/pages/Rituals";
import BondScore from "@/pages/BondScore";
import Intelligence from "@/pages/Intelligence";
import AICoach from "@/pages/AICoach";
import Reports from "@/pages/Reports";
import CareCircle from "@/pages/CareCircle";
import VoiceSupport from "@/pages/VoiceSupport";
import AgentCenter from "@/pages/AgentCenter";
import Privacy from "@/pages/Privacy";
import Admin from "@/pages/Admin";

const Private = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground" data-testid="app-loading">Loading Soula Paws...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><AuthPage mode="forgot" /></PublicOnly>} />
          <Route path="/reset-password/:token" element={<PublicOnly><AuthPage mode="reset" /></PublicOnly>} />
          <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
          <Route path="/profile" element={<Private><HumanProfile /></Private>} />
          <Route path="/pets" element={<Private><Pets /></Private>} />
          <Route path="/workspaces" element={<Private><Workspaces /></Private>} />
          <Route path="/check-ins" element={<Private><CheckIns /></Private>} />
          <Route path="/wellness" element={<Private><WellnessLogs /></Private>} />
          <Route path="/rituals" element={<Private><Rituals /></Private>} />
          <Route path="/bond-score" element={<Private><BondScore /></Private>} />
          <Route path="/intelligence" element={<Private><Intelligence /></Private>} />
          <Route path="/coach" element={<Private><AICoach /></Private>} />
          <Route path="/reports" element={<Private><Reports /></Private>} />
          <Route path="/care-circle" element={<Private><CareCircle /></Private>} />
          <Route path="/voice-support" element={<Private><VoiceSupport /></Private>} />
          <Route path="/agents" element={<Private><AgentCenter /></Private>} />
          <Route path="/privacy" element={<Private><Privacy /></Private>} />
          <Route path="/admin" element={<Private adminOnly><Admin /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
