import { Application, Router, oakCors } from "./deps.ts";
import { closeDatabase, initDatabase } from "./config/database.ts";
import { initSupabase } from "./config/supabase.ts";
import { authMiddleware } from "./middleware/auth.ts";
import { rateLimitMiddleware } from "./middleware/rateLimit.ts";
import { userRouter } from "./modules/user/routes.ts";
import { canvasRouter } from "./modules/canvas/routes.ts";
import { artworkRouter } from "./modules/artwork/routes.ts";
import { transactionRouter } from "./modules/transaction/routes.ts";

const router = new Router();
router.use("/api/users", userRouter.routes(), userRouter.allowedMethods());
router.use(
  "/api/canvases",
  canvasRouter.routes(),
  canvasRouter.allowedMethods()
);
router.use(
  "/api/artworks",
  authMiddleware,
  artworkRouter.routes(),
  artworkRouter.allowedMethods()
);
router.use(
  "/api/transactions",
  authMiddleware,
  transactionRouter.routes(),
  transactionRouter.allowedMethods()
);

const app = new Application();

// CORS
const allowedOrigins: (string | RegExp)[] = [
  /^https?:\/\/([a-z0-9-]+\.)?youdroppedthis\.xyz$/,
];
const allowOrigin = Deno.env.get("ALLOW_ORIGIN");
if (allowOrigin) {
  allowedOrigins.push(...allowOrigin.split(",").map((o) => o.trim()));
}
app.use(
  oakCors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Global middleware
app.use(rateLimitMiddleware);

app.use(router.routes());

// Initialize services
await initDatabase();
Deno.addSignalListener("SIGINT", async () => {
  await closeDatabase();
  Deno.exit();
});
initSupabase();

const PORT = parseInt(Deno.env.get("PORT") || "8000");

console.log(`🚀 YouDroppedThis server running on port ${PORT}`);
await app.listen({ port: PORT });
