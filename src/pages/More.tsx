import { useState } from "react";
import { Link } from "react-router-dom";
import { Modal, useTitle } from "../components";
import { companyById, fullName, personById } from "../data";
import {
  COSTS,
  STARTING_CREDITS,
  buildTasks,
  formatCredits,
  integrationCatalog,
  savedIds,
  type IntegrationId,
} from "../logic";
import { useStore } from "../store";

export function Analytics() {
  useTitle("Analytics");
  const { state } = useStore();
  const tasks = buildTasks(state.sequences, state.completedTasks);
  const spent = state.ledger.reduce((sum, entry) => sum + entry.cost, 0);
  const byType = { email: 0, phone: 0, company: 0 };
  for (const entry of state.ledger) byType[entry.type] += entry.cost;
  const max = Math.max(byType.email, byType.phone, byType.company, 1);
  const enrolled = new Set(state.sequences.flatMap((sequence) => sequence.enrollments.map((item) => item.personId))).size;

  return (
    <div className="page">
      <p className="eyebrow">Analytics</p>
      <h1>A quiet picture of the work.</h1>
      <p className="lede">These numbers come from what you’ve done in this sample workspace.</p>
      <section className="stat-row">
        <div className="stat">
          <span>Credits left</span>
          <strong>{formatCredits(state.credits)}</strong>
        </div>
        <div className="stat">
          <span>Credits spent</span>
          <strong>{formatCredits(spent)}</strong>
        </div>
        <div className="stat">
          <span>People saved</span>
          <strong>{savedIds(state.lists).length}</strong>
        </div>
        <div className="stat">
          <span>Enrolled</span>
          <strong>{enrolled}</strong>
        </div>
        <div className="stat">
          <span>Tasks done</span>
          <strong>
            {tasks.filter((task) => task.done).length}/{tasks.length}
          </strong>
        </div>
      </section>
      <section className="card stack">
        <h2>Where credits went</h2>
        {spent === 0 ? (
          <p className="empty">Nothing spent yet. You still have the full {formatCredits(STARTING_CREDITS)} starter credits.</p>
        ) : (
          <div className="bars">
            <Bar label="Work email" value={byType.email} max={max} />
            <Bar label="Direct phone" value={byType.phone} max={max} />
            <Bar label="Company details" value={byType.company} max={max} />
          </div>
        )}
      </section>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar-track" aria-hidden="true">
        <div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span>{formatCredits(value)}</span>
    </div>
  );
}

