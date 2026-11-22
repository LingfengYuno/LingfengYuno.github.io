import content from "./content.json";
export type Post = {
  id: string;
  category: "log" | "thought" | "resource";
  title: string;
  body: string;
  image: string;
  date: string;
  published?: number;
};

export const posts = content.posts as Post[];
export const profile = content.profile;

export function articlePath(id: string) {
  return `/read/${id}/`;
}

export const pages = {
  "/": { view: "home" },
  "/works/": { view: "works" },
  "/about/": { view: "about" },
  "/guestbook/": { view: "guestbook" },
  "/characters/kk/": { view: "character", characterSlug: "kk" },
  "/characters/xinyi/": { view: "character", characterSlug: "xinyi" },
} as const;

export function pageProps(path: string) {
  if (Object.hasOwn(pages, path)) return pages[path as keyof typeof pages];
  if (path === "/read/") return { view: "read" } as const;

  const article = posts.find((post) => articlePath(post.id) === path);
  if (article) return { view: "read", articleId: article.id } as const;
}
