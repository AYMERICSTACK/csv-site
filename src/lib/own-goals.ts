export const OWN_GOAL_VALUE = "__CSC_ADVERSE__";
export const OWN_GOAL_TYPE = "OWN_GOAL";

export function parseGoalPlayerIds(formData: FormData) {
  return formData.getAll("goalPlayerId")
    .map((value) => String(value || "").trim()).filter(Boolean);
}

export function buildGoalEvents(matchId: string, goalIds: string[], assistIds: string[]) {
  return [
    ...goalIds.map((playerId) => ({
      matchId,
      playerId: playerId === OWN_GOAL_VALUE ? null : playerId,
      type: playerId === OWN_GOAL_VALUE ? OWN_GOAL_TYPE : "GOAL",
    })),
    ...assistIds.map((playerId) => ({ matchId, playerId, type: "ASSIST" })),
  ];
}

export function buildScorersText(goalIds: string[], players: { id: string; firstName: string; lastName: string }[]) {
  return goalIds.map((id) => {
    if (id === OWN_GOAL_VALUE) return "CSC";
    const player = players.find((item) => item.id === id);
    return player ? `${player.firstName} ${player.lastName}` : null;
  }).filter(Boolean).join(", ");
}
