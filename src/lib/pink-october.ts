export function isPinkOctoberActive(date = new Date()) {
  const month = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    month: "numeric",
  }).format(date);

  return Number(month) === 10;
}
