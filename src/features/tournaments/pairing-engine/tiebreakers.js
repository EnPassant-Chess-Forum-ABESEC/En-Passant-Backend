import { calculatePlayerStats } from "./swissEngine.js";

export function calculateStandings(players, rounds, roundsTotal = 5) {
  const statsMap = calculatePlayerStats(players, rounds);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const cumulativeScores = calculateCumulativeScores(players, rounds);

  const playerScores = new Map();
  for (const p of players) {
    playerScores.set(p.id, statsMap.get(p.id)?.score ?? 0);
  }

  const opponentDetailsMap = new Map();

  for (const player of players) {
    const details = [];
    let runningScore = 0;

    for (const round of rounds) {
      const game = round.games.find(
        (g) => g.whitePlayerId === player.id || g.blackPlayerId === player.id,
      );

      if (!game || !game.result) continue;

      const isWhite = game.whitePlayerId === player.id;
      const isBlack = game.blackPlayerId === player.id;
      const color = isWhite ? "W" : isBlack ? "B" : "-";

      let pts = 0;
      if (game.result === "1-0") pts = isWhite ? 1 : 0;
      else if (game.result === "0-1") pts = isBlack ? 1 : 0;
      else if (game.result === "1/2-1/2") pts = 0.5;
      else if (game.result === "1-0F") pts = isWhite ? 1 : 0;
      else if (game.result === "0-1F") pts = isBlack ? 1 : 0;
      else if (game.result === "BYE_PAB") pts = 1.0;
      else if (game.result === "BYE_HALF") pts = 0.5;

      const preGameScore = runningScore;
      runningScore += pts;

      if (
        game.result === "BYE_PAB" ||
        game.result === "BYE_HALF" ||
        (game.result === "1-0F" && !isBlack) ||
        (game.result === "0-1F" && !isWhite)
      ) {
        const remainingRounds = Math.max(0, roundsTotal - round.roundNumber);
        const virtualScore = preGameScore + 0.5 + remainingRounds * 0.5;

        details.push({
          round: round.roundNumber,
          opponentId: null,
          opponentName:
            game.result === "BYE_PAB"
              ? "Pairing Bye (+1.0 Point)"
              : "Half-Point Bye (+0.5 Point)",
          opponentRating: player.rating,
          opponentFinalScore: virtualScore,
          color: "-",
          result: game.result,
          pointsAwarded: pts,
          isVirtual: true,
        });
      } else {
        const oppId = isWhite ? game.blackPlayerId : game.whitePlayerId;
        const opponent = oppId ? playerMap.get(oppId) : null;
        const oppFinalScore = oppId ? (playerScores.get(oppId) ?? 0) : 0;

        details.push({
          round: round.roundNumber,
          opponentId: oppId,
          opponentName: opponent ? opponent.name : "Unknown Opponent",
          opponentRating: opponent?.rating ?? 0,
          opponentFinalScore: oppFinalScore,
          color,
          result: game.result,
          pointsAwarded: pts,
          isVirtual: false,
        });
      }
    }

    opponentDetailsMap.set(player.id, details);
  }

  const buchholzMap = new Map();
  const buchholzCut1Map = new Map();
  const sonnebornBergerMap = new Map();

  for (const player of players) {
    const details = opponentDetailsMap.get(player.id) ?? [];
    const oppScores = details.map((d) => d.opponentFinalScore);

    const bh = oppScores.reduce((sum, s) => sum + s, 0);
    buchholzMap.set(player.id, bh);

    if (oppScores.length > 0) {
      let minScore = oppScores[0];
      let minIdx = 0;
      for (let i = 1; i < oppScores.length; i++) {
        if (oppScores[i] < minScore) {
          minScore = oppScores[i];
          minIdx = i;
        }
      }
      const bhCut1 = bh - minScore;
      buchholzCut1Map.set(player.id, {
        value: bhCut1,
        excludedId: details[minIdx].opponentId,
        excludedScore: minScore,
      });
    } else {
      buchholzCut1Map.set(player.id, {
        value: 0,
        excludedId: null,
        excludedScore: 0,
      });
    }

    let sb = 0;
    for (const d of details) {
      if (d.pointsAwarded === 1.0) {
        sb += d.opponentFinalScore * 1.0;
      } else if (d.pointsAwarded === 0.5) {
        sb += d.opponentFinalScore * 0.5;
      }
    }
    sonnebornBergerMap.set(player.id, sb);
  }

  const directEncounterMap = calculateDirectEncounters(
    players,
    rounds,
    playerScores,
  );

  const rows = players.map((player) => {
    const stats = statsMap.get(player.id) || {};
    const de = directEncounterMap.get(player.id) ?? 0;
    const bh = buchholzMap.get(player.id) ?? 0;
    const bhCut1Info = buchholzCut1Map.get(player.id) ?? {
      value: 0,
      excludedId: null,
      excludedScore: 0,
    };
    const sb = sonnebornBergerMap.get(player.id) ?? 0;
    const cum = cumulativeScores.get(player.id) ?? 0;
    const details = opponentDetailsMap.get(player.id) ?? [];

    return {
      rank: 1,
      playerId: player.id,
      name: player.name,
      title: player.title || "",
      rating: player.rating,
      score: stats.score ?? 0,
      directEncounter: de,
      buchholzCut1: bhCut1Info.value,
      buchholz: bh,
      sonnebornBerger: sb,
      cumulativeScore: cum,
      wins: stats.actualWins ?? 0,
      gamesPlayed: stats.gamesPlayed ?? 0,
      colorBalance: stats.colorDifference ?? 0,
      active: player.active,
      details: {
        opponents: details,
        buchholzExcludedId: bhCut1Info.excludedId,
        buchholzExcludedScore: bhCut1Info.excludedScore,
      },
    };
  });

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    if (b.directEncounter !== a.directEncounter) {
      return b.directEncounter - a.directEncounter;
    }

    if (Math.abs(b.buchholzCut1 - a.buchholzCut1) > 0.001) {
      return b.buchholzCut1 - a.buchholzCut1;
    }

    if (Math.abs(b.buchholz - a.buchholz) > 0.001) {
      return b.buchholz - a.buchholz;
    }

    if (Math.abs(b.sonnebornBerger - a.sonnebornBerger) > 0.001) {
      return b.sonnebornBerger - a.sonnebornBerger;
    }

    if (Math.abs(b.cumulativeScore - a.cumulativeScore) > 0.001) {
      return b.cumulativeScore - a.cumulativeScore;
    }

    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }

    return a.name.localeCompare(b.name);
  });

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

