import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { companyById, fullName, type Person } from "./data";
import { COSTS, formatCredits, linkedinSearchUrl } from "./logic";
import { useStore } from "./store";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Harbor`;
  }, [title]);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 33 + char.charCodeAt(0)) % 360;
  return `hsl(${hash} 28% 34%)`;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span className={`avatar ${size}`} style={{ background: avatarColor(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SpendDialog({
  title,
  detail,
  confirmLabel,
  canConfirm = true,
  onConfirm,
  onClose,
}: {
  title: string;
  detail: string;
  confirmLabel: string;
  canConfirm?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{detail}</p>
      {canConfirm ? null : <p className="warn">There aren’t enough credits for this yet.</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canConfirm}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function SaveDialog({ personIds, onClose }: { personIds: string[]; onClose: () => void }) {
  const { state, saveToList, removeFromList, createList } = useStore();

  return (
    <Modal title={personIds.length > 1 ? `Save ${personIds.length} people` : "Save to a list"} onClose={onClose}>
      <ul className="choice-list">
        {state.lists.map((list) => {
          const allIn = personIds.every((id) => list.personIds.includes(id));
          return (
            <li key={list.id}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={allIn}
                  onChange={() => {
                    if (allIn) personIds.forEach((id) => removeFromList(list.id, id));
                    else saveToList(list.id, personIds);
                  }}
                />
                <span>{list.name}</span>
                <span className="muted">{list.personIds.length}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const name = String(data.get("listName") ?? "");
          if (!name.trim()) return;
          const id = createList(name);
          saveToList(id, personIds);
          event.currentTarget.reset();
        }}
      >
        <input name="listName" placeholder="New list name" aria-label="New list name" />
        <button type="submit" className="btn btn-ghost">
          Create and save
        </button>
      </form>
    </Modal>
  );
}

export function EnrollDialog({ personIds, onClose }: { personIds: string[]; onClose: () => void }) {
  const { state, enroll } = useStore();
  return (
    <Modal title="Add to a sequence" onClose={onClose}>
      {state.sequences.length === 0 ? (
        <p>
          You don’t have a sequence yet. Start with a LinkedIn-first draft on the Sequences page, then come back and add people.
        </p>
      ) : (
        <ul className="choice-list">
          {state.sequences.map((sequence) => (
            <li key={sequence.id} className="spread">
              <div>
                <strong>{sequence.name}</strong>
                <div className="muted">
                  {sequence.status === "active" ? "On" : "Draft"} · {sequence.steps.length} steps
                </div>
              </div>
              <button
                type="button"
                className="btn btn-small"
                onClick={() => {
                  enroll(sequence.id, personIds);
                  onClose();
                }}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="modal-actions">
        <Link className="btn btn-primary" to="/sequences" onClick={onClose}>
          Go to sequences
        </Link>
      </div>
    </Modal>
  );
}

export function PersonCard({
  person,
  checked,
  onChecked,
  onSave,
  onReveal,
}: {
  person: Person;
  checked?: boolean;
  onChecked?: (checked: boolean) => void;
  onSave: () => void;
  onReveal: () => void;
}) {
  const { state } = useStore();
  const company = companyById.get(person.companyId);
  const revealed = state.revealedEmails.includes(person.id);
  const saved = state.lists.some((list) => list.personIds.includes(person.id));
  const linkedinOn = state.integrations.linkedin.connected;

  return (
    <article className="person">
      {onChecked ? (
        <label className="check tight">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onChecked(event.target.checked)}
            aria-label={`Select ${fullName(person)}`}
          />
        </label>
      ) : null}
      <Avatar name={fullName(person)} />
      <div className="person-main">
        <div className="spread">
          <div>
            <Link className="person-name" to={`/people/${person.id}`}>
              {fullName(person)}
            </Link>
            <div className="person-role">
              {person.title}
              {company ? (
                <>
                  {" "}
                  at <Link to={`/companies/${company.id}`}>{company.name}</Link>
                </>
              ) : null}
            </div>
            <div className="muted">
              {person.city}, {person.country} · {person.seniority} · {person.department}
            </div>
          </div>
        </div>
        <div className="signals">
          {linkedinOn && person.inNetwork ? <span className="badge badge-net">In your network</span> : null}
          {person.signals.map((signal) => (
            <span key={signal} className="badge">
              {signal}
            </span>
          ))}
        </div>
      </div>
      <div className="actions">
        <a className="btn btn-linkedin btn-small" href={linkedinSearchUrl(person)} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <button type="button" className="btn btn-small" onClick={onReveal} disabled={revealed}>
          {revealed ? "Email revealed" : `Email · ${COSTS.email} credit`}
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onSave}>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}

export function creditLine(cost: number, left: number): string {
  const leftAfter = Math.max(0, left - cost);
  return `This uses ${formatCredits(cost)} ${cost === 1 ? "credit" : "credits"}. You’ll have ${formatCredits(leftAfter)} left.`;
}