export function Credits() {
  useTitle("Credits");
  const { state } = useStore();
  return (
    <div className="page">
      <p className="eyebrow">Credits</p>
      <h1>{formatCredits(state.credits)} credits left</h1>
      <p className="lede">
        This workspace started with {formatCredits(STARTING_CREDITS)} credits. Search, lists, sequences, and LinkedIn drafts are free.
      </p>
      <section className="card">
        <h2>What a credit buys</h2>
        <ul className="simple-list plain">
          <li>
            <span>Work email</span>
            <strong>{COSTS.email} credit</strong>
          </li>
          <li>
            <span>Direct phone</span>
            <strong>{COSTS.phone} credits</strong>
          </li>
          <li>
            <span>Company funding and technology</span>
            <strong>{COSTS.company} credits</strong>
          </li>
        </ul>
      </section>
      <section className="card stack">
        <h2>Activity</h2>
        {state.ledger.length === 0 ? (
          <p className="empty">No credits spent. The balance is still {formatCredits(STARTING_CREDITS)}.</p>
        ) : (
          <ul className="simple-list">
            {state.ledger.map((entry) => {
              const person = entry.personId ? personById.get(entry.personId) : undefined;
              const company = entry.companyId ? companyById.get(entry.companyId) : undefined;
              return (
                <li key={entry.id}>
                  <div>
                    <strong>{entry.label}</strong>
                    <div className="muted">{new Date(entry.at).toLocaleString()}</div>
                  </div>
                  <div className="row">
                    {person ? <Link to={`/people/${person.id}`}>{fullName(person)}</Link> : null}
                    {company ? <Link to={`/companies/${company.id}`}>{company.name}</Link> : null}
                    <span>−{entry.cost}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export function Integrations() {
  useTitle("Integrations");
  const { state, connect, disconnect } = useStore();
  const [pending, setPending] = useState<IntegrationId | null>(null);
  const pendingInfo = integrationCatalog.find((item) => item.id === pending);

  return (
    <div className="page">
      <p className="eyebrow">Integrations</p>
      <h1>Work where you already talk to people.</h1>
      <p className="lede">
        LinkedIn is the priority. Other inboxes, calendars, and CRMs sit beside it. These are demo connections: Harbor asks you to
        confirm, and it never asks for a password.
      </p>
      <div className="stack">
        {integrationCatalog.map((item) => {
          const status = state.integrations[item.id];
          return (
            <article key={item.id} className={`card integration${item.priority ? " priority" : ""}`}>
              <div>
                {item.priority ? <span className="eyebrow">Priority</span> : <span className="eyebrow">{item.group}</span>}
                <h2>{item.name}</h2>
                <p>{item.blurb}</p>
                {item.id === "linkedin" ? (
                  <ul className="ticks">
                    <li>Match saved people against a sample of your network</li>
                    <li>Draft a connection note and open LinkedIn search</li>
                    <li>No scraping, no stored password, no messages sent for you</li>
                  </ul>
                ) : null}
              </div>
              <div className="stack tight">
                <span className={status.connected ? "badge badge-net" : "badge"}>{status.connected ? "Connected" : "Not connected"}</span>
                {status.connected ? (
                  <button type="button" className="btn btn-ghost" onClick={() => disconnect(item.id)}>
                    Disconnect
                  </button>
                ) : (
                  <button
                    type="button"
                    className={item.id === "linkedin" ? "btn btn-linkedin" : "btn btn-primary"}
                    onClick={() => setPending(item.id)}
                  >
                    Connect {item.name}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {pending && pendingInfo ? (
        <Modal title={`Connect ${pendingInfo.name}`} onClose={() => setPending(null)}>
          <p>
            In a live workspace this would open {pendingInfo.name}’s own login so you can approve access. This demo marks the
            connection locally. Harbor does not collect your password or pull private data in the background.
          </p>
          {pending === "linkedin" ? (
            <p>After you connect, people already in the sample network get a badge, and LinkedIn stays the first action on every profile.</p>
          ) : null}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={pending === "linkedin" ? "btn btn-linkedin" : "btn btn-primary"}
              onClick={() => {
                connect(pending);
                setPending(null);
              }}
            >
              Use demo connection
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function Settings() {
  useTitle("Settings");
  const { state, updateProfile, resetWorkspace, notify } = useStore();
  const [userName, setUserName] = useState(state.userName);
  const [workspaceName, setWorkspaceName] = useState(state.workspaceName);
  const [userEmail, setUserEmail] = useState(state.userEmail);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="page narrow">
      <p className="eyebrow">Settings</p>
      <h1>Workspace</h1>
      <p className="lede slim">
        {workspaceName} is a sample workspace with fictional people. Outreach still needs a lawful reason to contact someone.
      </p>
      <form
        className="card stack"
        onSubmit={(event) => {
          event.preventDefault();
          updateProfile({
            userName: userName.trim() || state.userName,
            workspaceName: workspaceName.trim() || state.workspaceName,
            userEmail: userEmail.trim() || state.userEmail,
          });
          notify("Workspace details saved.");
        }}
      >
        <label className="field">
          <span>Your name</span>
          <input value={userName} onChange={(event) => setUserName(event.target.value)} />
        </label>
        <label className="field">
          <span>Workspace name</span>
          <input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
        </label>
        <label className="field">
          <span>Email on drafts</span>
          <input value={userEmail} onChange={(event) => setUserEmail(event.target.value)} type="email" />
        </label>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </form>
      <section className="card stack">
        <h2>Restore starter credits</h2>
        <p className="quiet">
          This clears reveals, lists, sequences, and connections, and puts {formatCredits(STARTING_CREDITS)} credits back.
        </p>
        <button type="button" className="btn btn-danger" onClick={() => setConfirmReset(true)}>
          Restore workspace
        </button>
      </section>
      {confirmReset ? (
        <Modal title="Restore the starter workspace?" onClose={() => setConfirmReset(false)}>
          <p>You’ll be back to {formatCredits(STARTING_CREDITS)} credits. Saved people and sequences in this browser will be cleared.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                resetWorkspace();
                setUserName("Alex Morgan");
                setWorkspaceName("Alex's workspace");
                setUserEmail("alex@harbor.demo");
                setConfirmReset(false);
              }}
            >
              Restore
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function NotFound() {
  useTitle("Not found");
  return (
    <div className="page">
      <h1>That page isn’t here.</h1>
      <Link to="/">Back to today</Link>
    </div>
  );
}
