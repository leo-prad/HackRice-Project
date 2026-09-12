import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Complete from "./pages/Complete";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import NextQuest from "./pages/NextQuest";
import Onboard from "./pages/Onboard";
import Pair from "./pages/Pair";
import Profile from "./pages/Profile";
import { session } from "./lib/api";

const Guard = ({ children }: { children: React.ReactNode }) => (session.get() ? children : <Navigate to="/" replace />);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Login />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="pair" element={<Pair />} />
        <Route path="onboard" element={<Guard><Onboard /></Guard>} />
        <Route path="next" element={<Guard><NextQuest /></Guard>} />
        <Route path="complete" element={<Guard><Complete /></Guard>} />
        <Route path="profile" element={<Guard><Profile /></Guard>} />
      </Route>
    </Routes>
  );
}
