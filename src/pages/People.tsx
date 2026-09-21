import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  EnrollDialog,
  PersonCard,
  SaveDialog,
  SpendDialog,
  creditLine,
  useTitle,
  Avatar,
} from "../components";
import {
  companies,
  companyById,
  fullName,
  people,
  personById,
  seniorityOrder,
  uniqueSorted,
  type Seniority,
} from "../data";
import {
  COSTS,
  emptyQuery,
  filterCompanies,
  filterPeople,
  formatCredits,
  linkedinSearchUrl,
  maskEmail,
  maskPhone,
  sizeOptions,
  suggestNote,
  unrevealedCost,
  webSearchUrl,
  type PeopleQuery,
} from "../logic";
import { useStore } from "../store";

const cities = uniqueSorted(people.map((person) => person.city));
const industries = uniqueSorted(companies.map((company) => company.industry));
const departments = uniqueSorted(people.map((person) => person.department));

function readList(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? "").split("|").filter(Boolean);
}

function queryFromParams(params: URLSearchParams): PeopleQuery {
  const seniorities = readList(params, "seniority").filter((value): value is Seniority =>
    seniorityOrder.includes(value as Seniority),
  );
  return {
    q: params.get("q") ?? "",
    seniorities,
    cities: readList(params, "city"),
    industries: readList(params, "industry"),
    departments: readList(params, "dept"),
    sizes: readList(params, "size"),
    networkOnly: params.get("network") === "1",
  };
}

function writeQuery(query: PeopleQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.seniorities.length) params.set("seniority", query.seniorities.join("|"));
  if (query.cities.length) params.set("city", query.cities.join("|"));
  if (query.industries.length) params.set("industry", query.industries.join("|"));
  if (query.departments.length) params.set("dept", query.departments.join("|"));
  if (query.sizes.length) params.set("size", query.sizes.join("|"));
  if (query.networkOnly) params.set("network", "1");
  return params;
}

