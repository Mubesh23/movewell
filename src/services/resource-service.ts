import { repository } from '../db/repository';
import { ServiceResource } from '../types';

export class ResourceService {
  async findResources(category?: string, zipCode?: string): Promise<ServiceResource[]> {
    return await repository.findServices(category, zipCode);
  }
}

export const resourceService = new ResourceService();
