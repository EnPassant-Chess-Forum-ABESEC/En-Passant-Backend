import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";
import { findTournamentById } from "./tournament.repository.js";
import { AppError } from "../../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PAIRINGS_TEMPLATE_PATH = path.join(__dirname, "templates", "pairings.ejs");

let globalBrowser = null;

const getBrowser = async () => {
  if (!globalBrowser || !globalBrowser.connected) {
    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    globalBrowser = await puppeteer.launch(launchOptions);
    globalBrowser.on("disconnected", () => {
      globalBrowser = null;
    });
  }
  return globalBrowser;
};

export const buildPairingsPdfFilename = (tournament, roundNumber) => {
  const sanitize = (str) =>
    (str || "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const titlePart = sanitize(tournament.title) || "Tournament";
  return `${titlePart}_Round_${roundNumber}_Pairings.pdf`;
};

export const generateRoundPairingsHtml = async (tournament, roundNumber) => {
  const targetRoundNum = Number(roundNumber);
  const round = tournament.rounds.find((r) => r.roundNumber === targetRoundNum);

  if (!round) {
    throw new AppError(`Round ${roundNumber} not found in tournament`, 404);
  }

  if (!round.games || round.games.length === 0) {
    throw new AppError(
      `Round ${roundNumber} does not have any paired games to export`,
      400,
    );
  }

  const title = tournament.title || "Tournament";

  const playerMap = new Map();
  for (const p of tournament.players || []) {
    playerMap.set(p.id, p);
  }

  const sortedGames = [...round.games].sort(
    (a, b) => a.boardNumber - b.boardNumber,
  );

  const pairings = sortedGames.map((game) => {
    const whitePlayer = playerMap.get(game.whitePlayerId);
    const blackPlayer = playerMap.get(game.blackPlayerId);

    const whiteName = whitePlayer
      ? (whitePlayer.name || `Player ${game.whitePlayerId}`)
      : "BYE";
    const blackName = blackPlayer
      ? (blackPlayer.name || `Player ${game.blackPlayerId}`)
      : "BYE";

    return {
      boardNumber: game.boardNumber,
      white: whiteName,
      black: blackName,
    };
  });

  const templateData = {
    title,
    roundNumber: targetRoundNum,
    pairings,
  };

  return await ejs.renderFile(PAIRINGS_TEMPLATE_PATH, templateData);
};

export const generateRoundPairingsPdf = async (tournamentId, roundNumber) => {
  const tournament = await findTournamentById(tournamentId);
  if (!tournament) {
    throw new AppError("Tournament not found", 404);
  }
  const targetRoundNum = Number(roundNumber);

  const html = await generateRoundPairingsHtml(tournament, targetRoundNum);
  const filename = buildPairingsPdfFilename(tournament, targetRoundNum);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "15mm",
        right: "15mm",
      },
    });

    return {
      buffer,
      filename,
      contentType: "application/pdf",
    };
  } finally {
    await page.close();
  }
};
