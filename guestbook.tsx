import { useEffect, useRef, useState, type FormEvent } from "react";

const endpoint = "https://lingfeng-yuno-guestbook.snowy-ray-5146.chatgpt.site/messages";
const scopes = { author: "给作者", game: "给游戏" } as const;
const sortLabels = { newest: "发布最新", oldest: "发布最早", likes: "点赞最多" } as const;
type Scope = keyof typeof scopes;
type Sort = keyof typeof sortLabels;
type Entry = { id: string; nickname: string; body: string; created_at: number };
type Message = Entry & { reply: string; likes: number; liked: number; reply_count: number };
const date = new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeZone: "Asia/Shanghai" });
const sendError = "暂时无法确认是否送达，可以保留原内容再试一次。";

async function api<T>(query: URLSearchParams, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint + "?" + query, {
    credentials: "omit",
    signal: AbortSignal.timeout(15000),
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "留言服务暂时不可用，请稍后再试。");
  return data as T;
}

function send<T>(fields: Record<string, unknown>) {
  return api<T>(new URLSearchParams(), {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields),
  });
}

function Composer({ scope, parent }: { scope: Scope; parent?: Entry }) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const busy = useRef(false);
  const attempt = useRef<{ payload: string; id: string }>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nickname = String(data.get("nickname") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    const visibility = data.get("visibility");
    if (!nickname || !body) {
      setStatus("请填写昵称和内容。");
      return;
    }
    const target = parent ? { action: "reply", parent: parent.id } : { visibility };
    const fields = { scope, nickname, body, website: data.get("website"), ...target };
    const payload = JSON.stringify(fields);
    if (attempt.current?.payload !== payload) attempt.current = { payload, id: crypto.randomUUID() };
    busy.current = true;
    setSubmitting(true);
    setStatus("");
    try {
      const result = await send<{ ok: boolean }>({ ...fields, id: attempt.current.id });
      if (!result.ok) {
        setStatus(sendError);
        return;
      }
      attempt.current = null;
      form.reset();
      setStatus(visibility === "private" ? "私密留言已送达作者。" : parent ? "回复已送达，审核通过后公开。" : "留言已送达，审核通过后公开。");
    } catch (error) {
      setStatus(error instanceof Error && !["TypeError", "TimeoutError", "AbortError"].includes(error.name) ? error.message : sendError);
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="guestbook-form" method="post" onSubmit={submit}>
      <noscript>请启用 JavaScript 后发送内容。</noscript>
      <fieldset disabled={submitting}>
        <legend>{parent ? "回复 " + parent.nickname : "写留言"}</legend>
        <label>昵称<input name="nickname" required maxLength={30} autoComplete="nickname" /></label>
        <label>{parent ? "回复内容" : "留言内容"}<textarea name="body" required maxLength={2000} rows={parent ? 3 : 6} /></label>
        {!parent && (
          <fieldset className="guestbook-visibility">
            <legend>谁可以看</legend>
            <label><input type="radio" name="visibility" value="public" defaultChecked /> 审核后公开</label>
            <label><input type="radio" name="visibility" value="private" /> 仅作者可见</label>
          </fieldset>
        )}
        <div className="guestbook-trap" aria-hidden="true" inert>
          <label>网站<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <button type="submit" className="button primary">{submitting ? "正在发送…" : parent ? "提交回复" : "发送留言"}</button>
      </fieldset>
      <p className="guestbook-status" role="status">{status}</p>
    </form>
  );
}

function EntryHeader({ entry }: { entry: Entry }) {
  return <header className="guestbook-entry-header">
    <strong>{entry.nickname}</strong>
    <time dateTime={new Date(entry.created_at).toISOString()}>{date.format(entry.created_at)}</time>
  </header>;
}

function Pagination({ page, hasMore, onChange, label }: {
  page: number; hasMore: boolean; onChange: (newPage: number) => void; label: string;
}) {
  if (page === 1 && !hasMore) return null;
  return <nav className="guestbook-pagination" aria-label={label}>
    <button type="button" className="guestbook-control" disabled={page === 1} onClick={() => onChange(page - 1)}>上一页</button>
    <span>第 {page} 页</span>
    <button type="button" className="guestbook-control" disabled={!hasMore} onClick={() => onChange(page + 1)}>下一页</button>
  </nav>;
}

function Thread({ message, scope }: { message: Message; scope: Scope }) {
  const [replies, setReplies] = useState<{ rows: Entry[]; hasMore: boolean }>();
  const [page, setPage] = useState(1);
  const [problem, setProblem] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<{ replies: Entry[]; hasMore: boolean }>(new URLSearchParams({ scope, parent: message.id, page: String(page) }), {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    }).then(({ replies: rows, hasMore }) => {
      if (!controller.signal.aborted) setReplies({ rows, hasMore });
    }).catch(() => {
      if (!controller.signal.aborted) setProblem("回复暂时无法加载。");
    });
    return () => controller.abort();
  }, [scope, message.id, reload, page]);

  return (
    <div id={"thread-" + message.id} className="guestbook-thread">
      {problem ? (
        <p role="status">{problem} <button type="button" className="guestbook-control"
          onClick={() => { setProblem(""); setReload((value) => value + 1); }}>重试</button></p>
      ) : !replies ? <p role="status">正在加载回复…</p> : replies.rows.length ? (
        <ol className="guestbook-replies">
          {replies.rows.map((entry) => <li key={entry.id}><EntryHeader entry={entry} /><p>{entry.body}</p></li>)}
        </ol>
      ) : <p className="guestbook-note">还没有公开回复。</p>}
      {replies && <Pagination page={page} hasMore={replies.hasMore} label="访客回复分页"
        onChange={(next) => { setReplies(undefined); setPage(next); }} />}
      <Composer scope={scope} parent={message} />
    </div>
  );
}

