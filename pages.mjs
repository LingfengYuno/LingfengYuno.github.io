import { copyFile, mkdir, readdir } from "node:fs/promises";

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
  const { build } = await import("vite");
  const output = "node_modules/.cache/yuno-prerender";
  await build({
    publicDir: false,
    build: {
      ssr: "prerender.tsx",
      outDir: output,
      emptyOutDir: true,
      rolldownOptions: { output: { entryFileNames: "prerender.mjs" } },
    },
  });
  await import("./" + output + "/prerender.mjs");
}
