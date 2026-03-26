import { Router, type IRouter } from "express";
import healthRouter from "./health";
import companiesRouter from "./companies";
import cosiriRouter from "./cosiri";
import gmpRouter from "./gmp";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(companiesRouter);
router.use(cosiriRouter);
router.use(gmpRouter);
router.use(storageRouter);

export default router;
