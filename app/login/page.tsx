"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LockIcon as Lock } from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(json?.error ?? "Feil passord");
        return;
      }
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen w-screen flex items-center justify-center bg-bg">
      <form
        onSubmit={submit}
        className="w-full max-w-xs flex flex-col gap-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center gap-2 text-text-3 text-xs uppercase tracking-widest">
          <Lock size={13} weight="light" />
          Infoskjerm
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passord"
          className="rounded-lg bg-surface-2 border border-border px-3 py-2 text-text text-sm outline-none focus:border-border-strong"
        />
        {error && <div className="text-live text-xs">{error}</div>}
        <button
          type="submit"
          disabled={loading || !password}
          className="rounded-lg bg-accent/90 enabled:hover:bg-accent text-bg text-sm font-medium py-2 disabled:opacity-40 transition-colors"
        >
          Logg inn
        </button>
      </form>
    </main>
  );
}
