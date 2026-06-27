import { updateUser as updateUserRepository } from "./user.repository.js";

export const updateUser = async (clerkId, userData) => {
  return updateUserRepository(clerkId, userData);
};
