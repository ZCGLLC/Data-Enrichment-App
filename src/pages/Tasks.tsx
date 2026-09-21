import { useState } from "react";
import { Link } from "react-router-dom";
import { SpendDialog, creditLine, useTitle } from "../components";
import { companyById, fullName, personById } from "../data";
import {
  COSTS,
  buildTasks,
  channelLabel,
  dueLabel,
  fillTemplate,
  linkedinSearchUrl,
} from "../logic";
import { useStore } from "../store";

export function Tasks() {
  useTitle("Tasks");
  const { state, completeTask, reopenTask, saveNote, revealEmails, notify } = useStore();
  const [tab, setTab] = useState<"open" | "done">("open");
  const [spendId, setSpendId] = useState<string | null>(null);
  const tasks = buildTasks(state.sequences, state.completedTasks);
  const visible = tasks.filter((task) => (tab === "done" ? task.done : !task.done));

  return (
    <div className="page">
      <p className="eyebrow">Tasks</p>
      <h1>Do the next touch. Harbor won’t send it for you.</h1>
      <p className="lede">
        LinkedIn steps open a search. Email steps open your mail app after you reveal the address. Marking a task done only updates Harbor.
      </p>
      <div className="tabs" role="tablist">
        <button type="button" className={tab === "open" ? "tab active" : "tab"} onClick={() => setTab("open")}>
          Open ({tasks.filter((task) => !task.done).length})
        </button>
        <button type="button" className={tab === "done" ? "tab active" : "tab"} onClick={() => setTab("done")}>
          Done ({tasks.filter((task) => task.done).length})
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="empty card">
          {tab === "open"
            ? "No open tasks. Turn on a sequence and enroll someone when you want a plan."
            : "Nothing completed yet."}{" "}
          <Link to="/sequences">Go to sequences</Link>
        </p>
      ) : (
        <div className="stack">
          {visible.map((task) => {
            const person = personById.get(task.personId);
            if (!person) return null;
            const company = companyById.get(person.companyId);
            const filledBody = state.notes[task.id] ?? fillTemplate(task.body, person, state.userName);
            const filledSubject = fillTemplate(task.subject, person, state.userName);
            const emailReady = state.revealedEmails.includes(person.id);
            const mailHref = emailReady
              ? `mailto:${person.email}?subject=${encodeURIComponent(filledSubject)}&body=${encodeURIComponent(filledBody)}`
              : undefined;
            return (
              <article key={task.id} className="card stack task">
                <div className="spread">
                  <span className={`channel channel-${task.channel}`}>{channelLabel(task.channel)}</span>
                  <span className={task.bucket === "overdue" && !task.done ? "warn" : "muted"}>{dueLabel(task.due)}</span>
                </div>
                <h2>
                  <Link to={`/people/${person.id}`}>{fullName(person)}</Link>
                </h2>
                <p className="muted">
                  {person.title}
                  {company ? ` · ${company.name}` : ""} · {task.sequenceName}
                </p>
                {task.channel === "email" && filledSubject ? <p className="subject">{filledSubject}</p> : null}
                <textarea
                  rows={5}
                  value={filledBody}
                  aria-label={`Note for ${fullName(person)}`}
                  onChange={(event) => saveNote(task.id, event.target.value)}
                />
                <div className="row wrap">
                  {task.channel === "linkedin" ? (
                    <a className="btn btn-linkedin btn-small" href={linkedinSearchUrl(person)} target="_blank" rel="noreferrer">
                      Open LinkedIn search
                    </a>
                  ) : null}
                  {task.channel === "email" && !emailReady ? (
                    <button type="button" className="btn btn-small" onClick={() => setSpendId(person.id)}>
                      Reveal email · {COSTS.email} credit
                    </button>
                  ) : null}
                  {task.channel === "email" && mailHref ? (
                    <a className="btn btn-small" href={mailHref}>
                      Open mail draft
                    </a>
                  ) : null}
                  {task.channel === "call" && state.revealedPhones.includes(person.id) ? (
                    <a className="btn btn-small" href={`tel:${person.phone}`}>
                      Call {person.phone}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => copyText(`${filledSubject ? `${filledSubject}\n\n` : ""}${filledBody}`, notify)}
                  >
                    Copy
                  </button>
                  {task.done ? (
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => reopenTask(task.id)}>
                      Reopen
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary btn-small" onClick={() => completeTask(task.id)}>
                      Mark done
                    </button>
                  )}
                </div>
                {task.channel === "linkedin" && !state.integrations.linkedin.connected ? (
                  <p className="quiet">
                    <Link to="/integrations">Connect LinkedIn</Link> so this note sits next to your account. You still post it yourself.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      {spendId ? (
        <SpendDialog
          title="Reveal work email"
          detail={creditLine(COSTS.email, state.credits)}
          confirmLabel="Reveal email"
          canConfirm={state.credits >= COSTS.email}
          onConfirm={() => revealEmails([spendId])}
          onClose={() => setSpendId(null)}
        />
      ) : null}
    </div>
  );
}

async function copyText(value: string, notify: (message: string) => void) {
  try {
    await navigator.clipboard.writeText(value);
    notify("Copied.");
  } catch {
    notify("Couldn’t copy automatically. Select the note and copy it.");
  }
}
