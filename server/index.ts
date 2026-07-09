import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { z } from "zod";
import { getRazorpayConfig, razorpay } from "./lib/razorpay.js";
import { generateWritingAssist } from "./lib/ai.js";
import {
  attachOptionalUser,
  requireAuth,
  signToken,
  type AuthenticatedRequest,
} from "./lib/auth.js";
import {
  addComment,
  createStory,
  createUser,
  ensureStoryVisibleToUser,
  getAuthorById,
  getBootstrap,
  getStoryById,
  getUserForAuth,
  incrementStoryRead,
  initializeDatabase,
  savePreferences,
  toggleFollow,
  toggleLike,
  verifyPassword,
  updateUserSubscription,
  updateUserRazorpayAccountId,
  cancelUserSubscription,
} from "./db.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const uploadsDirectory = path.resolve(process.cwd(), "uploads", "covers");
fs.mkdirSync(uploadsDirectory, { recursive: true });

initializeDatabase();

app.use(
  cors({
    origin: true,
    credentials: false,
  }),
);

// Apply json middleware to all routes except the Stripe webhook endpoint
app.use((request, response, next) => {
  if (request.path === "/api/razorpay/webhook") {
    next();
  } else {
    express.json({ limit: "2mb" })(request, response, next);
  }
});

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use(attachOptionalUser);

const genreSchema = z.enum([
  "Personal",
  "Memoir",
  "Fantasy",
  "Romance",
  "Adventure",
  "Poetry",
  "Sci-Fi",
  "Horror",
]);

const uploadStorage = multer.diskStorage({
  destination: (_request, _file, callback) => callback(null, uploadsDirectory),
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname) || ".png";
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are supported."));
      return;
    }

    callback(null, true);
  },
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

const storyDraftSchema = z.object({
  title: z.string().trim().min(2).max(140),
  summary: z.string().trim().min(10).max(500),
  genre: genreSchema,
  tags: z.array(z.string().trim().min(1).max(40)).max(8),
  coverStyle: z.string().trim().min(1).max(200),
  coverImageUrl: z.string().trim().optional(),
  visibility: z.enum(["public", "private"]),
  isPersonal: z.boolean(),
  challenge: z.string().trim().optional(),
  chapters: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        content: z.string().trim().min(1),
      }),
    )
    .min(1),
});

const preferencesSchema = z.object({
  preferences: z.array(genreSchema).min(1).max(5),
});

const commentSchema = z.object({
  body: z.string().trim().min(2).max(1000),
});

const aiSchema = z.object({
  action: z.enum(["opening", "ending", "polish", "character"]),
  text: z.string().max(8000),
  genre: genreSchema.optional(),
  title: z.string().max(140).optional(),
});

const checkoutSchema = z.object({
  billingCycle: z.enum(["monthly", "yearly"]),
});

const respondWithValidationError = (
  response: express.Response,
  error: z.ZodError,
) => {
  response.status(400).json({
    message: error.issues[0]?.message || "Invalid request.",
  });
};

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/bootstrap", (request: AuthenticatedRequest, response) => {
  response.json(getBootstrap(request.userId));
});

app.post("/api/auth/register", (request, response) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    respondWithValidationError(response, parsed.error);
    return;
  }

  try {
    const user = createUser(parsed.data);
    const token = signToken(user!.id);
    response.status(201).json({ token, user });
  } catch (error) {
    response
      .status(400)
      .json({
        message:
          error instanceof Error ? error.message : "Unable to create account.",
      });
  }
});

app.post("/api/auth/login", (request, response) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    respondWithValidationError(response, parsed.error);
    return;
  }

  const userRecord = getUserForAuth(parsed.data.email);
  if (
    !userRecord ||
    !verifyPassword(parsed.data.password, userRecord.password_hash)
  ) {
    response.status(401).json({ message: "Incorrect email or password." });
    return;
  }

  const user = getAuthorById(userRecord.id);
  response.json({ token: signToken(userRecord.id), user });
});

app.get(
  "/api/auth/me",
  requireAuth,
  (request: AuthenticatedRequest, response) => {
    response.json({ user: getAuthorById(request.userId!) });
  },
);

app.put(
  "/api/me/preferences",
  requireAuth,
  (request: AuthenticatedRequest, response) => {
    const parsed = preferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      respondWithValidationError(response, parsed.error);
      return;
    }

    const preferences = savePreferences(
      request.userId!,
      parsed.data.preferences,
    );
    response.json({ preferences });
  },
);

app.get("/api/stories/:storyId", (request: AuthenticatedRequest, response) => {
  const storyId = String(request.params.storyId);
  const story = getStoryById(storyId, request.userId);

  if (!story) {
    response.status(404).json({ message: "Story not found." });
    return;
  }

  incrementStoryRead(story.id);
  response.json({ story: getStoryById(story.id, request.userId) });
});

app.post(
  "/api/stories",
  requireAuth,
  (request: AuthenticatedRequest, response) => {
    const parsed = storyDraftSchema.safeParse(request.body);
    if (!parsed.success) {
      respondWithValidationError(response, parsed.error);
      return;
    }

    try {
      const story = createStory({ authorId: request.userId!, ...parsed.data });
      response.status(201).json({ story });
    } catch (error) {
      response
        .status(400)
        .json({
          message:
            error instanceof Error ? error.message : "Unable to publish story.",
        });
    }
  },
);

