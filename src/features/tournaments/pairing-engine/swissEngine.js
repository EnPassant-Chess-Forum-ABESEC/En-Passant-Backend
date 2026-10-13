export const VALID_RESULTS = new Set([
  "1-0",
  "0-1",
  "1/2-1/2",
  "1-0F",
  "0-1F",
  "0-0F",
  "BYE_PAB",
  "BYE_HALF",
  "BYE_ZERO",
]);

export function calculatePlayerStats(
  players,
  rounds,
  upToRoundInclusive = undefined,
) {
  const statsMap = new Map();

  for (const player of players) {
    statsMap.set(player.id, {
      playerId: player.id,
      score: 0.0,
      colorHistory: [],
      colorDifference: 0,
      consecutiveSameColor: { color: "W", count: 0 },
      opponentsPlayed: [],
      hasHadBye: false,
      hasReceivedUnplayedPoint: false,
      gamesPlayed: 0,
      actualWins: 0,
    });
  }

  const sortedRounds = [...rounds].sort(
    (a, b) => a.roundNumber - b.roundNumber,
  );

  for (const round of sortedRounds) {
    if (
      upToRoundInclusive !== undefined &&
      round.roundNumber > upToRoundInclusive
    ) {
      continue;
    }

    for (const game of round.games) {
      if (game.result === null || game.result === undefined) {
        continue;
      }

      if (game.result === "BYE_PAB") {
        const playerId = game.whitePlayerId || game.blackPlayerId;
        if (playerId && statsMap.has(playerId)) {
          const stats = statsMap.get(playerId);
          stats.score += 1.0;
          stats.hasHadBye = true;
          stats.hasReceivedUnplayedPoint = true;
        }
        continue;
      }

      if (game.result === "BYE_HALF") {
        const playerId = game.whitePlayerId || game.blackPlayerId;
        if (playerId && statsMap.has(playerId)) {
          const stats = statsMap.get(playerId);
          stats.score += 0.5;
          stats.hasHadBye = true;
        }
        continue;
      }

      if (game.result === "BYE_ZERO") {
        const playerId = game.whitePlayerId || game.blackPlayerId;
        if (playerId && statsMap.has(playerId)) {
          const stats = statsMap.get(playerId);
          stats.hasHadBye = true;
        }
        continue;
      }

      const white = game.whitePlayerId
        ? statsMap.get(game.whitePlayerId)
        : null;
      const black = game.blackPlayerId
        ? statsMap.get(game.blackPlayerId)
        : null;

      if (white && black) {
        white.opponentsPlayed.push(black.playerId);
        black.opponentsPlayed.push(white.playerId);
        white.colorHistory.push("W");
        black.colorHistory.push("B");
        white.colorDifference += 1;
        black.colorDifference -= 1;
        white.gamesPlayed += 1;
        black.gamesPlayed += 1;
      }

      switch (game.result) {
        case "1-0":
          if (white) {
            white.score += 1.0;
            white.actualWins += 1;
          }
          break;
        case "0-1":
          if (black) {
            black.score += 1.0;
            black.actualWins += 1;
          }
          break;
        case "1/2-1/2":
          if (white) white.score += 0.5;
          if (black) black.score += 0.5;
          break;
        case "1-0F":
          if (white) {
            white.score += 1.0;
            white.hasReceivedUnplayedPoint = true;
          }
          break;
        case "0-1F":
          if (black) {
            black.score += 1.0;
            black.hasReceivedUnplayedPoint = true;
          }
          break;
        case "0-0F":
          break;
        default:
          break;
      }
    }
  }

  for (const stats of statsMap.values()) {
    const history = stats.colorHistory;
    if (history.length === 0) {
      stats.consecutiveSameColor = { color: "W", count: 0 };
    } else {
      const lastColor = history[history.length - 1];
      let count = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i] === lastColor) {
          count++;
        } else {
          break;
        }
      }
      stats.consecutiveSameColor = { color: lastColor, count };
    }
  }

  return statsMap;
}

