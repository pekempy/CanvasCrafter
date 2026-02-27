import { NextResponse } from 'next/server';
import { getUsers, saveUser, getSession, hashPassword } from '@/lib/security';

export async function GET(request: Request) {
    const user = await getSession(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const users = await getUsers();
        // Return usernames and last login, but omit password hashes
        const usersList = Object.values(users).map(u => ({
            username: u.username,
            lastLogin: u.lastLogin
        }));
        return NextResponse.json(usersList);
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const currentUser = await getSession(request);
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
        }

        const users = await getUsers();
        if (users[username]) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const passwordHash = await hashPassword(password);
        await saveUser({
            username,
            passwordHash,
            lastLogin: 0
        });

        return NextResponse.json({ success: true, message: `User ${username} created successfully` });
    } catch (e: any) {
        console.error("Create User Error:", e.message);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
