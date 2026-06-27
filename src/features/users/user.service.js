import { findByClerkId, createUser, updateUser as updateUserRepository } from "./user.repository.js";

export const updateUser = async (clerkId, userData) => {
  return updateUserRepository(clerkId, userData);
};

export const getCurrentUser = async (clerkId) => {
  const user = await findByClerkId(clerkId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
