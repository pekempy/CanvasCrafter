"use client";

import { useState, useEffect } from "react";
import LoginPage from "@/components/Auth/LoginPage";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor/Editor"), {
    ssr: false,
});

export default function Page() {
    const [auth, setAuth] = useState<{ authenticated: boolean; needsSetup: boolean; username?: string } | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/status');
            const data = await res.json();
            setAuth(data);
        } catch (e) {
            setAuth({ authenticated: false, needsSetup: false });
        }
    };

    if (auth === null) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0c]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!auth.authenticated) {
        return <LoginPage onLoginSuccess={checkAuth} needsSetup={auth.needsSetup} />;
    }

    return <Editor username={auth.username} />;
}
