export type Seniority = "C-Suite" | "VP" | "Director" | "Manager" | "IC";

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employees: number;
  city: string;
  country: string;
  summary: string;
  technologies: string[];
  funding: string;
};

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  seniority: Seniority;
  department: string;
  companyId: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  inNetwork: boolean;
  about: string;
  signals: string[];
};

export const companies: Company[] = [
  {
    id: "northwind",
    name: "Northwind Labs",
    domain: "northwindlabs.example",
    industry: "Software",
    employees: 220,
    city: "San Francisco",
    country: "United States",
    summary: "Workflow software for operations teams that have outgrown spreadsheets.",
    technologies: ["React", "Postgres", "AWS"],
    funding: "Series B",
  },
  {
    id: "brightloom",
    name: "Brightloom Health",
    domain: "brightloom.example",
    industry: "Healthcare",
    employees: 1400,
    city: "Boston",
    country: "United States",
    summary: "Care coordination tools used by regional hospital groups.",
    technologies: ["Python", "Snowflake", "GCP"],
    funding: "Series C",
  },
  {
    id: "copperline",
    name: "Copperline Bank",
    domain: "copperline.example",
    industry: "Finance",
    employees: 800,
    city: "New York",
    country: "United States",
    summary: "A digital bank for mid-market treasury teams.",
    technologies: ["Java", "Kafka", "Azure"],
    funding: "Private",
  },
  {
    id: "fieldwork",
    name: "Fieldwork Robotics",
    domain: "fieldwork.example",
    industry: "Manufacturing",
    employees: 540,
    city: "Austin",
    country: "United States",
    summary: "Warehouse robots for plants that still run mixed manual lines.",
    technologies: ["ROS", "Python", "AWS"],
    funding: "Series B",
  },
  {
    id: "paperplane",
    name: "Paperplane Retail",
    domain: "paperplane.example",
    industry: "Retail",
    employees: 3200,
    city: "Chicago",
    country: "United States",
    summary: "A home-goods retailer rebuilding its stores around local inventory.",
    technologies: ["Shopify", "BigQuery", "React"],
    funding: "Public",
  },
  {
    id: "lantern",
    name: "Lantern Education",
    domain: "lanternedu.example",
    industry: "Education",
    employees: 180,
    city: "Toronto",
    country: "Canada",
    summary: "Course tools for continuing-education programs.",
    technologies: ["Ruby", "Postgres", "Heroku"],
    funding: "Series A",
  },
  {
    id: "harborlight",
    name: "Harborlight Energy",
    domain: "harborlight.example",
    industry: "Energy",
    employees: 960,
    city: "Houston",
    country: "United States",
    summary: "Grid software for regional utilities adding storage.",
    technologies: ["Go", "Timescale", "AWS"],
    funding: "Series C",
  },
  {
    id: "kindred",
    name: "Kindred Cloud",
    domain: "kindredcloud.example",
    industry: "Software",
    employees: 75,
    city: "Seattle",
    country: "United States",
    summary: "Support software for B2B teams that want a shared inbox.",
    technologies: ["TypeScript", "Postgres", "GCP"],
    funding: "Seed",
  },
  {
    id: "mosaic",
    name: "Mosaic Freight",
    domain: "mosaicfreight.example",
    industry: "Logistics",
    employees: 2100,
    city: "Chicago",
    country: "United States",
    summary: "Regional freight with a tracking product for shippers.",
    technologies: ["Java", "Oracle", "Azure"],
    funding: "Private",
  },
  {
    id: "sable",
    name: "Sable & Co",
    domain: "sableco.example",
    industry: "Professional Services",
    employees: 430,
    city: "London",
    country: "United Kingdom",
    summary: "An advisory firm for operators opening a second market.",
    technologies: ["Microsoft 365", "Salesforce", "Tableau"],
    funding: "Partnership",
  },
  {
    id: "juniper",
    name: "Juniper Bio",
    domain: "juniperbio.example",
    industry: "Healthcare",
    employees: 90,
    city: "Berlin",
    country: "Germany",
    summary: "Lab software for small biotech teams running shared studies.",
    technologies: ["Python", "Postgres", "GCP"],
    funding: "Series A",
  },
  {
    id: "atlas",
    name: "Atlas Civic",
    domain: "atlascivic.example",
    industry: "Government",
    employees: 260,
    city: "Washington",
    country: "United States",
    summary: "Resident-service portals for city operations teams.",
    technologies: ["TypeScript", "Postgres", "AWS"],
    funding: "Series B",
  },
  {
    id: "pebble",
    name: "Pebble Analytics",
    domain: "pebbleanalytics.example",
    industry: "Software",
    employees: 28,
    city: "Denver",
    country: "United States",
    summary: "A tiny product studio selling analytics to independent clinics.",
    technologies: ["TypeScript", "DuckDB", "Vercel"],
    funding: "Bootstrapped",
  },
];

