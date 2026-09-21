import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTitle } from "../components";
import { fullName, personById } from "../data";
import { callFirstSteps, channelLabel, savedIds, warmIntroSteps, type Channel } from "../logic";
import { useStore } from "../store";

export function Sequences() {
  useTitle("Sequences");
  const { state, createSequence } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const start = (label: string, steps: ReturnType<typeof warmIntroSteps>) => {
    const id = createSequence(label, steps);
    navigate(`/sequences/${id}`);
  };

  return (
    <div className="page">
      <p className="eyebrow">Sequences</p>
      <h1>A short plan, with LinkedIn on day one.</h1>
      <p className="lede">
        Sequences stay drafts until you turn them on. Harbor schedules the tasks. You still send each note and email yourself.
      </p>
      <div className="grid-cards">
        <button type="button" className="card template" onClick={() => start("Warm intro", warmIntroSteps())}>
          <span className="eyebrow">Recommended</span>
          <h2>Warm intro</h2>
          <p>LinkedIn note today, an email on day 3, and a short close on day 7.</p>
        </button>
        <button type="button" className="card template" onClick={() => start("Call, then connect", callFirstSteps())}>
          <span className="eyebrow">Template</span>
          <h2>Call, then connect</h2>
          <p>A call task today and a LinkedIn note tomorrow if you don’t reach them.</p>
        </button>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          start(name.trim() || "Untitled sequence", []);
          setName("");
        }}
      >
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name a blank sequence" aria-label="Sequence name" />
        <button type="submit" className="btn btn-ghost">
          Start blank
        </button>
      </form>
      <div className="stack">
        {state.sequences.length === 0 ? <p className="empty">No sequences yet. The warm intro is the easiest place to begin.</p> : null}
        {state.sequences.map((sequence) => (
          <Link key={sequence.id} className="card spread sequence-row" to={`/sequences/${sequence.id}`}>
            <div>
              <h2>{sequence.name}</h2>
              <p className="muted">
                {sequence.status === "active" ? "On" : "Draft"} · {sequence.steps.length} steps · {sequence.enrollments.length}{" "}
                enrolled
              </p>
            </div>
            <span>Open</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SequenceDetail() {
  const { sequenceId = "" } = useParams();
  const { state, updateSequence, deleteSequence, addStep, updateStep, removeStep, enroll, unenroll } = useStore();
  const sequence = state.sequences.find((item) => item.id === sequenceId);
  useTitle(sequence?.name ?? "Sequence");
  const [channel, setChannel] = useState<Channel>("linkedin");
  const [day, setDay] = useState(0);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [personId, setPersonId] = useState("");
  const navigate = useNavigate();

  if (!sequence) {
    return (
      <div className="page">
        <h1>That sequence is gone.</h1>
        <Link to="/sequences">Back to sequences</Link>
      </div>
    );
  }

  const saved = savedIds(state.lists)
    .map((id) => personById.get(id))
    .filter((person) => person !== undefined);

  return (
    <div className="page">
      <Link className="back" to="/sequences">
        Back to sequences
      </Link>
      <div className="spread head-gap">
        <input
          className="title-input"
          aria-label="Sequence name"
          value={sequence.name}
          onChange={(event) => updateSequence(sequence.id, { name: event.target.value })}
        />
        <div className="row">
          {sequence.status === "active" ? (
            <button type="button" className="btn btn-ghost" onClick={() => updateSequence(sequence.id, { status: "draft" })}>
              Pause
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => updateSequence(sequence.id, { status: "active" })}>
              Turn on
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              deleteSequence(sequence.id);
              navigate("/sequences");
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <p className="quiet">
        {sequence.status === "active"
          ? "This sequence is on. Tasks show up for everyone enrolled. Harbor will not send them."
          : "This is a draft. Add steps, enroll people, then turn it on when the wording feels right."}
      </p>
      <p className="quiet">Tokens: {"{{firstName}}"}, {"{{company}}"}, {"{{title}}"}, {"{{sender}}"}.</p>

      <section className="stack">
        <h2>Steps</h2>
        {sequence.steps.length === 0 ? <p className="empty">No steps yet. LinkedIn on day 0 is a good default.</p> : null}
        {sequence.steps
          .slice()
          .sort((a, b) => a.day - b.day)
          .map((step) => (
            <article key={step.id} className="card stack step">
              <div className="spread">
                <strong>
                  Day {step.day} · {channelLabel(step.channel)}
                </strong>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => removeStep(sequence.id, step.id)}>
                  Remove
                </button>
              </div>
              <div className="toolbar">
                <label className="field grow">
                  <span>Channel</span>
                  <select
                    value={step.channel}
                    onChange={(event) => updateStep(sequence.id, step.id, { channel: event.target.value as Channel })}
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="email">Email</option>
                    <option value="call">Call</option>
                  </select>
                </label>
                <label className="field">
                  <span>Day</span>
                  <input
                    type="number"
                    min={0}
                    value={step.day}
                    onChange={(event) => updateStep(sequence.id, step.id, { day: Math.max(0, Number(event.target.value) || 0) })}
                  />
                </label>
              </div>
              {step.channel === "email" ? (
                <label className="field">
                  <span>Subject</span>
                  <input value={step.subject} onChange={(event) => updateStep(sequence.id, step.id, { subject: event.target.value })} />
                </label>
              ) : null}
              <label className="field">
                <span>What you’ll send</span>
                <textarea rows={4} value={step.body} onChange={(event) => updateStep(sequence.id, step.id, { body: event.target.value })} />
              </label>
            </article>
          ))}
        <form
          className="card stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            addStep(sequence.id, { channel, day, subject: channel === "email" ? subject : "", body });
            setBody("");
            setSubject("");
          }}
        >
          <h2>Add a step</h2>
          <div className="toolbar">
            <label className="field grow">
              <span>Channel</span>
              <select value={channel} onChange={(event) => setChannel(event.target.value as Channel)}>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="call">Call</option>
              </select>
            </label>
            <label className="field">
              <span>Day</span>
              <input type="number" min={0} value={day} onChange={(event) => setDay(Math.max(0, Number(event.target.value) || 0))} />
            </label>
          </div>
          {channel === "email" ? (
            <label className="field">
              <span>Subject</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>
          ) : null}
          <label className="field">
            <span>Note</span>
            <textarea rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Hi {{firstName}} — " />
          </label>
          <button type="submit" className="btn btn-primary">
            Add step
          </button>
        </form>
      </section>

      <section className="stack">
        <h2>People</h2>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!personId) return;
            enroll(sequence.id, [personId]);
            setPersonId("");
          }}
        >
          <select value={personId} onChange={(event) => setPersonId(event.target.value)} aria-label="Person to enroll">
            <option value="">Choose someone you’ve saved</option>
            {saved.map((person) => (
              <option key={person.id} value={person.id}>
                {fullName(person)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-ghost" disabled={!personId}>
            Enroll
          </button>
          <Link className="btn btn-ghost" to="/people">
            Browse people
          </Link>
        </form>
        {saved.length === 0 ? <p className="quiet">Save someone from People first, then enroll them here.</p> : null}
        {sequence.enrollments.length === 0 ? <p className="empty">Nobody is enrolled yet.</p> : null}
        <ul className="simple-list">
          {sequence.enrollments.map((enrollment) => {
            const person = personById.get(enrollment.personId);
            if (!person) return null;
            return (
              <li key={enrollment.personId}>
                <Link to={`/people/${person.id}`}>{fullName(person)}</Link>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => unenroll(sequence.id, person.id)}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
