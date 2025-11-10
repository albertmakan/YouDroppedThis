import { Application, Router, oakCors } from "./deps.ts";
import { initDatabase } from "./config/database.ts";
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
app.use(
  oakCors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Global middleware
app.use(rateLimitMiddleware);

app.use(router.routes());

// Initialize services
await initDatabase();
initSupabase();

const PORT = parseInt(Deno.env.get("PORT") || "8000");

console.log(`🚀 YouDroppedThis server running on port ${PORT}`);
await app.listen({ port: PORT });
