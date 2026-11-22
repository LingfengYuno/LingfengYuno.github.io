import { useEffect, useRef, useState, type FormEvent } from "react";

const endpoint = "https://lingfeng-yuno-guestbook.snowy-ray-5146.chatgpt.site/messages";
const scopes = { author: "给作者留言", game: "给游戏留言" } as const;
type Scope = keyof typeof scopes;
type Message = { id: string; nickname: string; body: string; reply: string; created_at: number };
const messageDate = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium", timeZone: "Asia/Shanghai",
});

export default function Guestbook() {
  const [scope, setScope] = useState<Scope>("author");
  const [listing, setListing] = useState<{ scope: Scope; messages?: Message[] }>();
  const [reload, setReload] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const submission = useRef<{ payload: string; id: string }>(null);
  const busy = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${endpoint}?scope=${scope}`, {
          credentials: "omit", signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data.messages)) throw new Error();
        if (!controller.signal.aborted) setListing({ scope, messages: data.messages });
      } catch {
        if (!controller.signal.aborted) setListing({ scope });
      }
    }
    void load();
    return () => controller.abort();
  }, [scope, reload]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nickname = String(data.get("nickname") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    const visibility = data.get("visibility");
    if (!nickname || !body) {
      setStatus("请填写昵称和留言内容。");
      return;
    }
    const fields = { scope, nickname, body, visibility, website: data.get("website") };
    const payload = JSON.stringify(fields);
    if (submission.current?.payload !== payload) {
      submission.current = { payload, id: crypto.randomUUID() };
    }
    busy.current = true;
    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch(endpoint, {
        method: "POST", credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, id: submission.current.id }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setStatus(result.error || "留言未发送成功，请稍后再试。");
        return;
      }
      submission.current = null;
      form.reset();
      setStatus(visibility === "public" ? "留言已送达，作者审核后会显示在留言板。" : "私密留言已送达作者。");
    } catch {
      setStatus("暂时无法确认是否送达。可以保留原内容，再试一次。");
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className="guestbook" aria-labelledby="guestbook-heading">
      <h1 id="guestbook-heading">留言板</h1>
      <form className="guestbook-form" method="post" onSubmit={submit}>
        <noscript>请启用 JavaScript 后发送留言。</noscript>
        <fieldset disabled={submitting}>
          <legend>写留言</legend>
          <div className="guestbook-fields">
            <label>留言对象
              <select value={scope} onChange={(event) => setScope(event.target.value as Scope)}>
                <option value="author">{scopes.author}</option>
                <option value="game">{scopes.game}</option>
              </select>
            </label>
            <label>昵称<input name="nickname" required maxLength={30} autoComplete="nickname" /></label>
          </div>
          <label>留言内容<textarea name="body" required maxLength={2000} rows={5} /></label>
          <fieldset className="guestbook-visibility">
            <legend>谁可以看</legend>
            <label><input type="radio" name="visibility" value="public" defaultChecked /> 审核后公开</label>
            <label><input type="radio" name="visibility" value="private" /> 仅作者可见</label>
          </fieldset>
          <div className="guestbook-trap" aria-hidden="true" inert>
            <label>网站<input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>
          <button type="submit" className="button primary">{submitting ? "正在发送…" : "发送留言"}</button>
        </fieldset>
        <p className="guestbook-status" role="status">{status}</p>
      </form>

      <section className="guestbook-list" aria-labelledby="guestbook-list-heading">
        <h2 id="guestbook-list-heading">公开留言</h2>
        <div role="group" aria-label="留言分类" className="guestbook-filters">
          <button type="button" aria-pressed={scope === "author"} onClick={() => setScope("author")}>给作者</button>
          <button type="button" aria-pressed={scope === "game"} onClick={() => setScope("game")}>给游戏</button>
        </div>
        <div aria-live="polite">
          {listing?.scope !== scope ? <p>正在加载留言…</p> : !listing.messages ? (
            <p>暂时无法加载留言。 <button type="button" onClick={() => { setListing(undefined); setReload(reload + 1); }}>重试</button></p>
          ) : listing.messages.length ? listing.messages.map((message) => (
            <article key={message.id}>
              <header><strong>{message.nickname}</strong><time dateTime={new Date(message.created_at).toISOString()}>{messageDate.format(message.created_at)}</time></header>
              <p>{message.body}</p>
              {message.reply && <div className="guestbook-reply"><strong>作者回复</strong><p>{message.reply}</p></div>}
            </article>
          )) : <p>还没有公开留言。</p>}
        </div>
      </section>
    </section>
  );
}
