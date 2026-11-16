export type ImportedResult = { team: string; opponent: string; scoreTeam: number | null; scoreOpponent: number | null; status: "finished" | "postponed"; warning?: string };
export type PositionedText = { text: string; x: number; y: number; page: number };
const TEAMS = ["U13 1", "U13 2", "U13 3", "U15 1", "U15 2", "U20", "Seniors 1", "Seniors 2", "Seniors 3", "Seniors 4", "Féminines", "Vétérans"];
function clean(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, " ").trim().toLowerCase(); }
function identifyTeam(s: string) { return TEAMS.find(t => clean(s) === clean(t)) || null; }
function resultFromText(text: string): Omit<ImportedResult,"team"> | null {
  const postponed = /report[eé]/i.test(text);
  if (postponed) return { opponent: "", scoreTeam: null, scoreOpponent: null, status: "postponed" };
  const score = text.match(/(victoire|d[eé]faite|match\s+nul|nul)\s*(\d{1,2})\s*[-–]\s*(\d{1,2})\s*\/\s*(.+)/i);
  if (!score) return null;
  const left = Number(score[2]), right = Number(score[3]);
  const defeat = /d[eé]faite/i.test(score[1]);
  const victory = /victoire/i.test(score[1]);
  const draw = /nul/i.test(score[1]);
  const reverse = (defeat && left > right) || (victory && left < right);
  return { opponent: score[4].trim(), scoreTeam: reverse ? right : left, scoreOpponent: reverse ? left : right, status: "finished", warning: (draw && left !== right) || (defeat && left === right) || (victory && left === right) ? "Résultat incohérent : vérifier le score." : undefined };
}
// PDF.js supplies coordinates. Associate each result with the closest team above it
// in the same visual column, instead of relying on the PDF's internal text order.
export function parsePositionedResults(items: PositionedText[]): ImportedResult[] {
  const lines: PositionedText[] = [];
  // Group adjacent PDF.js text fragments into visual rows, preserving columns.
  const sorted = items.filter(i => i.text.trim()).sort((a,b) => a.page-b.page || b.y-a.y || a.x-b.x);
  for (const item of sorted) {
    const line = lines.find(l => l.page === item.page && Math.abs(l.y-item.y) < 4 && item.x >= l.x && item.x-l.x < 200);
    if (line) line.text += ` ${item.text.trim()}`;
    else lines.push({ ...item, text: item.text.trim() });
  }
  const byY = lines;
  const teams = byY.map(l => ({ ...l, team: identifyTeam(l.text) })).filter((l): l is typeof l & { team: string } => Boolean(l.team));
  const scores = byY.map(l => ({ ...l, parsed: resultFromText(l.text) })).filter((l): l is typeof l & { parsed: NonNullable<ReturnType<typeof resultFromText>> } => Boolean(l.parsed));
  const used = new Set<string>();
  const output: ImportedResult[] = [];
  for (const score of scores) {
    const options = teams.filter(t => t.page === score.page && !used.has(t.team) && t.y >= score.y - 3 && t.y - score.y < 85 && Math.abs(t.x - score.x) < 130)
      .sort((a,b) => (a.y-score.y)*2+Math.abs(a.x-score.x)/3 - ((b.y-score.y)*2+Math.abs(b.x-score.x)/3));
    if (!options.length) continue;
    const team = options[0];
    used.add(team.team);
    output.push({ team: team.team, ...score.parsed });
  }
  return output.sort((a,b) => a.team.localeCompare(b.team,"fr",{numeric:true}));
}
export function parseResultTokens(tokens: string[]): ImportedResult[] {
  const teams = tokens.map((text,index) => ({team:identifyTeam(text),index})).filter((v):v is {team:string;index:number}=>Boolean(v.team));
  const scores = tokens.map((text,index)=>({parsed:resultFromText(text),index})).filter((v):v is {parsed:NonNullable<ReturnType<typeof resultFromText>>;index:number}=>Boolean(v.parsed));
  const used = new Set<number>();
  return teams.flatMap(t=>{ const s=scores.filter(v=>!used.has(v.index)).sort((a,b)=>Math.abs(a.index-t.index)-Math.abs(b.index-t.index))[0]; if(!s||Math.abs(s.index-t.index)>3)return []; used.add(s.index);return [{team:t.team,...s.parsed}]; });
}
