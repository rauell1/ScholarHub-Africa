import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { apiError, isDbUnavailable } from '@/lib/http';
import { queryScholarshipCards } from '@/lib/queries';
import { getProfile } from '@/lib/tracker-queries';

export const dynamic = 'force-dynamic';

const FIELD_KEYWORD_MAP: Record<string, string[]> = {
  engineering: ['engineering', 'technology', 'infrastructure', 'renewable', 'water', 'energy'],
  'data science': ['data', 'computer', 'digital', 'artificial intelligence', 'machine learning'],
  'public health': ['health', 'medicine', 'public health', 'epidemiology', 'nutrition'],
  economics: ['economics', 'finance', 'business', 'management', 'policy'],
  'environmental science': ['environment', 'climate', 'sustainability', 'ecology', 'agriculture'],
  education: ['education', 'pedagogy', 'teaching', 'curriculum'],
  law: ['law', 'legal', 'governance', 'human rights', 'justice'],
};

function fieldMatches(degreeField: string, scholarshipName: string): boolean {
  const fieldLower = degreeField.toLowerCase();
  const nameLower = scholarshipName.toLowerCase();
  for (const [key, keywords] of Object.entries(FIELD_KEYWORD_MAP)) {
    if (fieldLower.includes(key) || keywords.some((k) => fieldLower.includes(k))) {
      if (keywords.some((k) => nameLower.includes(k))) return true;
    }
  }
  return false;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const profile = await getProfile(session.user.id);

    // Build filters — open scholarships ordered by deadline
    const scholarships = await queryScholarshipCards({
      status: ['open', 'open_now', 'opening_soon'],
      deadlineAfter: new Date().toISOString().slice(0, 10),
      ordering: 'deadline_date',
      limit: 50,
    });

    if (!profile || (!profile.degree_field && !profile.nationality)) {
      // No profile data — return top-scored open scholarships
      return NextResponse.json({ results: scholarships.slice(0, 10) });
    }

    // Score each scholarship for relevance
    const scored = scholarships.map((s) => {
      let relevance = 0;

      // Eligibility match (open to all Africans gets full points)
      if (s.eligibility_label === 'PE' || s.eligibility_label === 'AA') relevance += 3;

      // Field match
      if (profile.degree_field && fieldMatches(profile.degree_field, s.name)) relevance += 2;

      // Bonus for high scholarship score
      relevance += Math.floor((s.score ?? 0) / 25);

      return { ...s, relevance };
    });

    // Sort by relevance desc, then by scholarship score desc
    scored.sort((a, b) => b.relevance - a.relevance || (b.score ?? 0) - (a.score ?? 0));

    return NextResponse.json({ results: scored.slice(0, 10) });
  } catch (err) {
    console.error('[api/v1/scholarships/recommended]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
