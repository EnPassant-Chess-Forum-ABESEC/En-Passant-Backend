import { AppError } from "../../utils/AppError.js";
import * as eventRepo from "./event.repository.js";
import * as regRepo from "./registration/event.registration.repository.js";
import * as tournamentRepo from "../tournaments/tournament.repository.js";
import * as tournamentService from "../tournaments/tournament.service.js";
import { REGISTRATION_STATUS } from "./event.constants.js";
import { TOURNAMENT_STATUS } from "../tournaments/tournament.constants.js";

const extractPlayerRating = (user) => {
  if (!user || !user.chessAccounts) return 1200;
  const chessCom = user.chessAccounts.chessCom?.ratings;
  const lichess = user.chessAccounts.lichess?.ratings;
  return (
    chessCom?.rapid ||
    chessCom?.blitz ||
    lichess?.rapid ||
    lichess?.blitz ||
    1200
  );
};

export const initializeEventTournaments = async (userId, eventId, config = {}) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  const referenceId = eventId.toString();
  const targets = [];

  const isAll = !config.section || config.section.toLowerCase().trim() === "all";

  if (isAll) {
    if (Array.isArray(event.sections) && event.sections.length > 0) {
      for (const sec of event.sections) {
        const sectionName = sec.name.toLowerCase().trim();
        for (const brk of sec.brackets || []) {
          const bracketName = brk.name.toLowerCase().trim();
          const rounds = Number(
            config.bracketConfigs?.[bracketName]?.totalRounds ||
            brk.totalRounds ||
            sec.totalRounds ||
            config.totalRounds ||
            5
          );
          const timeControl =
            config.bracketConfigs?.[bracketName]?.timeControl ||
            brk.timeControl ||
            brk.timeFormat ||
            sec.timeControl ||
            sec.timeFormat ||
            config.timeControl ||
            config.timeFormat ||
            event.timeControl ||
            (bracketName === "advanced" ? "15 + 2" : "10 + 5");

          targets.push({
            section: sectionName,
            bracket: bracketName,
            totalRounds: rounds,
            timeControl,
            timeFormat: timeControl,
          });
        }
      }
    } else {
      const defaultBrackets = ["beginner", "intermediate", "advanced"];
      const rounds = Number(config.totalRounds || 5);
      for (const brk of defaultBrackets) {
        const timeControl =
          config.bracketConfigs?.[brk]?.timeControl ||
          (brk === "advanced" ? "15 + 2" : "10 + 5");
        targets.push({
          section: "open",
          bracket: brk,
          totalRounds: rounds,
          timeControl,
          timeFormat: timeControl,
        });
      }
    }
  } else {
    const sectionName = config.section.toLowerCase().trim();
    const eventSec = event.sections?.find(
      (s) => s.name?.toLowerCase() === sectionName,
    );

    let brackets = [];
    if (Array.isArray(config.brackets) && config.brackets.length > 0) {
      brackets = config.brackets.map((b) =>
        typeof b === "string" ? b.toLowerCase().trim() : b.name?.toLowerCase().trim()
      );
    } else if (
      eventSec &&
      Array.isArray(eventSec.brackets) &&
      eventSec.brackets.length > 0
    ) {
      brackets = eventSec.brackets.map((b) => b.name.toLowerCase().trim());
    } else {
      brackets = ["open"];
    }

    for (const brkName of brackets) {
      const secBrk = eventSec?.brackets?.find(
        (b) => b.name?.toLowerCase() === brkName,
      );
      const rounds = Number(
        config.bracketConfigs?.[brkName]?.totalRounds ||
        secBrk?.totalRounds ||
        config.totalRounds ||
        eventSec?.totalRounds ||
        5
      );
      const timeControl =
        config.bracketConfigs?.[brkName]?.timeControl ||
        secBrk?.timeControl ||
        secBrk?.timeFormat ||
        eventSec?.timeControl ||
        eventSec?.timeFormat ||
        config.timeControl ||
        config.timeFormat ||
        event.timeControl ||
        (brkName === "advanced" ? "15 + 2" : "10 + 5");

      targets.push({
        section: sectionName,
        bracket: brkName,
        totalRounds: rounds,
        timeControl,
        timeFormat: timeControl,
      });
    }
  }

  const results = [];
  for (const target of targets) {
    let tournament = await tournamentRepo.findTournamentByReferenceAndBracket(
      referenceId,
      target.section,
      target.bracket,
    );

    if (!tournament) {
      const title = `${event.title} - ${target.section.toUpperCase()} (${target.bracket.toUpperCase()})`;
      tournament = await tournamentService.createTournament(userId, {
        title,
        referenceId,
        section: target.section,
        bracket: target.bracket,
        format: config.format || "swiss",
        timeControl: target.timeControl,
        timeFormat: target.timeFormat,
        totalRounds: target.totalRounds,
        round1TopSeedColor: config.round1TopSeedColor || "W",
        players: [],
      });
    } else if (tournament.currentRoundNumber === 0) {
      let modified = false;
      if (target.timeControl && tournament.timeControl !== target.timeControl) {
        tournament.timeControl = target.timeControl;
        tournament.timeFormat = target.timeFormat;
        modified = true;
      }
      if (target.totalRounds && tournament.totalRounds !== target.totalRounds) {
        tournament.totalRounds = target.totalRounds;
        modified = true;
      }
      if (modified) {
        await tournament.save();
      }
    }
    results.push(tournament);
  }

  return results;
};

