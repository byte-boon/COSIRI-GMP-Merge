import { Router, type IRouter } from "express";
import healthRouter from "./health";
import companiesRouter from "./companies";
import cosiriRouter from "./cosiri";
import gmpRouter from "./gmp";
import storageRouter from "./storage";
import authRouter from "./auth";
import { requireCompanyAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(companiesRouter);
router.use(requireCompanyAuth, cosiriRouter);
router.use(requireCompanyAuth, gmpRouter);
router.use(requireCompanyAuth, storageRouter);

export default router;
