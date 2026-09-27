import { repository } from '../db/repository';
import {
  ServiceResource,
  ResourceSearchProvider,
  ResourceSearchInput,
  ResourceCandidate,
  ResourceTrustLabel,
  ProposedResourceNeed,
} from '../types';

export class CuratedDirectoryResourceProvider implements ResourceSearchProvider {
  async searchNearby(input: ResourceSearchInput): Promise<ResourceCandidate[]> {
    const normCategory = resourceService.normalizeCategory(input.category);
    const services = await repository.findServices(normCategory, input.zipCode);

    const mapped = services.map((s) => {
      let trustLabel: ResourceTrustLabel = 'Nearby option';
      if (
        s.costType === 'free_public_service' ||
        s.name.toLowerCase().includes('metro') ||
        s.name.toLowerCase().includes('county') ||
        s.name.toLowerCase().includes('area agency')
      ) {
        trustLabel = 'Public agency';
      } else if (
        s.organizationName?.toLowerCase().includes('nonprofit') ||
        s.description?.toLowerCase().includes('nonprofit') ||
        s.description?.toLowerCase().includes('volunteer') ||
        s.costType === 'sliding_scale'
      ) {
        trustLabel = 'Nonprofit';
      } else if (s.verification?.verificationStatus?.toLowerCase().includes('verified')) {
        trustLabel = 'Bridgewell-reviewed';
      } else if (s.organizationName) {
        trustLabel = 'Directory listing';
      }

      return {
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        phone: s.location?.phone,
        address: s.location?.address,
        city: s.location?.city,
        state: s.location?.state,
        zipCode: s.location?.zipCode,
        trustLabel,
        costType: s.costType,
        website: s.website,
      };
    });

    // Rank: 1. Public agency / Nonprofit / Free help -> 2. Bridgewell-reviewed -> 3. Directory listing -> 4. Nearby option
    const rankScore = (r: ResourceCandidate) => {
      if (r.trustLabel === 'Public agency' || r.trustLabel === 'Nonprofit' || r.costType === 'free_public_service') {
        return 1;
      }
      if (r.trustLabel === 'Bridgewell-reviewed') {
        return 2;
      }
      if (r.trustLabel === 'Directory listing') {
        return 3;
      }
      return 4;
    };

    mapped.sort((a, b) => rankScore(a) - rankScore(b));

    return mapped.slice(0, input.limit || 5);
  }
}

export class ResourceService {
  private defaultProvider: ResourceSearchProvider = new CuratedDirectoryResourceProvider();

  public setProvider(provider: ResourceSearchProvider) {
    this.defaultProvider = provider;
  }

  async searchNearby(input: ResourceSearchInput): Promise<ResourceCandidate[]> {
    return this.defaultProvider.searchNearby(input);
  }

  async findResources(category?: string, zipCode?: string): Promise<ServiceResource[]> {
    const normCategory = this.normalizeCategory(category);
    return await repository.findServices(normCategory, zipCode);
  }

  /**
   * Deterministically maps tasks to relevant resource intents.
   * Decision-only tasks return null (no external business search).
   */
  public getIntentForTask(templateId?: string, title?: string): ProposedResourceNeed | null {
    const t = `${templateId || ''} ${title || ''}`.toLowerCase();

    if (t.includes('mover') || t.includes('moving') || t.includes('schedule-senior-mover')) {
      return {
        category: 'moving',
        label: 'Senior movers & moving companies',
        searchTerms: ['senior mover', 'moving company', 'packing service'],
      };
    }

    if (
      t.includes('home-accessibility') ||
      t.includes('accessibility') ||
      t.includes('home safety') ||
      t.includes('grab bar') ||
      t.includes('ramp')
    ) {
      return {
        category: 'home_modification',
        label: 'Accessibility & safety contractors',
        searchTerms: ['accessibility contractor', 'grab bars', 'wheelchair ramp'],
      };
    }

    if (
      t.includes('donation') ||
      t.includes('belongings') ||
      t.includes('declutter') ||
      t.includes('schedule-donation-pickup')
    ) {
      return {
        category: 'donation',
        label: 'Donation pickup & decluttering',
        searchTerms: ['donation pickup', 'furniture donation'],
      };
    }

    if (t.includes('storage')) {
      return {
        category: 'storage',
        label: 'Climate-controlled storage',
        searchTerms: ['storage facility', 'self storage'],
      };
    }

    return null;
  }

  public normalizeCategory(raw?: string): string | undefined {
    if (!raw || raw.toUpperCase() === 'ALL') return undefined;
    const q = raw.toLowerCase().trim();
    if (q.includes('move') || q.includes('mover') || q.includes('moving')) return 'moving';
    if (q.includes('transport') || q.includes('transit') || q.includes('bus') || q.includes('ride')) return 'transportation';
    if (q.includes('donat') || q.includes('furniture')) return 'donation';
    if (q.includes('storag')) return 'storage';
    if (q.includes('ramp') || q.includes('modific') || q.includes('safety')) return 'home_modification';
    if (q.includes('senior') || q.includes('care') || q.includes('management') || q.includes('helper')) return 'senior_move_management';
    return raw;
  }
}

export const resourceService = new ResourceService();

