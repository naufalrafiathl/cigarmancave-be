import { Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { environment } from "../config/environment";
import { UnauthorizedError } from "../errors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

export const validateAuth0Token = auth({
  audience: environment.AUTH0_AUDIENCE,
  issuerBaseURL: environment.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await validateAuth0Token(req, res, (err) => {
      if (err) {
        throw new UnauthorizedError("Invalid token");
      }
    });

    const auth0Id = req.auth?.payload.sub;
    if (!auth0Id) {
      throw new UnauthorizedError("User ID not found in token");
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: auth0Id },
    });

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          auth0Id: auth0Id,
          email: req.auth?.payload.email as string,
          badgeDisplayPreference: {},
          emailVerified: false,
          isPremium: false,
        },
      });
      req.user = { id: newUser.id };
    } else {
      req.user = { id: user.id };
    }

    next();
  } catch (error) {
    next(error);
  }
};
