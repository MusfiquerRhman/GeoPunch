"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { userSchema } from "./schema";
import { db } from "@/utils/prisma";

export async function createUser(formData: FormData) {
  const data = Object.fromEntries(formData);

  const parsed = userSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  console.log(parsed.data); // this is the validated data

  // do DB stuff
  return { success: true };
};
