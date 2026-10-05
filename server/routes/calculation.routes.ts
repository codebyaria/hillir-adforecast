import { Router } from "express";

import type { PublicUser } from "../../shared/auth.js";
import {
  calculationPaginationSchema,
  calculationRequestSchema,
} from "../../shared/validation.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import type { AuthService } from "../services/auth.service.js";
import type { CalculationService } from "../services/calculation.service.js";

function authenticatedUser(responseLocals: Record<string, unknown>) {
  return responseLocals.authenticatedUser as PublicUser;
}

export function createCalculationRouter(
  authService: AuthService,
  calculationService: CalculationService,
) {
  const router = Router();
  const authenticate = createAuthenticate(authService);

  router.post("/calculations", authenticate, async (request, response) => {
    const input = calculationRequestSchema.parse(request.body);
    const calculation = await calculationService.create(
      authenticatedUser(response.locals).id,
      input,
    );

    response.status(201).json({ calculation });
  });

  router.get("/calculations", authenticate, async (request, response) => {
    // Vercel menambahkan parameter routing internal ke query string. Ambil hanya
    // parameter publik agar detail infrastruktur tidak masuk ke kontrak API.
    const pagination = calculationPaginationSchema.parse({
      page: request.query.page,
      limit: request.query.limit,
    });
    const result = await calculationService.list(
      authenticatedUser(response.locals).id,
      pagination,
    );

    response.status(200).json(result);
  });

  return router;
}
