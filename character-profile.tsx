
import { Fragment, useState } from "react";
import characterData from "./characters.json";
import { characterImages } from "./gallery";

function Inline({ children }: { children: string }) {
  return (
    <>
      {children
        .split(/(\*\*[^*]+\*\*)/g)
        .map((part, index) =>
          part.startsWith("**") ? (
            <strong key={index}>{part.slice(2, -2)}</strong>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          ),
        )}
    </>
  );
}
function Markdown({ text }: { text: string }) {
  return (
    <div className="archive-prose">
      {text.split(/\n\s*\n/).map((block, index) => {
        const lines = block.split("\n");
        if (lines[0].startsWith("|")) {
          const rows = lines
            .filter((line) => !/^\|[\s:|-]+\|$/.test(line))
            .map((line) =>
              line
                .split("|")
                .slice(1, -1)
                .map((cell) => cell.trim()),
            );
          return (
            <div className="archive-table-wrap" key={index}>
              <table>
                <thead>
                  <tr>
                    {rows[0].map((cell, i) => (
                      <th scope="col" key={i}>
                        <Inline>{cell}</Inline>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>
                          <Inline>{cell}</Inline>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (lines.every((line) => line.startsWith("- ")))
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>
                  <Inline>{line.slice(2)}</Inline>
                </li>
              ))}
            </ul>
          );
        if (block.startsWith("### "))
          return <h4 key={index}>{block.slice(4)}</h4>;
        return (
          <p key={index}>
            <Inline>{block}</Inline>
          </p>
        );
      })}
    </div>
  );
}
export default function CharacterProfile({ slug }: { slug: "kk" | "xinyi" }) {
  const character = characterData[slug];
  const expressions = characterImages.filter((image) =>
    image.src.startsWith(`/images/${slug}`),
  );
  const [expression, setExpression] = useState(expressions[0]);
  const [groupIndex, setGroupIndex] = useState(0);
  const group = character.groups[groupIndex];
  return (
    <div className={`character-profile ${slug}`}>
      <a href="/works?tab=intro" className="text-link archive-back">
        ← 返回作品介绍
      </a>
      <section className="archive-hero">
        <div className="archive-visual">
          <div className="archive-portrait">
            <img
              src={expression.src}
              alt={expression.label}
              width="550"
              height="704"
              fetchPriority="high"
            />
          </div>
          <div
            className="expression-options"
            role="group"
            aria-label={`${character.name}的表情`}
          >
            {expressions.map((image) => (
              <button
                key={image.src}
                aria-pressed={expression.src === image.src}
                onClick={() => setExpression(image)}
              >
                {image.label.split(" · ")[1]}
              </button>
            ))}
          </div>
        </div>
        <div className="archive-intro">
          <p className="eyebrow">无法抵达的现在 · 人物档案</p>
          <h1>
            {character.name}
            <span className="accent-stop">。</span>
          </h1>
          <p className="archive-ability">{character.ability}持有者</p>
          <p className="archive-keywords">{character.keywords}</p>
          <blockquote>{character.quote}</blockquote>
          <p className="archive-hint">
            部分档案涉及人物背景与结局，可按需展开阅读。
          </p>
        </div>
      </section>
      <div className="archive-tabs" role="tablist" aria-label="档案分类">
        {character.groups.map((item, index) => (
          <button
            key={item.name}
            role="tab"
            id={`archive-tab-${index}`}
            aria-selected={groupIndex === index}
            aria-controls={`archive-group-${index}`}
            tabIndex={groupIndex === index ? 0 : -1}
            onClick={() => setGroupIndex(index)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight")
                next = (index + 1) % character.groups.length;
              else if (event.key === "ArrowLeft")
                next =
                  (index + character.groups.length - 1) %
                  character.groups.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = character.groups.length - 1;
              else return;
              event.preventDefault();
              setGroupIndex(next);
              document.getElementById(`archive-tab-${next}`)?.focus();
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      <section
        className="archive-panel"
        id={`archive-group-${groupIndex}`}
        role="tabpanel"
        aria-labelledby={`archive-tab-${groupIndex}`}
        tabIndex={0}
        key={groupIndex}
      >
        <h2>{group.name}</h2>
        {group.sections.map((section, index) => {
          const spoiler = "spoiler" in section && section.spoiler;
          return (
            <details
              className={`archive-section ${spoiler ? "spoiler-section" : ""}`}
              key={section.title}
              open={groupIndex === 0 && index === 0 ? true : undefined}
            >
              <summary>
                <span>{section.title}</span>
                <span className="archive-section-mark">
                  {spoiler && <span className="spoiler-label">含剧透</span>}
                  <span aria-hidden="true">＋</span>
                </span>
              </summary>
              <Markdown text={section.markdown} />
            </details>
          );
        })}
      </section>
      <div className="archive-next">
        <a
          href={`/characters/${slug === "kk" ? "xinyi" : "kk"}`}
          className="text-link"
        >
          认识{slug === "kk" ? "徐欣怡" : "kk"} ↗
        </a>
        <a href="/works#playtest" className="button primary">
          加入QQ群试玩 ↗
        </a>
      </div>
    </div>
  );
}
