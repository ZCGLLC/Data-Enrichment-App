import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Avatar, Modal } from "./components";
import { formatCredits, STARTING_CREDITS } from "./logic";
import { useStore } from "./store";

const links = [
  { to: "/", label: "Today", end: true },
  { to: "/people", label: "People" },
  { to: "/companies", label: "Companies" },
  { to: "/lists", label: "Lists" },
  { to: "/sequences", label: "Sequences" },
  { to: "/tasks", label: "Tasks" },
  { to: "/analytics", label: "Analytics" },
  { to: "/integrations", label: "Integrations" },
  { to: "/credits", label: "Credits" },
  { to: "/settings", label: "Settings" },
];

export function Layout() {
  const { state, toasts, dismissToast, dismissWelcome } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState(false);
  const linkedin = state.integrations.linkedin.connected;

  useEffect(() => {
    setFlash(true);
    const timer = window.setTimeout(() => setFlash(false), 700);
    return () => window.clearTimeout(timer);
  }, [state.credits]);

  return (
    <div className="shell">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            Harbor
            <small>Sample workspace</small>
          </span>
        </div>
        <nav className="nav" aria-label="Workspace">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {link.label}
              {link.to === "/integrations" && !linkedin ? <span className="dot" aria-label="LinkedIn not connected" /> : null}
            </NavLink>
          ))}
        </nav>
        <p className="side-note">Starter balance {formatCredits(STARTING_CREDITS)} credits. LinkedIn is the first channel.</p>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <form
            className="top-search"
            onSubmit={(event) => {
              event.preventDefault();
              const next = query.trim();
              navigate(next ? `/people?q=${encodeURIComponent(next)}` : "/people");
            }}
          >
            <label className="sr" htmlFor="global-search">
              Search people
            </label>
            <input
              id="global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, titles, or companies"
            />
          </form>
          <button
            type="button"
            className={`credit-link${flash ? " flash" : ""}`}
            onClick={() => navigate("/credits")}
          >
            <span>{formatCredits(state.credits)}</span> credits
          </button>
          <Linkish name={state.userName} />
        </header>
        <main id="content" className="content">
          <Outlet />
        </main>
      </div>
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((toast) => (
          <button key={toast.id} type="button" className="toast" onClick={() => dismissToast(toast.id)}>
            {toast.message}
          </button>
        ))}
      </div>
      {state.dismissedWelcome ? null : (
        <Modal title={`You have ${formatCredits(STARTING_CREDITS)} credits to start.`} onClose={dismissWelcome}>
          <p>
            Search and save people for free. Spend a credit when you actually need a work email. A direct phone is 5, and
            extra company details are 2.
          </p>
          <p>Say hello on LinkedIn first. Harbor drafts the note and opens search for you. It does not message anyone on its own.</p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-linkedin"
              onClick={() => {
                dismissWelcome();
                navigate("/integrations");
              }}
            >
              Connect LinkedIn
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                dismissWelcome();
                navigate("/people");
              }}
            >
              Find people first
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Linkish({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" className="who" onClick={() => navigate("/settings")}>
      <Avatar name={name} />
      <span>{name}</span>
    </button>
  );
}
