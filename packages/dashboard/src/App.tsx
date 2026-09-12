import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Pair from "./pages/Pair";
import Profile from "./pages/Profile";
import { session } from "./lib/api";

const Guard = ({ children }: { children: React.ReactNode }) => session.get() ? children : <Navigate to="/" replace/>;
export default function App() { return <Routes><Route element={<Layout/>}><Route index element={<Login/>}/><Route path="leaderboard" element={<Leaderboard/>}/><Route path="pair" element={<Pair/>}/><Route path="profile" element={<Guard><Profile/></Guard>}/></Route></Routes>; }
