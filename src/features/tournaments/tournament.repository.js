import Tournament from "./tournament.model.js";

export const createTournament = async (tournamentData) => {
  return Tournament.create(tournamentData);
};

export const findTournamentById = async (id) => {
  return Tournament.findById(id);
};

export const findTournaments = async (filter = {}) => {
  return Tournament.find(filter).sort({ createdAt: -1 });
};

export const findTournamentByReferenceId = async (referenceId) => {
  return Tournament.findOne({ referenceId });
};

export const findTournamentsByReferenceId = async (referenceId, filter = {}) => {
  return Tournament.find({ referenceId, ...filter }).sort({
    section: 1,
    bracket: 1,
    createdAt: 1,
  });
};

export const findTournamentByReferenceAndBracket = async (
  referenceId,
  section = "open",
  bracket = "open",
) => {
  return Tournament.findOne({ referenceId, section, bracket });
};

export const updateTournament = async (id, updateData) => {
  return Tournament.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

export const deleteTournament = async (id) => {
  return Tournament.findByIdAndDelete(id);
};
