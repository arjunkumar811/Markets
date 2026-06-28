import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";

const supabaseUrl = "https://jyyyzkwufgvxlthfwaej.supabase.co";
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseSecretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY environment variable");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey);

export async function middleware (req: Request, res: Response, next: NextFunction) {
const token = req.headers.authorization;

try {
    const {data: {user} , error } = await supabase.auth.getUser(token);
    console.log(user);
    console.log(error);
    next();
} catch (e) {
    res.status(403).json({
        message: "Incorrect credentials"
    })
}


}
