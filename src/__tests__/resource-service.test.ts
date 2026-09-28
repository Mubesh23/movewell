import { describe, it, expect } from 'vitest';
import { resourceService } from '../services/resource-service';

describe('Resource Service Queries', () => {
  it('should list all verified Houston resources when category is ALL', async () => {
    const resources = await resourceService.findResources('ALL', '77004');
    expect(resources.length).toBeGreaterThanOrEqual(5);

    const mover = resources.find((r) => r.category === 'moving');
    expect(mover).toBeDefined();
    expect(mover?.verification?.verificationStatus).toBe('Directory listing');
    expect(mover?.verification?.verificationStatus).not.toContain('Verified');
  });

  it('should filter resources by category and strictly return only moving services for category "moving"', async () => {
    const movers = await resourceService.findResources('moving', '77004');
    expect(movers.length).toBeGreaterThan(0);
    expect(movers.every((m) => m.category === 'moving')).toBe(true);

    // Verify METROLift (paratransit/transportation) is NOT returned for moving company queries
    const metrolift = movers.find((m) => m.name.includes('METROLift') || m.id.includes('metrolift'));
    expect(metrolift).toBeUndefined();
  });

  it('should normalize category aliases like "movers" or "moving company"', async () => {
    const moversAlias = await resourceService.findResources('movers', '77004');
    expect(moversAlias.length).toBeGreaterThan(0);
    expect(moversAlias.every((m) => m.category === 'moving')).toBe(true);
  });
});
