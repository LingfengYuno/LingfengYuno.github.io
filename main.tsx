import { createRoot, hydrateRoot } from "react-dom/client";
import Page from "./page";
import { articlePath, posts } from "./site";
import "./globals.css";

const path = window.location.pathname.replace(/\/+$/, "") + "/";
const root = document.getElementById("root")!;
const legacyId = path === "/read/" ? new URLSearchParams(location.search).get("id") : null;
const legacyPost = legacyId && posts.find((post) => post.id === legacyId);

if (legacyPost) {
  location.replace(articlePath(legacyPost.id) + location.hash);
} else {
  const page = <Page path={path} />;
  if (root.firstElementChild) hydrateRoot(root, page);
  else createRoot(root).render(page);
}