export function getColorPreference(stats) {
  const cd = stats.colorDifference;
  const csc = stats.consecutiveSameColor;

  if (cd >= 2) {
    return {
      preferred: "B",
      isAbsolute: true,
      reason: `Absolute: color_diff=+${cd} must play Black (C4)`,
    };
  }
  if (cd <= -2) {
    return {
      preferred: "W",
      isAbsolute: true,
      reason: `Absolute: color_diff=${cd} must play White (C4)`,
    };
  }

  if (csc.count >= 2) {
    if (csc.color === "W") {
      return {
        preferred: "B",
        isAbsolute: true,
        reason: "Absolute: 2 consecutive Whites → must play Black (C3)",
      };
    }
    return {
      preferred: "W",
      isAbsolute: true,
      reason: "Absolute: 2 consecutive Blacks → must play White (C3)",
    };
  }

  if (cd > 0) {
    return {
      preferred: "B",
      isAbsolute: false,
      reason: `Strong: color_diff=+${cd} prefers Black`,
    };
  }
  if (cd < 0) {
    return {
      preferred: "W",
      isAbsolute: false,
      reason: `Strong: color_diff=${cd} prefers White`,
    };
  }

  if (stats.colorHistory.length > 0) {
    const last = stats.colorHistory[stats.colorHistory.length - 1];
    const pref = last === "W" ? "B" : "W";
    return {
      preferred: pref,
      isAbsolute: false,
      reason: `Mild: alternate from last (${last} → ${pref})`,
    };
  }

  return {
    preferred: null,
    isAbsolute: false,
    reason: "Neutral: no preference yet",
  };
}

export function canBePaired(playerAId, playerBId, statsMap) {
  if (playerAId === playerBId) {
    return {
      valid: false,
      reason: "Cannot play oneself",
      allowedOrientations: [],
      hasColorBreak: false,
    };
  }

  const sa = statsMap.get(playerAId);
  const sb = statsMap.get(playerBId);

  if (!sa || !sb) {
    return {
      valid: false,
      reason: "Player stats not found",
      allowedOrientations: [],
      hasColorBreak: false,
    };
  }

  if (sa.opponentsPlayed.includes(playerBId)) {
    return {
      valid: false,
      reason: "FIDE C1: Already played each other",
      allowedOrientations: [],
      hasColorBreak: false,
    };
  }

  const prefA = getColorPreference(sa);
  const prefB = getColorPreference(sb);

  const allowed = [];

  const aCanBeWhite = !(prefA.isAbsolute && prefA.preferred === "B");
  const bCanBeBlack = !(prefB.isAbsolute && prefB.preferred === "W");
  if (aCanBeWhite && bCanBeBlack) {
    allowed.push("AB");
  }

  const bCanBeWhite = !(prefB.isAbsolute && prefB.preferred === "B");
  const aCanBeBlack = !(prefA.isAbsolute && prefA.preferred === "W");
  if (bCanBeWhite && aCanBeBlack) {
    allowed.push("BA");
  }

  if (allowed.length === 0) {
    return {
      valid: true,
      hasColorBreak: true,
      reason: "FIDE Color Break: Points prioritized over color constraint",
      allowedOrientations: ["AB", "BA"],
    };
  }

  return {
    valid: true,
    allowedOrientations: allowed,
    hasColorBreak: false,
  };
}

