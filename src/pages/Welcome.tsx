import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/auth";

const EMOJIS = ["🎉", "🎊", "🥳", "✨", "🎈", "🎁", "🌟"];
const WORDS = ["Welcome", "To", "Redant", "International"];
const DURATION_MS = 6500;

function makeConfetti() {
  return Array.from({ length: 38 }, (_, i) => ({
    id: i,
    emoji: EMOJIS[i % EMOJIS.length],
    left: Math.random() * 100,
    size: 20 + Math.random() * 24,
    duration: 5 + Math.random() * 5,
    delay: Math.random() * 4,
  }));
}

export default function Welcome() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [confetti] = useState(makeConfetti);
  const firstName = profile?.full_name.split(" ")[0] ?? "";

  const finish = useCallback(async () => {
    try {
      await api.post("/users/me/welcome-seen");
      await refreshProfile();
    } catch {
      // carry on to the dashboard anyway
    }
    navigate("/", { replace: true });
  }, [navigate, refreshProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => void finish(), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [finish]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 flex flex-col items-center justify-center px-6 text-center">
      {confetti.map((c) => (
        <span
          key={c.id}
          aria-hidden="true"
          className="confetti"
          style={{
            left: `${c.left}%`,
            fontSize: `${c.size}px`,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          {c.emoji}
        </span>
      ))}

      <div className="relative z-10 max-w-5xl">
        <h1 className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-1 text-5xl sm:text-7xl lg:text-8xl font-extrabold leading-tight">
          {WORDS.map((word, i) => (
            <span
              key={word}
              className={`welcome-word ${i >= 2 ? "text-red-400" : "text-white"}`}
              style={{ animationDelay: `${0.3 + i * 0.35}s` }}
            >
              {word}
            </span>
          ))}
        </h1>

        <p className="welcome-word mt-8 text-lg sm:text-2xl text-blue-100" style={{ animationDelay: "1.9s" }}>
          We're glad you're here{firstName ? `, ${firstName}` : ""}. Getting your workspace ready...
        </p>

        <div className="mt-10 mx-auto h-1.5 w-64 sm:w-80 rounded-full bg-white/15 overflow-hidden">
          <div className="welcome-bar h-full rounded-full bg-red-500" />
        </div>
      </div>

      <button
        onClick={() => void finish()}
        className="absolute bottom-6 z-10 text-sm text-blue-200/80 hover:text-white underline underline-offset-4"
      >
        Skip
      </button>
    </div>
  );
}