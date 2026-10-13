export function generateRoundRobinPairings(
  roundNumber,
  players,
  round1TopSeedColor = "W",
) {
  const activePlayers = players.filter((p) => p.active);
  const sorted = [...activePlayers].sort((a, b) => b.rating - a.rating);

  const n = sorted.length;
  if (n < 2) return [];

  const participants = [...sorted];
  if (n % 2 !== 0) {
    participants.push(null);
  }

  const totalParticipants = participants.length;
  const totalRounds = totalParticipants - 1;

  if (roundNumber > totalRounds) {
    throw new Error(
      `Round ${roundNumber} exceeds total Round-Robin rounds (${totalRounds}).`,
    );
  }

  const rotating = participants.slice(1);
  const shift = (roundNumber - 1) % rotating.length;
  const currentRotation = [
    participants[0],
    ...rotating.slice(rotating.length - shift),
    ...rotating.slice(0, rotating.length - shift),
  ];

  const games = [];
  const half = totalParticipants / 2;
  let boardNum = 1;

  for (let i = 0; i < half; i++) {
    const p1 = currentRotation[i];
    const p2 = currentRotation[totalParticipants - 1 - i];

    if (p1 === null && p2 !== null) {
      games.push({
        id: `rr-r${roundNumber}-bye-${p2.id}`,
        round: roundNumber,
        boardNumber: boardNum++,
        whitePlayerId: p2.id,
        blackPlayerId: null,
        result: "BYE_PAB",
        pairingExplanation: "Round-Robin Bye for odd field.",
      });
      continue;
    }

    if (p2 === null && p1 !== null) {
      games.push({
        id: `rr-r${roundNumber}-bye-${p1.id}`,
        round: roundNumber,
        boardNumber: boardNum++,
        whitePlayerId: p1.id,
        blackPlayerId: null,
        result: "BYE_PAB",
        pairingExplanation: "Round-Robin Bye for odd field.",
      });
      continue;
    }

    if (!p1 || !p2) continue;

    const isWhiteFirst = (roundNumber + i) % 2 === 0;
    const whiteId = isWhiteFirst ? p1.id : p2.id;
    const blackId = isWhiteFirst ? p2.id : p1.id;

    games.push({
      id: `rr-r${roundNumber}-b${boardNum}`,
      round: roundNumber,
      boardNumber: boardNum,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
      result: null,
      pairingExplanation: `Round-Robin Board ${boardNum}`,
    });
    boardNum++;
  }

  return games;
}

export function generateKnockoutPairings(
  roundNumber,
  players,
  completedRounds,
  round1TopSeedColor = "W",
) {
  const activePlayers = players.filter((p) => p.active);
  const sorted = [...activePlayers].sort((a, b) => b.rating - a.rating);

  if (roundNumber === 1) {
    let bracketSize = 2;
    while (bracketSize < sorted.length) {
      bracketSize *= 2;
    }

    const games = [];
    let boardNum = 1;

    for (let i = 0; i < bracketSize / 2; i++) {
      const topSeed = sorted[i];
      const bottomSeed = sorted[bracketSize - 1 - i];

      if (topSeed && !bottomSeed) {
        games.push({
          id: `ko-r1-bye-${topSeed.id}`,
          round: 1,
          boardNumber: boardNum++,
          whitePlayerId: topSeed.id,
          blackPlayerId: null,
          result: "BYE_PAB",
          pairingExplanation: "Knockout 1st round bye.",
        });
      } else if (topSeed && bottomSeed) {
        const isWhite = i % 2 === 0;
        games.push({
          id: `ko-r1-b${boardNum}`,
          round: 1,
          boardNumber: boardNum++,
          whitePlayerId: isWhite ? topSeed.id : bottomSeed.id,
          blackPlayerId: isWhite ? bottomSeed.id : topSeed.id,
          result: null,
          pairingExplanation: `Knockout Board ${boardNum}`,
        });
      }
    }
    return games;
  }

  const prevRound = completedRounds.find(
    (r) => r.roundNumber === roundNumber - 1,
  );
  if (!prevRound) {
    throw new Error(`Previous round ${roundNumber - 1} not found.`);
  }

  const winners = [];
  for (const game of prevRound.games) {
    if (game.result === "1-0" || game.result === "1-0F") {
      if (game.whitePlayerId) winners.push(game.whitePlayerId);
    } else if (game.result === "0-1" || game.result === "0-1F") {
      if (game.blackPlayerId) winners.push(game.blackPlayerId);
    } else if (game.result === "BYE_PAB") {
      const pId = game.whitePlayerId || game.blackPlayerId;
      if (pId) winners.push(pId);
    } else if (game.result === "1/2-1/2") {
      throw new Error(
        `Knockout match on Board ${game.boardNumber} ended in a draw! Tiebreak winner must be decided.`,
      );
    } else {
      throw new Error(
        `Pending game on Board ${game.boardNumber} in Round ${roundNumber - 1}.`,
      );
    }
  }

  if (winners.length <= 1) {
    throw new Error(
      "Tournament has already concluded! Final champion determined.",
    );
  }

  const games = [];
  let boardNum = 1;
  for (let i = 0; i < winners.length; i += 2) {
    const p1 = winners[i];
    const p2 = winners[i + 1];

    if (p1 && !p2) {
      games.push({
        id: `ko-r${roundNumber}-bye-${p1}`,
        round: roundNumber,
        boardNumber: boardNum++,
        whitePlayerId: p1,
        blackPlayerId: null,
        result: "BYE_PAB",
        pairingExplanation: "Knockout bye advance.",
      });
    } else if (p1 && p2) {
      games.push({
        id: `ko-r${roundNumber}-b${boardNum}`,
        round: roundNumber,
        boardNumber: boardNum++,
        whitePlayerId: p1,
        blackPlayerId: p2,
        result: null,
        pairingExplanation: `Knockout Board ${boardNum}`,
      });
    }
  }

  return games;
}

export function calculateFormatTotalRounds(
  format = "swiss",
  playerCount = 0,
  fallbackSwissRounds = 5,
) {
  if (format === "round_robin") {
    if (playerCount < 2) return 1;
    return playerCount % 2 === 0 ? playerCount - 1 : playerCount;
  }
  if (format === "knockout") {
    if (playerCount < 2) return 1;
    return Math.max(1, Math.ceil(Math.log2(playerCount)));
  }
  return fallbackSwissRounds;
}
