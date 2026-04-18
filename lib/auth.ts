// lib/auth.ts - แก้ใหม่ใช้ jose
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode("devsecret");

export type JwtPayload = { 
  uid: string; 
  email: string; 
  role: "USER" | "ADMIN" 
};

export async function signToken(payload: JwtPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    
    const role = payload.role?.toString().toUpperCase();
    
    return {
      uid: payload.uid?.toString() || payload.sub?.toString() || '',
      email: payload.email?.toString() || '',
      role: (role === "ADMIN" ? "ADMIN" : "USER") as "USER" | "ADMIN"
    };
  } catch (error) {
    console.error("❌ Token verification error:", error);
    return null;
  }
}

// getAuth ต้องเปลี่ยนเป็น async
export async function getAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("auth");
  const token = authCookie?.value;

  if (!token) {
    console.log("❌ No auth token found in cookies");
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    console.log("❌ Token verification failed");
    return null;
  }

  console.log("✅ Auth successful for user:", payload.email);
  console.log("🔍 User role:", payload.role);
  console.log("🔍 User UID:", payload.uid);
  return payload;
}

export async function getAdminAuth() {
  const auth = await getAuth();
  
  if (!auth) {
    console.log("❌ No authentication for admin access");
    return null;
  }

  if (auth.role.toUpperCase() !== "ADMIN") {
    console.log("❌ Access denied - User is not ADMIN");
    return null;
  }

  console.log("✅ Admin access granted for:", auth.email);
  return auth;
}