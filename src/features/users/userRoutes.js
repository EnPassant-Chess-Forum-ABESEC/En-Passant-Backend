import express from "express";
import { me, updateMe } from "./userController.js";
import { userAuth } from "../../middleware/authMiddleware.js";
import { validate } from "../../middleware/validateMiddleware.js";
import { updateProfileSchema } from "./userValidation.js";

const router = express.Router();

router.get("/me", userAuth, me);
router.put("/me", userAuth, validate(updateProfileSchema), updateMe);

export default router;
