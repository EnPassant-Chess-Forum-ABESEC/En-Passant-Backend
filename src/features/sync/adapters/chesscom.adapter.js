export const fetchChessComRatings = async (username) => {
  const url = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Chess.com user '${username}' not found`);
    }
    throw new Error(
      `Chess.com API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();

  return {
    blitz: data.chess_blitz?.last?.rating || 0,
    bullet: data.chess_bullet?.last?.rating || 0,
    rapid: data.chess_rapid?.last?.rating || 0,
  };
};
