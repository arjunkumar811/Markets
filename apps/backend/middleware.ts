import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "db";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const supabaseUrl = "https://jyyyzkwufgvxlthfwaej.supabase.co";
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || "dummy_secret_for_local_dev";

const supabase = createClient(supabaseUrl, supabaseSecretKey);

export async function middleware (req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;

  if (!token) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(403).json({ message: "Incorrect credentials", error });
      return;
    }

    // Auto-create user if they don't exist in our DB yet
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser) {
      const address = user.user_metadata?.address || user.email || user.id;
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          address: address,
          usdBalance: 100000 // $1,000.00 default balance
        }
      });
    }

    req.userId = user.id;
    next();
  } catch (e) {
    res.status(403).json({
      message: "Incorrect credentials"
    });
  }
}
