export function normalizePersonToken(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-'’]/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr-FR");
}

function titleCaseWord(value: string) {
  return value
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[-'’\s])([a-zà-öø-ÿ])/g, (_, prefix: string, letter: string) =>
      `${prefix}${letter.toLocaleUpperCase("fr-FR")}`,
    );
}

export function formatPlayerName(firstName: string, lastName: string) {
  const familyName = String(lastName || "").trim().toLocaleUpperCase("fr-FR");
  const givenName = String(firstName || "").trim()
    ? titleCaseWord(String(firstName).trim())
    : "";
  return `${familyName} ${givenName}`.trim();
}

export function playerSortKey(firstName: string, lastName: string) {
  return `${normalizePersonToken(lastName)}\u0000${normalizePersonToken(firstName)}`;
}

export function comparePlayerNames(
  a: { firstName: string; lastName: string },
  b: { firstName: string; lastName: string },
) {
  return playerSortKey(a.firstName, a.lastName).localeCompare(
    playerSortKey(b.firstName, b.lastName),
    "fr",
    { sensitivity: "base" },
  );
}

/**
 * Stable identity key for loose names coming from User/StaffMember.name.
 * Sorting normalized words lets us deduplicate "Aymeric DJERIDI" and
 * "DJERIDI Aymeric" without changing database values.
 */
export function loosePersonIdentityKey(name: string) {
  return normalizePersonToken(name)
    .split(" ")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
    .join("|");
}

function isUpperWord(value: string) {
  const letters = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  return Boolean(letters) && letters === letters.toLocaleUpperCase("fr-FR");
}

/**
 * User.name is historically stored as "Prénom Nom" while some legacy staff
 * rows are already "NOM Prénom". This formatter detects the obvious legacy
 * cases, then falls back to Prénom Nom -> NOM Prénom.
 */
export function formatLoosePersonName(name: string) {
  const raw = String(name || "").trim().replace(/\s+/g, " ");
  if (!raw || raw.includes("@")) return raw;

  const parts = raw.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].toLocaleUpperCase("fr-FR");

  const firstUpper = isUpperWord(parts[0]);
  const lastUpper = isUpperWord(parts[parts.length - 1]);

  let familyParts: string[];
  let givenParts: string[];

  if (firstUpper && !lastUpper) {
    familyParts = [parts[0]];
    givenParts = parts.slice(1);
  } else if (!firstUpper && lastUpper) {
    familyParts = [parts[parts.length - 1]];
    givenParts = parts.slice(0, -1);
  } else if (parts.every(isUpperWord)) {
    // Legacy all-caps staff entries are generally already NOM PRÉNOM.
    familyParts = [parts[0]];
    givenParts = parts.slice(1);
  } else {
    // Active users are stored as Prénom Nom.
    familyParts = [parts[parts.length - 1]];
    givenParts = parts.slice(0, -1);
  }

  const family = familyParts.join(" ").toLocaleUpperCase("fr-FR");
  const given = givenParts.map(titleCaseWord).join(" ");
  return `${family} ${given}`.trim();
}

export function loosePersonSortKey(name: string) {
  return normalizePersonToken(formatLoosePersonName(name));
}

export type StaffDirectoryEntry = {
  name: string;
  label: string;
};

export function buildStaffDirectory(names: string[]): StaffDirectoryEntry[] {
  const byIdentity = new Map<string, StaffDirectoryEntry>();

  for (const rawName of names) {
    const name = String(rawName || "").trim().replace(/\s+/g, " ");
    if (!name || name.includes("@")) continue;

    const key = loosePersonIdentityKey(name);
    if (!key) continue;

    const candidate = { name, label: formatLoosePersonName(name) };
    const current = byIdentity.get(key);

    // Prefer the source spelling that already makes the family name explicit.
    if (!current || candidate.label < current.label) {
      byIdentity.set(key, candidate);
    }
  }

  return [...byIdentity.values()].sort((a, b) =>
    normalizePersonToken(a.label).localeCompare(normalizePersonToken(b.label), "fr", {
      sensitivity: "base",
    }),
  );
}