type Seed = [
  string,
  string,
  string,
  Seniority,
  string,
  string,
  string,
  string,
  boolean,
  string,
  string[],
];

const seeds: Seed[] = [
  ["Avery", "Chen", "VP Sales", "VP", "Sales", "northwind", "San Francisco", "United States", true, "Runs the revenue team and still joins the first call on larger deals.", ["New in role", "Hiring two account executives"]],
  ["Priya", "Shah", "Director of Engineering", "Director", "Engineering", "northwind", "San Francisco", "United States", false, "Leads the platform group that ships the workflow editor.", ["Speaking at a local engineering meetup"]],
  ["Noah", "Kim", "Account Executive", "IC", "Sales", "northwind", "San Francisco", "United States", false, "Covers west-coast operations leaders and writes his own outbound.", ["Quota carrying"]],
  ["Jordan", "Okonkwo", "Chief Medical Officer", "C-Suite", "Clinical", "brightloom", "Boston", "United States", false, "Sets clinical standards for how Brightloom shows up in hospitals.", ["Published a care-coordination note"]],
  ["Elena", "Rossi", "VP Marketing", "VP", "Marketing", "brightloom", "Boston", "United States", true, "Owns brand and pipeline for the hospital segment.", ["In your extended network"]],
  ["Grace", "Adeyemi", "Product Manager", "Manager", "Product", "brightloom", "Boston", "United States", false, "Ships the nurse handoff workflow.", ["Hiring a designer"]],
  ["Mateo", "Alvarez", "Chief Financial Officer", "C-Suite", "Finance", "copperline", "New York", "United States", false, "Watches treasury products from the buyer's side and the builder's side.", ["New in role"]],
  ["Hannah", "Brooks", "Director of Partnerships", "Director", "Sales", "copperline", "New York", "United States", true, "Builds bank and software partnerships for mid-market clients.", ["Posted about partner programs"]],
  ["Ethan", "Walsh", "Finance Manager", "Manager", "Finance", "copperline", "New York", "United States", false, "Runs planning for the commercial banking group.", []],
  ["Samir", "Haddad", "Chief Executive Officer", "C-Suite", "Operations", "fieldwork", "Austin", "United States", false, "Founded Fieldwork after a decade inside automotive plants.", ["Changed roles recently"]],
  ["Isla", "MacLeod", "VP Operations", "VP", "Operations", "fieldwork", "Austin", "United States", false, "Responsible for rollout crews that install robots on live lines.", ["Hiring field leads"]],
  ["Diego", "Navarro", "Robotics Engineer", "IC", "Engineering", "fieldwork", "Austin", "United States", false, "Works on navigation for narrow warehouse aisles.", []],
  ["Nora", "Berg", "Chief Marketing Officer", "C-Suite", "Marketing", "paperplane", "Chicago", "United States", false, "Rebuilding the brand around neighborhood stores.", ["Hiring"]],
  ["Ruby", "Singh", "Director of Ecommerce", "Director", "Marketing", "paperplane", "Chicago", "United States", true, "Connects the site, stores, and local inventory.", ["Posted about store pickup"]],
  ["Marcus", "Hale", "Store Operations Manager", "Manager", "Operations", "paperplane", "Chicago", "United States", false, "Looks after a cluster of Chicago shops.", []],
  ["Camille", "Duval", "Founder", "C-Suite", "Product", "lantern", "Toronto", "Canada", true, "Started Lantern to replace the shared drives most programs still use.", ["Raised a Series A"]],
  ["Owen", "Blake", "Head of Growth", "Director", "Marketing", "lantern", "Toronto", "Canada", false, "Runs campaigns aimed at university extension schools.", ["Hiring a lifecycle marketer"]],
  ["Mei", "Lin", "Curriculum Designer", "IC", "Product", "lantern", "Toronto", "Canada", false, "Designs the course templates customers start from.", []],
  ["Yusuf", "Demir", "VP Engineering", "VP", "Engineering", "harborlight", "Houston", "United States", false, "Leads the team modeling storage on regional grids.", ["New in role"]],
  ["Ingrid", "Solberg", "Director of Sustainability", "Director", "Operations", "harborlight", "Houston", "United States", false, "Tracks how software changes each utility's reporting.", []],
  ["Andre", "Costa", "Sales Manager", "Manager", "Sales", "harborlight", "Houston", "United States", true, "Sells to operations leaders at municipal utilities.", ["Covers municipal utilities"]],
  ["Hiro", "Tanaka", "Chief Technology Officer", "C-Suite", "Engineering", "kindred", "Seattle", "United States", true, "Still reviews the shared-inbox architecture personally.", ["Hiring engineers"]],
  ["Lila", "Cohen", "VP Customer Success", "VP", "Customer Success", "kindred", "Seattle", "United States", false, "Owns onboarding for teams leaving a shared alias.", ["Posted about onboarding"]],
  ["Theo", "Laurent", "Product Designer", "IC", "Product", "kindred", "Seattle", "United States", false, "Designs the composer and collision handling.", []],
  ["Amira", "Hassan", "Chief Operating Officer", "C-Suite", "Operations", "mosaic", "Chicago", "United States", false, "Runs terminals and the tracking product as one system.", ["Speaking at a logistics forum"]],
  ["Felix", "Berger", "Director of Logistics", "Director", "Operations", "mosaic", "Chicago", "United States", false, "Plans lanes across the Midwest.", []],
  ["Naomi", "Park", "Account Manager", "IC", "Sales", "mosaic", "Chicago", "United States", false, "Looks after shippers who outgrew a spreadsheet.", ["Quota carrying"]],
  ["Leo", "Martins", "Managing Partner", "C-Suite", "Sales", "sable", "London", "United Kingdom", true, "Leads the market-entry practice and still takes intro meetings.", ["Takes intro meetings"]],
  ["Freya", "Nilsen", "Marketing Director", "Director", "Marketing", "sable", "London", "United Kingdom", false, "Publishes the firm's operator briefings.", ["Posted this week"]],
  ["Clara", "Mendes", "Senior Consultant", "IC", "Operations", "sable", "London", "United Kingdom", false, "Staffs the first 90 days of a new-market project.", []],
  ["Sofia", "Petrova", "Chief Executive Officer", "C-Suite", "Product", "juniper", "Berlin", "Germany", false, "Building lab software she wanted at her last company.", ["Raised a Series A"]],
  ["Jonah", "Adler", "VP Research", "VP", "Engineering", "juniper", "Berlin", "Germany", false, "Partners with study leads on how experiments are recorded.", []],
  ["Aisha", "Rahman", "Lab Operations Manager", "Manager", "Clinical", "juniper", "Berlin", "Germany", false, "Keeps shared instruments and schedules in one place.", ["Hiring"]],
  ["Omar", "Farouk", "Director of Public Sector", "Director", "Sales", "atlas", "Washington", "United States", true, "Sells resident portals to city operations teams.", ["Sells to city teams"]],
  ["Victor", "Lange", "Engineering Manager", "Manager", "Engineering", "atlas", "Washington", "United States", false, "Leads the team that ships permit status.", []],
  ["Leila", "Haddad", "Policy Analyst", "IC", "Operations", "atlas", "Washington", "United States", false, "Translates procurement rules into product requirements.", []],
  ["Mina", "Cho", "Founder", "C-Suite", "Product", "pebble", "Denver", "United States", true, "Sells and designs the product, and answers support before noon.", ["Bootstrapped"]],
  ["Chris", "Daley", "Head of Sales", "Director", "Sales", "pebble", "Denver", "United States", false, "The first sales hire, covering independent clinics.", ["New in role"]],
  ["Paula", "Nguyen", "Data Engineer", "IC", "Engineering", "pebble", "Denver", "United States", false, "Builds the small warehouse behind clinic dashboards.", []],
];

export const people: Person[] = seeds.map((seed, index) => {
  const [firstName, lastName, title, seniority, department, companyId, city, country, inNetwork, about, signals] = seed;
  const company = companies.find((item) => item.id === companyId);
  if (!company) throw new Error(`Missing company ${companyId}`);
  const local = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "");
  return {
    id: `p${String(index + 1).padStart(2, "0")}`,
    firstName,
    lastName,
    title,
    seniority,
    department,
    companyId,
    city,
    country,
    inNetwork,
    about,
    signals,
    email: `${local}@${company.domain}`,
    phone: `+1-555-${String(140 + index).padStart(4, "0")}`,
  };
});

export const companyById = new Map(companies.map((company) => [company.id, company]));
export const personById = new Map(people.map((person) => [person.id, person]));

export function fullName(person: Pick<Person, "firstName" | "lastName">): string {
  return `${person.firstName} ${person.lastName}`;
}

export const seniorityOrder: Seniority[] = ["C-Suite", "VP", "Director", "Manager", "IC"];

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
