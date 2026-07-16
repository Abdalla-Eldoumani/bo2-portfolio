/*
  CLOUD TRIAGE statements — original true/false claims about AWS
  fundamentals for the cloud-practitioner-prep field sim. Written for
  this portfolio (no exam dumps): every claim is a well-established AWS
  fact a study site would teach, phrased short enough to judge in two
  seconds. Domains mirror the four CLF-C02 exam domains the project's
  README organizes its 886 questions around.
*/

export type TriageDomain = 'concepts' | 'security' | 'technology' | 'billing';

export type TriageStatement = {
  text: string;
  truth: boolean;
  domain: TriageDomain;
};

export const TRIAGE_DOMAINS: Record<TriageDomain, string> = {
  concepts: 'CONCEPTS',
  security: 'SECURITY',
  technology: 'TECH',
  billing: 'BILLING',
};

export const TRIAGE_STATEMENTS: readonly TriageStatement[] = [
  // cloud concepts
  { text: 'AN AZ IS ONE OR MORE DATA CENTERS', truth: true, domain: 'concepts' },
  { text: 'A REGION HOLDS MULTIPLE AZs', truth: true, domain: 'concepts' },
  { text: 'ELASTICITY MEANS FIXED CAPACITY', truth: false, domain: 'concepts' },
  { text: 'CLOUD TRADES CAPEX FOR VARIABLE COST', truth: true, domain: 'concepts' },
  { text: 'EC2 IS SOFTWARE AS A SERVICE', truth: false, domain: 'concepts' },
  { text: 'HIGH AVAILABILITY SPANS MULTIPLE AZs', truth: true, domain: 'concepts' },
  // security and compliance
  { text: 'AWS SECURES THE CLOUD ITSELF', truth: true, domain: 'security' },
  { text: 'CUSTOMERS PATCH THE HYPERVISOR', truth: false, domain: 'security' },
  { text: 'S3 BUCKETS START OUT PUBLIC', truth: false, domain: 'security' },
  { text: 'IAM COSTS NOTHING EXTRA', truth: true, domain: 'security' },
  { text: 'ROOT USER IS FOR EVERYDAY WORK', truth: false, domain: 'security' },
  { text: 'CLOUDTRAIL RECORDS API CALLS', truth: true, domain: 'security' },
  // cloud technology and services
  { text: 'S3 IS OBJECT STORAGE', truth: true, domain: 'technology' },
  { text: 'DYNAMODB IS A RELATIONAL DATABASE', truth: false, domain: 'technology' },
  { text: 'LAMBDA MAKES YOU PATCH SERVERS', truth: false, domain: 'technology' },
  { text: 'ROUTE 53 IS A DNS SERVICE', truth: true, domain: 'technology' },
  { text: 'GLACIER IS BUILT FOR HOT DATA', truth: false, domain: 'technology' },
  { text: 'CLOUDFRONT SERVES FROM EDGE LOCATIONS', truth: true, domain: 'technology' },
  // billing, pricing and support
  { text: 'SPOT INSTANCES CAN BE RECLAIMED', truth: true, domain: 'billing' },
  { text: 'RESERVED BEATS ON-DEMAND ON PRICE', truth: true, domain: 'billing' },
  { text: 'EVERY SUPPORT PLAN IS FREE', truth: false, domain: 'billing' },
  { text: 'COST ALLOCATION TAGS TRACK SPEND', truth: true, domain: 'billing' },
  { text: 'THE EC2 FREE TIER NEVER EXPIRES', truth: false, domain: 'billing' },
  { text: 'BUDGETS CAN ALERT ON FORECAST SPEND', truth: true, domain: 'billing' },
] satisfies readonly TriageStatement[];
