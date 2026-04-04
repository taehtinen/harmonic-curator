import type { UserStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      status: UserStatus;
    } & DefaultSession["user"];
  }

  interface User {
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    status?: UserStatus;
  }
}
