import { describe, it, expect } from 'vitest';
import { resourceService } from '../services/resource-service';

describe('Resource Service Queries', () => {
  it('should list all verified Houston resources when category is ALL', async () => {
    const resources = await resourceService.findResources('ALL', '77004');
    expect(resources.length).toBeGreaterThanOrEqual(5);

    const mover = resources.find((r) => r.category === 'moving');
    expect(mover).toBeDefined();
    expect(mover?.verification?.verificationStatus).toBe('Verified listing');
  });

  it('should filter resources by category', async () => {
    const movers = await resourceService.findResources('moving', '77004');
    expect(movers.every((m) => m.category === 'moving')).toBe(true);

    const storage = await resourceService.findResources('storage', '77004');
    expect(storage.every((s) => s.category === 'storage')).toBe(true);
  });
});
