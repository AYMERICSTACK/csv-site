const PARIS_TIME_ZONE = "Europe/Paris";

function getParisOffsetMs(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  const parisAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );

  return parisAsUtc - date.getTime();
}

/**
 * Convertit une valeur HTML datetime-local (heure française) en Date UTC.
 * Le calcul respecte automatiquement l'heure d'été / d'hiver à Paris.
 */
export function parseParisDateTime(value: string) {
  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) {
    throw new Error("Date et heure invalides.");
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    throw new Error("Date et heure invalides.");
  }

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const offsetMs = getParisOffsetMs(utcGuess);

  return new Date(utcGuess.getTime() - offsetMs);
}
