import express from "express";
import { me, updateMe, onboardUser } from "./user.controller.js";
import { userAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateProfileSchema, onboardingSchema } from "./user.validation.js";

const router = express.Router();

router.get("/me", userAuth, me);
router.post("/onboard", userAuth, validate(onboardingSchema), onboardUser);
router.put("/me", userAuth, validate(updateProfileSchema), updateMe);

export default router;
