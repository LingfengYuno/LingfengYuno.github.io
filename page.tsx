import Website from "./website";
import { pageProps } from "./site";

export default function Page({ path }: { path: string }) {
  const page = pageProps(path);
  if (page) return <Website {...page} />;

  return (
    <main className="site-main reading-page">
      <h1>找不到这一页</h1>
      <a className="text-link" href="/">返回小屋</a>
    </main>
  );
}
