import { database } from "@/server/db";
import { handleContact } from "@/server/handlers";
import { createMailer } from "@/server/mailer";
import { createVerifier } from "@/server/turnstile";

// Node, not edge: nodemailer and @libsql/client both need node builtins.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const { db } = database();
  return handleContact(request, { db, mailer: createMailer(), verifier: createVerifier() });
}
