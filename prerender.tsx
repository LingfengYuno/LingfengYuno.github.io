import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import Page from "./page";
import { articlePath, pages, posts } from "./site";

const origin = "https://lingfengyuno.com";
const siteName = "凌风Yuno的小屋";
const cover = origin + "/images/riverside.webp";
const metadata = {
  "/": {
    title: "凌风Yuno的小屋 · 游戏与创作",
    description: "认识凌风Yuno，探索剧情游戏《无法抵达的现在》，阅读开发日志与创作感悟。",
  },
  "/works/": {
    title: "《无法抵达的现在》· 凌风Yuno的作品",
    description: "徐欣怡能看见他人的过去，kk能看见他人的未来。了解剧情游戏《无法抵达的现在》的故事、角色、开发进展与试玩方式。",
  },
  "/about/": {
    title: "关于凌风Yuno · 创作经历与联系方式",
    description: "认识独立游戏创作者凌风Yuno，了解个人简介、游戏创作经历、QQ群与联系邮箱。",
    image: origin + "/images/avatar.webp",
  },
  "/guestbook/": {
    title: "留言板 · 凌风Yuno的小屋",
    description: "给凌风Yuno或剧情游戏《无法抵达的现在》留言，浏览公开留言和作者回复。",
  },
  "/characters/kk/": {
    title: "kk ·《无法抵达的现在》人物档案",
    description: "kk是《无法抵达的现在》中拥有未来视的银发少女。浏览她的人物档案、角色立绘与背景故事。",
    image: origin + "/images/kk.webp",
  },
  "/characters/xinyi/": {
    title: "徐欣怡 ·《无法抵达的现在》人物档案",
    description: "徐欣怡是《无法抵达的现在》中拥有过去视的高中女生。浏览她的人物档案、角色立绘与背景故事。",
    image: origin + "/images/xinyi.webp",
  },
} satisfies Record<keyof typeof pages, { title: string; description: string; image?: string }>;

function escapeMarkup(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type Metadata = { title: string; description: string; image?: string; article?: boolean };

function renderMetadata(path: string, data?: Metadata) {
  if (!data) {
    const title = path === "/read/" ? "阅读记录" : "找不到这一页";
    return '<title>' + title + ' · ' + siteName + '</title>\n    <meta name="robots" content="noindex">';
  }

  const url = origin + path;
  const title = escapeMarkup(data.title);
  const description = escapeMarkup(data.description);
  const image = escapeMarkup(data.image || cover);
  return [
    '<title>' + title + '</title>',
    '<meta name="description" content="' + description + '">',
    '<link rel="canonical" href="' + escapeMarkup(url) + '">',
    '<meta property="og:site_name" content="' + siteName + '">',
    '<meta property="og:type" content="' + (data.article ? "article" : "website") + '">',
    '<meta property="og:title" content="' + title + '">',
    '<meta property="og:description" content="' + description + '">',
    '<meta property="og:url" content="' + escapeMarkup(url) + '">',
    '<meta property="og:image" content="' + image + '">',
    '<meta name="twitter:card" content="summary_large_image">',
  ].join("\n    ");
}

const dist = resolve("dist");
const template = await readFile(resolve(dist, "index.html"), "utf8");
const titlePattern = /<title>[^<]*<\/title>/;
if (!titlePattern.test(template) || !template.includes("<!--page-body-->")) {
  throw new Error("Built index.html is missing the title or page body placeholder.");
}
const routes = new Map<string, Metadata>(Object.entries(metadata));

for (const post of posts) {
  const path = articlePath(post.id);
  if (!/^[a-zA-Z0-9_-]+$/.test(post.id) || routes.has(path)) {
    throw new Error("Invalid or duplicate article ID: " + post.id);
  }

  const excerpt = Array.from(post.body.replace(/\s+/g, " ").trim());
  const description = excerpt.slice(0, 110).join("") + (excerpt.length > 110 ? "…" : "");
  routes.set(path, {
    title: post.title + " · " + siteName,
    description: description || post.title,
    image: post.image ? new URL(post.image, origin).href : undefined,
    article: true,
  });
}

async function writePage(path: string, data?: Metadata) {
  const output = resolve(dist, "." + (path === "/404.html" ? path : path + "index.html"));
  const html = template
    .replace(titlePattern, () => renderMetadata(path, data))
    .replace("<!--page-body-->", () => renderToString(<Page path={path} />));
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, html);
}

for (const [path, data] of routes) await writePage(path, data);
await writePage("/read/");
await writePage("/404.html");

const urls = Array.from(routes.keys(), (path) => "  <url><loc>" + escapeMarkup(origin + path) + "</loc></url>");
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  "</urlset>",
  "",
].join("\n");

await Promise.all([
  writeFile(resolve(dist, "sitemap.xml"), sitemap),
  writeFile(resolve(dist, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: " + origin + "/sitemap.xml\n"),
  writeFile(resolve(dist, ".nojekyll"), ""),
]);
