import { AppError } from "../../utils/AppError.js";
import * as tournamentRepo from "./tournament.repository.js";
import {
  generateRoundPairings,
  calculateStandings,
  validateTournamentRules,
  VALID_RESULTS,
} from "./pairing-engine/index.js";
import {
  TOURNAMENT_STATUS,
  ROUND_STATUS,
  GAME_STATUS,
} from "./tournament.constants.js";

const sanitizePlayer = (p, index) => ({
  id: p.id ? String(p.id) : String(index + 1),
  name: p.name || `Player ${index + 1}`,
  rating: Number(p.rating) || 1200,
  title: p.title || "",
  initialRank: p.initialRank || index + 1,
  active: p.active !== false,
  halfPointByeRequestedRounds: Array.isArray(p.halfPointByeRequestedRounds)
    ? p.halfPointByeRequestedRounds.map(Number)
    : [],
});

export const createTournament = async (userId, data) => {
  let players = [];
  if (Array.isArray(data.players)) {
    const sorted = [...data.players].sort((a, b) => {
      const rA = Number(a.rating) || 1200;
      const rB = Number(b.rating) || 1200;
      if (rB !== rA) return rB - rA;
      return (a.name || "").localeCompare(b.name || "");
    });
    players = sorted.map((p, idx) => sanitizePlayer(p, idx));
  }

  const tournamentData = {
    title: data.title,
    referenceId: data.referenceId || null,
    section: (data.section || "open").toLowerCase().trim(),
    bracket: (data.bracket || "open").toLowerCase().trim(),
    format: data.format || "swiss",
    totalRounds: Number(data.totalRounds),
    round1TopSeedColor: data.round1TopSeedColor === "B" ? "B" : "W",
    status: TOURNAMENT_STATUS.SETUP,
    players,
    rounds: [],
    createdBy: userId || null,
  };

  return tournamentRepo.createTournament(tournamentData);
};

export const getTournamentById = async (id) => {
  const tournament = await tournamentRepo.findTournamentById(id);
  if (!tournament) throw new AppError("Tournament not found", 404);
  return tournament;
};

export const getTournaments = async (filter = {}) => {
  return tournamentRepo.findTournaments(filter);
};

export const getTournamentsByReference = async (referenceId, filter = {}) => {
  return tournamentRepo.findTournamentsByReferenceId(referenceId, filter);
};

export const getTournamentByReferenceAndBracket = async (
  referenceId,
  section = "open",
  bracket = "open",
) => {
  const tournament = await tournamentRepo.findTournamentByReferenceAndBracket(
    referenceId,
    section.toLowerCase().trim(),
    bracket.toLowerCase().trim(),
  );
  if (!tournament) throw new AppError("Tournament bracket not found", 404);
  return tournament;
};

export const deleteTournament = async (id) => {
  const tournament = await tournamentRepo.deleteTournament(id);
  if (!tournament) throw new AppError("Tournament not found", 404);
  return tournament;
};

