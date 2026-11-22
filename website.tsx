

import { useEffect, useRef, useState } from "react";
import CharacterProfile from "./character-profile";
import Guestbook from "./guestbook";
import { articlePath, posts, profile, type Post } from "./site";
import { gameScreens, characterImages, artworkImages } from "./gallery";

type View = "home" | "works" | "about" | "read" | "character" | "guestbook";
type Category = "intro" | "log" | "thought" | "resource";
const categories: Record<Category, string> = {
  intro: "作品介绍",
  log: "开发日志",
  thought: "创作感悟",
  resource: "公开内容",
};

function Arrow() {
  return (
    <span aria-hidden="true" className="arrow">
      ↗
    </span>
  );
}
function DateLabel({ date }: { date: string }) {
  return <time dateTime={date}>{date.replaceAll("-", ".")}</time>;
}
function TextBlocks({ text }: { text: string }) {
  return (
    <div className="prose">
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

export default function Website({
  view = "home",
  characterSlug = "kk",
  articleId = "",
}: {
  view?: View;
  characterSlug?: "kk" | "xinyi";
  articleId?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<Category>("intro");
  const [image, setImage] = useState<{ src: string; caption: string } | null>(
    null,
  );
  const [copyState, setCopyState] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (view !== "works") return;
    const selected = new URLSearchParams(location.search).get("tab");
    if (selected && Object.hasOwn(categories, selected)) {
      setTab(selected as Category);
    }
  }, [view]);
  useEffect(() => {
    if (image) dialog.current?.showModal();
    else dialog.current?.close();
  }, [image]);
  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  function chooseTab(next: Category) {
    setTab(next);
    history.replaceState(null, "", `/works/?tab=${next}`);
  }
  async function copyQQ() {
    try {
      await navigator.clipboard.writeText(profile.qq);
      setCopyState("群号已复制");
    } catch {
      setCopyState(`QQ群号 ${profile.qq}`);
    }
  }
  function gallery(src: string, caption: string) {
    setImage({ src, caption });
  }
  const post = posts.find((item) => item.id === articleId);
  const nav = [
    { href: "/", label: "首页", active: view === "home" },
    {
      href: "/works/",
      label: "我的作品",
      active: view === "works" || view === "read" || view === "character",
    },
    { href: "/about/", label: "关于我", active: view === "about" },
    { href: "/guestbook/", label: "留言板", active: view === "guestbook" },
  ];

  return (
    <>
      <a href="#main" className="skip-link">
        跳到正文
      </a>
      <header className="site-header">
        <a href="/" className="brand" aria-label="凌风Yuno 首页">
          <img src="/images/avatar.webp" alt="" width="36" height="36" />
          <span>
            凌风<span className="brand-en">Yuno</span>
            <span className="brand-dot">.</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="主导航">
          {nav.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a className="header-note" href="/about/#contact">
          联系作者 <Arrow />
        </a>
        <button
          type="button"
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          aria-label={menuOpen ? "关闭导航" : "打开导航"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
      </header>
      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="手机导航">
          {nav.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
            >
              {link.label}
              <Arrow />
            </a>
          ))}
          <a href="/about/#contact">
            联系作者
            <Arrow />
          </a>
        </nav>
      )}

      <main id="main" className="site-main" inert={menuOpen || undefined}>
        {view === "guestbook" && <Guestbook />}
        {view === "character" && <CharacterProfile slug={characterSlug} />}
        {view === "home" && (
          <>
            <section className="home-hero">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span className="live-dot" /> 你好，我是凌风Yuno
                </p>
                <h1>
                  把想象，
                  <br />
                  慢慢做成作品<span className="accent-stop">。</span>
                </h1>
                <p className="hero-description">
                  这里放着我的游戏、创作中的想法，
                  <br className="desktop-break" />
                  还有一路走来的点滴。很高兴在这里遇见你。
                </p>
                <a href="/works/" className="button primary">
                  看看我的作品 <Arrow />
                </a>
              </div>
              <div className="hero-portrait">
                <div className="portrait-frame">
                  <img
                    src="/images/avatar.webp"
                    alt="凌风Yuno的头像"
                    width="360"
                    height="360"
                    fetchPriority="high"
                  />
                </div>
                <div className="portrait-caption">
                  <span>凌风Yuno的小屋</span>
                  <span aria-hidden="true">✳</span>
                </div>
              </div>
            </section>
            <section
              className="featured-section"
              aria-labelledby="featured-heading"
            >
              <div className="section-heading">
                <h2 id="featured-heading">从这里，走进故事</h2>
                <span className="muted">我的游戏作品</span>
              </div>
              <a className="featured-art" href="/works/">
                <img
                  src="/images/riverside.webp"
                  alt="《无法抵达的现在》游戏CG，两位角色在护城河边奔跑"
                  width="1920"
                  height="1080"
                  fetchPriority="high"
                />
                <span className="art-corner">
                  <Arrow />
                </span>
              </a>
              <div className="feature-caption">
                <div>
                  <p className="eyebrow">剧情游戏</p>
                  <h3>
                    <a href="/works/">无法抵达的现在</a>
                  </h3>
                </div>
                <div className="feature-actions">
                  <a href="/works/" className="text-link">
                    认识这个作品 <Arrow />
                  </a>
                  <a href="/works/#playtest" className="text-link">
                    加入QQ群试玩 <Arrow />
                  </a>
                </div>
              </div>
            </section>
            <section className="updates-section">
              <div className="section-heading">
                <h2>创作路上的记录</h2>
                <a href="/works/?tab=log" className="text-link">
                  全部记录 <Arrow />
                </a>
              </div>
              {posts.filter((p) => p.category !== "resource").length ? (
                <PostList
                  posts={posts
                    .filter((p) => p.category !== "resource")
                    .slice(0, 3)}
                />
              ) : (
                <div className="quiet-empty">
                  <span className="empty-symbol" aria-hidden="true">
                    ✳
                  </span>
                  <div>
                    <h3>下一段故事，正在酝酿</h3>
                    <p>开发日志与创作感悟，会慢慢写在这里。</p>
                  </div>
                  <a
                    href="/works/?tab=log"
                    className="round-link"
                    aria-label="查看开发日志"
                  >
                    <Arrow />
                  </a>
                </div>
              )}
            </section>
            <section className="home-about">
              <div>
                <p className="eyebrow">关于创作，也关于我</p>
                <h2>
                  作品之外，
                  <br />
                  也聊聊我自己。
                </h2>
              </div>
              <div>
                <p>
                  {profile.bio.split("\n")[0] ||
                    "如果你也对游戏、故事和创作感兴趣，欢迎来坐坐。"}
                </p>
                <a href="/about/" className="text-link">
                  认识凌风Yuno <Arrow />
                </a>
              </div>
            </section>
          </>
        )}

        {view === "works" && (
          <>
            <section className="page-intro">
              <p className="eyebrow">游戏与创作</p>
              <h1>
                我的作品<span className="accent-stop">。</span>
              </h1>
              <p>从一个想法开始，一点点让它成为可以触碰的世界。</p>
            </section>
            <section className="game-section">
              <button
                type="button"
                className="game-cover image-button"
                onClick={() =>
                  gallery("/images/riverside.webp", "游戏 CG · 护城河奔跑图")
                }
                aria-label="放大查看游戏CG"
              >
                <img
                  src="/images/riverside.webp"
                  alt="护城河奔跑图"
                  width="1920"
                  height="1080"
                  fetchPriority="high"
                />
                <span className="image-expand">放大画面 ↗</span>
              </button>
              <div className="game-heading">
                <div>
                  <p className="eyebrow">剧情游戏</p>
                  <h2>无法抵达的现在</h2>
                </div>
                <a href="#playtest" className="button primary">
                  加入QQ群试玩 <Arrow />
                </a>
              </div>
              <div className="work-tabs" role="tablist" aria-label="作品内容">
                {Object.entries(categories).map(([key, value]) => (
                  <button
                    key={key}
                    id={`tab-${key}`}
                    role="tab"
                    aria-selected={tab === key}
                    aria-controls={`panel-${key}`}
                    tabIndex={tab === key ? 0 : -1}
                    onClick={() => chooseTab(key as Category)}
                    onKeyDown={(event) => {
                      const keys = Object.keys(categories) as Category[];
                      let index = keys.indexOf(tab);
                      if (event.key === "ArrowRight")
                        index = (index + 1) % keys.length;
                      else if (event.key === "ArrowLeft")
                        index = (index + keys.length - 1) % keys.length;
                      else if (event.key === "Home") index = 0;
                      else if (event.key === "End") index = keys.length - 1;
                      else return;
                      event.preventDefault();
                      chooseTab(keys[index]);
                      document.getElementById(`tab-${keys[index]}`)?.focus();
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {(Object.keys(categories) as Category[]).map((panel) => (
                <div
                  key={panel}
                  className="work-panel"
                  role="tabpanel"
                  id={`panel-${panel}`}
                  aria-labelledby={`tab-${panel}`}
                  hidden={panel !== tab}
                  tabIndex={0}
                >
                  {panel === "intro" ? (
                    <>
                      <div className="project-intro">
                        <div className="story-visual">
                          <h3>关于这个故事</h3>
                          <img
                            className="story-illustration"
                            src="/images/kk-interview.webp"
                            alt="kk侧身站立的全身立绘"
                            width="393"
                            height="1415"
                            loading="lazy"
                          />
                        </div>
                        <div>
                          {profile.gameIntro ? (
                            <TextBlocks text={profile.gameIntro} />
                          ) : (
                            <p className="empty-note">作品介绍待补充。</p>
                          )}
                          <dl className="project-facts">
                            <div>
                              <dt>作品类型</dt>
                              <dd>剧情游戏</dd>
                            </div>
                            <div>
                              <dt>创作者</dt>
                              <dd>凌风Yuno</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      <div className="character-section">
                        <div className="section-heading">
                          <h3>故事中的她们</h3>
                          <span className="muted">点击查看人物档案</span>
                        </div>
                        <div className="characters">
                          <Character name="kk" base="kk" />
                          <Character name="徐欣怡" base="xinyi" />
                        </div>
                      </div>
                    </>
                  ) : panel === "resource" ? (
                    <>
                      <div className="resource-heading">
                        <h3>故事的片段</h3>
                        <p>游戏截图、CG与角色立绘，一起看看这个世界的模样。</p>
                      </div>
                      <h3 className="gallery-heading">游戏实机画面</h3>
                      <ResourceGallery
                        images={gameScreens}
                        onOpen={gallery}
                        kind="screenshots"
                      />
                      <h3 className="gallery-heading">CG与标题</h3>
                      <ResourceGallery
                        images={artworkImages}
                        onOpen={gallery}
                        kind="artwork"
                      />
                      <h3 className="gallery-heading">角色立绘</h3>
                      <ResourceGallery
                        images={characterImages}
                        onOpen={gallery}
                        kind="portraits"
                      />
                      <p className="resource-notice">
                        素材在此供浏览欣赏。其他使用方式请联系作者。
                      </p>
                      {posts.some((p) => p.category === "resource") && (
                        <PostList
                          posts={posts.filter((p) => p.category === "resource")}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <div className="resource-heading">
                        <h3>
                          {panel === "log"
                            ? "一款游戏，慢慢生长"
                            : "每个阶段，都有新的想法"}
                        </h3>
                        <p>
                          {panel === "log"
                            ? "记录开发中的尝试、进展，以及值得记下的小事。"
                            : "把不同时期对作品的感受，留在这里。"}
                        </p>
                      </div>
                      {posts.some((p) => p.category === panel) ? (
                        <PostList
                          posts={posts.filter((p) => p.category === panel)}
                        />
                      ) : (
                        <div className="article-empty">
                          <span aria-hidden="true">✳</span>
                          <p>
                            {panel === "log"
                              ? "第一篇开发日志，还在路上。"
                              : "第一篇创作感悟，留待慢慢写下。"}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </section>
            <PlaytestCallout qq={profile.qq} />
          </>
        )}

        {view === "about" && (
          <>
            <section className="about-hero">
              <div className="about-portrait">
                <img
                  src="/images/avatar.webp"
                  alt="凌风Yuno头像"
                  width="400"
                  height="400"
                  fetchPriority="high"
                />
              </div>
              <div>
                <p className="eyebrow">很高兴认识你</p>
                <h1>
                  我是凌风Yuno<span className="accent-stop">。</span>
                </h1>
                <p className="about-lead">做游戏，也记录创作路上的想法。</p>
                {profile.bio ? (
                  <TextBlocks text={profile.bio} />
                ) : (
                  <p className="empty-note">个人简介待补充。</p>
                )}
                <a href="#contact" className="button primary">
                  联系作者 <Arrow />
                </a>
              </div>
            </section>
            <section id="contact" className="about-details">
              <div>
                <h2>创作经历</h2>
                {profile.experience ? (
                  <Experience text={profile.experience} />
                ) : (
                  <div className="empty-line">
                    <span aria-hidden="true">○</span>
                    <p>这一页，留给慢慢补全的创作经历。</p>
                  </div>
                )}
              </div>
              <div>
                <h2>保持联系</h2>
                <div className="contact-row">
                  <span>QQ群</span>
                  {profile.qq ? (
                    <button onClick={copyQQ}>
                      {profile.qq} <span aria-hidden="true">↗</span>
                    </button>
                  ) : (
                    <span className="muted">待补充</span>
                  )}
                </div>
                <div className="contact-row">
                  <span>联系邮箱</span>
                  {profile.email ? (
                    <a href={`mailto:${profile.email}`}>
                      {profile.email} <Arrow />
                    </a>
                  ) : (
                    <span className="muted">待补充</span>
                  )}
                </div>
                <p role="status" className="copy-status">
                  {copyState}
                </p>
              </div>
            </section>
          </>
        )}

        {view === "read" && (
          <section className="reading-page">
            <a
              href={`/works/?tab=${post?.category || "log"}`}
              className="text-link"
            >
              ← 返回{post ? categories[post.category] : "我的作品"}
            </a>
            {post ? (
              <article>
                <p className="eyebrow">
                  {categories[post.category]} · <DateLabel date={post.date} />
                </p>
                <h1>{post.title}</h1>
                {post.category === "thought" && (
                  <p className="historical-note">
                    阶段性创作记录，保留当时的想法与设定。早期设定可能随创作推进而调整。
                  </p>
                )}
                {post.image && (
                  <button
                    className="article-image image-button"
                    onClick={() => gallery(post.image, post.title)}
                  >
                    <img src={post.image} alt={post.title} />
                  </button>
                )}
                <TextBlocks text={post.body} />
              </article>
            ) : (
              <div className="article-empty">
                <h1>这篇记录暂未公开</h1>
                <a href="/works/" className="button primary">
                  去看看作品 <Arrow />
                </a>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <a href="/" className="footer-brand">
          凌风Yuno<span className="brand-dot">.</span>
        </a>
        <p>游戏、故事，以及创作路上的点滴。</p>
        <div>
          <span suppressHydrationWarning>© {new Date().getFullYear()} 凌风Yuno</span>
        </div>
      </footer>
      <dialog
        ref={dialog}
        className="lightbox"
        onCancel={() => setImage(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setImage(null);
        }}
        onClose={() => setImage(null)}
      >
        <button
          className="lightbox-close"
          onClick={() => setImage(null)}
          aria-label="关闭图片"
        >
          ×
        </button>
        {image && (
          <figure>
            <img src={image.src} alt={image.caption} />
            <figcaption>{image.caption}</figcaption>
          </figure>
        )}
      </dialog>
    </>
  );
}

function Character({ name, base }: { name: string; base: string }) {
  return (
    <a
      className="character"
      href={`/characters/${base}/`}
      aria-label={`查看${name}的人物档案`}
    >
      <div className="character-image">
        <img
          src={`/images/${base}.webp`}
          alt={`${name}常态`}
          width="687"
          height="880"
          loading="lazy"
        />
      </div>
      <span className="character-caption">
        <strong>{name}</strong>
        <span>人物档案 ↗</span>
      </span>
    </a>
  );
}
function Experience({ text }: { text: string }) {
  const paragraphs = text.split(/\n\s*\n/);
  if (paragraphs.length < 3) return <TextBlocks text={text} />;
  return (
    <>
      <TextBlocks text={paragraphs.slice(0, 2).join("\n\n")} />
      <details className="experience-more">
        <summary>
          展开完整创作经历 <span aria-hidden="true">＋</span>
        </summary>
        <TextBlocks text={paragraphs.slice(2).join("\n\n")} />
      </details>
    </>
  );
}
function ResourceGallery({
  images,
  onOpen,
  kind,
}: {
  images: { src: string; label: string; type: string }[];
  onOpen: (src: string, caption: string) => void;
  kind: string;
}) {
  return (
    <div className={`resource-gallery ${kind}`}>
      {images.map((image) => (
        <button
          key={image.src}
          type="button"
          className="resource-item image-button"
          aria-label={`放大查看${image.label}`}
          onClick={() => onOpen(image.src, `${image.type} · ${image.label}`)}
        >
          <div className="resource-preview">
            <img src={image.src} alt={image.label} loading="lazy" />
          </div>
          <span>
            {image.label}
            <span className="muted">{image.type} ↗</span>
          </span>
        </button>
      ))}
    </div>
  );
}
function PlaytestCallout({ qq }: { qq: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(qq);
      setStatus("群号已复制，在QQ中搜索并申请加入即可。");
    } catch {
      setStatus(`请在QQ中搜索群号 ${qq}，申请加入。`);
    }
  }
  return (
    <section id="playtest" className="playtest-callout">
      <div>
        <p className="eyebrow">一起走进这个故事</p>
        <h2>想试玩这个故事？</h2>
        <p>加入作品QQ群，了解试玩方式与后续更新。</p>
      </div>
      <div className="playtest-contact">
        <span>QQ群</span>
        <strong>{qq || "群号加载中…"}</strong>
        <button className="button primary" onClick={copy} disabled={!qq}>
          复制群号，去QQ加群 ↗
        </button>
        <p role="status">{status || "复制群号后，在QQ中搜索并申请加入。"}</p>
      </div>
    </section>
  );
}
function PostList({ posts }: { posts: Post[] }) {
  return (
    <div className="post-list">
      {posts.map((post) => (
        <a className="post-row" href={articlePath(post.id)} key={post.id}>
          <div className="post-meta">
            <span>{categories[post.category]}</span>
            <DateLabel date={post.date} />
          </div>
          <div>
            <h3>{post.title}</h3>
            <p>{post.body.slice(0, 95)}</p>
          </div>
          <Arrow />
        </a>
      ))}
    </div>
  );
}