export function calculateDirectEncounters(players, rounds, playerScores) {
  const deMap = new Map();
  for (const p of players) {
    deMap.set(p.id, 0);
  }

  const scoreGroups = new Map();
  for (const [playerId, score] of playerScores.entries()) {
    if (!scoreGroups.has(score)) {
      scoreGroups.set(score, []);
    }
    scoreGroups.get(score).push(playerId);
  }

  const mutualResults = new Map();

  for (const round of rounds) {
    for (const game of round.games) {
      if (!game.result || !game.whitePlayerId || !game.blackPlayerId) continue;
      const wId = game.whitePlayerId;
      const bId = game.blackPlayerId;

      if (!mutualResults.has(wId)) mutualResults.set(wId, new Map());
      if (!mutualResults.has(bId)) mutualResults.set(bId, new Map());

      let wPts = 0;
      let bPts = 0;
      if (game.result === "1-0") {
        wPts = 1;
        bPts = 0;
      } else if (game.result === "0-1") {
        wPts = 0;
        bPts = 1;
      } else if (game.result === "1/2-1/2") {
        wPts = 0.5;
        bPts = 0.5;
      } else if (game.result === "1-0F") {
        wPts = 1;
        bPts = 0;
      } else if (game.result === "0-1F") {
        wPts = 0;
        bPts = 1;
      }

      mutualResults.get(wId).set(bId, wPts);
      mutualResults.get(bId).set(wId, bPts);
    }
  }

  for (const [, tiedPlayerIds] of scoreGroups.entries()) {
    if (tiedPlayerIds.length <= 1) continue;

    let allPlayed = true;
    for (let i = 0; i < tiedPlayerIds.length; i++) {
      for (let j = i + 1; j < tiedPlayerIds.length; j++) {
        const p1 = tiedPlayerIds[i];
        const p2 = tiedPlayerIds[j];
        if (!mutualResults.get(p1)?.has(p2)) {
          allPlayed = false;
          break;
        }
      }
      if (!allPlayed) break;
    }

    if (allPlayed) {
      for (const pId of tiedPlayerIds) {
        let deScore = 0;
        for (const oppId of tiedPlayerIds) {
          if (pId === oppId) continue;
          deScore += mutualResults.get(pId)?.get(oppId) ?? 0;
        }
        deMap.set(pId, deScore);
      }
    }
  }

  return deMap;
}

export function calculateCumulativeScores(players, rounds) {
  const cumMap = new Map();
  for (const p of players) {
    cumMap.set(p.id, 0);
  }

  const sortedRounds = [...rounds].sort(
    (a, b) => a.roundNumber - b.roundNumber,
  );
  const currentRunningScore = new Map();
  for (const p of players) {
    currentRunningScore.set(p.id, 0);
  }

  for (const round of sortedRounds) {
    for (const game of round.games) {
      if (!game.result) continue;

      const wId = game.whitePlayerId;
      const bId = game.blackPlayerId;

      if (game.result === "BYE_PAB") {
        const pId = wId || bId;
        if (pId)
          currentRunningScore.set(
            pId,
            (currentRunningScore.get(pId) ?? 0) + 1.0,
          );
        continue;
      }
      if (game.result === "BYE_HALF") {
        const pId = wId || bId;
        if (pId)
          currentRunningScore.set(
            pId,
            (currentRunningScore.get(pId) ?? 0) + 0.5,
          );
        continue;
      }

      if (wId) {
        let pts = 0;
        if (game.result === "1-0" || game.result === "1-0F") pts = 1;
        else if (game.result === "1/2-1/2") pts = 0.5;
        currentRunningScore.set(wId, (currentRunningScore.get(wId) ?? 0) + pts);
      }

      if (bId) {
        let pts = 0;
        if (game.result === "0-1" || game.result === "0-1F") pts = 1;
        else if (game.result === "1/2-1/2") pts = 0.5;
        currentRunningScore.set(bId, (currentRunningScore.get(bId) ?? 0) + pts);
      }
    }

    for (const p of players) {
      const curScore = currentRunningScore.get(p.id) ?? 0;
      cumMap.set(p.id, (cumMap.get(p.id) ?? 0) + curScore);
    }
  }

  return cumMap;
}
