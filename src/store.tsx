import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { companyById, personById } from "./data";
import {
  COSTS,
  STARTING_CREDITS,
  defaultIntegrations,
  defaultState,
  formatCredits,
  uid,
  type IntegrationId,
  type LedgerEntry,
  type Sequence,
  type SequenceStep,
  type WorkspaceState,
} from "./logic";

const STORAGE_KEY = "harbor.workspace.v1";

type Toast = { id: string; message: string };

type Store = {
  state: WorkspaceState;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  notify: (message: string) => void;
  dismissWelcome: () => void;
  connect: (id: IntegrationId) => void;
  disconnect: (id: IntegrationId) => void;
  revealEmails: (personIds: string[]) => boolean;
  revealPhone: (personId: string) => boolean;
  revealCompany: (companyId: string) => boolean;
  createList: (name: string) => string;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  saveToList: (listId: string, personIds: string[]) => void;
  removeFromList: (listId: string, personId: string) => void;
  createSequence: (name: string, steps: SequenceStep[]) => string;
  deleteSequence: (sequenceId: string) => void;
  updateSequence: (sequenceId: string, patch: Partial<Pick<Sequence, "name" | "status">>) => boolean;
  addStep: (sequenceId: string, step: Omit<SequenceStep, "id">) => void;
  updateStep: (sequenceId: string, stepId: string, patch: Partial<SequenceStep>) => void;
  removeStep: (sequenceId: string, stepId: string) => void;
  enroll: (sequenceId: string, personIds: string[]) => void;
  unenroll: (sequenceId: string, personId: string) => void;
  completeTask: (taskId: string) => void;
  reopenTask: (taskId: string) => void;
  saveNote: (key: string, note: string) => void;
  updateProfile: (patch: Partial<Pick<WorkspaceState, "userName" | "workspaceName" | "userEmail">>) => void;
  resetWorkspace: () => void;
};

const StoreContext = createContext<Store | null>(null);

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sanitize(raw: unknown): WorkspaceState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const candidate = raw as Partial<WorkspaceState>;
  const credits =
    typeof candidate.credits === "number" && Number.isFinite(candidate.credits)
      ? Math.max(0, Math.floor(candidate.credits))
      : base.credits;
  const lists = Array.isArray(candidate.lists)
    ? candidate.lists
        .filter((list) => list && typeof list === "object")
        .map((list) => ({
          id: typeof list.id === "string" ? list.id : uid("list"),
          name: typeof list.name === "string" && list.name.trim() ? list.name : "Untitled list",
          personIds: asStrings(list.personIds),
        }))
    : [];
  if (!lists.some((list) => list.id === "starred")) {
    lists.unshift({ id: "starred", name: "Starred", personIds: [] });
  }
  return {
    ...base,
    credits,
    userName: typeof candidate.userName === "string" && candidate.userName.trim() ? candidate.userName : base.userName,
    workspaceName:
      typeof candidate.workspaceName === "string" && candidate.workspaceName.trim()
        ? candidate.workspaceName
        : base.workspaceName,
    userEmail: typeof candidate.userEmail === "string" && candidate.userEmail.trim() ? candidate.userEmail : base.userEmail,
    revealedEmails: asStrings(candidate.revealedEmails),
    revealedPhones: asStrings(candidate.revealedPhones),
    revealedCompanies: asStrings(candidate.revealedCompanies),
    lists,
    sequences: Array.isArray(candidate.sequences) ? candidate.sequences : [],
    completedTasks: asStrings(candidate.completedTasks),
    integrations: { ...defaultIntegrations(), ...(candidate.integrations ?? {}) },
    ledger: Array.isArray(candidate.ledger) ? candidate.ledger : [],
    notes: candidate.notes && typeof candidate.notes === "object" ? candidate.notes : {},
    dismissedWelcome: Boolean(candidate.dismissedWelcome),
  };
}

