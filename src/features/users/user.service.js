import * as userRepo from "./user.repository.js";

export const getUserByIdService = async (clerkId) => {
  return userRepo.findByClerkId(clerkId);
};

export const getAllUsersService = async (pageSize, pageNumber) => {
  return userRepo.findAll(pageSize, pageNumber);
};

export const updateUserService = async (clerkId, data) => {
  return userRepo.updateUser(clerkId, data);
};
