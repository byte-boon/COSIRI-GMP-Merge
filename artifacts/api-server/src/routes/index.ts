import { Router, type IRouter } from "express";
import healthRouter from "./health";
import companiesRouter from "./companies";
import cosiriRouter from "./cosiri";
import gmpRouter from "./gmp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(companiesRouter);
router.use(cosiriRouter);
router.use(gmpRouter);

export default router;
