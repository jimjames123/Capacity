import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { MemberLayout } from "./components/MemberLayout";
import { AdminLayout } from "./components/AdminLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboard from "./pages/Onboard";
import Dashboard from "./pages/Dashboard";
import LogActivity from "./pages/LogActivity";
import History from "./pages/History";
import Marketplace from "./pages/Marketplace";
import CourseDetail from "./pages/CourseDetail";
import Record from "./pages/Record";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminQueue from "./pages/admin/AdminQueue";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminMemberDetail from "./pages/admin/AdminMemberDetail";
import type { ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (!user.onboarded) return <Navigate to="/onboard" replace />;
  return <>{children}</>;
}

function AdminProtected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface">
      <div className="animate-pulse font-serif text-lg text-muted">
        Loading CapacitySpot…
      </div>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Auth mode="signin" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/onboard" element={<Onboard />} />

      <Route
        path="/app"
        element={
          <Protected>
            <MemberLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="log" element={<LogActivity />} />
        <Route path="history" element={<History />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="marketplace/:id" element={<CourseDetail />} />
        <Route path="record" element={<Record />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminProtected>
            <AdminLayout />
          </AdminProtected>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="queue" element={<AdminQueue />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="members/:id" element={<AdminMemberDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