export function People() {
  useTitle("People");
  const [params, setParams] = useSearchParams();
  const query = queryFromParams(params);
  const { state, revealEmails } = useStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [saveIds, setSaveIds] = useState<string[] | null>(null);
  const [enrollIds, setEnrollIds] = useState<string[] | null>(null);
  const [spendIds, setSpendIds] = useState<string[] | null>(null);

  const results = useMemo(() => filterPeople(query), [query]);
  const companyHits = query.q.trim() ? filterCompanies(query.q, "", "").slice(0, 3) : [];
  const linkedin = state.integrations.linkedin.connected;

  const update = (patch: Partial<PeopleQuery>) => {
    setParams(writeQuery({ ...query, ...patch }), { replace: true });
    setSelected([]);
  };

  const toggle = (key: "seniorities" | "cities" | "industries" | "departments" | "sizes", value: string) => {
    const current = query[key] as string[];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    update({ [key]: next } as Partial<PeopleQuery>);
  };

  const freshSelected = selected.filter((id) => !state.revealedEmails.includes(id));
  const allChecked = results.length > 0 && results.every((person) => selected.includes(person.id));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">People</p>
          <h1>Find someone worth a conversation.</h1>
          <p className="lede">
            {results.length} {results.length === 1 ? "person matches" : "people match"}. Work emails cost{" "}
            {COSTS.email} credit and only appear after you confirm.
          </p>
        </div>
      </div>

      {!linkedin ? (
        <div className="banner">
          <div>
            <strong>LinkedIn is not connected yet.</strong>
            <p>Connect it to mark people who are already in your sample network. Search still works either way.</p>
          </div>
          <Link className="btn btn-linkedin btn-small" to="/integrations">
            Connect
          </Link>
        </div>
      ) : null}

      <div className="finder">
        <aside className="filters">
          <label className="field">
            <span>Search</span>
            <input
              value={query.q}
              onChange={(event) => update({ q: event.target.value })}
              placeholder="Name, title, or company"
            />
          </label>
          <FilterGroup
            title="Role level"
            options={seniorityOrder.map((value) => ({
              value,
              label: value === "IC" ? "Individual contributor" : value,
            }))}
            selected={query.seniorities}
            onToggle={(value) => toggle("seniorities", value)}
          />
          <FilterGroup
            title="City"
            options={cities.map((value) => ({ value, label: value }))}
            selected={query.cities}
            onToggle={(value) => toggle("cities", value)}
          />
          <FilterGroup
            title="Industry"
            options={industries.map((value) => ({ value, label: value }))}
            selected={query.industries}
            onToggle={(value) => toggle("industries", value)}
          />
          <FilterGroup
            title="Department"
            options={departments.map((value) => ({ value, label: value }))}
            selected={query.departments}
            onToggle={(value) => toggle("departments", value)}
          />
          <FilterGroup
            title="Company size"
            options={sizeOptions.map((value) => ({ value, label: value }))}
            selected={query.sizes}
            onToggle={(value) => toggle("sizes", value)}
          />
          <label className="check">
            <input
              type="checkbox"
              checked={query.networkOnly}
              onChange={(event) => update({ networkOnly: event.target.checked })}
            />
            <span>In my LinkedIn network</span>
          </label>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => update(emptyQuery())}>
            Clear filters
          </button>
        </aside>

        <div className="results">
          {companyHits.length > 0 ? (
            <p className="company-hits">
              Companies:{" "}
              {companyHits.map((company, index) => (
                <span key={company.id}>
                  {index > 0 ? ", " : null}
                  <Link to={`/companies/${company.id}`}>{company.name}</Link>
                </span>
              ))}
            </p>
          ) : null}

          {query.networkOnly && !linkedin ? (
            <p className="quiet">This filter uses the sample network until you connect LinkedIn.</p>
          ) : null}

          {selected.length > 0 ? (
            <div className="bulk-bar">
              <span>{selected.length} selected</span>
              <button type="button" className="btn btn-small" disabled={freshSelected.length === 0} onClick={() => setSpendIds(selected)}>
                {freshSelected.length === 0
                  ? "Emails revealed"
                  : `Reveal ${freshSelected.length} ${freshSelected.length === 1 ? "email" : "emails"} · ${formatCredits(unrevealedCost(selected, state.revealedEmails, COSTS.email))}`}
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setSaveIds(selected)}>
                Save
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setEnrollIds(selected)}>
                Add to sequence
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setSelected([])}>
                Clear
              </button>
            </div>
          ) : (
            <label className="check select-all">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(event) => setSelected(event.target.checked ? results.map((person) => person.id) : [])}
              />
              <span>Select everyone in these results</span>
            </label>
          )}

          {results.length === 0 ? (
            <div className="empty card">
              No one matches those filters. Clear one and try again.
              <div>
                <button type="button" className="btn btn-small" onClick={() => update(emptyQuery())}>
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="person-list">
              {results.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  checked={selected.includes(person.id)}
                  onChecked={(next) =>
                    setSelected((current) => (next ? [...current, person.id] : current.filter((id) => id !== person.id)))
                  }
                  onSave={() => setSaveIds([person.id])}
                  onReveal={() => setSpendIds([person.id])}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {saveIds ? <SaveDialog personIds={saveIds} onClose={() => setSaveIds(null)} /> : null}
      {enrollIds ? <EnrollDialog personIds={enrollIds} onClose={() => setEnrollIds(null)} /> : null}
      {spendIds ? (
        <SpendDialog
          title="Reveal work email"
          detail={freshSpendDetail(spendIds, state.revealedEmails, state.credits)}
          confirmLabel={`Use ${formatCredits(unrevealedCost(spendIds, state.revealedEmails, COSTS.email))} ${unrevealedCost(spendIds, state.revealedEmails, COSTS.email) === 1 ? "credit" : "credits"}`}
          canConfirm={state.credits >= unrevealedCost(spendIds, state.revealedEmails, COSTS.email)}
          onConfirm={() => revealEmails(spendIds)}
          onClose={() => setSpendIds(null)}
        />
      ) : null}
    </div>
  );
}

function freshSpendDetail(ids: string[], revealed: string[], credits: number): string {
  const fresh = ids.filter((id) => !revealed.includes(id));
  const cost = fresh.length * COSTS.email;
  const names = fresh
    .map((id) => personById.get(id))
    .filter((person): person is NonNullable<typeof person> => Boolean(person))
    .map((person) => person.firstName);
  const who = names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
  if (fresh.length === 0) return "Those emails are already revealed.";
  return `Reveal the work ${fresh.length === 1 ? "email" : "emails"} for ${who}. ${creditLine(cost, credits)}`;
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="filter-block">
      <legend>{title}</legend>
      {options.map((option) => (
        <label key={option.value} className="check">
          <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function PersonDetail() {
  const { personId = "" } = useParams();
  const person = personById.get(personId);
  useTitle(person ? fullName(person) : "Person");
  const { state, revealEmails, revealPhone, saveNote } = useStore();
  const [spend, setSpend] = useState<"email" | "phone" | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  if (!person) {
    return (
      <div className="page">
        <h1>That person isn’t in this workspace.</h1>
        <Link to="/people">Back to people</Link>
      </div>
    );
  }

  const company = companyById.get(person.companyId);
  const emailOn = state.revealedEmails.includes(person.id);
  const phoneOn = state.revealedPhones.includes(person.id);
  const noteKey = `profile:${person.id}`;
  const note = state.notes[noteKey] ?? "";
  const linkedin = state.integrations.linkedin.connected;

  return (
    <div className="page">
      <Link className="back" to="/people">
        Back to people
      </Link>
      <header className="profile-head">
        <Avatar name={fullName(person)} size="lg" />
        <div>
          <h1>{fullName(person)}</h1>
          <p className="lede slim">
            {person.title}
            {company ? (
              <>
                {" "}
                at <Link to={`/companies/${company.id}`}>{company.name}</Link>
              </>
            ) : null}
          </p>
          <p className="muted">
            {person.city}, {person.country} · {person.department}
          </p>
          <div className="signals">
            {linkedin && person.inNetwork ? <span className="badge badge-net">In your network</span> : null}
            {person.signals.map((signal) => (
              <span key={signal} className="badge">
                {signal}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="profile-grid">
        <section className="card stack">
          <h2>How to reach {person.firstName}</h2>
          <p className="quiet">LinkedIn comes first. Email and phone stay masked until you spend credits.</p>
          <div className="channel-row">
            <div>
              <strong>LinkedIn</strong>
              <p>{linkedin ? "Connected. Open search, then send the note yourself." : "Connect LinkedIn to mark your network."}</p>
            </div>
            <a className="btn btn-linkedin btn-small" href={linkedinSearchUrl(person)} target="_blank" rel="noreferrer">
              Open LinkedIn search
            </a>
          </div>
          <div className="channel-row">
            <div>
              <strong>Work email</strong>
              <p className="mono">{emailOn ? person.email : maskEmail(person.email)}</p>
            </div>
            {emailOn ? (
              <a className="btn btn-small" href={`mailto:${person.email}`}>
                Write email
              </a>
            ) : (
              <button type="button" className="btn btn-small" onClick={() => setSpend("email")}>
                Reveal · {COSTS.email} credit
              </button>
            )}
          </div>
          <div className="channel-row">
            <div>
              <strong>Direct phone</strong>
              <p className="mono">{phoneOn ? person.phone : maskPhone(person.phone)}</p>
            </div>
            {phoneOn ? (
              <a className="btn btn-small" href={`tel:${person.phone}`}>
                Call
              </a>
            ) : (
              <button type="button" className="btn btn-small" onClick={() => setSpend("phone")}>
                Reveal · {COSTS.phone} credits
              </button>
            )}
          </div>
          <div className="site-links">
            <span className="muted">Also look them up</span>
            <a href={webSearchUrl(person)} target="_blank" rel="noreferrer">
              Web search
            </a>
            {company ? <span className="muted">Sample domain {company.domain}</span> : null}
          </div>
        </section>

        <section className="card stack">
          <h2>About</h2>
          <p>{person.about}</p>
          <div className="row">
            <button type="button" className="btn btn-small" onClick={() => setSaveOpen(true)}>
              Save to a list
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => setEnrollOpen(true)}>
              Add to sequence
            </button>
          </div>
          <h2>LinkedIn note</h2>
          <p className="quiet">Keep it under 300 characters. Harbor stores the draft here and does not post it.</p>
          <textarea
            value={note}
            onChange={(event) => saveNote(noteKey, event.target.value)}
            rows={5}
            placeholder="Write a short connection note"
          />
          <div className="spread">
            <span className={note.length > 300 ? "warn" : "muted"}>{note.length}/300</span>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => saveNote(noteKey, suggestNote(person, state.userName))}
            >
              Suggest a note
            </button>
          </div>
          {state.sequences.some((sequence) => sequence.enrollments.some((item) => item.personId === person.id)) ? (
            <p className="quiet">
              In{" "}
              {state.sequences
                .filter((sequence) => sequence.enrollments.some((item) => item.personId === person.id))
                .map((sequence) => sequence.name)
                .join(", ")}
              .
            </p>
          ) : null}
        </section>
      </div>

      {saveOpen ? <SaveDialog personIds={[person.id]} onClose={() => setSaveOpen(false)} /> : null}
      {enrollOpen ? <EnrollDialog personIds={[person.id]} onClose={() => setEnrollOpen(false)} /> : null}
      {spend === "email" ? (
        <SpendDialog
          title={`Reveal ${person.firstName}’s work email`}
          detail={creditLine(COSTS.email, state.credits)}
          confirmLabel="Reveal email"
          canConfirm={state.credits >= COSTS.email}
          onConfirm={() => revealEmails([person.id])}
          onClose={() => setSpend(null)}
        />
      ) : null}
      {spend === "phone" ? (
        <SpendDialog
          title={`Reveal ${person.firstName}’s direct phone`}
          detail={
            state.credits >= COSTS.phone
              ? creditLine(COSTS.phone, state.credits)
              : `A direct phone uses ${COSTS.phone} credits. You have ${formatCredits(state.credits)}.`
          }
          confirmLabel="Reveal phone"
          canConfirm={state.credits >= COSTS.phone}
          onConfirm={() => revealPhone(person.id)}
          onClose={() => setSpend(null)}
        />
      ) : null}
    </div>
  );
}