function Card({ message, scope, onLike }: {
  message: Message; scope: Scope; onLike: (id: string, likes: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [liking, setLiking] = useState(false);
  const [problem, setProblem] = useState("");
  const busy = useRef(false);

  async function like() {
    if (busy.current || message.liked) return;
    busy.current = true;
    setLiking(true);
    setProblem("");
    try {
      const result = await send<{ ok: boolean; likes: number }>({ action: "like", parent: message.id, scope });
      if (!result.ok) throw new Error();
      onLike(message.id, result.likes);
    } catch (error) {
      setProblem(error instanceof Error && error.name === "Error" && error.message ? error.message : "暂时无法点赞，请重试。");
    } finally {
      busy.current = false;
      setLiking(false);
    }
  }

  return (
    <article className="guestbook-card">
      <EntryHeader entry={message} />
      <p className="guestbook-body">{message.body}</p>
      {message.reply && <div className="guestbook-reply"><strong>作者回复</strong><p>{message.reply}</p></div>}
      <div className="guestbook-actions">
        <button type="button" className="guestbook-control" aria-pressed={Boolean(message.liked)}
          disabled={liking} onClick={like}>
          {message.liked ? "已点赞" : "点赞"} <span>{message.likes ?? 0}</span>
        </button>
        <button type="button" className="guestbook-control" aria-expanded={expanded}
          aria-controls={expanded ? "thread-" + message.id : undefined} onClick={() => setExpanded(!expanded)}>
          {expanded ? "收起回复" : "回复"} <span>{message.reply_count ?? 0}</span>
        </button>
      </div>
      {problem && <p role="status" className="guestbook-note">{problem}</p>}
      {expanded && <Thread message={message} scope={scope} />}
    </article>
  );
}

export default function Guestbook() {
  const [scope, setScope] = useState<Scope>("author");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const [listing, setListing] = useState<{ query: string; messages?: Message[]; hasMore?: boolean }>();
  const [reload, setReload] = useState(0);
  const query = new URLSearchParams({ scope, sort, page: String(page) }).toString();
  useEffect(() => {
    const controller = new AbortController();
    api<{ messages: Message[]; hasMore: boolean }>(new URLSearchParams(query), {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    }).then((data) => {
      if (!Array.isArray(data.messages)) throw new Error();
      if (!controller.signal.aborted) setListing({ query, messages: data.messages, hasMore: data.hasMore });
    }).catch(() => {
      if (!controller.signal.aborted) setListing({ query });
    });
    return () => controller.abort();
  }, [query, reload]);

  function applyLike(id: string, likes: number) {
    setListing((current) => {
      if (current?.query !== query || !current.messages) return current;
      const messages = current.messages.map((entry) => entry.id === id ? { ...entry, likes, liked: 1 } : entry);
      if (sort === "likes") messages.sort((a, b) => b.likes - a.likes || b.created_at - a.created_at || b.id.localeCompare(a.id));
      return { ...current, messages };
    });
    if (sort === "likes") setReload((value) => value + 1);
  }

  function chooseScope(next: Scope) {
    if (next !== scope) {
      setPage(1);
      setScope(next);
    }
  }

  return (
    <section className="public-guestbook" aria-labelledby="guestbook-heading">
      <header className="guestbook-heading">
        <h1 id="guestbook-heading">留言板</h1>
        <div role="group" aria-label="留言对象" className="guestbook-scope">
          <button type="button" aria-pressed={scope === "author"} onClick={() => chooseScope("author")}>{scopes.author}</button>
          <button type="button" aria-pressed={scope === "game"} onClick={() => chooseScope("game")}>{scopes.game}</button>
        </div>
      </header>
      <div className="guestbook-layout">
        <aside className="guestbook-composer" aria-label="写留言">
          <Composer scope={scope} />
        </aside>
        <section className="guestbook-list" aria-labelledby="guestbook-list-heading">
          <header className="guestbook-list-heading">
            <h2 id="guestbook-list-heading">公开留言</h2>
            <label>排序
              <select value={sort} onChange={(event) => { setPage(1); setSort(event.target.value as Sort); }}>
                {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </header>
          {listing?.query !== query ? <p role="status">正在加载留言…</p> : !listing.messages ? (
            <p role="status">暂时无法加载留言。 <button type="button" className="guestbook-control"
              onClick={() => { setListing(undefined); setReload((value) => value + 1); }}>重试</button></p>
          ) : listing.messages.length ? (
            <div className="guestbook-feed">
              {listing.messages.map((message) => <Card key={message.id} message={message} scope={scope} onLike={applyLike} />)}
            </div>
          ) : <p className="guestbook-empty">还没有公开留言。</p>}
          {listing?.query === query && listing.messages && (
            <Pagination page={page} hasMore={Boolean(listing.hasMore)} label="公开留言分页" onChange={setPage} />
          )}
        </section>
      </div>
    </section>
  );
}
