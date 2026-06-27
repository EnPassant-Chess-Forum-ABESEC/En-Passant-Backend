import express from "express";
import { me, updateMe } from "./user.controller.js";
import { userAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateProfileSchema } from "./user.validation.js";

const router = express.Router();

router.get("/me", userAuth, me);
router.put("/me", userAuth, validate(updateProfileSchema), updateMe);

export default router;