export function resolveColorOrientation(
  playerAId,
  playerBId,
  statsMap,
  roundNumber,
  round1TopSeedColor = "W",
) {
  const check = canBePaired(playerAId, playerBId, statsMap);
  if (!check.valid || check.allowedOrientations.length === 0) {
    return {
      whiteId: playerAId,
      blackId: playerBId,
      reason: "Forced orientation",
    };
  }

  if (check.allowedOrientations.length === 1) {
    if (check.allowedOrientations[0] === "AB") {
      return {
        whiteId: playerAId,
        blackId: playerBId,
        reason: "Compatible color orientation",
      };
    }
    return {
      whiteId: playerBId,
      blackId: playerAId,
      reason: "Compatible color orientation",
    };
  }

  const sa = statsMap.get(playerAId);
  const sb = statsMap.get(playerBId);

  const evaluateOrientation = (whiteStats, blackStats) => {
    let score = 0.0;
    const wp = getColorPreference(whiteStats);
    const bp = getColorPreference(blackStats);

    if (wp.preferred === "W") score += wp.isAbsolute ? 60 : 20;
    if (wp.preferred === "B") score -= wp.isAbsolute ? 60 : 20;
    if (bp.preferred === "B") score += bp.isAbsolute ? 60 : 20;
    if (bp.preferred === "W") score -= bp.isAbsolute ? 60 : 20;

    if (whiteStats.colorDifference < 0)
      score += 25 * Math.abs(whiteStats.colorDifference);
    if (whiteStats.colorDifference > 0)
      score -= 25 * Math.abs(whiteStats.colorDifference);
    if (blackStats.colorDifference > 0)
      score += 25 * Math.abs(blackStats.colorDifference);
    if (blackStats.colorDifference < 0)
      score -= 25 * Math.abs(blackStats.colorDifference);

    if (whiteStats.consecutiveSameColor.color === "B") {
      score += 15 * whiteStats.consecutiveSameColor.count;
    }
    if (whiteStats.consecutiveSameColor.color === "W") {
      score -= 30 * whiteStats.consecutiveSameColor.count;
    }
    if (blackStats.consecutiveSameColor.color === "W") {
      score += 15 * blackStats.consecutiveSameColor.count;
    }
    if (blackStats.consecutiveSameColor.color === "B") {
      score -= 30 * blackStats.consecutiveSameColor.count;
    }

    if (
      whiteStats.consecutiveSameColor.color === "W" &&
      whiteStats.consecutiveSameColor.count >= 2
    ) {
      score -= 250;
    }
    if (
      blackStats.consecutiveSameColor.color === "B" &&
      blackStats.consecutiveSameColor.count >= 2
    ) {
      score -= 250;
    }

    return score;
  };

  const scoreAB = evaluateOrientation(sa, sb);
  const scoreBA = evaluateOrientation(sb, sa);

  if (scoreAB > scoreBA) {
    return {
      whiteId: playerAId,
      blackId: playerBId,
      reason: "FIDE Rule 8: Color balance & alternation preference",
    };
  }
  if (scoreBA > scoreAB) {
    return {
      whiteId: playerBId,
      blackId: playerAId,
      reason: "FIDE Rule 8: Color balance & alternation preference",
    };
  }

  const prefA = getColorPreference(sa);
  const prefB = getColorPreference(sb);

  if (sa.score > sb.score) {
    if (prefA.preferred === "B") {
      return {
        whiteId: playerBId,
        blackId: playerAId,
        reason: "FIDE Rule 8: Higher score gets preferred Black",
      };
    }
    return {
      whiteId: playerAId,
      blackId: playerBId,
      reason: "FIDE Rule 8: Higher score gets preferred White",
    };
  }
  if (sb.score > sa.score) {
    if (prefB.preferred === "B") {
      return {
        whiteId: playerAId,
        blackId: playerBId,
        reason: "FIDE Rule 8: Higher score gets preferred Black",
      };
    }
    return {
      whiteId: playerBId,
      blackId: playerAId,
      reason: "FIDE Rule 8: Higher score gets preferred White",
    };
  }

  if (prefA.preferred === "B") {
    return {
      whiteId: playerBId,
      blackId: playerAId,
      reason: "FIDE Rule 8 (Color Break): Top seed gets preferred Black",
    };
  }
  if (prefA.preferred === "W") {
    return {
      whiteId: playerAId,
      blackId: playerBId,
      reason: "FIDE Rule 8 (Color Break): Top seed gets preferred White",
    };
  }

  if (round1TopSeedColor === "W") {
    return {
      whiteId: playerAId,
      blackId: playerBId,
      reason: "Standard FIDE lot allocation",
    };
  }
  return {
    whiteId: playerBId,
    blackId: playerAId,
    reason: "Standard FIDE lot allocation",
  };
}

export function selectByePlayer(activePlayers, statsMap) {
  if (activePlayers.length % 2 === 0) {
    return null;
  }

  const eligible = activePlayers.filter((p) => {
    const stats = statsMap.get(p.id);
    return !(stats && (stats.hasReceivedUnplayedPoint || stats.hasHadBye));
  });

  if (eligible.length === 0) {
    return [...activePlayers].sort((a, b) => {
      const sa = statsMap.get(a.id)?.score ?? 0;
      const sb = statsMap.get(b.id)?.score ?? 0;
      if (sa !== sb) return sa - sb;
      return a.rating - b.rating;
    })[0];
  }

  return [...eligible].sort((a, b) => {
    const sa = statsMap.get(a.id)?.score ?? 0;
    const sb = statsMap.get(b.id)?.score ?? 0;
    if (sa !== sb) return sa - sb;
    return a.rating - b.rating;
  })[0];
}

