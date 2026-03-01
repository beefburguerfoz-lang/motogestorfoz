import jwt from "jsonwebtoken";

type DispatchAction = "ACCEPT" | "REFUSE";

type DispatchTokenPayload = {
  action: DispatchAction;
  orderId: string;
  riderId: string;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("jwt_secret_not_configured");
  return secret;
}

export function createDispatchToken(payload: DispatchTokenPayload, expiresIn: string = "5m") {
  return jwt.sign(payload, getSecret(), { expiresIn } as any);
}

export function verifyDispatchToken(token: string): DispatchTokenPayload {
  return jwt.verify(token, getSecret()) as DispatchTokenPayload;
}
