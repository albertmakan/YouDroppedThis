import { Application, Router } from "./deps.ts";
import { oakCors } from "./deps.ts";
import { authRouter } from "./routes/auth.ts";
import { canvasRouter } from "./routes/canvas.ts";
import { artworkRouter } from "./routes/artwork.ts";
import { userRouter } from "./routes/user.ts";
import { authMiddleware } from "./middleware/auth.ts";
import { rateLimitMiddleware } from "./middleware/rateLimit.ts";
import { WebSocketService } from "./services/WebSocketService.ts";
import { ExpirationService } from "./services/ExpirationService.ts";
import { initDatabase } from "./config/database.ts";

const router = new Router();
// Routes
router.use("/api/auth", authRouter.routes(), authRouter.allowedMethods());
router.use(
  "/api/user",
  authMiddleware,
  userRouter.routes(),
  userRouter.allowedMethods()
);
router.use("/api/canvas", canvasRouter.routes(), canvasRouter.allowedMethods());
router.use(
  "/api/artwork",
  authMiddleware,
  artworkRouter.routes(),
  artworkRouter.allowedMethods()
);

const wsService = new WebSocketService();
// WebSocket endpoint
router.get("/ws", (ctx) => {
  const socket = ctx.upgrade();
  wsService.handleConnection(socket, ctx);
});

const app = new Application();
const expirationService = new ExpirationService();

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
expirationService.start();

const PORT = parseInt(Deno.env.get("PORT") || "8000");

console.log(`🚀 YouDroppedThis server running on port ${PORT}`);
console.log(`📡 WebSocket server ready at ws://localhost:${PORT}/ws`);

await app.listen({ port: PORT });