export const seedPlayersFromRegistrations = async (eventId, options = {}) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  const referenceId = eventId.toString();
  const tournaments = await tournamentRepo.findTournamentsByReferenceId(referenceId);
  if (!tournaments || tournaments.length === 0) {
    throw new AppError("No tournament brackets initialized for this event", 400);
  }

  const tournamentMap = new Map();
  for (const t of tournaments) {
    const secKey = (t.section || "").toLowerCase().trim();
    const brkKey = (t.bracket || "").toLowerCase().trim();
    tournamentMap.set(`${secKey}:${brkKey}`, t);
  }

  const statusFilter = options.status || REGISTRATION_STATUS.CONFIRMED;
  const registrations = await regRepo.findAllRegistrationsByEventId(eventId, {
    status: statusFilter,
  });

  const bucketMap = new Map();
  for (const t of tournaments) {
    bucketMap.set(t._id.toString(), []);
  }

  const secConfig = event.sections?.find(
    (s) => s.name?.toLowerCase() === "open",
  );
  const begBracket = secConfig?.brackets?.find((b) => b.name === "beginner");
  const intBracket = secConfig?.brackets?.find((b) => b.name === "intermediate");

  const defaultBegMax = begBracket?.maxRating ? begBracket.maxRating + 1 : 900;
  const defaultIntMax = intBracket?.maxRating ? intBracket.maxRating + 1 : 1500;

  const { beginnerMax = defaultBegMax, intermediateMax = defaultIntMax } =
    options.ratingThresholds || {};

  for (const reg of registrations) {
    const user = reg.registeredBy;
    const playerId = user?._id?.toString() || reg._id.toString();
    const playerName =
      reg.chessUsername ||
      user?.name ||
      user?.fullName ||
      user?.userName ||
      user?.collegeEmail ||
      (user?.rollNo ? `Roll ${user.rollNo}` : null) ||
      `Player ${playerId.slice(-4)}`;

    const rating = Number(reg.peakRapidRating) || extractPlayerRating(user) || 1200;

    let targetSection = (reg.section || "open").toLowerCase().trim();
    let targetBracket = (reg.bracket || "").toLowerCase().trim();

    if (targetSection === "open") {
      if (options.forceAutoAssignByRating || !targetBracket || targetBracket === "open") {
        if (rating < beginnerMax) {
          targetBracket = "beginner";
        } else if (rating < intermediateMax) {
          targetBracket = "intermediate";
        } else {
          targetBracket = "advanced";
        }
      }
    } else if (targetSection === "womens") {
      targetBracket = "open";
    } else if (!targetBracket) {
      targetBracket = "open";
    }

    let tournament =
      tournamentMap.get(`${targetSection}:${targetBracket}`) ||
      tournaments.find((t) => (t.section || "").toLowerCase().trim() === targetSection) ||
      tournaments[0];

    const playerEntry = {
      id: playerId,
      name: playerName,
      rating,
      active: true,
    };

    bucketMap.get(tournament._id.toString()).push(playerEntry);
  }

  const summary = {
    totalSeeded: 0,
    brackets: {},
  };

  for (const tournament of tournaments) {
    const playersToAdd = bucketMap.get(tournament._id.toString()) || [];
    const isStartedOrDone =
      tournament.status === TOURNAMENT_STATUS.COMPLETED ||
      tournament.currentRoundNumber > 0 ||
      tournament.status === TOURNAMENT_STATUS.IN_PROGRESS;

    const key = `${tournament.section}:${tournament.bracket}`;

    if (playersToAdd.length > 0) {
      if (isStartedOrDone) {
        summary.brackets[key] = {
          tournamentId: tournament._id,
          title: tournament.title,
          playerCount: tournament.players?.length || 0,
          seededInBatch: 0,
          status: tournament.status,
          skipped: true,
          reason: "Tournament has already started or completed",
        };
        continue;
      }

      const existingPlayerIds = new Set((tournament.players || []).map((p) => p.id));
      const freshPlayers = playersToAdd.filter((p) => !existingPlayerIds.has(p.id));

      if (freshPlayers.length > 0) {
        await tournamentService.addPlayers(tournament._id, freshPlayers);
        summary.totalSeeded += freshPlayers.length;
      }
    }

    const updatedTourn = await tournamentRepo.findTournamentById(tournament._id);
    summary.brackets[key] = {
      tournamentId: tournament._id,
      title: tournament.title,
      playerCount: updatedTourn?.players?.length || 0,
      seededInBatch: playersToAdd.length,
      status: tournament.status,
    };
  }

  return summary;
};

