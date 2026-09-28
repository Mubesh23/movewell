import {
  EvidenceSource,
  CostEvidenceObservation,
  EstimateEvidenceSummary,
} from '../types';

/**
 * Normalized External Evidence Registry
 *
 * CRITICAL RULE: BridgeWell is NEVER the source of pricing or provider verification.
 * The external publisher, public agency, or industry benchmark is always the source.
 * Historical observations are preserved immutably.
 */

export const REAL_EVIDENCE_SOURCES: EvidenceSource[] = [
  {
    id: 'src-move-org-houston',
    title: 'Houston Local Moving Rates & Cost Guide (2025–2026)',
    publisher: 'Move.org',
    url: 'https://www.move.org/moving-cost-calculator/',
    geography: 'Houston, TX',
    publishedDate: '2025-11-15',
    lastCheckedAt: '2026-09-20',
    extractionMethod: 'PUBLIC_RATE_SHEET',
  },
  {
    id: 'src-txdmv-tariff',
    title: 'Texas Household Goods Carrier Maximum Rate Tariff Guidelines',
    publisher: 'Texas Department of Motor Vehicles (TxDMV)',
    url: 'https://www.txdmv.gov/motor-carriers/moving-companies',
    geography: 'Texas',
    publishedDate: '2025-06-01',
    lastCheckedAt: '2026-09-15',
    extractionMethod: 'PUBLIC_AGENCY_TARIFF',
  },
  {
    id: 'src-homeadvisor-packing-houston',
    title: 'Cost to Hire Professional Packers in Houston, TX',
    publisher: 'HomeAdvisor',
    url: 'https://www.homeadvisor.com/cost/cleaning-and-maid-services/hire-packers/',
    geography: 'Houston, TX',
    publishedDate: '2026-01-10',
    lastCheckedAt: '2026-09-18',
    extractionMethod: 'PUBLIC_RATE_SHEET',
  },
  {
    id: 'src-naipc-packing',
    title: 'Senior Downsizing & Packing Cost Benchmarks',
    publisher: 'National Aging in Place Council',
    url: 'https://ageinplace.org',
    geography: 'National',
    publishedDate: '2025-09-12',
    lastCheckedAt: '2026-09-01',
    extractionMethod: 'INDUSTRY_BENCHMARK',
  },
  {
    id: 'src-angi-grab-bars-houston',
    title: 'Grab Bar & Handrail Installation Costs in Greater Houston',
    publisher: 'Angi',
    url: 'https://www.angi.com/companylist/houston/handyman-service.htm',
    geography: 'Houston, TX',
    publishedDate: '2026-02-01',
    lastCheckedAt: '2026-09-19',
    extractionMethod: 'PUBLIC_RATE_SHEET',
  },
  {
    id: 'src-homemods-fall-prevention',
    title: 'Home Accessibility Modifications - Bathroom Safety Costs',
    publisher: 'Fall Prevention Center of Excellence',
    url: 'https://homemods.org',
    geography: 'National',
    publishedDate: '2025-10-01',
    lastCheckedAt: '2026-08-30',
    extractionMethod: 'INDUSTRY_BENCHMARK',
  },
  {
    id: 'src-homeadvisor-ramp-houston',
    title: 'Modular & Threshold Wheelchair Ramp Installation Costs',
    publisher: 'HomeAdvisor',
    url: 'https://www.homeadvisor.com/cost/disability-accommodation/build-a-wheelchair-ramp/',
    geography: 'Houston, TX',
    publishedDate: '2025-12-05',
    lastCheckedAt: '2026-09-12',
    extractionMethod: 'PUBLIC_RATE_SHEET',
  },
  {
    id: 'src-metrolift-fare-sheet',
    title: 'METROLift Service Policy & Fare Tariff',
    publisher: 'Metropolitan Transit Authority of Harris County (METRO)',
    url: 'https://www.ridemetro.org/fares/metrolift-fares',
    geography: 'Harris County, TX',
    publishedDate: '2026-01-01',
    lastCheckedAt: '2026-09-22',
    extractionMethod: 'PUBLIC_AGENCY_TARIFF',
  },
  {
    id: 'src-houston-furniture-bank-fees',
    title: 'Residential Furniture Donation Pickup Fee Schedule',
    publisher: 'Houston Furniture Bank',
    url: 'https://houstonfurniturebank.org/take-action/donate-furniture/',
    geography: 'Houston, TX',
    publishedDate: '2026-01-15',
    lastCheckedAt: '2026-09-24',
    extractionMethod: 'PUBLIC_RATE_SHEET',
  },
];

