import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import { AppLayout, AuthLayout, Topbar } from "../../layouts";
import { NotFoundPage } from "../../components/NotFoundPage";
import { GuestRoute, ProtectedRoute } from "../../components/routing";
import { ProjectsPage } from "../../../features/projects/pages/ProjectsPage";
import {
  loadBacklogPage,
  loadBoardPage,
  loadLoginPage,
  loadProfilePage,
  loadRegisterPage,
  loadSprintsPage,
} from "./routeModules";

const LoginPage = lazy(() =>
  loadLoginPage().then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  loadRegisterPage().then((module) => ({ default: module.RegisterPage })),
);
const BacklogPage = lazy(() =>
  loadBacklogPage().then((module) => ({ default: module.BacklogPage })),
);
const BoardPage = lazy(() =>
  loadBoardPage().then((module) => ({ default: module.BoardPage })),
);
const SprintsPage = lazy(() =>
  loadSprintsPage().then((module) => ({ default: module.SprintsPage })),
);
const ProfilePage = lazy(() =>
  loadProfilePage().then((module) => ({ default: module.ProfilePage })),
);

function ProjectRedirect() {
  const { projectId } = useParams();
  return <Navigate to={`/projects/${projectId}/backlog`} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={null}><RegisterPage /></Suspense>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="profile" element={<Suspense fallback={<Topbar title="Profile" />}><ProfilePage /></Suspense>} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectRedirect />} />
          <Route path="projects/:projectId/backlog" element={<Suspense fallback={<Topbar title="Backlog" />}><BacklogPage /></Suspense>} />
          <Route path="projects/:projectId/board" element={<Suspense fallback={<Topbar title="Active Sprint" />}><BoardPage /></Suspense>} />
          <Route path="projects/:projectId/sprints" element={<Suspense fallback={<Topbar title="Sprints History" />}><SprintsPage /></Suspense>} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
