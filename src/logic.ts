import {
  companies,
  companyById,
  people,
  personById,
  seniorityOrder,
  type Company,
  type Person,
  type Seniority,
} from "./data";

export const STARTING_CREDITS = 10000;

export const COSTS = {
  email: 1,
  phone: 5,
  company: 2,
} as const;

export type Channel = "linkedin" | "email" | "call";

export type IntegrationId =
  | "linkedin"
  | "gmail"
  | "outlook"
  | "gcal"
  | "salesforce"
  | "hubspot"
  | "slack";

export type PeopleQuery = {
  q: string;
  seniorities: Seniority[];
  cities: string[];
  industries: string[];
  departments: string[];
  sizes: string[];
  networkOnly: boolean;
};

export type SequenceStep = {
  id: string;
  channel: Channel;
  day: number;
  subject: string;
  body: string;
};

export type Sequence = {
  id: string;
  name: string;
  status: "draft" | "active";
  steps: SequenceStep[];
  enrollments: { personId: string; startedAt: string }[];
};

export type ListRecord = {
  id: string;
  name: string;
  personIds: string[];
};

export type LedgerEntry = {
  id: string;
  type: "email" | "phone" | "company";
  cost: number;
  at: string;
  label: string;
  personId?: string;
  companyId?: string;
};

export type IntegrationState = {
  connected: boolean;
  connectedAt?: string;
};

export type WorkspaceState = {
  credits: number;
  userName: string;
  workspaceName: string;
  userEmail: string;
  revealedEmails: string[];
  revealedPhones: string[];
  revealedCompanies: string[];
  lists: ListRecord[];
  sequences: Sequence[];
  completedTasks: string[];
  integrations: Record<IntegrationId, IntegrationState>;
  ledger: LedgerEntry[];
  notes: Record<string, string>;
  dismissedWelcome: boolean;
};

export const integrationCatalog: {
  id: IntegrationId;
  name: string;
  group: string;
  blurb: string;
  priority?: boolean;
}[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    group: "Social",
    priority: true,
    blurb: "See who is already in your network, draft a connection note, and open a LinkedIn search for each person.",
  },
  {
    id: "gmail",
    name: "Gmail",
    group: "Email",
    blurb: "Send sequence email from your own inbox. Harbor keeps the draft; you decide when it goes out.",
  },
  {
    id: "outlook",
    name: "Outlook",
    group: "Email",
    blurb: "Use an Outlook mailbox for the same email steps if Gmail is not your work inbox.",
  },
  {
    id: "gcal",
    name: "Google Calendar",
    group: "Calendar",
    blurb: "Turn a positive reply into a hold on your calendar.",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    group: "CRM",
    blurb: "Keep saved people aligned with the accounts your team already works.",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    group: "CRM",
    blurb: "Push a saved list into HubSpot when you are ready to report on it.",
  },
  {
    id: "slack",
    name: "Slack",
    group: "Team",
    blurb: "Get a quiet note when a task is due or a teammate saves someone new.",
  },
];

export function defaultIntegrations(): Record<IntegrationId, IntegrationState> {
  return {
    linkedin: { connected: false },
    gmail: { connected: false },
    outlook: { connected: false },
    gcal: { connected: false },
    salesforce: { connected: false },
    hubspot: { connected: false },
    slack: { connected: false },
  };
}

export function defaultState(): WorkspaceState {
  return {
    credits: STARTING_CREDITS,
    userName: "Alex Morgan",
    workspaceName: "Alex's workspace",
    userEmail: "alex@harbor.demo",
    revealedEmails: [],
    revealedPhones: [],
    revealedCompanies: [],
    lists: [{ id: "starred", name: "Starred", personIds: [] }],
    sequences: [],
    completedTasks: [],
    integrations: defaultIntegrations(),
    ledger: [],
    notes: {},
    dismissedWelcome: false,
  };
}

