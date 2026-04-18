import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function parseArgs(argv) {
  const options = {
    days: 90,
    output: "",
    json: "",
    token: process.env.GITHUB_TOKEN || "",
    help: false,
  };

  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-o":
      case "--output":
        options.output = requireValue(argv, index, arg);
        index += 1;
        break;
      case "--json":
        options.json = requireValue(argv, index, arg);
        index += 1;
        break;
      case "--days":
        options.days = Number(requireValue(argv, index, arg));
        index += 1;
        break;
      case "--token":
        options.token = requireValue(argv, index, arg);
        index += 1;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }
        positional.push(arg);
        break;
    }
  }

  if (options.help) {
    return options;
  }

  if (!positional[0]) {
    throw new Error("Missing required GitHub username. Run with --help for usage.");
  }

  if (!Number.isFinite(options.days) || options.days <= 0) {
    throw new Error("--days must be a positive number.");
  }

  options.username = positional[0];
  options.output ||= `${sanitizeSegment(options.username)}.report.html`;

  return options;
}

function requireValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
}

export async function writeTextFile(targetPath, contents) {
  await mkdir(path.dirname(path.resolve(targetPath)), { recursive: true });
  await writeFile(targetPath, contents, "utf8");
}

export function sanitizeSegment(value) {
  return String(value).trim().replace(/[^a-z0-9._-]+/gi, "-");
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

export function formatShortDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatMonthLabel(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatDayLabel(value) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function relativeDaysFromNow(value) {
  const milliseconds = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(milliseconds / 86400000));

  if (days === 0) {
    return "today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export function titleCase(value) {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Event$/, "")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function hashToColor(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 72% 62%)`;
}

export function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function startOfUtcDay(value = new Date()) {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export function subtractDays(value, amount) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() - amount);
  return date;
}
