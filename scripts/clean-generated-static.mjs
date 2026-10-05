import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const generatedDirectories = ["dist", "public"].map((directory) =>
  path.resolve(projectRoot, directory),
);

for (const generatedDirectory of generatedDirectories) {
  if (path.dirname(generatedDirectory) !== projectRoot) {
    throw new Error("Target cleanup berada di luar project root.");
  }

  fs.rmSync(generatedDirectory, { recursive: true, force: true });
}

console.log("Generated static directory siap dibangun ulang di Vercel.");