export function emptyQuery(): PeopleQuery {
  return {
    q: "",
    seniorities: [],
    cities: [],
    industries: [],
    departments: [],
    sizes: [],
    networkOnly: false,
  };
}

export function companySizeBucket(employees: number): string {
  if (employees <= 50) return "1–50";
  if (employees <= 200) return "51–200";
  if (employees <= 1000) return "201–1,000";
  return "1,000+";
}

export const sizeOptions = ["1–50", "51–200", "201–1,000", "1,000+"];

export function formatCredits(value: number): string {
  return value.toLocaleString("en-US");
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function filterPeople(query: PeopleQuery, source: Person[] = people): Person[] {
  const words = query.q
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);

  const matched = source.filter((person) => {
    const company = companyById.get(person.companyId);
    if (!company) return false;
    if (query.seniorities.length > 0 && !query.seniorities.includes(person.seniority)) return false;
    if (query.cities.length > 0 && !query.cities.includes(person.city)) return false;
    if (query.industries.length > 0 && !query.industries.includes(company.industry)) return false;
    if (query.departments.length > 0 && !query.departments.includes(person.department)) return false;
    if (query.networkOnly && !person.inNetwork) return false;
    if (query.sizes.length > 0 && !query.sizes.includes(companySizeBucket(company.employees))) return false;
    if (words.length > 0) {
      const hay = [
        person.firstName,
        person.lastName,
        person.title,
        person.department,
        person.city,
        person.country,
        person.signals.join(" "),
        company.name,
        company.industry,
      ]
        .join(" ")
        .toLowerCase();
      if (!words.every((word) => hay.includes(word))) return false;
    }
    return true;
  });

  return matched.sort((a, b) => scorePerson(b, query) - scorePerson(a, query));
}

function scorePerson(person: Person, query: PeopleQuery): number {
  const company = companyById.get(person.companyId);
  let score = 100 - seniorityOrder.indexOf(person.seniority) * 8;
  if (person.inNetwork) score += 20;
  const q = query.q.toLowerCase();
  if (q && `${person.firstName} ${person.lastName}`.toLowerCase().includes(q)) score += 30;
  if (q && company && company.name.toLowerCase().includes(q)) score += 12;
  return score;
}

