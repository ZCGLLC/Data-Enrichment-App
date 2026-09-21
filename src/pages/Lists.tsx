import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PersonCard, SaveDialog, SpendDialog, creditLine, useTitle } from "../components";
import { fullName, personById } from "../data";
import { COSTS } from "../logic";
import { useStore } from "../store";

export function Lists() {
  useTitle("Lists");
  const { state, createList } = useStore();
  const [name, setName] = useState("");

  return (
    <div className="page">
      <p className="eyebrow">Lists</p>
      <h1>Keep the people you mean to talk to.</h1>
      <p className="lede">Saving is free. Starred is always here, and you can make a list for each motion.</p>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          createList(name);
          setName("");
        }}
      >
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="New list name" aria-label="New list name" />
        <button type="submit" className="btn btn-primary">
          Create list
        </button>
      </form>
      <div className="grid-cards">
        {state.lists.map((list) => (
          <Link key={list.id} className="card company-card" to={`/lists/${list.id}`}>
            <span className="eyebrow">{list.id === "starred" ? "Default" : "List"}</span>
            <h2>{list.name}</h2>
            <p className="muted">
              {list.personIds.length} {list.personIds.length === 1 ? "person" : "people"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ListDetail() {
  const { listId = "" } = useParams();
  const { state, renameList, deleteList, removeFromList, revealEmails } = useStore();
  const navigate = useNavigate();
  const list = state.lists.find((item) => item.id === listId);
  useTitle(list?.name ?? "List");
  const [saveIds, setSaveIds] = useState<string[] | null>(null);
  const [spendIds, setSpendIds] = useState<string[] | null>(null);

  if (!list) {
    return (
      <div className="page">
        <h1>That list is gone.</h1>
        <Link to="/lists">Back to lists</Link>
      </div>
    );
  }

  const members = list.personIds.map((id) => personById.get(id)).filter((person) => person !== undefined);

  return (
    <div className="page">
      <Link className="back" to="/lists">
        Back to lists
      </Link>
      <div className="spread head-gap">
        <input
          className="title-input"
          aria-label="List name"
          value={list.name}
          onChange={(event) => renameList(list.id, event.target.value)}
        />
        {list.id === "starred" ? null : (
          <button
            type="button"
            className="btn btn-danger btn-small"
            onClick={() => {
              deleteList(list.id);
              navigate("/lists");
            }}
          >
            Delete list
          </button>
        )}
      </div>
      {members.length === 0 ? (
        <p className="empty card">
          This list is empty. <Link to="/people">Find people</Link> and save them here.
        </p>
      ) : (
        <div className="person-list">
          {members.map((person) => (
            <div key={person.id} className="list-person">
              <PersonCard person={person} onSave={() => setSaveIds([person.id])} onReveal={() => setSpendIds([person.id])} />
              <button type="button" className="btn btn-ghost btn-small" onClick={() => removeFromList(list.id, person.id)}>
                Remove {fullName(person).split(" ")[0]}
              </button>
            </div>
          ))}
        </div>
      )}
      {saveIds ? <SaveDialog personIds={saveIds} onClose={() => setSaveIds(null)} /> : null}
      {spendIds ? (
        <SpendDialog
          title="Reveal work email"
          detail={creditLine(COSTS.email, state.credits)}
          confirmLabel="Reveal email"
          canConfirm={state.credits >= COSTS.email}
          onConfirm={() => revealEmails(spendIds)}
          onClose={() => setSpendIds(null)}
        />
      ) : null}
    </div>
  );
}
