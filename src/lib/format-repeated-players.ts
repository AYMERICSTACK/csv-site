/** Regroupe les buteurs répétés sans modifier les données enregistrées. */
export function formatRepeatedPlayers(value: string): string {
  const names = value.split(",").map((name) => name.trim()).filter(Boolean);
  const counts = new Map<string, { name: string; count: number }>();

  for (const name of names) {
    const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLocaleLowerCase("fr");
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { name, count: 1 });
  }

  return [...counts.values()]
    .map(({ name, count }) => count > 1 ? `${name} ×${count}` : name)
    .join(", ");
}
