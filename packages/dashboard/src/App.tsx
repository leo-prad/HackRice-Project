import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import WorkflowGate from "./components/workflow/WorkflowGate";
import AuthContinue from "./pages/AuthContinue";
import Complete from "./pages/Complete";
import Ingest from "./pages/Ingest";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import NextQuest from "./pages/NextQuest";
import Onboard from "./pages/Onboard";
import Pair from "./pages/Pair";
import Profile from "./pages/Profile";
import { session } from "./lib/api";

const Guard = ({ children }: { children: React.ReactNode }) =>
  session.get() ? <>{children}</> : <Navigate to="/" replace />;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Login />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="pair" element={<Pair />} />

        {/* Shared post-auth router — decides newcomer vs returning */}
        <Route path="auth/continue" element={<Guard><AuthContinue /></Guard>} />

        {/* Newcomer layer only */}
        <Route
          path="ingest"
          element={
            <Guard>
              <WorkflowGate layer="newcomer">
                <Ingest />
              </WorkflowGate>
            </Guard>
          }
        />
        <Route
          path="onboard"
          element={
            <Guard>
              <WorkflowGate layer="newcomer">
                <Onboard />
              </WorkflowGate>
            </Guard>
          }
        />

        {/* Returning player layer only */}
        <Route
          path="next"
          element={
            <Guard>
              <WorkflowGate layer="returning">
                <NextQuest />
              </WorkflowGate>
            </Guard>
          }
        />
        <Route
          path="complete"
          element={
            <Guard>
              <WorkflowGate layer="returning">
                <Complete />
              </WorkflowGate>
            </Guard>
          }
        />
        <Route
          path="profile"
          element={
            <Guard>
              <WorkflowGate layer="returning">
                <Profile />
              </WorkflowGate>
            </Guard>
          }
        />
      </Route>
    </Routes>
  );
}
