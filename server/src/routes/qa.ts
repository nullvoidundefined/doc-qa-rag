import express from "express";

import * as qaHandlers from "app/handlers/qa/qa.js";
import { requireAuth } from "app/middleware/requireAuth/requireAuth.js";

const qaRouter = express.Router();

qaRouter.use(requireAuth);
qaRouter.post("/", qaHandlers.streamQA);

export { qaRouter };
