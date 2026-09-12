import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { session } from "./lib/api";
import "./index.css";

const token = new URLSearchParams(location.hash.slice(1)).get("token");
if (token) { session.set(token); history.replaceState(null, "", "/profile"); }

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
