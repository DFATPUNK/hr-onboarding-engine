import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding: 16 }}>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>Automated onboarding — Zero Touch</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              From offer signed to Day 1 readiness — without manual coordination.
            </div>
          </Link>

          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 8, maxWidth: 980, lineHeight: 1.45 }}>
            This demo simulates what happens after a new hire signs an offer. The system executes deterministic onboarding
            actions automatically, and escalates to HR only when ambiguity is detected.
          </div>
        </div>

        <a
          href="https://writebook.jeremybrunet.com/3/alan"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, fontWeight: 700, textDecoration: "underline" }}
        >
          About this demo & my application →
        </a>
      </header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <Routes>
          <Route path="/alan" element={<Home />} />
          <Route path="/" element={<Navigate to="/alan" />} />
        </Routes>
      </main>
    </div>
  );
}