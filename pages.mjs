import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";

if (process.argv[2] === "assets") {
  await mkdir("public/images", { recursive: true });
  await mkdir("public/fonts", { recursive: true });
  for (const name of await readdir(".")) {
    if (name === "content.json" || name === "favicon.webp") {
      await copyFile(name, "public/" + name);
    } else if (name.endsWith(".woff2")) {
      await copyFile(name, "public/fonts/" + name);
    } else if (/\.(webp|png|jpg)$/.test(name)) {
      await copyFile(name, "public/images/" + name);
    }
  }
} else {
  for (const route of ["works", "about", "read", "characters/kk", "characters/xinyi"]) {
    const folder = "dist/" + route;
    await mkdir(folder, { recursive: true });
    await copyFile("dist/index.html", folder + "/index.html");
  }
  await copyFile("dist/index.html", "dist/404.html");
  await writeFile("dist/.nojekyll", "");
}
