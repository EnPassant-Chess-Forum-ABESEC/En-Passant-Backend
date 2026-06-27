import { findByClerkId, createUser } from "../users/userRepository.js";

export const getCurrentUser = async (clerkId) => {
  const user = await findByClerkId(clerkId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
