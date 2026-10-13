import { Router } from "express";
import { adminAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as tournamentController from "./tournament.controller.js";
import {
  createTournamentSchema,
  tournamentIdParamSchema,
  addPlayersSchema,
  updatePlayerSchema,
  updateGameResultSchema,
  bulkUpdateGameResultsSchema,
  roundParamsSchema,
} from "./tournament.validation.js";

const router = Router();

router.post(
  "/",
  adminAuth,
  validate(createTournamentSchema),
  tournamentController.createTournament,
);

router.get("/", tournamentController.getAllTournaments);

router.get(
  "/:id",
  validate(tournamentIdParamSchema),
  tournamentController.getTournamentById,
);

router.delete(
  "/:id",
  adminAuth,
  validate(tournamentIdParamSchema),
  tournamentController.deleteTournament,
);

router.post(
  "/:id/players",
  adminAuth,
  validate(addPlayersSchema),
  tournamentController.addPlayers,
);

router.patch(
  "/:id/players/:playerId",
  adminAuth,
  validate(updatePlayerSchema),
  tournamentController.updatePlayer,
);

router.post(
  "/:id/rounds/pair",
  adminAuth,
  validate(tournamentIdParamSchema),
  tournamentController.generateNextRound,
);

router.patch(
  "/:id/rounds/:roundNumber/games/:gameId",
  adminAuth,
  validate(updateGameResultSchema),
  tournamentController.updateGameResult,
);

router.post(
  "/:id/rounds/:roundNumber/games/bulk",
  adminAuth,
  validate(bulkUpdateGameResultsSchema),
  tournamentController.bulkUpdateGameResults,
);

router.post(
  "/:id/rounds/:roundNumber/complete",
  adminAuth,
  validate(roundParamsSchema),
  tournamentController.completeRound,
);

router.post(
  "/:id/complete",
  adminAuth,
  validate(tournamentIdParamSchema),
  tournamentController.completeTournament,
);

router.post(
  "/:id/rounds/:roundNumber/rollback",
  adminAuth,
  validate(roundParamsSchema),
  tournamentController.rollbackRound,
);

router.get(
  "/:id/standings",
  validate(tournamentIdParamSchema),
  tournamentController.getStandings,
);

router.get(
  "/:id/crosstable",
  validate(tournamentIdParamSchema),
  tournamentController.getCrossTable,
);

router.get(
  "/:id/rounds/:roundNumber/pdf",
  validate(roundParamsSchema),
  tournamentController.exportRoundPairingsPdf,
);

router.get(
  "/:id/audit",
  validate(tournamentIdParamSchema),
  tournamentController.getAuditReport,
);

export default router;
