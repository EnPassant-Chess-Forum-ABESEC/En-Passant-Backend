import * as eventTournamentService from "./eventTournament.service.js";
import * as tournamentRepo from "../tournaments/tournament.repository.js";
import * as tournamentPdfService from "../tournaments/tournamentPdf.service.js";
import { AppError } from "../../utils/AppError.js";

export const initializeEventTournaments = async (req, res, next) => {
  try {
    const tournaments =
      await eventTournamentService.initializeEventTournaments(
        req.user?._id,
        req.params.id,
        req.body,
      );

    return res.status(201).json({
      success: true,
      message: "Event tournament brackets initialized successfully",
      tournaments,
    });
  } catch (error) {
    next(error);
  }
};

export const seedPlayers = async (req, res, next) => {
  try {
    const result =
      await eventTournamentService.seedPlayersFromRegistrations(
        req.params.id,
        req.body,
      );

    return res.status(200).json({
      success: true,
      message: "Players seeded into tournament brackets successfully",
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const dashboard =
      await eventTournamentService.getEventTournamentDashboard(req.params.id);

    return res.status(200).json({
      success: true,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};

export const pairRound = async (req, res, next) => {
  try {
    const { section, bracket } = req.body || {};
    let result;

    if (section && bracket) {
      result = await eventTournamentService.pairNextRoundForBracket(
        req.params.id,
        section,
        bracket,
      );
    } else {
      result = await eventTournamentService.pairNextRoundForAllBrackets(
        req.params.id,
      );
    }

    let message = "Pairings generated successfully";
    if (Array.isArray(result)) {
      const pairedCount = result.filter((r) => r.success).length;
      message =
        pairedCount > 0
          ? `Pairings generated for ${pairedCount} bracket(s)`
          : "No brackets were paired. Ensure brackets have at least 2 active players.";
    }

    return res.status(200).json({
      success: true,
      message,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getStandings = async (req, res, next) => {
  try {
    const standings = await eventTournamentService.getEventStandings(
      req.params.id,
    );

    return res.status(200).json({
      success: true,
      standings,
    });
  } catch (error) {
    next(error);
  }
};

export const recordGameResult = async (req, res, next) => {
  try {
    const { id, section, bracket } = req.params;
    const { roundNumber, gameId, result } = req.body;

    const tournament = await eventTournamentService.recordEventGameResult(
      id,
      section,
      bracket,
      roundNumber,
      gameId,
      result,
    );

    return res.status(200).json({
      success: true,
      message: "Game result recorded successfully",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const exportBracketRoundPdf = async (req, res, next) => {
  try {
    const { id, section, bracket, roundNumber } = req.params;
    const { download } = req.query;
    const tournament =
      await tournamentRepo.findTournamentByReferenceAndBracket(
        id,
        section.toLowerCase().trim(),
        bracket.toLowerCase().trim(),
      );
    if (!tournament) {
      throw new AppError("Tournament bracket not found", 404);
    }

    const { buffer, filename } =
      await tournamentPdfService.generateRoundPairingsPdf(
        tournament._id,
        roundNumber,
      );

    res.setHeader("Content-Type", "application/pdf");
    const dispositionType = download === "true" ? "attachment" : "inline";
    res.setHeader(
      "Content-Disposition",
      `${dispositionType}; filename="${filename}"`,
    );
    res.setHeader("Content-Length", buffer.length);

    return res.end(buffer);
  } catch (error) {
    next(error);
  }
};
