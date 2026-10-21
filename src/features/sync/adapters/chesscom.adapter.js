import { AppError } from "../../../utils/AppError.js";
export const fetchChessComRatings = async (username) => {
  const url = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "EnPassantApp (kaustubh.24b0101134@abes.ac.in)",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new AppError(`Chess.com user '${username}' not found`, 404);
    }
    throw new AppError(`Chess.com API error: ${response.status} ${response.statusText}`, 502);
  }

  const data = await response.json();

  return {
    blitz: data.chess_blitz?.last?.rating || 0,
    bullet: data.chess_bullet?.last?.rating || 0,
    rapid: data.chess_rapid?.last?.rating || 0,
  };
};

export const fetchChessComRapidVerification = async (username) => {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const headers = {
    "User-Agent": "EnPassantApp (kaustubh.24b0101134@abes.ac.in)",
  };

  const archivesUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`;
  let archivesRes;
  try {
    archivesRes = await fetch(archivesUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    throw new AppError(
      "Unable to connect to Chess.com to verify games. Please try again in a moment.",
      502,
    );
  }

  if (!archivesRes.ok) {
    if (archivesRes.status === 404) {
      throw new AppError(`Chess.com user '${username}' not found`, 404);
    }
    throw new AppError(
      `Chess.com API error: ${archivesRes.status} ${archivesRes.statusText}`,
      502,
    );
  }

  const archivesData = await archivesRes.json();
  const archives = Array.isArray(archivesData.archives)
    ? archivesData.archives
    : [];
  const recentArchives = archives.slice(-2);

  const allGames = [];
  for (const archiveUrl of recentArchives) {
    try {
      const res = await fetch(archiveUrl, {
        headers,
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.games)) {
          allGames.push(...data.games);
        }
      }
    } catch {}
  }

  const userLower = username.toLowerCase();
  const rapidGames = allGames.filter(
    (g) => g.time_class === "rapid" && Number(g.end_time) >= thirtyDaysAgo,
  );

  let currentRapid = 0;
  try {
    const statsUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`;
    const statsRes = await fetch(statsUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      currentRapid = statsData.chess_rapid?.last?.rating || 0;
    }
  } catch {}

  let peakRapid = currentRapid;
  for (const g of rapidGames) {
    const isWhite = g.white?.username?.toLowerCase() === userLower;
    const playerObj = isWhite ? g.white : g.black;
    const gameRating = Number(playerObj?.rating || 0);
    if (gameRating > peakRapid) {
      peakRapid = gameRating;
    }
  }

  return {
    rapidGamesCount: rapidGames.length,
    peakRapidRating: peakRapid,
    currentRapidRating: currentRapid,
  };
};
