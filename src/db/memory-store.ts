import {
  TransitionCase,
  SeniorProfile,
  CaseMember,
  TransitionTask,
  TaskDependency,
  CaseEvent,
  CostModel,
  Organization,
  ServiceResource,
  Location,
  ResourceVerification,
  CostItem,
} from '../types';
import { HOUSTON_RESOURCE_SEEDS } from './seeds/resources';

class MemoryStore {
  public cases: Map<string, TransitionCase> = new Map();
  public seniorProfiles: Map<string, SeniorProfile> = new Map();
  public caseMembers: Map<string, CaseMember> = new Map();
  public tasks: Map<string, TransitionTask> = new Map();
  public taskDependencies: TaskDependency[] = [];
  public caseEvents: CaseEvent[] = [];
  public costModels: Map<string, CostModel> = new Map();
  public costItems: Map<string, CostItem> = new Map();

  public intakeDrafts: Map<string, import('../types').IntakeDraftRecord> = new Map();
  public planDrafts: Map<string, import('../types').PlanDraft> = new Map();
  public caseLocations: Map<string, import('../types').CaseLocation> = new Map();
  public users: Map<string, import('../types').UserProfile> = new Map();

  public organizations: Map<string, Organization> = new Map();
  public services: Map<string, ServiceResource> = new Map();
  public locations: Map<string, Location> = new Map();
  public resourceVerifications: Map<string, ResourceVerification> = new Map();

  constructor() {
    this.seedDefaultCostModels();
    this.seedDefaultResources();
  }

  private seedDefaultResources() {
    HOUSTON_RESOURCE_SEEDS.forEach((pkg) => {
      this.organizations.set(pkg.organization.id, pkg.organization);
      this.services.set(pkg.service.id, pkg.service);
      this.locations.set(pkg.location.id, pkg.location);
      this.resourceVerifications.set(pkg.verification.id, pkg.verification);
    });
  }

  private seedDefaultCostModels() {
    const defaults: CostModel[] = [
      {
        id: 'cm-moving',
        category: 'moving',
        name: 'Local Moving Services',
        minCost: 1200,
        maxCost: 2400,
        unit: 'job',
      },
      {
        id: 'cm-packing',
        category: 'packing',
        name: 'Full Packing & Materials',
        minCost: 600,
        maxCost: 1100,
        unit: 'job',
      },
      {
        id: 'cm-junk-donation',
        category: 'junk_removal',
        name: 'Donation Pickup & Junk Removal',
        minCost: 300,
        maxCost: 700,
        unit: 'job',
      },
      {
        id: 'cm-cleaning',
        category: 'cleaning',
        name: 'Deep Cleaning Services',
        minCost: 250,
        maxCost: 450,
        unit: 'job',
      },
      {
        id: 'cm-repairs-modifications',
        category: 'home_modification',
        name: 'Accessibility & Safety Modifications',
        minCost: 800,
        maxCost: 2500,
        unit: 'job',
      },
      {
        id: 'cm-storage',
        category: 'storage',
        name: 'Climate-Controlled Storage',
        minCost: 120,
        maxCost: 250,
        unit: 'month',
      },
    ];

    defaults.forEach((cm) => this.costModels.set(cm.id, cm));
  }

  public clear() {
    this.cases.clear();
    this.seniorProfiles.clear();
    this.caseMembers.clear();
    this.tasks.clear();
    this.taskDependencies = [];
    this.caseEvents = [];
    this.costItems.clear();
    this.intakeDrafts.clear();
    this.planDrafts.clear();
    this.caseLocations.clear();
    this.users.clear();
  }
}

// Global singleton instance for in-memory mode across Next.js reloads
const globalForMemory = globalThis as unknown as {
  moveWellMemoryStore: MemoryStore | undefined;
};

export const memoryStore =
  globalForMemory.moveWellMemoryStore ?? new MemoryStore();

if (process.env.NODE_ENV !== 'production') {
  globalForMemory.moveWellMemoryStore = memoryStore;
}
