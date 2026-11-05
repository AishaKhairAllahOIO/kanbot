import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import { AppLayout, AuthLayout } from "../../layouts";
import { NotFoundPage } from "../../components/NotFoundPage";
import { GuestRoute, ProtectedRoute } from "../../components/routing";
import { Spinner } from "../../../shared/components/Spinner";

const LoginPage = lazy(() =>
  import("../../../features/auth/pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("../../../features/auth/pages/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("../../../features/projects/pages/ProjectsPage").then((module) => ({
    default: module.ProjectsPage,
  })),
);
const BacklogPage = lazy(() =>
  import("../../../features/backlog/pages/BacklogPage").then((module) => ({
    default: module.BacklogPage,
  })),
);
const BoardPage = lazy(() =>
  import("../../../features/board/pages/BoardPage").then((module) => ({
    default: module.BoardPage,
  })),
);
const SprintsPage = lazy(() =>
  import("../../../features/sprints/pages/SprintsPage").then((module) => ({
    default: module.SprintsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../../../features/profile/pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
);

function ProjectRedirect() {
  const { projectId } = useParams();
  return <Navigate to={`/projects/${projectId}/backlog`} replace />;
}

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-content-center">
          <Spinner />
        </div>
      }
    >
      <Routes>
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectRedirect />} />
            <Route path="projects/:projectId/backlog" element={<BacklogPage />} />
            <Route path="projects/:projectId/board" element={<BoardPage />} />
            <Route path="projects/:projectId/sprints" element={<SprintsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
