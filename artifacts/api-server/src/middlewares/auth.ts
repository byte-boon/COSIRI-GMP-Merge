import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { companies, type Company } from "@workspace/db/schema";

export const AUTH_COOKIE_NAME = "sustainpro_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  };
}

function cleanCompany(company: Company) {
  const { passwordHash: _passwordHash, sessionToken: _sessionToken, ...safeCompany } = company;
  return safeCompany;
}

async function lookupCompanyByToken(token: string | undefined | null) {
  if (!token) return null;
  const [company] = await db.select().from(companies).where(eq(companies.sessionToken, token));
  return company ?? null;
}

function extractSessionToken(req: Request) {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  const headerToken = req.header("x-session-token");
  return cookieToken || headerToken || null;
}

export async function optionalCompanyAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractSessionToken(req);
    const company = await lookupCompanyByToken(token);
    req.company = company;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function requireCompanyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractSessionToken(req);
    const company = await lookupCompanyByToken(token);
    if (!company) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.company = company;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function setCompanySession(res: Response, sessionToken: string) {
  res.cookie(AUTH_COOKIE_NAME, sessionToken, cookieOptions());
}

export function clearCompanySession(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

export function toSafeCompany(company: Company) {
  return cleanCompany(company);
}

declare global {
  namespace Express {
    interface Request {
      company?: Company | null;
    }
  }
}


