import User from "./user.model.js";

export const findByClerkId = async (clerkId) => {
  return User.findOne({ clerkId });
};

export const findByUserName = async (userName) => {
  return User.findOne({ userName });
};

export const createUser = async (userData) => {
  return User.create(userData);
};

export const updateUser = async (clerkId, userData) => {
  return User.findOneAndUpdate({ clerkId }, userData, {
    returnDocument: "after",
  });
};

import mongoose from "mongoose";

export const buildUserQuery = (search, role) => {
  const query = {};
  if (role && role !== "ALL") {
    query.role = role;
  }
  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { userName: searchRegex },
      { email: searchRegex },
      { clerkId: searchRegex },
    ];
    if (mongoose.Types.ObjectId.isValid(search)) {
      query.$or.push({ _id: search });
    }
  }
  return query;
};

export const countUsers = async (search = "", role = "ALL") => {
  const query = buildUserQuery(search, role);
  return User.countDocuments(query);
};

export const findAll = (pageSize = 10, pageNumber = 1, search = "", role = "ALL", sort = "NEWEST") => {
  const query = buildUserQuery(search, role);
  const sortOrder = sort === "OLDEST" ? { createdAt: 1 } : { createdAt: -1 };

  return User.find(query)
    .sort(sortOrder)
    .limit(Number(pageSize))
    .skip((Number(pageNumber) - 1) * Number(pageSize));
};
