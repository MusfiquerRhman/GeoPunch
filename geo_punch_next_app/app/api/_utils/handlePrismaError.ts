import { Prisma } from "@/app/generated/prisma/client";

export function handlePrismaError(error: unknown): Error {
  console.error("Prisma Error:", error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint failed
        return new Error(`ID Card Number / Email already exists. Please use a different value`);

      case "P2003":
        // Foreign key constraint failed
        return new Error("Invalid reference: related record not found");

      case "P2025":
        // Record not found
        return new Error("Requested record does not exist");

      default:
        return new Error(`Database error: ${error.message}`);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new Error("Invalid data provided");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new Error("Database connection failed");
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new Error("Internal database error");
  }

  return new Error("Something went wrong");
}