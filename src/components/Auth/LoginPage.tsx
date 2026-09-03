"use client";

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

export default function LoginPage({ onLoginSuccess, needsSetup }: { onLoginSuccess: () => void; needsSetup: boolean }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (res.ok) onLoginSuccess();
            else setError(data.error || "That didn't work. Check your details and try again.");
        } catch {
            setError("Couldn't reach the server. Try again in a moment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg">
            <div className="w-full max-w-[360px] px-6">
                <div className="mb-8">
                    <span className="text-[22px] text-gold" style={{ fontFamily: "var(--font-display)" }}>CanvasCrafter</span>
                    <p className="mt-1 text-[13px] text-text-dim">
                        {needsSetup ? "Set a username and password to secure this install." : "Matchday graphics studio."}
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    {error && (
                        <div className="flex items-start gap-2 rounded-app border border-line bg-surface-2 p-3 text-[12px] text-danger">
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <label className="block">
                        <span className="mb-1.5 block text-[12px] text-text-dim">Username</span>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus className="field" />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[12px] text-text-dim">Password</span>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="field" />
                    </label>

                    <button type="submit" disabled={loading} className="btn btn-primary btn-block mt-1">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : needsSetup ? "Create account" : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
