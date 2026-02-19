import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { User, JWTPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };
  return jwt.sign(payload, JWT_SECRET);
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function createUser(email: string, name: string, password: string, phone?: string): Promise<User> {
  const db = getDb();
  const id = uuidv4();
  const passwordHash = await hashPassword(password);
  
  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, phone, password_hash)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, email, name, phone || null, passwordHash);
  
  return {
    id,
    email,
    name,
    phone,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getUserByEmail(email: string): (User & { passwordHash: string }) | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const row = stmt.get(email) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  password?: string;
}

export async function updateUser(userId: string, input: UpdateUserInput): Promise<User | null> {
  const db = getDb();
  const existing = getUserById(userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.phone !== undefined) {
    updates.push('phone = ?');
    values.push(input.phone ?? null);
  }
  if (input.password !== undefined && input.password.length > 0) {
    updates.push('password_hash = ?');
    values.push(await hashPassword(input.password));
  }

  if (updates.length === 0) return existing;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...values);
  return getUserById(userId);
}
