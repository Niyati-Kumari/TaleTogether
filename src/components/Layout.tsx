import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import type { Author } from "../types";

interface LayoutProps {
  children: ReactNode;
  currentUser: Author | null;
  storyCount: number;
  streak: number;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const navigation = [
  { label: "Home", to: "/" },
  { label: "Read stories", to: "/discover" },
  { label: "Write", to: "/write" },
  { label: "Prompts", to: "/challenges" },
  { label: "Subscribe", to: "/subscribe" },
  { label: "My profile", to: "/profile/you" },
];

export const Layout = ({
  children,
  currentUser,
  storyCount,
  streak,
  onLogout,
  darkMode,
  onToggleDarkMode,
}: LayoutProps) => (
  <div className="app-shell">
    <header className="topbar">
      <div>
        <NavLink to="/" className="brand-link">
          <span className="brand-mark">✦</span>
          <div>
            <p className="eyebrow">read • write • improve</p>
            <h1>TaleTogether</h1>
            <p className="brand-subtitle">
              A simple home for personal stories, fiction, and new writers.
            </p>
          </div>
        </NavLink>
      </div>

      <nav className="topnav">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          type="button"
          className="button-link ghost small-button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        {currentUser ? (
          <aside className="profile-pill auth-pill">
            <div className="avatar">{currentUser.avatar}</div>
            <div>
              <strong>{currentUser.name}</strong>
              <div className="muted-small">
                {storyCount} stories • {streak}-day writing streak
              </div>
            </div>
            <button
              type="button"
              className="button-link ghost small-button"
              onClick={onLogout}
            >
              Log out
            </button>
          </aside>
        ) : (
          <aside className="auth-cta-group">
            <Link to="/auth" className="button-link secondary">
              Sign in
            </Link>
            <Link to="/auth" className="button-link primary">
              Create account
            </Link>
          </aside>
        )}
      </div>
    </header>

    <main className="page-container">{children}</main>
  </div>
);
