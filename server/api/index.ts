import type { IncomingMessage, ServerResponse } from "http";
import { app } from "../src/app";
import { connectToDatabase } from "../src/config/database";

// Vercel serverless entry point. The connection is cached in
// connectToDatabase, so warm invocations reuse it instead of reconnecting.
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("Database connection failed", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        data: null,
        error: { message: "Database connection failed" },
      }),
    );
    return;
  }

  return app(
    req as Parameters<typeof app>[0],
    res as Parameters<typeof app>[1],
  );
}
