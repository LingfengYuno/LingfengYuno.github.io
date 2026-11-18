import { createRoot } from "react-dom/client";
import Website from "./website";
import "./globals.css";

const route = window.location.pathname.replace(/\/+$/, "");
const pages = {
  "": { view: "home" },
  "/works": { view: "works" },
  "/about": { view: "about" },
  "/read": { view: "read" },
  "/characters/kk": { view: "character", characterSlug: "kk" },
  "/characters/xinyi": { view: "character", characterSlug: "xinyi" },
} as const;
const page = pages[route as keyof typeof pages];
createRoot(document.getElementById("root")!).render(
  page ? <Website {...page} /> : (
    <main className="site-main reading-page">
      <h1>找不到这一页</h1>
      <a className="text-link" href="/">返回小屋</a>
    </main>
  ),
);
