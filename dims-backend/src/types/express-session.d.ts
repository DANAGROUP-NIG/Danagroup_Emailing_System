import "express-session";

declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      email: string;
      role: string;
    };
  }
}

// Optional: If you use req.user via Passport
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }
  }
}
