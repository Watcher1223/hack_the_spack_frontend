/**
 * Format execution result for human-readable display.
 * Returns a short summary for known shapes (e.g. weather), or null to show raw JSON.
 */
export function formatExecutionResultForDisplay(result: unknown): string | null {
  if (result == null || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;

  // Unwrap { success, result } so we format the inner payload
  const payload = r.result != null && typeof r.result === "object" ? r.result : r;
  const p = payload as Record<string, unknown>;

  // Weather-like result: { city, current_weather: { temperature_2m, ... }, units }
  const city = p.city;
  const current = p.current_weather as Record<string, unknown> | undefined;
  const units = p.units as Record<string, unknown> | undefined;
  if (city != null && current != null && typeof current === "object") {
    const temp = current.temperature_2m;
    const feelsLike = current.apparent_temperature;
    const humidity = current.relative_humidity_2m;
    const wind = current.wind_speed_10m;
    const code = current.weather_code;
    const tempUnit = units && typeof units.temperature_2m === "string" ? units.temperature_2m : "°C";
    const windUnit = units && typeof units.wind_speed_10m === "string" ? units.wind_speed_10m : "km/h";
    const cityStr = typeof city === "string" ? city : String(city);
    const parts: string[] = [];
    if (temp != null) parts.push(`${temp}${tempUnit}`);
    if (feelsLike != null && feelsLike !== temp) parts.push(`feels like ${feelsLike}${tempUnit}`);
    if (humidity != null) parts.push(`${humidity}% humidity`);
    if (wind != null) parts.push(`wind ${wind} ${windUnit}`);
    const condition = weatherCodeToLabel(code);
    if (condition) parts.push(condition);
    return `${cityStr}: ${parts.join(", ")}.`;
  }

  return null;
}

/** WMO weather code to short label (common codes) */
function weatherCodeToLabel(code: unknown): string | null {
  if (code == null) return null;
  const c = Number(code);
  const map: Record<number, string> = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Slight showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
  };
  return map[c] ?? null;
}