export const getEventTournamentDashboard = async (eventId) => {
  const event = await eventRepo.findEventById(eventId);
  if (!event) throw new AppError("Event not found", 404);

  const referenceId = eventId.toString();
  const tournaments = await tournamentRepo.findTournamentsByReferenceId(referenceId);

  const bracketsDashboard = [];
  for (const t of tournaments) {
    const currentRound = t.rounds.find(
      (r) => r.roundNumber === t.currentRoundNumber,
    );
    const completedRounds = t.rounds.filter((r) => r.isCompleted).length;
    const standingsData = await tournamentService.getStandings(t._id);
    const standings = standingsData?.standings || [];

    bracketsDashboard.push({
      tournamentId: t._id,
      title: t.title,
      section: t.section,
      bracket: t.bracket,
      format: t.format,
      timeControl: t.timeControl || null,
      timeFormat: t.timeFormat || t.timeControl || null,
      status: t.status,
      totalRounds: t.totalRounds,
      currentRoundNumber: t.currentRoundNumber,
      completedRounds,
      playerCount: t.players.length,
      activePlayerCount: t.players.filter((p) => p.active).length,
      currentRound: currentRound || null,
      topStandings: standings.slice(0, 5),
    });
  }

  return {
    eventId: event._id,
    eventTitle: event.title,
    participationMode: event.participationMode,
    totalBrackets: tournaments.length,
    brackets: bracketsDashboard,
  };
};

export const pairNextRoundForAllBrackets = async (eventId) => {
  const referenceId = eventId.toString();
  const tournaments = await tournamentRepo.findTournamentsByReferenceId(referenceId);
  if (!tournaments || tournaments.length === 0) {
    throw new AppError("No tournament brackets found for this event", 404);
  }

  const results = [];
  for (const t of tournaments) {
    try {
      const activeCount = (t.players || []).filter((p) => p.active !== false).length;
      if (activeCount < 2) {
        results.push({
          tournamentId: t._id,
          section: t.section,
          bracket: t.bracket,
          skipped: true,
          reason: `Insufficient active players (${activeCount} registered, minimum 2 required)`,
        });
        continue;
      }

      const isInitial = t.status === TOURNAMENT_STATUS.SETUP && t.currentRoundNumber === 0;
      const latestRound = t.rounds.find((r) => r.roundNumber === t.currentRoundNumber);
      const isReadyForNext = latestRound && latestRound.isCompleted && t.currentRoundNumber < t.totalRounds;

      if (isInitial || isReadyForNext) {
        const paired = await tournamentService.generateNextRound(t._id);
        results.push({
          tournamentId: t._id,
          section: t.section,
          bracket: t.bracket,
          success: true,
          roundNumber: paired.currentRoundNumber,
          gameCount: paired.rounds[paired.rounds.length - 1]?.games?.length || 0,
        });
      } else {
        results.push({
          tournamentId: t._id,
          section: t.section,
          bracket: t.bracket,
          skipped: true,
          reason: `Tournament status is ${t.status}, current round ${t.currentRoundNumber} completed: ${Boolean(latestRound?.isCompleted)}`,
        });
      }
    } catch (err) {
      results.push({
        tournamentId: t._id,
        section: t.section,
        bracket: t.bracket,
        success: false,
        error: err.message,
      });
    }
  }

  return results;
};

export const pairNextRoundForBracket = async (eventId, section = "open", bracket = "open") => {
  const referenceId = eventId.toString();
  const tournament = await tournamentRepo.findTournamentByReferenceAndBracket(
    referenceId,
    section.toLowerCase().trim(),
    bracket.toLowerCase().trim(),
  );
  if (!tournament) throw new AppError("Tournament bracket not found", 404);

  return tournamentService.generateNextRound(tournament._id);
};

export const getEventStandings = async (eventId) => {
  const referenceId = eventId.toString();
  const tournaments = await tournamentRepo.findTournamentsByReferenceId(referenceId);
  if (!tournaments || tournaments.length === 0) {
    throw new AppError("No tournament brackets found for this event", 404);
  }

  const standingsBySection = {};
  for (const t of tournaments) {
    const standingsData = await tournamentService.getStandings(t._id);
    const standings = standingsData?.standings || [];
    if (!standingsBySection[t.section]) {
      standingsBySection[t.section] = {};
    }
    standingsBySection[t.section][t.bracket] = {
      tournamentId: t._id,
      title: t.title,
      totalRounds: t.totalRounds,
      currentRoundNumber: t.currentRoundNumber,
      status: t.status,
      standings,
    };
  }

  return standingsBySection;
};

export const recordEventGameResult = async (
  eventId,
  section,
  bracket,
  roundNumber,
  gameId,
  result,
) => {
  const referenceId = eventId.toString();
  const tournament = await tournamentRepo.findTournamentByReferenceAndBracket(
    referenceId,
    section.toLowerCase().trim(),
    bracket.toLowerCase().trim(),
  );
  if (!tournament) throw new AppError("Tournament bracket not found", 404);

  return tournamentService.updateGameResult(
    tournament._id,
    roundNumber,
    gameId,
    { result },
  );
};