export function filterCompanies(q: string, industry: string, size: string): Company[] {
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 1);
  return companies
    .filter((company) => {
      if (industry && company.industry !== industry) return false;
      if (size && companySizeBucket(company.employees) !== size) return false;
      if (words.length === 0) return true;
      const hay = `${company.name} ${company.industry} ${company.city} ${company.summary}`.toLowerCase();
      return words.every((word) => hay.includes(word));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function peopleAtCompany(companyId: string): Person[] {
  return people
    .filter((person) => person.companyId === companyId)
    .sort((a, b) => seniorityOrder.indexOf(a.seniority) - seniorityOrder.indexOf(b.seniority));
}

export function fillTemplate(text: string, person: Person, sender: string): string {
  const company = companyById.get(person.companyId);
  return text
    .replaceAll("{{firstName}}", person.firstName)
    .replaceAll("{{lastName}}", person.lastName)
    .replaceAll("{{fullName}}", `${person.firstName} ${person.lastName}`)
    .replaceAll("{{title}}", person.title)
    .replaceAll("{{company}}", company?.name ?? "the company")
    .replaceAll("{{sender}}", sender);
}

export function warmIntroSteps(): SequenceStep[] {
  return [
    {
      id: uid("step"),
      channel: "linkedin",
      day: 0,
      subject: "",
      body: "Hi {{firstName}} — I came across your work as {{title}} at {{company}}. I would value connecting here first.",
    },
    {
      id: uid("step"),
      channel: "email",
      day: 3,
      subject: "A short note for {{company}}",
      body: "Hi {{firstName}},\n\nI sent a connection note on LinkedIn in case that is the easier place to say hello. Sharing the same thought here.\n\nWould 15 minutes next week be useful?\n\n{{sender}}",
    },
    {
      id: uid("step"),
      channel: "email",
      day: 7,
      subject: "Should I close the loop?",
      body: "Hi {{firstName}},\n\nI will assume the timing is off if I do not hear back. Happy to reconnect later.\n\n{{sender}}",
    },
  ];
}

export function callFirstSteps(): SequenceStep[] {
  return [
    {
      id: uid("step"),
      channel: "call",
      day: 0,
      subject: "",
      body: "Call {{firstName}} ({{title}}, {{company}}). Goal: ask for a 15-minute intro, then stop.",
    },
    {
      id: uid("step"),
      channel: "linkedin",
      day: 1,
      subject: "",
      body: "Hi {{firstName}} — I tried you briefly today. Connecting here so the note is easy to find.",
    },
  ];
}

export type TaskView = {
  id: string;
  sequenceId: string;
  sequenceName: string;
  personId: string;
  stepId: string;
  channel: Channel;
  day: number;
  due: string;
  bucket: "overdue" | "today" | "upcoming";
  done: boolean;
  subject: string;
  body: string;
};

function dayStart(value: string | Date): number {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function shiftDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

export function dueLabel(iso: string, now = new Date()): string {
  const diff = Math.round((dayStart(iso) - dayStart(now)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff < 7) return `In ${diff} days`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function buildTasks(sequences: Sequence[], completed: string[], now = new Date()): TaskView[] {
  const done = new Set(completed);
  const today = dayStart(now);
  const tasks: TaskView[] = [];
  for (const sequence of sequences) {
    if (sequence.status !== "active") continue;
    for (const enrollment of sequence.enrollments) {
      for (const step of sequence.steps) {
        const due = shiftDays(enrollment.startedAt, step.day);
        const dueDay = dayStart(due);
        const bucket = dueDay < today ? "overdue" : dueDay === today ? "today" : "upcoming";
        const id = `${sequence.id}:${enrollment.personId}:${step.id}`;
        tasks.push({
          id,
          sequenceId: sequence.id,
          sequenceName: sequence.name,
          personId: enrollment.personId,
          stepId: step.id,
          channel: step.channel,
          day: step.day,
          due,
          bucket,
          done: done.has(id),
          subject: step.subject,
          body: step.body,
        });
      }
    }
  }
  return tasks.sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
}

export function savedIds(lists: ListRecord[]): string[] {
  return [...new Set(lists.flatMap((list) => list.personIds))];
}

export function linkedinSearchUrl(person: Person): string {
  const company = companyById.get(person.companyId);
  const keywords = `${person.firstName} ${person.lastName} ${company?.name ?? ""}`.trim();
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

export function webSearchUrl(person: Person): string {
  const company = companyById.get(person.companyId);
  return `https://www.google.com/search?q=${encodeURIComponent(`${person.firstName} ${person.lastName} ${company?.name ?? ""}`)}`;
}

export function suggestNote(person: Person, sender: string): string {
  const company = companyById.get(person.companyId);
  const topic = person.signals.find((signal) => !/network/i.test(signal))?.toLowerCase();
  const first = sender.split(" ")[0] || sender;
  const companyName = company?.name ?? "your company";
  if (!topic) {
    return `Hi ${person.firstName} — I'm ${first}. I came across your work as ${person.title} at ${companyName}. Open to connecting?`;
  }
  return `Hi ${person.firstName} — I noticed ${topic} around your role as ${person.title} at ${companyName}. I'm ${first}. Open to connecting?`;
}

export function lookupPerson(id: string): Person | undefined {
  return personById.get(id);
}

export function channelLabel(channel: Channel): string {
  if (channel === "linkedin") return "LinkedIn";
  if (channel === "email") return "Email";
  return "Call";
}

export function unrevealedCost(ids: string[], revealed: string[], cost: number): number {
  return ids.filter((id) => !revealed.includes(id)).length * cost;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "Hidden";
  return `${local.slice(0, 1)}••••@${domain}`;
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 7)}••••`;
}
