import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECURITY_FILE = path.join(DATA_DIR, 'security.json');
const LOCKDOWN_FILE = path.join(DATA_DIR, 'SYSTEM_LOCKDOWN');

export interface User {
    username: string;
    passwordHash: string;
    lastLogin?: number;
}

export interface SecurityRecord {
    attempts: Record<string, {
        count: number;
        lastAttempt: number;
        lockedUntil: number;
    }>;
    totalFailed: number;
}

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readJSON<T>(file: string, defaultValue: T): Promise<T> {
    try {
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch {
        return defaultValue;
    }
}

async function writeJSON(file: string, data: any) {
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function isSystemLocked(): Promise<boolean> {
    try {
        await fs.access(LOCKDOWN_FILE);
        return true;
    } catch {
        return false;
    }
}

export async function getUsers(): Promise<Record<string, User>> {
    const data = await readJSON(USERS_FILE, { users: {} });
    return data.users;
}

export async function saveUser(user: User) {
    await ensureDataDir();
    const data = await readJSON(USERS_FILE, { users: {} as Record<string, User> });
    data.users[user.username] = user;
    await writeJSON(USERS_FILE, data);
}

export async function getSecurity(): Promise<SecurityRecord> {
    return await readJSON(SECURITY_FILE, { attempts: {}, totalFailed: 0 });
}

export async function updateSecurity(record: SecurityRecord) {
    await ensureDataDir();
    await writeJSON(SECURITY_FILE, record);

    // Check for hard lockdown
    if (record.totalFailed >= 30) {
        await fs.writeFile(LOCKDOWN_FILE, 'TOTAL ATTEMPTS EXCEEDED. DELETE THIS FILE TO UNLOCK.');
    }
}

export async function checkLockout(username: string): Promise<{ locked: boolean; message?: string }> {
    if (await isSystemLocked()) {
        return { locked: true, message: "System is in hard lockdown. Contact administrator." };
    }

    const security = await getSecurity();
    const record = security.attempts[username];

    if (record && record.lockedUntil > Date.now()) {
        const remainingMinutes = Math.ceil((record.lockedUntil - Date.now()) / (1000 * 60));
        return { locked: true, message: `Account temporarily locked. Try again in ${remainingMinutes} minutes.` };
    }

    return { locked: false };
}

export async function recordAttempt(username: string, success: boolean) {
    const security = await getSecurity();

    if (!security.attempts[username]) {
        security.attempts[username] = { count: 0, lastAttempt: 0, lockedUntil: 0 };
    }

    const record = security.attempts[username];
    record.lastAttempt = Date.now();

    if (success) {
        record.count = 0;
        record.lockedUntil = 0;
    } else {
        record.count++;
        security.totalFailed++;

        if (record.count >= 3) {
            record.lockedUntil = Date.now() + (60 * 60 * 1000); // 1 hour lockout
        }
    }

    await updateSecurity(security);
}

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export async function getSession(request: Request): Promise<string | null> {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
        const [k, v] = c.trim().split('=');
        if (k && v) acc[k] = v;
        return acc;
    }, {} as Record<string, string>);

    const token = cookies['auth_token'];
    if (!token || !token.startsWith('sess_')) return null;

    const parts = token.split('_');
    if (parts.length < 2) return null;
    return parts[1]; // sess_username_random
}
