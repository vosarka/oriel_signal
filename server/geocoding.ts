import { find as tzFind } from "geo-tz";

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

export interface TimezoneResult {
  tzId: string;
  offsetHours: number;
}

/**
 * Geocode a city/address string to coordinates using Nominatim (OpenStreetMap).
 * No API key required. Rate limit: 1 req/sec — fine for human-driven form submissions.
 */
export async function geocodeCity(city: string): Promise<GeocodeResult> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", city);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "OrielResonanceCircle/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`);
  }

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  if (!results.length) {
    throw new Error(`No location found for: "${city}"`);
  }

  const first = results[0];
  return {
    displayName: first.display_name,
    latitude: parseFloat(first.lat),
    longitude: parseFloat(first.lon),
  };
}

/**
 * Look up the IANA timezone ID for a coordinate pair using geo-tz (embedded data, no API call).
 * Then compute the UTC offset in decimal hours at the given reference date.
 */
export function getTimezoneForCoords(
  lat: number,
  lon: number,
  referenceDate: Date = new Date()
): TimezoneResult {
  const tzIds = tzFind(lat, lon);
  const tzId = tzIds[0] ?? "UTC";
  const offsetHours = getUtcOffsetHours(tzId, referenceDate);
  return { tzId, offsetHours };
}

/**
 * Compute the UTC offset in decimal hours for an IANA timezone at a specific date,
 * accounting for DST. Uses the built-in Intl API — no extra packages required.
 *
 * Examples: "Europe/London" in winter → 0, in summer → 1
 *           "America/New_York" in winter → -5, in summer → -4
 *           "Asia/Kolkata" → 5.5
 */
function getUtcOffsetHours(tzId: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tzId,
      timeZoneName: "longOffset",
      hour: "numeric",
    }).formatToParts(date);

    const tzName = parts.find(p => p.type === "timeZoneName")?.value ?? "GMT+0";
    // tzName is like "GMT+5:30", "GMT-8", "GMT+0"
    const match = tzName.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;

    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3] ?? "0", 10);
    return sign * (hours + minutes / 60);
  } catch {
    return 0;
  }
}

function parseBirthTimeParts(birthTime: string) {
  const match = birthTime
    .trim()
    .match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) {
    throw new Error(
      "Birth time must use a valid 24-hour HH:MM or HH:MM:SS format."
    );
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
    seconds: Number(match[3] ?? "0"),
  };
}

function localPartsAtInstant(tzId: string, instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tzId,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hours: value("hour"),
    minutes: value("minute"),
    seconds: value("second"),
  };
}

/**
 * Resolve the historical IANA timezone offset for an exact local birth moment.
 *
 * Unlike getTimezoneForCoords(), this treats birth date + time as local wall
 * clock values and validates that the moment exists exactly once. DST gaps and
 * repeated hours are rejected instead of being silently labelled "exact".
 */
export function getTimezoneForLocalDateTime(
  lat: number,
  lon: number,
  birthDate: Date,
  birthTime: string
): TimezoneResult {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Number.isNaN(birthDate.getTime())
  ) {
    throw new Error(
      "Valid birth coordinates and birth date are required for timezone resolution."
    );
  }

  const tzId = tzFind(lat, lon)[0];
  if (!tzId) {
    throw new Error(
      "Unable to resolve a timezone for the supplied birth coordinates."
    );
  }

  const { hours, minutes, seconds } = parseBirthTimeParts(birthTime);
  const target = {
    year: birthDate.getUTCFullYear(),
    month: birthDate.getUTCMonth() + 1,
    day: birthDate.getUTCDate(),
    hours,
    minutes,
    seconds,
  };
  const localTimestamp = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hours,
    target.minutes,
    target.seconds,
    0
  );

  // Sample both sides of any DST boundary and validate each candidate by
  // formatting the implied UTC instant back into the requested local clock.
  const candidateOffsets = new Set<number>();
  for (const hoursFromLocal of [-36, -12, 0, 12, 36]) {
    candidateOffsets.add(
      getUtcOffsetHours(
        tzId,
        new Date(localTimestamp + hoursFromLocal * 3_600_000)
      )
    );
  }

  const matches = Array.from(candidateOffsets)
    .map(offsetHours => ({
      offsetHours,
      instant: new Date(localTimestamp - offsetHours * 3_600_000),
    }))
    .filter(({ instant }) => {
      const local = localPartsAtInstant(tzId, instant);
      return (
        local.year === target.year &&
        local.month === target.month &&
        local.day === target.day &&
        local.hours === target.hours &&
        local.minutes === target.minutes &&
        local.seconds === target.seconds
      );
    });

  if (matches.length === 0) {
    throw new Error(
      `The local birth time ${birthTime} does not exist in ${tzId} because of a timezone transition.`
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `The local birth time ${birthTime} is ambiguous in ${tzId} because of a timezone transition.`
    );
  }

  return { tzId, offsetHours: matches[0].offsetHours };
}