export function generateRound1Pairings(players, round1TopSeedColor = "W") {
  const active = players.filter((p) => p.active !== false);
  if (active.length < 2) {
    throw new Error(
      `Cannot generate pairings: At least 2 active players are required (found ${active.length})`,
    );
  }
  const sortedPlayers = [...active].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const games = [];
  const halfByePlayers = [];
  const toPair = [];

  for (const p of sortedPlayers) {
    const halfByes =
      p.halfPointByeRequestedRounds || p.half_point_bye_requested_rounds || [];
    if (halfByes.includes(1)) {
      halfByePlayers.push(p);
    } else {
      toPair.push(p);
    }
  }

  let byePlayer = null;
  if (toPair.length % 2 !== 0) {
    byePlayer = toPair.pop();
  }

  const half = Math.floor(toPair.length / 2);
  const s1 = toPair.slice(0, half);
  const s2 = toPair.slice(half);

  let boardNum = 1;
  for (let i = 0; i < half; i++) {
    const playerA = s1[i];
    const playerB = s2[i];

    const isEvenBoard = i % 2 === 1;
    let topColor;
    if (isEvenBoard) {
      topColor = round1TopSeedColor === "W" ? "B" : "W";
    } else {
      topColor = round1TopSeedColor;
    }

    const whiteId = topColor === "W" ? playerA.id : playerB.id;
    const blackId = topColor === "W" ? playerB.id : playerA.id;

    games.push({
      id: `r1-b${boardNum}`,
      round: 1,
      boardNumber: boardNum,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
      result: null,
      pairingExplanation:
        `FIDE Dutch Round 1: Top half (Seed #${i + 1} ${playerA.name}) ` +
        `vs Bottom half (Seed #${half + i + 1} ${playerB.name}). Color alternated.`,
    });
    boardNum++;
  }

  for (const hp of halfByePlayers) {
    games.push({
      id: `r1-bye-half-${hp.id}`,
      round: 1,
      boardNumber: boardNum,
      whitePlayerId: hp.id,
      blackPlayerId: null,
      result: "BYE_HALF",
      pairingExplanation: "Requested Half-Point Bye: 0.5 unplayed points.",
    });
    boardNum++;
  }

  if (byePlayer) {
    games.push({
      id: `r1-bye-pab-${byePlayer.id}`,
      round: 1,
      boardNumber: boardNum,
      whitePlayerId: byePlayer.id,
      blackPlayerId: null,
      result: "BYE_PAB",
      pairingExplanation:
        "FIDE C2 (PAB): Lowest rated gets 1.0 point bye for odd field.",
    });
  }

  return games;
}

export function solveDutchPairings(players, statsMap) {
  if (players.length === 0) return [];
  if (players.length % 2 !== 0) return null;

  const getPairWeight = (pa, pb) => {
    const sa = statsMap.get(pa.id);
    const sb = statsMap.get(pb.id);
    const scoreDiff = Math.abs(sa.score - sb.score);

    let weight = scoreDiff * 100000;

    weight += Math.abs(pa.rating - pb.rating) * 0.05;

    const check = canBePaired(pa.id, pb.id, statsMap);
    if (check.hasColorBreak) {
      weight += 5000000;
    } else {
      const prefA = getColorPreference(sa);
      const prefB = getColorPreference(sb);
      if (
        prefA.preferred &&
        prefB.preferred &&
        prefA.preferred === prefB.preferred
      ) {
        weight += 40;
      }
    }

    return weight;
  };

  const best = { solution: null, cost: Infinity };
  const currentPairs = [];
  const used = new Set();

  function search(playerIndex, currentCost) {
    if (currentCost >= best.cost) return;

    let idx = playerIndex;
    while (idx < players.length && used.has(players[idx].id)) {
      idx++;
    }

    if (idx >= players.length) {
      best.cost = currentCost;
      best.solution = [...currentPairs];
      return;
    }

    const p1 = players[idx];
    used.add(p1.id);

    const candidates = [];
    for (let j = idx + 1; j < players.length; j++) {
      const p2 = players[j];
      if (used.has(p2.id)) continue;

      const check = canBePaired(p1.id, p2.id, statsMap);
      if (check.valid) {
        const cost = getPairWeight(p1, p2);
        candidates.push({ cost, p2 });
      }
    }

    candidates.sort((a, b) => a.cost - b.cost);

    for (const { cost, p2 } of candidates) {
      used.add(p2.id);
      currentPairs.push([p1, p2]);
      search(idx + 1, currentCost + cost);

      if (best.cost === 0) return;

      currentPairs.pop();
      used.delete(p2.id);
    }

    used.delete(p1.id);
  }

  search(0, 0.0);
  return best.solution;
}

