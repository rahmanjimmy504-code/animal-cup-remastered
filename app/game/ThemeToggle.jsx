"use client";

import { useEffect, useState } from "react";
import { readTheme, setTheme } from "./cup";

function MoonIcon({ size = 21 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.2 15.3A8.7 8.7 0 0 1 8.7 3.8a8.9 8.9 0 1 0 11.5 11.5Z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [t, setT] = useState("light");

  useEffect(() => {
    const sync = () => setT(readTheme());
    sync();
    window.addEventListener("ac-theme", sync);
    return () => window.removeEventListener("ac-theme", sync);
  }, []);

  const toggle = () => {
    const next = t === "dark" ? "light" : "dark";
    setT(next);
    setTheme(next);
  };

  const label = t === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      data-tip={label}
      title={label}
    >
      <MoonIcon />
    </button>
  );
}
