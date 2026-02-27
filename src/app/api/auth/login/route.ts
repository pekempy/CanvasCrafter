import { NextResponse } from 'next/server';
import { getUsers, recordAttempt, checkLockout, comparePassword, saveUser } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
        }

        // Check if accounts exist - if none, the first login creates the admin
        const users = await getUsers();
        const isFirstUser = Object.keys(users).length === 0;

        // Check for lockout
        const lockout = await checkLockout(username);
        if (lockout.locked) {
            return NextResponse.json({ error: lockout.message }, { status: 403 });
        }

        if (isFirstUser) {
            // Auto-setup first user
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            await saveUser({
                username,
                passwordHash,
                lastLogin: Date.now()
            });

            const response = NextResponse.json({ success: true, message: "Admin account created" });
            response.cookies.set('auth_token', `sess_${username}_${Date.now()}`, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            return response;
        }

        const user = users[username];
        if (!user) {
            await recordAttempt(username, false);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.passwordHash);
        if (!isValid) {
            await recordAttempt(username, false);
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Success!
        await recordAttempt(username, true);
        user.lastLogin = Date.now();
        await saveUser(user);

        const response = NextResponse.json({ success: true });
        response.cookies.set('auth_token', `sess_${username}_${Math.random().toString(36).substring(7)}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;
    } catch (e: any) {
        console.error("Login Error:", e.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
