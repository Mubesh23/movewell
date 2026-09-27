import { repository } from '../db/repository';
import { ServiceResource } from '../types';

export class ResourceService {
  async findResources(category?: string, zipCode?: string): Promise<ServiceResource[]> {
    const normCategory = this.normalizeCategory(category);
    return await repository.findServices(normCategory, zipCode);
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