export const REAL_COST_OBSERVATIONS: CostEvidenceObservation[] = [
  // 1. Moving (Houston Local)
  {
    id: 'obs-mov-01',
    sourceId: 'src-move-org-houston',
    category: 'moving',
    amountMin: 950,
    amountMax: 2100,
    unit: 'transition job',
    geography: 'Houston, TX',
    observedDate: '2026-09-20',
    notes: '2-3 movers for 4-6 hours with 24-foot truck, local travel within Harris County.',
  },
  {
    id: 'obs-mov-02',
    sourceId: 'src-txdmv-tariff',
    category: 'moving',
    amountMin: 110,
    amountMax: 185,
    unit: 'hourly',
    geography: 'Texas',
    observedDate: '2026-09-15',
    notes: 'TxDMV regulated hourly rate envelope for two to three movers and vehicle.',
  },

  // 2. Packing / Unpacking
  {
    id: 'obs-pack-01',
    sourceId: 'src-homeadvisor-packing-houston',
    category: 'packing',
    amountMin: 450,
    amountMax: 1150,
    unit: 'downsize job',
    geography: 'Houston, TX',
    observedDate: '2026-09-18',
    notes: 'Partial to full apartment packing with basic corrugated materials and furniture blankets.',
  },
  {
    id: 'obs-pack-02',
    sourceId: 'src-naipc-packing',
    category: 'packing',
    amountMin: 500,
    amountMax: 1250,
    unit: 'downsize job',
    geography: 'National',
    observedDate: '2026-09-01',
    notes: 'Senior transition rightsizing and delicate glassware packing benchmark.',
  },

  // 3. Home Modification / Accessibility
  {
    id: 'obs-mod-01',
    sourceId: 'src-angi-grab-bars-houston',
    category: 'home_modification',
    amountMin: 150,
    amountMax: 350,
    unit: 'per grab bar installed',
    geography: 'Houston, TX',
    observedDate: '2026-09-19',
    notes: 'Includes ADA-compliant stainless steel grab bar, anchor hardware into wood or tile studs.',
  },
  {
    id: 'obs-mod-02',
    sourceId: 'src-homeadvisor-ramp-houston',
    category: 'home_modification',
    amountMin: 1200,
    amountMax: 3400,
    unit: 'modular ramp project',
    geography: 'Houston, TX',
    observedDate: '2026-09-12',
    notes: 'Aluminum modular ramp or threshold ramp for standard 2-step to 4-step entryway.',
  },
  {
    id: 'obs-mod-03',
    sourceId: 'src-homemods-fall-prevention',
    category: 'home_modification',
    amountMin: 175,
    amountMax: 375,
    unit: 'per fixture',
    geography: 'National',
    observedDate: '2026-08-30',
    notes: 'Bathroom safety modifications (grab bars, handheld shower wand, nonslip threshold).',
  },

  // 4. Transportation
  {
    id: 'obs-trans-01',
    sourceId: 'src-metrolift-fare-sheet',
    category: 'transportation',
    amountMin: 1.25,
    amountMax: 50,
    unit: 'per trip',
    geography: 'Harris County, TX',
    observedDate: '2026-09-22',
    notes: '$1.25 for subsidized METROLift transit; $35-$50 for specialized private medical wheelchair transport.',
  },

  // 5. Donation / Cleanout
  {
    id: 'obs-don-01',
    sourceId: 'src-houston-furniture-bank-fees',
    category: 'donation',
    amountMin: 50,
    amountMax: 100,
    unit: 'pickup fee',
    geography: 'Houston, TX',
    observedDate: '2026-09-24',
    notes: 'Residential fee covers truck dispatch and fuel for furniture pickup with tax donation receipt.',
  },
];

export class EvidenceService {
  private sourcesMap = new Map<string, EvidenceSource>();

  constructor() {
    for (const src of REAL_EVIDENCE_SOURCES) {
      this.sourcesMap.set(src.id, src);
    }
  }

