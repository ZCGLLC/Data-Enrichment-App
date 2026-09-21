import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PersonCard, SaveDialog, SpendDialog, creditLine, useTitle } from "../components";
import { companies, companyById, people, uniqueSorted } from "../data";
import {
  COSTS,
  companySizeBucket,
  filterCompanies,
  formatCredits,
  peopleAtCompany,
  sizeOptions,
} from "../logic";
import { useStore } from "../store";

export function Companies() {
  useTitle("Companies");
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const industries = uniqueSorted(companies.map((company) => company.industry));
  const results = filterCompanies(q, industry, size);

  return (
    <div className="page">
      <p className="eyebrow">Companies</p>
      <h1>See the account before you pick a person.</h1>
      <p className="lede">
        Industry and size are free. Funding and the technology stack cost {COSTS.company} credits when you want them.
      </p>
      <div className="toolbar">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search companies" aria-label="Search companies" />
        <select value={industry} onChange={(event) => setIndustry(event.target.value)} aria-label="Industry">
          <option value="">All industries</option>
          {industries.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={size} onChange={(event) => setSize(event.target.value)} aria-label="Company size">
          <option value="">Any size</option>
          {sizeOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="grid-cards">
        {results.map((company) => (
          <Link key={company.id} className="card company-card" to={`/companies/${company.id}`}>
            <span className="eyebrow">{company.industry}</span>
            <h2>{company.name}</h2>
            <p>{company.summary}</p>
            <p className="muted">
              {company.city}, {company.country} · {company.employees.toLocaleString("en-US")} people ·{" "}
              {people.filter((person) => person.companyId === company.id).length} in Harbor
            </p>
          </Link>
        ))}
      </div>
      {results.length === 0 ? <p className="empty">No companies match. Clear a filter and try again.</p> : null}
    </div>
  );
}

export function CompanyDetail() {
  const { companyId = "" } = useParams();
  const company = companyById.get(companyId);
  useTitle(company?.name ?? "Company");
  const { state, revealCompany, revealEmails } = useStore();
  const [saveIds, setSaveIds] = useState<string[] | null>(null);
  const [spendIds, setSpendIds] = useState<string[] | null>(null);
  const [confirmCompany, setConfirmCompany] = useState(false);

  if (!company) {
    return (
      <div className="page">
        <h1>That company isn’t in this workspace.</h1>
        <Link to="/companies">Back to companies</Link>
      </div>
    );
  }

  const revealed = state.revealedCompanies.includes(company.id);
  const staff = peopleAtCompany(company.id);

  return (
    <div className="page">
      <Link className="back" to="/companies">
        Back to companies
      </Link>
      <p className="eyebrow">{company.industry}</p>
      <h1>{company.name}</h1>
      <p className="lede slim">{company.summary}</p>
      <div className="stat-row">
        <div className="stat">
          <span>People</span>
          <strong>{company.employees.toLocaleString("en-US")}</strong>
        </div>
        <div className="stat">
          <span>Where</span>
          <strong>
            {company.city}
          </strong>
        </div>
        <div className="stat">
          <span>In Harbor</span>
          <strong>{staff.length}</strong>
        </div>
      </div>
      <section className="card stack">
        <div className="spread">
          <h2>Details</h2>
          {revealed ? (
            <span className="badge">Revealed</span>
          ) : (
            <button type="button" className="btn btn-small" onClick={() => setConfirmCompany(true)}>
              Reveal · {COSTS.company} credits
            </button>
          )}
        </div>
        <dl className="kv">
          <div>
            <dt>Domain</dt>
            <dd>{company.domain}</dd>
          </div>
          <div>
            <dt>Size band</dt>
            <dd>{companySizeBucket(company.employees)}</dd>
          </div>
          <div>
            <dt>Funding</dt>
            <dd>{revealed ? company.funding : "Hidden"}</dd>
          </div>
          <div>
            <dt>Technology</dt>
            <dd>{revealed ? company.technologies.join(", ") : "Hidden"}</dd>
          </div>
        </dl>
      </section>
      <section>
        <h2>People here</h2>
        <div className="person-list">
          {staff.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onSave={() => setSaveIds([person.id])}
              onReveal={() => setSpendIds([person.id])}
            />
          ))}
        </div>
      </section>
      {saveIds ? <SaveDialog personIds={saveIds} onClose={() => setSaveIds(null)} /> : null}
      {spendIds ? (
        <SpendDialog
          title="Reveal work email"
          detail={creditLine(COSTS.email, state.credits)}
          confirmLabel="Reveal email"
          canConfirm={state.credits >= COSTS.email && !state.revealedEmails.includes(spendIds[0] ?? "")}
          onConfirm={() => revealEmails(spendIds)}
          onClose={() => setSpendIds(null)}
        />
      ) : null}
      {confirmCompany ? (
        <SpendDialog
          title={`Reveal details for ${company.name}`}
          detail={
            state.credits >= COSTS.company
              ? creditLine(COSTS.company, state.credits)
              : `This uses ${COSTS.company} credits. You have ${formatCredits(state.credits)}.`
          }
          confirmLabel="Reveal details"
          canConfirm={state.credits >= COSTS.company}
          onConfirm={() => revealCompany(company.id)}
          onClose={() => setConfirmCompany(false)}
        />
      ) : null}
    </div>
  );
}