app.post(
  "/api/stories/:storyId/like",
  requireAuth,
  (request: AuthenticatedRequest, response) => {
    const storyId = String(request.params.storyId);

    try {
      ensureStoryVisibleToUser(storyId, request.userId);
      response.json(toggleLike(storyId, request.userId!));
    } catch (error) {
      response
        .status(404)
        .json({
          message: error instanceof Error ? error.message : "Story not found.",
        });
    }
  },
);

app.post(
  "/api/stories/:storyId/comments",
  requireAuth,
  (request: AuthenticatedRequest, response) => {
    const storyId = String(request.params.storyId);
    const parsed = commentSchema.safeParse(request.body);
    if (!parsed.success) {
      respondWithValidationError(response, parsed.error);
      return;
    }

    try {
      ensureStoryVisibleToUser(storyId, request.userId);
      const comment = addComment({
        storyId,
        userId: request.userId!,
        body: parsed.data.body,
      });
      response.status(201).json({ comment });
    } catch (error) {
      response
        .status(404)
        .json({
          message: error instanceof Error ? error.message : "Story not found.",
        });
    }
  },
);

app.post(
  "/api/authors/:authorId/follow",
  requireAuth,
  (request: AuthenticatedRequest, response) => {
    const authorId = String(request.params.authorId);
    const author = getAuthorById(authorId);
    if (!author) {
      response.status(404).json({ message: "Writer not found." });
      return;
    }

    response.json(toggleFollow(authorId, request.userId!));
  },
);

app.post(
  "/api/uploads/cover",
  requireAuth,
  upload.single("cover"),
  (request, response) => {
    if (!request.file) {
      response.status(400).json({ message: "No file uploaded." });
      return;
    }

    // Get the host from request headers to build absolute URL
    const protocol = request.protocol;
    const host = request.get('host');
    const absoluteUrl = `${protocol}://${host}/uploads/covers/${request.file.filename}`;

    response.status(201).json({
      url: absoluteUrl,
    });
  },
);

app.post("/api/ai/assist", requireAuth, async (request, response) => {
  const parsed = aiSchema.safeParse(request.body);
  if (!parsed.success) {
    respondWithValidationError(response, parsed.error);
    return;
  }

  const result = await generateWritingAssist(parsed.data);
  response.json(result);
});

// Razorpay Subscription Endpoint
app.post(
  "/api/razorpay/subscription",
  requireAuth,
  async (request: AuthenticatedRequest, response) => {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      respondWithValidationError(response, parsed.error);
      return;
    }

    const razorpayConfig = getRazorpayConfig();
    const planId =
      parsed.data.billingCycle === "monthly"
        ? razorpayConfig.premiumPlans.monthly
        : razorpayConfig.premiumPlans.yearly;

    if (!planId) {
      response.status(500).json({
        message: "Razorpay configuration not complete. Please set plan IDs.",
      });
      return;
    }

    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: parsed.data.billingCycle === "monthly" ? 12 : 1, // Number of billing cycles
        notes: {
          userId: request.userId!,
          billingCycle: parsed.data.billingCycle,
        },
      });

      response.json({ 
        subscriptionId: subscription.id, 
        keyId: razorpayConfig.keyId 
      });
    } catch (error) {
      console.error("Razorpay error:", error);
      response.status(500).json({
        message: "Failed to create subscription.",
      });
    }
  },
);

// Razorpay Webhook Endpoint
app.post(
  "/api/razorpay/webhook",
  express.raw({ type: "application/json" }), 
  async (request: express.Request, response: express.Response) => {
    const razorpayConfig = getRazorpayConfig();
    const signature = request.headers["x-razorpay-signature"] as string;

    const body = request.body.toString();
    const crypto = await import("node:crypto");
    const expectedSignature = crypto
      .createHmac("sha256", razorpayConfig.webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error(`⚠️  Webhook signature verification failed`);
      response.status(400).send(`Webhook Error: Invalid signature`);
      return;
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case "subscription.charged": {
        const subscription = event.payload.subscription.entity;
        const userId = subscription.notes?.userId;
        console.log(`💰 Payment successful for user: ${userId}`);
        if (userId) {
          updateUserSubscription(userId, "premium", subscription.id);
        }
        break;
      }
      case "subscription.cancelled": {
        const subscription = event.payload.subscription.entity;
        console.log(`❌ Subscription canceled: ${subscription.id}`);
        cancelUserSubscription(subscription.id);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.event}`);
    }

    response.json({ received: true });
  },
);

// Razorpay Connect for Writers (Stub)
app.post("/api/razorpay/connect", requireAuth, async (request: AuthenticatedRequest, response) => {
  // Stub for now. Razorpay Route implementation for payouts requires onboarding UI or OAuth.
  response.status(501).json({ message: "Writer payouts via Razorpay Route coming soon!" });
});

app.use(
  (
    error: Error,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    response
      .status(500)
      .json({ message: error.message || "Unexpected server error." });
  },
);

app.listen(port, () => {
  console.log(`TaleTogether API running at http://localhost:${port}`);
});
