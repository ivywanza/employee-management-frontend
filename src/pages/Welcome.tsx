
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/auth";

const EMOJIS = ["🎉", "🎊", "🥳", "✨", "🎈", "🎁", "🌟"];
const DURATION_MS = 6500;

const BRANDS = {
  red_ant: {
    name: "Red Ant International",
    words: ["Welcome", "To", "Red Ant", "International"],
    background: "bg-red-700",
    accent: "text-red-400",
    subtitle: "text-blue-100",
    button: "bg-red-500",
    logo: null,
  },
  bella_organics: {
    name: "Bella Organics",
    words: ["Welcome", "To", "Bella", "Organics"],
    background: "bg-green-800",
    accent: "text-lime-300",
    subtitle: "text-green-100",
    button: "bg-lime-500",
    logo: "/BellaLogo.png",
  },
  juakali: {
    name: "Juakali",
    words: ["Welcome", "To", "Juakali"],
    background: "bg-stone-900",
    accent: "text-amber-400",
    subtitle: "text-stone-200",
    button: "bg-amber-600",
    logo: null,
  },
};

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

  const organisation = profile?.organisation ?? "red_ant";

  const brand =
    BRANDS[organisation as keyof typeof BRANDS] ?? BRANDS.red_ant;

  const finish = useCallback(async () => {
    try {
      await api.post("/users/me/welcome-seen");
      await refreshProfile();
    } catch {
      // Continue to the dashboard if the welcome status request fails.
    }

    navigate("/", { replace: true });
  }, [navigate, refreshProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => void finish(), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [finish]);

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${brand.background} flex flex-col items-center justify-center px-6 text-center`}
    >
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
        {brand.logo && (
          <img
            src={brand.logo}
            alt={brand.name}
            className="mx-auto mb-8 h-20 max-w-48 object-contain"
          />
        )}

        <h1 className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-5xl font-extrabold leading-tight sm:gap-x-6 sm:text-7xl lg:text-8xl">
          {brand.words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className={`welcome-word ${
                i >= 2 ? brand.accent : "text-white"
              }`}
              style={{ animationDelay: `${0.3 + i * 0.35}s` }}
            >
              {word}
            </span>
          ))}
        </h1>

        <p
          className={`welcome-word mt-8 text-lg sm:text-2xl ${brand.subtitle}`}
          style={{ animationDelay: "1.9s" }}
        >
          We're glad you're here{firstName ? `, ${firstName}` : ""}.
          {" "}Getting your workspace ready...
        </p>

        <div className="mx-auto mt-10 h-1.5 w-64 overflow-hidden rounded-full bg-white/15 sm:w-80">
          <div
            className={`welcome-bar h-full rounded-full ${brand.button}`}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => void finish()}
        className="absolute bottom-6 z-10 text-sm text-white/80 underline underline-offset-4 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}
