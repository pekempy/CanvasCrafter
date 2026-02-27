import { NextResponse } from 'next/server';
import { getSession, getUsers } from '@/lib/security';

export async function GET(request: Request) {
    const user = await getSession(request);

    // Check if any users exist to see if we need setup
    const users = await getUsers();
    const needsSetup = Object.keys(users).length === 0;

    if (user) {
        return NextResponse.json({ authenticated: true, needsSetup, username: user });
    }

    return NextResponse.json({ authenticated: false, needsSetup });
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_token');
    return response;
}
