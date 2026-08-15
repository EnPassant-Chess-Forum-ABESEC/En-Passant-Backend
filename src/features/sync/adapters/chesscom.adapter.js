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
