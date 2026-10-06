export type ProjectStatus =
  | "scanning"
  | "refused"
  | "review"
  | "cases"
  | "running"
  | "report"
  | "error";

export type ResultStatus = "pass" | "fail" | "blocked" | "skipped";

export type PageType =
  | "Login"
  | "Listing"
  | "Detail"
  | "Cart"
  | "Checkout"
  | "Other";

export type CaptureMode = "ai" | "requirements" | "api" | "import";

export type FeatureId =
  | "authentication"
  | "listing"
  | "detail"
  | "cart"
  | "checkout"
  | "navigation"
  | "custom";

export type Confidence = "high" | "medium" | "low";

export type Field = {
  name: string;
  type: string;
  testId?: string;
  placeholder?: string;
};

export type NamedElement = {
  name: string;
  testId?: string;
  href?: string;
};

export type PageModel = {
  id: string;
  url: string;
  title: string;
  type: PageType;
  purpose: string;
  confidence: Confidence;
  headings: string[];
  fields: Field[];
  buttons: NamedElement[];
  links: NamedElement[];
  screenshot: string;
  statusCode: number;
  selected: boolean;
};

export type Feature = {
  id: FeatureId;
  name: string;
  description: string;
  pageIds: string[];
  selected: boolean;
};

export type Fitness = {
  allowed: boolean;
  score: number;
  reasons: string[];
  blockers: string[];
};

export type SiteModel = {
  gist: string;
  host: string;
  fitness: Fitness;
  pages: PageModel[];
  features: Feature[];
};

export type TestCase = {
  id: string;
  featureId: FeatureId;
  title: string;
  steps: string[];
  expected: string;
  selected: boolean;
  recipe: string;
};

export type CaseResult = {
  caseId: string;
  title: string;
  status: ResultStatus;
  reason: string;
  screenshot?: string;
  durationMs: number;
};

export type ScanLog = {
  at: string;
  message: string;
};

export type Project = {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  captureMode: CaptureMode;
  caseChoice?: "ai" | "provided";
  sourceText?: string;
  status: ProjectStatus;
  createdAt: string;
  logs: ScanLog[];
  error?: string;
  siteModel?: SiteModel;
  cases: TestCase[];
  results: CaseResult[];
  runStartedAt?: string;
  runFinishedAt?: string;
};
