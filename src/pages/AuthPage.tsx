import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Author } from "../types";

interface AuthPageProps {
  currentUser: Author | null;
  onLogin: (payload: { email: string; password: string }) => Promise<void>;
  onRegister: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
}

export const AuthPage = ({
  currentUser,
  onLogin,
  onRegister,
}: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@taletogether.app");
  const [password, setPassword] = useState("demo12345");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  if (currentUser) {
    return <Navigate to="/profile/you" replace />;
  }

  const submit = async () => {
    setSubmitting(true);
    setMessage("");

    try {
      if (mode === "login") {
        await onLogin({ email, password });
      } else {
        await onRegister({ name, email, password });
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="panel auth-panel">
        <div>
          <p className="eyebrow">simple sign in</p>
          <h2>
            {mode === "login"
              ? "Welcome back to your writing space"
              : "Create your account in a minute"}
          </h2>
          <p className="lead small">
            Just use your name, email, and password. After that, your stories,
            likes, writing progress, and profile will stay safely saved in your
            account.
          </p>
        </div>

        <div className="message-box success">
          <strong>Very simple:</strong>
          <p>
            Create an account → write a story → publish when you feel ready.
          </p>
        </div>

        <div className="steps-grid compact-steps auth-steps">
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">1</div>
              <div className="card-icon">👋</div>
            </div>
            <h4>Create or sign in</h4>
            <p>Use your email and password to enter your writing space.</p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">2</div>
              <div className="card-icon">📖</div>
            </div>
            <h4>Write or read</h4>
            <p>You can start with a story, a poem, or simply explore first.</p>
          </article>
          <article className="step-card">
            <div className="step-topline">
              <div className="step-number">3</div>
              <div className="card-icon">💾</div>
            </div>
            <h4>Save your progress</h4>
            <p>
              Your profile, preferences, and publishing activity stay connected
              to your account.
            </p>
          </article>
        </div>

        <div className="tab-row auth-tabs">
          <button
            type="button"
            className={`tab-button ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`tab-button ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <div className="form-grid auth-form-grid">
          {mode === "register" ? (
            <label>
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input"
                placeholder="Your name"
              />
              <div className="field-hint">
                This is the name readers will see on your stories.
              </div>
            </label>
          ) : null}
          <label>
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
              placeholder="you@example.com"
            />
            <div className="field-hint">
              Use an email you can remember easily.
            </div>
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input"
              placeholder="At least 8 characters"
            />
            <div className="field-hint">
              Choose a simple password you will remember.
            </div>
          </label>
        </div>

        {message ? <div className="message-box warning">{message}</div> : null}

        <button
          type="button"
          className="button-link primary full-width"
          onClick={submit}
          disabled={submitting}
        >
          {submitting
            ? "Working…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>

        <div className="message-box info">
          <strong>Just want to explore quickly?</strong>
          <p>Use the demo account below.</p>
          <p>
            Email: <code>demo@taletogether.app</code>
          </p>
          <p>
            Password: <code>demo12345</code>
          </p>
        </div>

        <Link to="/" className="text-link">
          Continue as reader →
        </Link>
      </section>
    </div>
  );
};
