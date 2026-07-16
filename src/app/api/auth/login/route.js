import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Пожалуйста, введите имя пользователя и пароль' }, { status: 400 });
    }

    const user = db.prepare(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.login = ?
    `).get(username);
    
    if (!user) {
      return NextResponse.json({ error: 'Неверное имя пользователя или пароль' }, { status: 401 });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Неверное имя пользователя или пароль' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      username: user.login,
      name: user.full_name,
      role: user.role_name,
    };
    
    await setSession(sessionData);

    return NextResponse.json({ success: true, role: user.role_name });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