export const addPlayers = async (tournamentId, playersList) => {
  const tournament = await getTournamentById(tournamentId);

  if (tournament.status === TOURNAMENT_STATUS.COMPLETED) {
    throw new AppError("Cannot add players to a completed tournament", 400);
  }

  if (
    tournament.currentRoundNumber > 0 ||
    tournament.status === TOURNAMENT_STATUS.IN_PROGRESS
  ) {
    throw new AppError(
      "Cannot add players to a tournament that has already started",
      400,
    );
  }

  const existingIds = new Set(tournament.players.map((p) => p.id));
  const newPlayers = [];

  for (const p of playersList) {
    let candidateId = p.id ? String(p.id) : null;
    if (!candidateId || existingIds.has(candidateId)) {
      candidateId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    existingIds.add(candidateId);
    newPlayers.push({
      ...p,
      id: candidateId,
      rating: Number(p.rating) || 1200,
      active: p.active !== false,
      halfPointByeRequestedRounds: Array.isArray(p.halfPointByeRequestedRounds)
        ? p.halfPointByeRequestedRounds.map(Number)
        : [],
    });
  }

  tournament.players.push(...newPlayers);

  if (tournament.currentRoundNumber === 0) {
    tournament.players.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
    tournament.players.forEach((p, idx) => {
      p.initialRank = idx + 1;
    });
  }

  return tournament.save();
};

export const updatePlayer = async (tournamentId, playerId, updateData) => {
  const tournament = await getTournamentById(tournamentId);

  if (tournament.status === TOURNAMENT_STATUS.COMPLETED) {
    throw new AppError("Cannot modify players in a completed tournament", 400);
  }

  const player = tournament.players.find((p) => p.id === String(playerId));

  if (!player) throw new AppError("Player not found in tournament", 404);

  if (typeof updateData.active === "boolean") player.active = updateData.active;
  if (updateData.name) player.name = updateData.name;
  if (typeof updateData.rating === "number") player.rating = updateData.rating;
  if (updateData.title !== undefined) player.title = updateData.title;
  if (Array.isArray(updateData.halfPointByeRequestedRounds)) {
    player.halfPointByeRequestedRounds =
      updateData.halfPointByeRequestedRounds.map(Number);
  }

  return tournament.save();
};

export const generateNextRound = async (tournamentId) => {
  const tournament = await getTournamentById(tournamentId);

  if (tournament.status === TOURNAMENT_STATUS.COMPLETED) {
    throw new AppError("Tournament is already completed", 400);
  }

  const currentRoundNum = tournament.currentRoundNumber;
  const nextRoundNum = currentRoundNum + 1;

  if (nextRoundNum > tournament.totalRounds) {
    throw new AppError(
      `All ${tournament.totalRounds} rounds have already been paired`,
      400,
    );
  }

  const activePlayers = (tournament.players || []).filter(
    (p) => p.active !== false,
  );
  if (activePlayers.length < 2) {
    throw new AppError(
      `Cannot pair round: At least 2 active players are required to generate pairings (found ${activePlayers.length})`,
      400,
    );
  }

  if (currentRoundNum > 0) {
    const currentRound = tournament.rounds.find(
      (r) => r.roundNumber === currentRoundNum,
    );

    if (!currentRound) {
      throw new AppError(`Current round ${currentRoundNum} not found`, 500);
    }

    const unfinished = currentRound.games.filter((g) => g.result === null);
    if (unfinished.length > 0) {
      const boards = unfinished.map((g) => g.boardNumber).join(", ");
      throw new AppError(
        `Cannot pair Round ${nextRoundNum}: Round ${currentRoundNum} has unfinished boards (${boards})`,
        400,
      );
    }

    currentRound.isCompleted = true;
    currentRound.status = ROUND_STATUS.COMPLETED;
    if (!currentRound.completedAt) currentRound.completedAt = new Date();
  }

  const players = tournament.players.map((p) => ({
    id: p.id,
    name: p.name,
    rating: p.rating,
    active: p.active,
    halfPointByeRequestedRounds: p.halfPointByeRequestedRounds || [],
  }));

  const completedRounds = tournament.rounds
    .filter((r) => r.roundNumber < nextRoundNum)
    .map((r) => ({
      roundNumber: r.roundNumber,
      isCompleted: true,
      games: r.games.map((g) => ({
        id: g.id,
        round: g.round,
        boardNumber: g.boardNumber,
        whitePlayerId: g.whitePlayerId,
        blackPlayerId: g.blackPlayerId,
        result: g.result,
      })),
    }));

  const games = generateRoundPairings(
    nextRoundNum,
    players,
    completedRounds,
    tournament.round1TopSeedColor,
    tournament.format,
  );

  if (!games || games.length === 0) {
    throw new AppError(
      "Cannot pair round: Pairing algorithm produced 0 games. Ensure at least 2 active players are available to play.",
      400,
    );
  }

  const formattedGames = games.map((g) => ({
    id: g.id || `r${nextRoundNum}-b${g.boardNumber}`,
    round: nextRoundNum,
    boardNumber: g.boardNumber,
    whitePlayerId: g.whitePlayerId,
    blackPlayerId: g.blackPlayerId,
    result: g.result || null,
    status: g.result ? GAME_STATUS.COMPLETED : GAME_STATUS.SCHEDULED,
    pairingExplanation: g.pairingExplanation || "",
    manualOverride: false,
    arbiterNotes: "",
  }));

  tournament.rounds.push({
    roundNumber: nextRoundNum,
    status: ROUND_STATUS.PUBLISHED,
    isCompleted: false,
    games: formattedGames,
    publishedAt: new Date(),
    completedAt: null,
  });

  tournament.currentRoundNumber = nextRoundNum;
  tournament.status = TOURNAMENT_STATUS.IN_PROGRESS;

  return tournament.save();
};

export const updateGameResult = async (
  tournamentId,
  roundNumber,
  gameId,
  resultData,
) => {
  const result =
    resultData && typeof resultData === "object"
      ? resultData.result
      : resultData;

  if (result !== null && !VALID_RESULTS.has(result)) {
    throw new AppError(`Invalid game result: ${result}`, 400);
  }

  const tournament = await getTournamentById(tournamentId);
  const round = tournament.rounds.find(
    (r) => r.roundNumber === Number(roundNumber),
  );

  if (!round) {
    throw new AppError(`Round ${roundNumber} not found`, 404);
  }

  const maxRoundNumber = tournament.rounds.reduce(
    (max, r) => Math.max(max, r.roundNumber),
    0,
  );
  if (round.roundNumber < maxRoundNumber) {
    throw new AppError(
      `Cannot modify Round ${roundNumber} results because Round ${round.roundNumber + 1} pairings have already been generated`,
      400,
    );
  }

  const game = round.games.find((g) => g.id === String(gameId));
  if (!game) {
    throw new AppError(`Game ${gameId} not found in Round ${roundNumber}`, 404);
  }

  game.result = result;
  game.status = result ? GAME_STATUS.COMPLETED : GAME_STATUS.SCHEDULED;

  const allFinished = round.games.every((g) => g.result !== null);
  if (allFinished) {
    round.isCompleted = true;
    round.status = ROUND_STATUS.COMPLETED;
    if (!round.completedAt) round.completedAt = new Date();
  } else {
    round.isCompleted = false;
    round.status = ROUND_STATUS.PUBLISHED;
  }

  return tournament.save();
};

export const bulkUpdateGameResults = async (
  tournamentId,
  roundNumber,
  resultsList,
) => {
  const tournament = await getTournamentById(tournamentId);
  const round = tournament.rounds.find(
    (r) => r.roundNumber === Number(roundNumber),
  );

  if (!round) {
    throw new AppError(`Round ${roundNumber} not found`, 404);
  }

  const maxRoundNumber = tournament.rounds.reduce(
    (max, r) => Math.max(max, r.roundNumber),
    0,
  );
  if (round.roundNumber < maxRoundNumber) {
    throw new AppError(
      `Cannot modify Round ${roundNumber} results because Round ${round.roundNumber + 1} pairings have already been generated`,
      400,
    );
  }

  for (const item of resultsList) {
    if (item.result !== null && !VALID_RESULTS.has(item.result)) {
      throw new AppError(`Invalid game result: ${item.result}`, 400);
    }

    const game = round.games.find((g) => g.id === String(item.gameId));
    if (game) {
      game.result = item.result;
      game.status = item.result ? GAME_STATUS.COMPLETED : GAME_STATUS.SCHEDULED;
    }
  }

  const allFinished = round.games.every((g) => g.result !== null);
  if (allFinished) {
    round.isCompleted = true;
    round.status = ROUND_STATUS.COMPLETED;
    if (!round.completedAt) round.completedAt = new Date();
  } else {
    round.isCompleted = false;
    round.status = ROUND_STATUS.PUBLISHED;
  }

  return tournament.save();
};

export const completeRound = async (tournamentId, roundNumber) => {
  const tournament = await getTournamentById(tournamentId);
  const round = tournament.rounds.find(
    (r) => r.roundNumber === Number(roundNumber),
  );

  if (!round) {
    throw new AppError(`Round ${roundNumber} not found`, 404);
  }

  if (!round.games || round.games.length === 0) {
    throw new AppError(
      `Cannot complete Round ${roundNumber}: Round has no paired games`,
      400,
    );
  }

  const unfinished = round.games.filter((g) => g.result === null);
  if (unfinished.length > 0) {
    const boards = unfinished.map((g) => g.boardNumber).join(", ");
    throw new AppError(
      `Cannot complete Round ${roundNumber}: Boards ${boards} are still unfinished`,
      400,
    );
  }

  round.isCompleted = true;
  round.status = ROUND_STATUS.COMPLETED;
  round.completedAt = new Date();

  if (Number(roundNumber) === tournament.totalRounds) {
    tournament.status = TOURNAMENT_STATUS.COMPLETED;
  }

  return tournament.save();
};

export const completeTournament = async (tournamentId) => {
  const tournament = await getTournamentById(tournamentId);

  if (tournament.currentRoundNumber < tournament.totalRounds) {
    throw new AppError(
      `Cannot complete tournament: Only ${tournament.currentRoundNumber} of ${tournament.totalRounds} rounds have been paired`,
      400,
    );
  }

  for (const r of tournament.rounds) {
    const unfinished = r.games.filter((g) => g.result === null);
    if (unfinished.length > 0) {
      throw new AppError(
        `Cannot complete tournament: Round ${r.roundNumber} still has unfinished games`,
        400,
      );
    }
    r.isCompleted = true;
    r.status = ROUND_STATUS.COMPLETED;
    if (!r.completedAt) r.completedAt = new Date();
  }

  tournament.status = TOURNAMENT_STATUS.COMPLETED;
  return tournament.save();
};

export const rollbackRound = async (tournamentId, roundNumber) => {
  const tournament = await getTournamentById(tournamentId);
  const targetRound = Number(roundNumber);

  if (tournament.currentRoundNumber !== targetRound) {
    throw new AppError(
      `Can only roll back the latest round (${tournament.currentRoundNumber})`,
      400,
    );
  }

  tournament.rounds = tournament.rounds.filter(
    (r) => r.roundNumber !== targetRound,
  );
  tournament.currentRoundNumber = targetRound - 1;

  if (tournament.currentRoundNumber === 0) {
    tournament.status = TOURNAMENT_STATUS.SETUP;
  } else {
    tournament.status = TOURNAMENT_STATUS.IN_PROGRESS;
    const prevRound = tournament.rounds.find(
      (r) => r.roundNumber === tournament.currentRoundNumber,
    );
    if (prevRound) {
      prevRound.isCompleted = false;
      prevRound.status = ROUND_STATUS.PUBLISHED;
    }
  }

  return tournament.save();
};

export const getStandings = async (tournamentId) => {
  const tournament = await getTournamentById(tournamentId);

  const players = tournament.players.map((p) => ({
    id: p.id,
    name: p.name,
    title: p.title,
    rating: p.rating,
    active: p.active,
  }));

  const completedRounds = tournament.rounds.map((r) => ({
    roundNumber: r.roundNumber,
    isCompleted: r.isCompleted,
    games: r.games.map((g) => ({
      id: g.id,
      round: g.round,
      boardNumber: g.boardNumber,
      whitePlayerId: g.whitePlayerId,
      blackPlayerId: g.blackPlayerId,
      result: g.result,
    })),
  }));

  const standings = calculateStandings(
    players,
    completedRounds,
    tournament.totalRounds,
  ).map((s) => ({
    ...s,
    points: s.score,
  }));

  return {
    tournamentId: tournament._id,
    title: tournament.title,
    currentRoundNumber: tournament.currentRoundNumber,
    totalRounds: tournament.totalRounds,
    status: tournament.status,
    standings,
  };
};

export const getCrossTable = async (tournamentId) => {
  const tournament = await getTournamentById(tournamentId);
  const standingsData = await getStandings(tournamentId);

  const playerMap = new Map(tournament.players.map((p) => [p.id, p]));

  const matrix = standingsData.standings.map((row) => {
    const roundResults = [];

    for (let r = 1; r <= tournament.currentRoundNumber; r++) {
      const round = tournament.rounds.find((rnd) => rnd.roundNumber === r);
      if (!round) {
        roundResults.push({ round: r, text: "-" });
        continue;
      }

      const game = round.games.find(
        (g) =>
          g.whitePlayerId === row.playerId || g.blackPlayerId === row.playerId,
      );

      if (!game) {
        roundResults.push({ round: r, text: "—", isOngoing: false });
        continue;
      }

      const isWhite = game.whitePlayerId === row.playerId;
      const isBlack = game.blackPlayerId === row.playerId;
      const color = isWhite ? "W" : isBlack ? "B" : "-";
      const oppId = isWhite ? game.blackPlayerId : game.whitePlayerId;
      const opp = oppId ? playerMap.get(oppId) : null;
      const oppStanding = oppId
        ? standingsData.standings.find((s) => s.playerId === oppId)
        : null;
      const oppRank = oppStanding?.rank || opp?.initialRank || null;
      const isBye = Boolean(
        game.result?.startsWith("BYE") || (!oppId && !game.blackPlayerId),
      );

      if (!game.result) {
        roundResults.push({
          round: r,
          opponentId: oppId,
          opponentRank: oppRank,
          opponentName: opp ? opp.name : "-",
          color,
          result: null,
          points: null,
          score: null,
          isOngoing: true,
          isBye: false,
          text: `* (${color}${oppRank ? ` #${oppRank}` : ""})`,
        });
        continue;
      }

      let pts = 0;
      if (game.result === "1-0") pts = isWhite ? 1 : 0;
      else if (game.result === "0-1") pts = isBlack ? 1 : 0;
      else if (game.result === "1/2-1/2") pts = 0.5;
      else if (game.result === "1-0F") pts = isWhite ? 1 : 0;
      else if (game.result === "0-1F") pts = isBlack ? 1 : 0;
      else if (game.result === "BYE_PAB") pts = 1;
      else if (game.result === "BYE_HALF") pts = 0.5;

      roundResults.push({
        round: r,
        opponentId: oppId,
        opponentRank: oppRank,
        opponentName: opp ? opp.name : isBye ? "BYE" : "-",
        color,
        result: game.result,
        points: pts,
        score: pts,
        isOngoing: false,
        isBye,
        text: `${pts} (${color}${oppRank ? ` #${oppRank}` : ""})`,
      });
    }

    return {
      rank: row.rank,
      playerId: row.playerId,
      name: row.name,
      rating: row.rating,
      score: row.score,
      tiebreakers: {
        buchholzCut1: row.buchholzCut1,
        buchholz: row.buchholz,
        sonnebornBerger: row.sonnebornBerger,
        wins: row.wins,
      },
      rounds: roundResults,
    };
  });

  return {
    tournamentId: tournament._id,
    title: tournament.title,
    currentRoundNumber: tournament.currentRoundNumber,
    totalRounds: tournament.totalRounds,
    matrix,
  };
};

export const getAuditReport = async (tournamentId) => {
  const tournament = await getTournamentById(tournamentId);

  const players = tournament.players.map((p) => ({
    id: p.id,
    name: p.name,
    rating: p.rating,
  }));

  const rounds = tournament.rounds.map((r) => ({
    roundNumber: r.roundNumber,
    games: r.games.map((g) => ({
      round: g.round,
      whitePlayerId: g.whitePlayerId,
      blackPlayerId: g.blackPlayerId,
      result: g.result,
    })),
  }));

  return validateTournamentRules(players, rounds);
};