function loadState(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function personLabel(personId: string): string {
  const person = personById.get(personId);
  return person ? `${person.firstName} ${person.lastName}` : "contact";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(loadState);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const notify = (message: string) => {
    const id = uid("toast");
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3800);
  };

  const dismissToast = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id));

  const store: Store = {
    state,
    toasts,
    dismissToast,
    notify,
    dismissWelcome: () => setState((current) => ({ ...current, dismissedWelcome: true })),
    connect: (id) => {
      setState((current) => ({
        ...current,
        integrations: {
          ...current.integrations,
          [id]: { connected: true, connectedAt: new Date().toISOString() },
        },
      }));
      notify(id === "linkedin" ? "LinkedIn connected. People in your sample network are marked." : "Connected. Harbor never stores the provider password.");
    },
    disconnect: (id) => {
      setState((current) => ({
        ...current,
        integrations: { ...current.integrations, [id]: { connected: false } },
      }));
      notify("Disconnected.");
    },
    revealEmails: (personIds) => {
      const fresh = personIds.filter((id) => !state.revealedEmails.includes(id));
      if (fresh.length === 0) {
        notify("Those work emails are already on the record.");
        return true;
      }
      const cost = fresh.length * COSTS.email;
      if (state.credits < cost) {
        notify(`That uses ${formatCredits(cost)} credits, and ${formatCredits(state.credits)} are left.`);
        return false;
      }
      const entries: LedgerEntry[] = fresh.map((personId) => ({
        id: uid("led"),
        type: "email",
        cost: COSTS.email,
        at: new Date().toISOString(),
        label: `Work email · ${personLabel(personId)}`,
        personId,
      }));
      setState((current) => {
        const pending = personIds.filter((id) => !current.revealedEmails.includes(id));
        const pendingCost = pending.length * COSTS.email;
        if (pending.length === 0 || current.credits < pendingCost) return current;
        return {
          ...current,
          credits: current.credits - pendingCost,
          revealedEmails: [...new Set([...current.revealedEmails, ...pending])],
          ledger: [...entries.filter((entry) => entry.personId && pending.includes(entry.personId)), ...current.ledger].slice(0, 300),
        };
      });
      const left = state.credits - cost;
      notify(
        fresh.length === 1
          ? `Work email revealed. ${formatCredits(left)} credits left.`
          : `${fresh.length} work emails revealed. ${formatCredits(left)} credits left.`,
      );
      return true;
    },
    revealPhone: (personId) => {
      if (state.revealedPhones.includes(personId)) return true;
      if (state.credits < COSTS.phone) {
        notify(`A direct phone uses ${COSTS.phone} credits. ${formatCredits(state.credits)} are left.`);
        return false;
      }
      setState((current) => {
        if (current.revealedPhones.includes(personId) || current.credits < COSTS.phone) return current;
        return {
          ...current,
          credits: current.credits - COSTS.phone,
          revealedPhones: [...current.revealedPhones, personId],
          ledger: [
            {
              id: uid("led"),
              type: "phone" as const,
              cost: COSTS.phone,
              at: new Date().toISOString(),
              label: `Direct phone · ${personLabel(personId)}`,
              personId,
            },
            ...current.ledger,
          ].slice(0, 300),
        };
      });
      notify(`Direct phone revealed. ${formatCredits(state.credits - COSTS.phone)} credits left.`);
      return true;
    },
    revealCompany: (companyId) => {
      if (state.revealedCompanies.includes(companyId)) return true;
      if (state.credits < COSTS.company) {
        notify(`Company details use ${COSTS.company} credits. ${formatCredits(state.credits)} are left.`);
        return false;
      }
      setState((current) => {
        if (current.revealedCompanies.includes(companyId) || current.credits < COSTS.company) return current;
        return {
          ...current,
          credits: current.credits - COSTS.company,
          revealedCompanies: [...current.revealedCompanies, companyId],
          ledger: [
            {
              id: uid("led"),
              type: "company" as const,
              cost: COSTS.company,
              at: new Date().toISOString(),
              label: `Company details · ${companyById.get(companyId)?.name ?? "Company"}`,
              companyId,
            },
            ...current.ledger,
          ].slice(0, 300),
        };
      });
      notify(`Company details revealed. ${formatCredits(state.credits - COSTS.company)} credits left.`);
      return true;
    },
    createList: (name) => {
      const id = uid("list");
      const trimmed = name.trim() || "Untitled list";
      setState((current) => ({
        ...current,
        lists: [...current.lists, { id, name: trimmed, personIds: [] }],
      }));
      notify(`Created “${trimmed}”.`);
      return id;
    },
    renameList: (listId, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setState((current) => ({
        ...current,
        lists: current.lists.map((list) => (list.id === listId ? { ...list, name: trimmed } : list)),
      }));
    },
    deleteList: (listId) => {
      if (listId === "starred") {
        notify("Starred stays. Remove people from it instead.");
        return;
      }
      setState((current) => ({ ...current, lists: current.lists.filter((list) => list.id !== listId) }));
      notify("List deleted.");
    },
    saveToList: (listId, personIds) => {
      const list = state.lists.find((item) => item.id === listId);
      setState((current) => ({
        ...current,
        lists: current.lists.map((item) =>
          item.id === listId ? { ...item, personIds: [...new Set([...item.personIds, ...personIds])] } : item,
        ),
      }));
      notify(
        personIds.length === 1
          ? `Saved to ${list?.name ?? "the list"}.`
          : `Saved ${personIds.length} people to ${list?.name ?? "the list"}.`,
      );
    },
    removeFromList: (listId, personId) => {
      setState((current) => ({
        ...current,
        lists: current.lists.map((list) =>
          list.id === listId ? { ...list, personIds: list.personIds.filter((id) => id !== personId) } : list,
        ),
      }));
    },
    createSequence: (name, steps) => {
      const id = uid("seq");
      const sequence: Sequence = {
        id,
        name: name.trim() || "Untitled sequence",
        status: "draft",
        steps,
        enrollments: [],
      };
      setState((current) => ({ ...current, sequences: [sequence, ...current.sequences] }));
      notify("Draft saved. Nothing is scheduled until you turn the sequence on.");
      return id;
    },
    deleteSequence: (sequenceId) => {
      setState((current) => ({
        ...current,
        sequences: current.sequences.filter((sequence) => sequence.id !== sequenceId),
        completedTasks: current.completedTasks.filter((id) => !id.startsWith(`${sequenceId}:`)),
      }));
      notify("Sequence deleted.");
    },
    updateSequence: (sequenceId, patch) => {
      const sequence = state.sequences.find((item) => item.id === sequenceId);
      if (!sequence) return false;
      if (patch.status === "active" && sequence.steps.length === 0) {
        notify("Add a step before turning this on.");
        return false;
      }
      setState((current) => ({
        ...current,
        sequences: current.sequences.map((item) => (item.id === sequenceId ? { ...item, ...patch } : item)),
      }));
      if (patch.status === "active") notify("Sequence is on. Tasks are ready for you to send.");
      if (patch.status === "draft") notify("Sequence paused. Open tasks are hidden until you turn it on again.");
      return true;
    },
    addStep: (sequenceId, step) => {
      setState((current) => ({
        ...current,
        sequences: current.sequences.map((sequence) =>
          sequence.id === sequenceId ? { ...sequence, steps: [...sequence.steps, { ...step, id: uid("step") }] } : sequence,
        ),
      }));
    },
    updateStep: (sequenceId, stepId, patch) => {
      setState((current) => ({
        ...current,
        sequences: current.sequences.map((sequence) =>
          sequence.id === sequenceId
            ? { ...sequence, steps: sequence.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)) }
            : sequence,
        ),
      }));
    },
    removeStep: (sequenceId, stepId) => {
      setState((current) => ({
        ...current,
        sequences: current.sequences.map((sequence) =>
          sequence.id === sequenceId
            ? { ...sequence, steps: sequence.steps.filter((step) => step.id !== stepId) }
            : sequence,
        ),
      }));
    },
    enroll: (sequenceId, personIds) => {
      const sequence = state.sequences.find((item) => item.id === sequenceId);
      const existing = new Set(sequence?.enrollments.map((item) => item.personId) ?? []);
      const additions = personIds.filter((id) => !existing.has(id));
      if (additions.length === 0) {
        notify("Those people are already in this sequence.");
        return;
      }
      setState((current) => ({
        ...current,
        sequences: current.sequences.map((item) => {
          if (item.id !== sequenceId) return item;
          const known = new Set(item.enrollments.map((enrollment) => enrollment.personId));
          const next = personIds
            .filter((id) => !known.has(id))
            .map((personId) => ({ personId, startedAt: new Date().toISOString() }));
          return { ...item, enrollments: [...item.enrollments, ...next] };
        }),
      }));
      notify(additions.length === 1 ? `Added to ${sequence?.name ?? "the sequence"}.` : `Added ${additions.length} people.`);
    },
    unenroll: (sequenceId, personId) => {
      setState((current) => ({
        ...current,
        sequences: current.sequences.map((sequence) =>
          sequence.id === sequenceId
            ? { ...sequence, enrollments: sequence.enrollments.filter((item) => item.personId !== personId) }
            : sequence,
        ),
        completedTasks: current.completedTasks.filter((id) => !id.startsWith(`${sequenceId}:${personId}:`)),
      }));
    },
    completeTask: (taskId) => {
      if (state.completedTasks.includes(taskId)) return;
      setState((current) =>
        current.completedTasks.includes(taskId) ? current : { ...current, completedTasks: [...current.completedTasks, taskId] },
      );
      notify("Marked done. You still send the LinkedIn note or email yourself.");
    },
    reopenTask: (taskId) => {
      setState((current) => ({ ...current, completedTasks: current.completedTasks.filter((id) => id !== taskId) }));
    },
    saveNote: (key, note) => {
      setState((current) => ({ ...current, notes: { ...current.notes, [key]: note } }));
    },
    updateProfile: (patch) => setState((current) => ({ ...current, ...patch })),
    resetWorkspace: () => {
      const next = defaultState();
      next.dismissedWelcome = true;
      setState(next);
      notify(`${formatCredits(STARTING_CREDITS)} starter credits are restored.`);
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