  /**
   * Looks up structured evidence for a category, prioritizing:
   * 1. Houston/Harris County local evidence
   * 2. Texas state evidence
   * 3. National evidence
   * Returns null if no external evidence exists (allowing clean workflow fallback).
   */
  public getEvidenceForCategory(
    categoryInput: string,
    geographyPreference: string = 'Houston, TX'
  ): EstimateEvidenceSummary | null {
    const cat = categoryInput.toLowerCase().trim();

    // Map common task titles/categories to canonical evidence categories
    let canonical = cat;
    if (cat.includes('mov') || cat.includes('relocat')) canonical = 'moving';
    else if (cat.includes('pack') || cat.includes('box')) canonical = 'packing';
    else if (cat.includes('mod') || cat.includes('ramp') || cat.includes('grab') || cat.includes('access'))
      canonical = 'home_modification';
    else if (cat.includes('trans') || cat.includes('ride') || cat.includes('lift'))
      canonical = 'transportation';
    else if (cat.includes('donat') || cat.includes('clean') || cat.includes('junk'))
      canonical = 'donation';

    const matchingObservations = REAL_COST_OBSERVATIONS.filter(
      (obs) => obs.category.toLowerCase() === canonical
    );

    if (matchingObservations.length === 0) {
      return null;
    }

    // Sort observations by geographical relevance:
    // Houston/Harris County (3) > Texas (2) > National (1) > Other (0)
    const scoredObservations = matchingObservations.map((obs) => {
      let geoScore = 1;
      const obsGeo = obs.geography.toLowerCase();
      if (obsGeo.includes('houston') || obsGeo.includes('harris') || obsGeo.includes('77004')) {
        geoScore = 3;
      } else if (obsGeo.includes('texas') || obsGeo.includes('tx')) {
        geoScore = 2;
      }
      return { obs, geoScore };
    });

    scoredObservations.sort((a, b) => {
      if (b.geoScore !== a.geoScore) return b.geoScore - a.geoScore;
      return new Date(b.obs.observedDate).getTime() - new Date(a.obs.observedDate).getTime();
    });

    const highestGeoScore = scoredObservations[0].geoScore;
    // Prefer highest geography tier observations
    const topTier = scoredObservations.filter((item) => item.geoScore === highestGeoScore);
    const selectedObservations = topTier.map((item) => item.obs);

    // Compute blended min/max
    const minAmount = Math.min(...selectedObservations.map((o) => o.amountMin));
    const maxAmount = Math.max(...selectedObservations.map((o) => o.amountMax));

    const matchedSources: EvidenceSource[] = [];
    const seenSourceIds = new Set<string>();

    for (const obs of selectedObservations) {
      if (!seenSourceIds.has(obs.sourceId)) {
        seenSourceIds.add(obs.sourceId);
        const source = this.sourcesMap.get(obs.sourceId);
        if (source) matchedSources.push(source);
      }
    }

    // Sort sources by published date / lastCheckedAt
    matchedSources.sort(
      (a, b) => new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime()
    );

    const newestDate = selectedObservations.reduce(
      (latest, obs) => (obs.observedDate > latest ? obs.observedDate : latest),
      selectedObservations[0].observedDate
    );

    const geoLabel =
      highestGeoScore === 3
        ? 'Houston, TX'
        : highestGeoScore === 2
        ? 'Texas'
        : 'National';

    const confidence: 'High' | 'Medium' | 'Low' =
      highestGeoScore === 3 && selectedObservations.length >= 1
        ? 'Medium'
        : highestGeoScore === 2
        ? 'Medium'
        : 'Low';

    const primaryPublisher = matchedSources[0]?.publisher || 'Published provider rate sheets';

    return {
      category: canonical,
      minAmount,
      maxAmount,
      unit: selectedObservations[0].unit,
      geography: geoLabel,
      observationCount: selectedObservations.length,
      newestObservedDate: newestDate,
      confidence,
      sources: matchedSources,
      observations: selectedObservations,
      rationale: `Estimate derived from ${selectedObservations.length} external rate observation${
        selectedObservations.length === 1 ? '' : 's'
      } published by ${primaryPublisher} in ${geoLabel}.`,
    };
  }

  /**
   * Explains cost evidence in natural language, citing publisher, URL, and date.
   * NEVER claims BridgeWell or internal median as the source.
   */
  public explainCost(
    categoryInput: string,
    geographyPreference: string = 'Houston, TX'
  ): {
    explanation: string;
    summary: EstimateEvidenceSummary | null;
  } {
    const summary = this.getEvidenceForCategory(categoryInput, geographyPreference);

    if (!summary) {
      return {
        explanation:
          'This figure is a preliminary workflow planning estimate. Specific local provider rate sheets are not yet published for this category in Harris County. We recommend requesting quotes from local providers to obtain a verified current price.',
        summary: null,
      };
    }

    const primarySource = summary.sources[0];
    const sourceList = summary.sources
      .map((s) => `• **${s.publisher}**: [${s.title}](${s.url}) (checked ${s.lastCheckedAt})`)
      .join('\n');

    const explanation =
      `This planning estimate of **$${summary.minAmount.toLocaleString()}–$${summary.maxAmount.toLocaleString()}** (${summary.unit}) is grounded in ${summary.geography} pricing published by **${primarySource.publisher}**.\n\n` +
      `**Evidence details:**\n` +
      `• Geography: ${summary.geography}\n` +
      `• Observed range: $${summary.minAmount.toLocaleString()} to $${summary.maxAmount.toLocaleString()}\n` +
      `• Observations: ${summary.observationCount} recent public tariff and rate sheet data point${summary.observationCount > 1 ? 's' : ''}\n` +
      `• Newest verification date: ${summary.newestObservedDate}\n\n` +
      `**Published Sources:**\n${sourceList}\n\n` +
      `*Published pricing is useful for planning, but the final cost depends on the exact job. Confirming with local providers would give you a more reliable current number.*`;

    return { explanation, summary };
  }
}

export const evidenceService = new EvidenceService();
