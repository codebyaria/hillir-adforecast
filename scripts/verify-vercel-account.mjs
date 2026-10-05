import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const expectedEmail = process.env.EXPECTED_VERCEL_EMAIL?.trim().toLowerCase();

if (!expectedEmail) {
  console.error(
    "Deployment diblokir: set EXPECTED_VERCEL_EMAIL untuk memverifikasi akun Vercel.",
  );
  process.exit(1);
}

const authCandidates = [
  process.env.VERCEL_CONFIG_DIR
    ? path.join(process.env.VERCEL_CONFIG_DIR, "auth.json")
    : undefined,
  path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "com.vercel.cli",
    "auth.json",
  ),
  path.join(os.homedir(), ".local", "share", "com.vercel.cli", "auth.json"),
  path.join(os.homedir(), ".config", "vercel", "auth.json"),
].filter(Boolean);

const tokenFromEnvironment = process.env.VERCEL_TOKEN;
const authFile = authCandidates.find((candidate) => fs.existsSync(candidate));
const tokenFromFile = authFile
  ? JSON.parse(fs.readFileSync(authFile, "utf8")).token
  : undefined;
const token = tokenFromEnvironment ?? tokenFromFile;

if (!token) {
  console.error("Deployment diblokir: sesi Vercel CLI tidak ditemukan.");
  process.exit(1);
}

const response = await fetch("https://api.vercel.com/v2/user", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (!response.ok) {
  console.error(
    `Deployment diblokir: profil Vercel tidak dapat diverifikasi (${response.status}).`,
  );
  process.exit(1);
}

const payload = await response.json();
const actualEmail = payload.user?.email?.trim().toLowerCase();

if (actualEmail !== expectedEmail) {
  console.error(
    `Deployment diblokir: akun aktif ${actualEmail ?? "tidak diketahui"}, bukan akun yang diwajibkan.`,
  );
  process.exit(1);
}

console.log(`Akun Vercel terverifikasi: ${payload.user.username} (${actualEmail})`);
