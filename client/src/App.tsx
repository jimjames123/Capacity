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
import AdminOrganizations from "./pages/admin/AdminOrganizations";
import AdminOrganizationDetail from "./pages/admin/AdminOrganizationDetail";
import AdminConsultants from "./pages/admin/AdminConsultants";
import AdminConsultantDetail from "./pages/admin/AdminConsultantDetail";
import AdminCourseQueue from "./pages/admin/AdminCourseQueue";
import AdminTrainerQueue from "./pages/admin/AdminTrainerQueue";
import { ProviderLayout } from "./components/ProviderLayout";
import ProviderHome from "./pages/provider/ProviderHome";
import ProviderCourses from "./pages/provider/ProviderCourses";
import ProviderTenders from "./pages/provider/ProviderTenders";
import ProviderTenderDetail from "./pages/provider/ProviderTenderDetail";
import ProviderBids from "./pages/provider/ProviderBids";
import ProviderNotifications from "./pages/provider/ProviderNotifications";
import { OrgLayout } from "./components/OrgLayout";
import OrgHome from "./pages/org/OrgHome";
import OrgStaff from "./pages/org/OrgStaff";
import OrgConsultants from "./pages/org/OrgConsultants";
import OrgConsultantDetail from "./pages/org/OrgConsultantDetail";
import OrgCatalog from "./pages/org/OrgCatalog";
import OrgInhouse from "./pages/org/OrgInhouse";
import OrgTenders from "./pages/org/OrgTenders";
import OrgTenderDetail from "./pages/org/OrgTenderDetail";
import OrgBookings from "./pages/org/OrgBookings";
import OrgAnnualPlan from "./pages/org/OrgAnnualPlan";
import OrgRecords from "./pages/org/OrgRecords";
import OrgReports from "./pages/org/OrgReports";
import OrgProfile from "./pages/org/OrgProfile";
import type { ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "PROVIDER") return <Navigate to="/provider" replace />;
  if (user.role === "ORG") return <Navigate to="/org" replace />;
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

function ProviderProtected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "PROVIDER") return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function OrgProtected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role !== "ORG") return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface">
      <div className="animate-pulse font-serif text-lg text-muted">
        Loading Capacity Lane…
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
        <Route path="organizations" element={<AdminOrganizations />} />
        <Route path="organizations/:id" element={<AdminOrganizationDetail />} />
        <Route path="consultants" element={<AdminConsultants />} />
        <Route path="consultants/:id" element={<AdminConsultantDetail />} />
        <Route path="course-queue" element={<AdminCourseQueue />} />
        <Route path="trainer-queue" element={<AdminTrainerQueue />} />
      </Route>

      <Route
        path="/provider"
        element={
          <ProviderProtected>
            <ProviderLayout />
          </ProviderProtected>
        }
      >
        <Route index element={<ProviderHome />} />
        <Route path="courses" element={<ProviderCourses />} />
        <Route path="tenders" element={<ProviderTenders />} />
        <Route path="tenders/:id" element={<ProviderTenderDetail />} />
        <Route path="bids" element={<ProviderBids />} />
        <Route path="notifications" element={<ProviderNotifications />} />
      </Route>

      <Route
        path="/org"
        element={
          <OrgProtected>
            <OrgLayout />
          </OrgProtected>
        }
      >
        <Route index element={<OrgHome />} />
        <Route path="staff" element={<OrgStaff />} />
        <Route path="consultants" element={<OrgConsultants />} />
        <Route path="consultants/:id" element={<OrgConsultantDetail />} />
        <Route path="catalog" element={<OrgCatalog />} />
        <Route path="inhouse" element={<OrgInhouse />} />
        <Route path="tenders" element={<OrgTenders />} />
        <Route path="tenders/:id" element={<OrgTenderDetail />} />
        <Route path="bookings" element={<OrgBookings />} />
        <Route path="annual-plan" element={<OrgAnnualPlan />} />
        <Route path="records" element={<OrgRecords />} />
        <Route path="reports" element={<OrgReports />} />
        <Route path="profile" element={<OrgProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
