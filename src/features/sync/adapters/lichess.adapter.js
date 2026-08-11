export const fetchLichessRatings = async (username) => {
  const url = `https://lichess.org/api/user/${encodeURIComponent(username)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "EnPassantApp (kaustubh.24b0101134@abes.ac.in)",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Lichess user '${username}' not found`);
    }
    throw new Error(
      `Lichess API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const perfs = data.perfs || {};

  return {
    blitz: perfs.blitz?.rating || 0,
    bullet: perfs.bullet?.rating || 0,
    rapid: perfs.rapid?.rating || 0,
  };
};
