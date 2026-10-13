export const TOURNAMENT_FORMAT = {
  SWISS: "swiss",
  ROUND_ROBIN: "round_robin",
  KNOCKOUT: "knockout",
};

export const TOURNAMENT_STATUS = {
  SETUP: "setup",
  IN_PROGRESS: "in_progress",
  PAUSED: "paused",
  COMPLETED: "completed",
};

export const ROUND_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  COMPLETED: "completed",
};

export const GAME_RESULT = {
  WHITE_WIN: "1-0",
  BLACK_WIN: "0-1",
  DRAW: "1/2-1/2",
  WHITE_FORFEIT: "1-0F",
  BLACK_FORFEIT: "0-1F",
  DOUBLE_FORFEIT: "0-0F",
  BYE_PAB: "BYE_PAB",
  BYE_HALF: "BYE_HALF",
  BYE_ZERO: "BYE_ZERO",
};

export const GAME_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  DISPUTED: "disputed",
};
