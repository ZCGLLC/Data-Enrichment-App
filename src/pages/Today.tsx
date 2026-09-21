import { Link } from "react-router-dom";
import { useTitle } from "../components";
import { companyById, fullName, personById } from "../data";
import { buildTasks, dueLabel, formatCredits, savedIds, STARTING_CREDITS } from "../logic";
import { useStore } from "../store";

const suggestions = [
  { label: "VP sales", to: "/people?seniority=VP&dept=Sales" },
  { label: "Founders and chiefs", to: "/people?seniority=C-Suite" },
  { label: "Software companies", to: "/people?industry=Software" },
  { label: "People in London", to: "/people?city=London" },
  { label: "Already in your network", to: "/people?network=1" },
];

export function Today() {
  useTitle("Today");
  const { state } = useStore();
  const tasks = buildTasks(state.sequences, state.completedTasks).filter((task) => !task.done);
  const due = tasks.filter((task) => task.bucket !== "upcoming").slice(0, 4);
  const saved = savedIds(state.lists).length;
  const linkedin = state.integrations.linkedin.connected;
  const firstName = state.userName.split(" ")[0] || state.userName;

  return (
    <div className="page">
      <section className="today-hero">
        <div>
          <p className="eyebrow">Today</p>
          <h1>Start with the person, not the spreadsheet.</h1>
          <p className="lede">
            {firstName}, this workspace opens with <strong>{formatCredits(state.credits)} credits</strong>
            {state.credits === STARTING_CREDITS ? " — the full starter balance." : "."} Search is free. LinkedIn is the
            first place to say hello, and contact details stay hidden until you choose to spend.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/people">
              Find people
            </Link>
            {linkedin ? (
              <Link className="btn btn-ghost" to="/tasks">
                Review tasks
              </Link>
            ) : (
              <Link className="btn btn-linkedin" to="/integrations">
                Connect LinkedIn
              </Link>
            )}
          </div>
        </div>
        <div className="hero-stat">
          <span>Credits left</span>
          <strong>{formatCredits(state.credits)}</strong>
          <span>of {formatCredits(STARTING_CREDITS)} starter credits</span>
        </div>
      </section>

      <section className="stat-row">
        <Link className="stat" to="/lists">
          <span>Saved people</span>
          <strong>{saved}</strong>
        </Link>
        <Link className="stat" to="/tasks">
          <span>Open tasks</span>
          <strong>{tasks.length}</strong>
        </Link>
        <Link className="stat" to="/sequences">
          <span>Sequences</span>
          <strong>{state.sequences.length}</strong>
        </Link>
        <Link className="stat" to="/integrations">
          <span>LinkedIn</span>
          <strong>{linkedin ? "Connected" : "Not yet"}</strong>
        </Link>
      </section>

      <div className="split">
        <section className="card">
          <h2>Try a search</h2>
          <p className="quiet">Plain filters, with the cost shown before anything is spent.</p>
          <div className="chips">
            {suggestions.map((item) => (
              <Link key={item.label} className="chip" to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>
        <section className={`card ${linkedin ? "" : "emphasis"}`}>
          <h2>{linkedin ? "LinkedIn is connected" : "Connect LinkedIn first"}</h2>
          <p className="quiet">
            {linkedin
              ? "Network badges are on. Draft a note, then open LinkedIn search when you are ready to send it yourself."
              : "Harbor’s demo connection uses LinkedIn’s login model: you approve access, and your password stays with LinkedIn. This sample workspace never asks for it."}
          </p>
          <Link className="btn btn-linkedin" to="/integrations">
            {linkedin ? "Manage connections" : "Set up LinkedIn"}
          </Link>
        </section>
      </div>

      <section className="card">
        <div className="spread">
          <h2>Due next</h2>
          <Link to="/tasks">All tasks</Link>
        </div>
        {due.length === 0 ? (
          <p className="empty">Nothing is due. Save a few people and turn on a sequence when you want a plan.</p>
        ) : (
          <ul className="simple-list">
            {due.map((task) => {
              const person = personById.get(task.personId);
              const company = person ? companyById.get(person.companyId) : undefined;
              if (!person) return null;
              return (
                <li key={task.id}>
                  <div>
                    <strong>{fullName(person)}</strong>
                    <div className="muted">
                      {task.channel === "linkedin" ? "LinkedIn" : task.channel === "email" ? "Email" : "Call"} ·{" "}
                      {company?.name} · {dueLabel(task.due)}
                    </div>
                  </div>
                  <Link to="/tasks">Open</Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
