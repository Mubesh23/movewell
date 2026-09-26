import {
  TransitionCase,
  SeniorProfile,
  CaseMember,
  TransitionTask,
  TaskDependency,
  CaseEvent,
  CostModel,
  ServiceResource,
} from '../types';
import { memoryStore } from './memory-store';

export class Repository {
  // --- Transition Cases ---
  async saveCase(caseData: TransitionCase): Promise<TransitionCase> {
    memoryStore.cases.set(caseData.id, { ...caseData });
    return caseData;
  }

  async getCaseById(id: string): Promise<TransitionCase | null> {
    return memoryStore.cases.get(id) || null;
  }

  async listCases(): Promise<TransitionCase[]> {
    return Array.from(memoryStore.cases.values());
  }

  // --- Senior Profiles ---
  async saveSeniorProfile(profile: SeniorProfile): Promise<SeniorProfile> {
    memoryStore.seniorProfiles.set(profile.id, { ...profile });
    return profile;
  }

  async getSeniorProfileByCaseId(caseId: string): Promise<SeniorProfile | null> {
    for (const profile of memoryStore.seniorProfiles.values()) {
      if (profile.caseId === caseId) return profile;
    }
    return null;
  }

  // --- Case Members ---
  async saveCaseMember(member: CaseMember): Promise<CaseMember> {
    memoryStore.caseMembers.set(member.id, { ...member });
    return member;
  }

  async getCaseMembers(caseId: string): Promise<CaseMember[]> {
    return Array.from(memoryStore.caseMembers.values()).filter(
      (m) => m.caseId === caseId
    );
  }

  // --- Tasks ---
  async saveTask(task: TransitionTask): Promise<TransitionTask> {
    memoryStore.tasks.set(task.id, { ...task });
    return task;
  }

  async saveTasks(tasks: TransitionTask[]): Promise<TransitionTask[]> {
    tasks.forEach((t) => memoryStore.tasks.set(t.id, { ...t }));
    return tasks;
  }

  async getTasksByCaseId(caseId: string): Promise<TransitionTask[]> {
    return Array.from(memoryStore.tasks.values())
      .filter((t) => t.caseId === caseId)
      .sort((a, b) => a.priority - b.priority);
  }

  async getTaskById(taskId: string): Promise<TransitionTask | null> {
    return memoryStore.tasks.get(taskId) || null;
  }

  // --- Dependencies ---
  async saveTaskDependencies(deps: TaskDependency[]): Promise<TaskDependency[]> {
    // Avoid duplicate dependencies
    deps.forEach((newDep) => {
      const exists = memoryStore.taskDependencies.some(
        (d) =>
          d.taskId === newDep.taskId &&
          d.dependsOnTaskId === newDep.dependsOnTaskId
      );
      if (!exists) {
        memoryStore.taskDependencies.push(newDep);
      }
    });
    return memoryStore.taskDependencies;
  }

  async getTaskDependenciesByCaseId(caseId: string): Promise<TaskDependency[]> {
    const caseTasks = await this.getTasksByCaseId(caseId);
    const caseTaskIds = new Set(caseTasks.map((t) => t.id));
    return memoryStore.taskDependencies.filter((dep) =>
      caseTaskIds.has(dep.taskId)
    );
  }

  // --- Case Events ---
  async saveCaseEvent(event: CaseEvent): Promise<CaseEvent> {
    memoryStore.caseEvents.push(event);
    return event;
  }

  async getCaseEvents(caseId: string): Promise<CaseEvent[]> {
    return memoryStore.caseEvents
      .filter((e) => e.caseId === caseId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // --- Cost Models ---
  async getCostModels(): Promise<CostModel[]> {
    return Array.from(memoryStore.costModels.values());
  }

  // --- Resources (Open Referral HSDS) ---
  async findServices(category?: string, zipCode?: string): Promise<ServiceResource[]> {
    const services = Array.from(memoryStore.services.values());

    return services
      .filter((s) => !category || category === 'ALL' || s.category === category)
      .map((s) => {
        const org = memoryStore.organizations.get(s.organizationId);
        const loc = Array.from(memoryStore.locations.values()).find(
          (l) => l.organizationId === s.organizationId
        );
        const ver = Array.from(memoryStore.resourceVerifications.values()).find(
          (v) => v.serviceId === s.id
        );

        return {
          ...s,
          organizationName: org?.name,
          location: loc,
          verification: ver,
        };
      });
  }

  // Clear helper for tests
  async resetAll(): Promise<void> {
    memoryStore.clear();
  }
}

export const repository = new Repository();
