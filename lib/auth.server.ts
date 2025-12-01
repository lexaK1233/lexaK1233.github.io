import { redirect } from "react-router";
import { db, type User } from "./db.server";

// Session management using cookies
const SESSION_SECRET = process.env.SESSION_SECRET || "default-secret-change-in-production";

// Simple password hashing simulation (replace with bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  // In production, use bcryptjs
  // return bcrypt.hash(password, 10);
  return `hashed_${password}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // In production, use bcryptjs
  // return bcrypt.compare(password, hashedPassword);
  return `hashed_${password}` === hashedPassword || hashedPassword.includes("$2a$10$"); // Allow demo passwords
}

// Cookie-based session
export async function createUserSession(userId: string, redirectTo: string) {
  const sessionData = JSON.stringify({ userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 days

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": `session=${sessionData}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    },
  });
}

export async function getUserSession(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const sessionCookie = cookies.find((c) => c.startsWith("session="));
  if (!sessionCookie) return null;

  try {
    const sessionData = JSON.parse(sessionCookie.split("=")[1]);
    if (sessionData.expiresAt < Date.now()) return null;
    return sessionData.userId;
  } catch {
    return null;
  }
}

export async function requireUser(request: Request): Promise<User> {
  const userId = await getUserSession(request);
  if (!userId) {
    throw redirect("/login");
  }

  const user = await db.getUserById(userId);
  if (!user) {
    throw redirect("/login");
  }

  return user;
}

export async function requireStaffUser(request: Request): Promise<User> {
  const user = await requireUser(request);
  if (user.role !== "staff") {
    throw redirect("/");
  }
  return user;
}

export async function logout(request: Request) {
  return redirect("/login", {
    headers: {
      "Set-Cookie": "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    },
  });
}

export async function getOptionalUser(request: Request): Promise<User | null> {
  const userId = await getUserSession(request);
  if (!userId) return null;
  return db.getUserById(userId);
}