export function generateSubsequentRoundPairings(
  roundNumber,
  players,
  completedRounds,
  round1TopSeedColor = "W",
) {
  const statsMap = calculatePlayerStats(
    players,
    completedRounds,
    roundNumber - 1,
  );
  const active = players.filter((p) => p.active !== false);
  if (active.length < 2) {
    throw new Error(
      `Cannot generate pairings: At least 2 active players are required (found ${active.length})`,
    );
  }

  const halfByePlayers = [];
  const pool = [];

  for (const p of active) {
    const halfByes =
      p.halfPointByeRequestedRounds || p.half_point_bye_requested_rounds || [];
    if (halfByes.includes(roundNumber)) {
      halfByePlayers.push(p);
    } else {
      pool.push(p);
    }
  }

  let byePlayer = null;
  if (pool.length % 2 !== 0) {
    byePlayer = selectByePlayer(pool, statsMap);
    if (byePlayer) {
      const idx = pool.findIndex((p) => p.id === byePlayer.id);
      if (idx !== -1) {
        pool.splice(idx, 1);
      }
    }
  }

  pool.sort((a, b) => {
    const sa = statsMap.get(a.id)?.score ?? 0;
    const sb = statsMap.get(b.id)?.score ?? 0;
    if (sb !== sa) return sb - sa;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const pairs = solveDutchPairings(pool, statsMap);
  if (pairs === null) {
    throw new Error(
      `Pairing Deadlock: No legal pairing satisfying FIDE C1/C3/C4 for Round ${roundNumber}.`,
    );
  }

  const games = [];
  let boardNum = 1;

  for (const [p1, p2] of pairs) {
    const result = resolveColorOrientation(
      p1.id,
      p2.id,
      statsMap,
      roundNumber,
      round1TopSeedColor,
    );
    const whiteId = result.whiteId;
    const blackId = result.blackId;
    const reason = result.reason;

    const s1 = statsMap.get(p1.id)?.score ?? 0;
    const s2 = statsMap.get(p2.id)?.score ?? 0;
    const scoreText =
      s1 === s2
        ? `Same score group (${s1} pts)`
        : `Score group float (${Math.max(s1, s2)} vs ${Math.min(s1, s2)} pts)`;

    games.push({
      id: `r${roundNumber}-b${boardNum}`,
      round: roundNumber,
      boardNumber: boardNum,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
      result: null,
      pairingExplanation: `FIDE Dutch: ${scoreText}. ${reason}.`,
    });
    boardNum++;
  }

  for (const hp of halfByePlayers) {
    games.push({
      id: `r${roundNumber}-bye-half-${hp.id}`,
      round: roundNumber,
      boardNumber: boardNum,
      whitePlayerId: hp.id,
      blackPlayerId: null,
      result: "BYE_HALF",
      pairingExplanation: "Requested Half-Point Bye: 0.5 unplayed points.",
    });
    boardNum++;
  }

  if (byePlayer) {
    games.push({
      id: `r${roundNumber}-bye-pab-${byePlayer.id}`,
      round: roundNumber,
      boardNumber: boardNum,
      whitePlayerId: byePlayer.id,
      blackPlayerId: null,
      result: "BYE_PAB",
      pairingExplanation:
        "FIDE C2 (PAB): Lowest rated in lowest score group gets 1.0 pt bye.",
    });
  }

  return games;
}

export function generateRoundPairings(
  roundNumber,
  players,
  rounds,
  round1TopSeedColor = "W",
  format = "swiss",
) {
  if (format === "swiss") {
    if (roundNumber === 1) {
      return generateRound1Pairings(players, round1TopSeedColor);
    }
    return generateSubsequentRoundPairings(
      roundNumber,
      players,
      rounds,
      round1TopSeedColor,
    );
  }
  throw new Error(
    `Format '${format}' not implemented directly in this entry point.`,
  );
}
