import * as tournamentService from "./tournament.service.js";
import * as tournamentPdfService from "./tournamentPdf.service.js";
import Event from "../events/event.model.js";

export const createTournament = async (req, res, next) => {
  try {
    const tournament = await tournamentService.createTournament(
      req.user?._id,
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: "Tournament created successfully",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTournaments = async (req, res, next) => {
  try {
    const tournaments = await tournamentService.getTournaments(req.query);
    const eventIds = [
      ...new Set(tournaments.map((t) => t.referenceId).filter(Boolean)),
    ];
    const eventMap = new Map();
    if (eventIds.length > 0) {
      try {
        const events = await Event.find({ _id: { $in: eventIds } })
          .select("title")
          .lean();
        for (const ev of events) {
          eventMap.set(ev._id.toString(), ev.title);
        }
      } catch {
        // ignore
      }
    }

    const populated = tournaments.map((t) => {
      const obj = t.toObject ? t.toObject() : { ...t };
      if (obj.referenceId && eventMap.has(obj.referenceId)) {
        obj.eventTitle = eventMap.get(obj.referenceId);
        obj.eventId = obj.referenceId;
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      tournaments: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const getTournamentById = async (req, res, next) => {
  try {
    const tournament = await tournamentService.getTournamentById(req.params.id);
    const obj = tournament.toObject ? tournament.toObject() : { ...tournament };
    if (obj.referenceId) {
      try {
        const event = await Event.findById(obj.referenceId)
          .select("title")
          .lean();
        if (event) {
          obj.eventTitle = event.title;
          obj.eventId = event._id.toString();
        }
      } catch {
        // ignore
      }
    }

    return res.status(200).json({
      success: true,
      tournament: obj,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTournament = async (req, res, next) => {
  try {
    await tournamentService.deleteTournament(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Tournament deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const addPlayers = async (req, res, next) => {
  try {
    const tournament = await tournamentService.addPlayers(
      req.params.id,
      req.body.players,
    );
    return res.status(200).json({
      success: true,
      message: "Players added successfully",
      players: tournament.players,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlayer = async (req, res, next) => {
  try {
    const tournament = await tournamentService.updatePlayer(
      req.params.id,
      req.params.playerId,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Player updated successfully",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const generateNextRound = async (req, res, next) => {
  try {
    const tournament = await tournamentService.generateNextRound(req.params.id);
    const latestRound = tournament.rounds[tournament.rounds.length - 1];
    return res.status(201).json({
      success: true,
      message: `Round ${tournament.currentRoundNumber} paired successfully`,
      roundNumber: tournament.currentRoundNumber,
      round: latestRound,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGameResult = async (req, res, next) => {
  try {
    const tournament = await tournamentService.updateGameResult(
      req.params.id,
      req.params.roundNumber,
      req.params.gameId,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Game result updated successfully",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateGameResults = async (req, res, next) => {
  try {
    const tournament = await tournamentService.bulkUpdateGameResults(
      req.params.id,
      req.params.roundNumber,
      req.body.results,
    );
    return res.status(200).json({
      success: true,
      message: "Bulk game results updated successfully",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const completeRound = async (req, res, next) => {
  try {
    const tournament = await tournamentService.completeRound(
      req.params.id,
      req.params.roundNumber,
    );
    return res.status(200).json({
      success: true,
      message: `Round ${req.params.roundNumber} completed successfully`,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const completeTournament = async (req, res, next) => {
  try {
    const tournament = await tournamentService.completeTournament(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Tournament completed successfully",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const rollbackRound = async (req, res, next) => {
  try {
    const tournament = await tournamentService.rollbackRound(
      req.params.id,
      req.params.roundNumber,
    );
    return res.status(200).json({
      success: true,
      message: `Round ${req.params.roundNumber} rolled back successfully`,
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

export const getStandings = async (req, res, next) => {
  try {
    const data = await tournamentService.getStandings(req.params.id);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCrossTable = async (req, res, next) => {
  try {
    const data = await tournamentService.getCrossTable(req.params.id);
    return res.status(200).json({
      success: true,
      crossTable: data.matrix,
      matrix: data.matrix,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditReport = async (req, res, next) => {
  try {
    const report = await tournamentService.getAuditReport(req.params.id);
    return res.status(200).json({
      success: true,
      audit: report,
      auditReport: report,
    });
  } catch (error) {
    next(error);
  }
};

export const exportRoundPairingsPdf = async (req, res, next) => {
  try {
    const { id, roundNumber } = req.params;
    const { download } = req.query;
    const { buffer, filename } =
      await tournamentPdfService.generateRoundPairingsPdf(id, roundNumber);

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
