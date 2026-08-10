/**
 * Policy generators — Privacy Policy, Cookie Policy and Terms of Service
 * produced dynamically from company variables.
 *
 * The admin fills a form; these templates render markdown that can be
 * published to the site (and downloaded as .md/.html). Output is a solid
 * starting point — always have a lawyer review before going live.
 */
import type { ConsentConfig } from '@/lib/consent/types';

export interface CompanyFacts {
  companyName: string;
  domain: string;
  contactEmail: string;
  dpoEmail: string;
  address: string;
  jurisdiction: string;
  effectiveDate: string;
  dataTypes: string[];
  thirdParties: string[];
  analyticsTools: string[];
  marketingTools: string[];
  retentionDays: number;
}

const DEFAULT_FACTS: CompanyFacts = {
  companyName: 'ScholarHub Africa',
  domain: 'scholarhub.africa',
  contactEmail: 'hello@scholarhub.africa',
  dpoEmail: 'dpo@scholarhub.africa',
  address: 'Nairobi, Kenya',
  jurisdiction: 'Kenya (with GDPR compliance for EU/EEA/UK users)',
  effectiveDate: new Date().toISOString().slice(0, 10),
  dataTypes: ['Name', 'Email address', 'Country / region', 'Consent choices', 'Usage analytics'],
  thirdParties: ['Cloud hosting provider', 'Email delivery service', 'Analytics providers'],
  analyticsTools: ['Plausible Analytics (privacy-friendly, cookieless)'],
  marketingTools: ['None by default — added only with consent'],
  retentionDays: 365,
};

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

export function generatePrivacyPolicy(facts: Partial<CompanyFacts>): string {
  const f: CompanyFacts = { ...DEFAULT_FACTS, ...facts };
  return `# Privacy Policy — ${f.companyName}

**Effective date:** ${f.effectiveDate}
**Jurisdiction:** ${f.jurisdiction}

## 1. Who we are
${f.companyName} ("we", "us") operates the website **${f.domain}**. For privacy
enquiries contact our Data Protection contact at **${f.dpoEmail}**.

## 2. What we collect
${list(f.dataTypes)}

## 3. How we use your data
- To operate and secure the website (legitimate interest)
- To provide the services you request (contract)
- With your consent: analytics and marketing (Art. 6(1)(a) GDPR / CCPA opt-in or opt-out as applicable)

## 4. Legal bases (GDPR)
We rely on consent, contract performance, and legitimate interest, as applicable.
You may withdraw consent at any time via the cookie preference panel.

## 5. Sharing (and "Do Not Sell")
We do **not sell** personal information. In the US (CCPA/CPRA and similar
state laws) we honour opt-out requests via the "Do Not Sell or Share My
Personal Information" control. We share data only with:
${list(f.thirdParties)}

## 6. Retention
Data is retained for ${f.retentionDays} days unless a longer period is required by law.

## 7. Your rights
GDPR: access, rectification, erasure, restriction, portability, objection.
CCPA/CPRA: know, delete, correct, opt-out of sale/sharing, non-discrimination.
Email **${f.dpoEmail}** to exercise any right. We respond within 30 days.

## 8. International transfers
Data may be processed outside your country using appropriate safeguards (e.g. SCCs).

## 9. Children
The service is not directed at children under 16.

## 10. Changes
We will post changes on this page with a new effective date.
`;
}

export function generateCookiePolicy(facts: Partial<CompanyFacts>, config?: ConsentConfig): string {
  const f: CompanyFacts = { ...DEFAULT_FACTS, ...facts };
  const domain = config?.company.domain ?? f.domain;
  return `# Cookie Policy — ${f.companyName}

**Effective date:** ${f.effectiveDate}
**Applies to:** ${domain}

## 1. What are cookies?
Cookies are small text files stored on your device. We also use similar
technologies (localStorage, pixels).

## 2. Categories we use
- **Necessary** — required for the site to function (e.g. security, session). Always active.
- **Preferences** — remembers choices such as language and region.
- **Analytics** — measures how visitors use the site. ${f.analyticsTools.join(', ')}.
- **Marketing** — powers personalised advertising and social tracking. ${f.marketingTools.join(', ')}.

## 3. How consent works
- **GDPR (EU/EEA/UK):** strict opt-in. Non-essential cookies are OFF until you accept them.
- **CCPA / US state laws:** opt-out. You can disable non-essential cookies at any time.

You can change your choices at any time via the shield button on the site,
or by clearing cookies in your browser.

## 4. Third-party cookies
${list(f.thirdParties)}

## 5. Cookie table
| Cookie | Category | Purpose | Duration |
|---|---|---|---|
| \`sh_region\` | Necessary | Stores your consent region (GDPR/CCPA) | 1 year |
| \`sh_consent\` | Necessary | Stores your consent choice (HTTP-only) | 1 year |
| \`sh:consent:v1\` (localStorage) | Necessary | Stores your consent choice locally | Until cleared |

## 6. Contact
Questions: **${f.contactEmail}** · DPO: **${f.dpoEmail}**
`;
}

export function generateTerms(facts: Partial<CompanyFacts>): string {
  const f: CompanyFacts = { ...DEFAULT_FACTS, ...facts };
  return `# Terms of Service — ${f.companyName}

**Effective date:** ${f.effectiveDate}
**Service:** ${f.domain}

## 1. Acceptance
By using ${f.domain} you agree to these terms and our Privacy and Cookie Policies.

## 2. Use of the service
You may use the service for lawful purposes only. You must not attempt to
disrupt, scrape beyond reasonable limits, or misuse the platform.

## 3. Accounts
Where accounts exist, you are responsible for keeping credentials confidential
and for activity under your account.

## 4. Intellectual property
All content, design and data on the service belong to ${f.companyName} or its
licensors unless stated otherwise.

## 5. Disclaimer of warranties
The service is provided "as is". Scholarship information is human-verified but
may change; always confirm deadlines and details on official sources.

## 6. Limitation of liability
To the maximum extent permitted by law, ${f.companyName} is not liable for
indirect or consequential damages arising from use of the service.

## 7. Governing law
These terms are governed by the laws of the jurisdiction stated in our
Privacy Policy, without regard to conflict-of-law rules.

## 8. Contact
**${f.contactEmail}**
`;
}

export function generateAllPolicies(facts: Partial<CompanyFacts>, config?: ConsentConfig) {
  return {
    privacy: generatePrivacyPolicy(facts),
    cookies: generateCookiePolicy(facts, config),
    terms: generateTerms(facts),
  };
}
