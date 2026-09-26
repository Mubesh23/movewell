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
import { supabase } from './client';

export class Repository {
  // --- Transition Cases ---
  async saveCase(caseData: TransitionCase): Promise<TransitionCase> {
    memoryStore.cases.set(caseData.id, { ...caseData });

    if (supabase) {
      const { error } = await supabase.from('transition_cases').upsert({
        id: caseData.id,
        transition_type: caseData.transitionType,
        urgency: caseData.urgency,
        zip_code: caseData.zipCode,
        target_date: caseData.targetDate || null,
        discharge_date: caseData.dischargeDate || null,
        housing_status: caseData.housingStatus || null,
        destination_status: caseData.destinationStatus || null,
        budget: caseData.budget,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Supabase saveCase error:', error);
        throw new Error(`Database saveCase failed: ${error.message}`);
      }
    }

    return caseData;
  }

  async getCaseById(id: string): Promise<TransitionCase | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('transition_cases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return memoryStore.cases.get(id) || null;
        }
        console.error('Supabase getCaseById error:', error);
        throw new Error(`Database getCaseById failed: ${error.message}`);
      }

      if (data) {
        const cData: TransitionCase = {
          id: data.id,
          transitionType: data.transition_type,
          urgency: data.urgency,
          zipCode: data.zip_code,
          targetDate: data.target_date || undefined,
          dischargeDate: data.discharge_date || undefined,
          housingStatus: data.housing_status || undefined,
          destinationStatus: data.destination_status || undefined,
          budget: Number(data.budget),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        memoryStore.cases.set(cData.id, cData);
        return cData;
      }
    }

    return memoryStore.cases.get(id) || null;
  }

  async listCases(): Promise<TransitionCase[]> {
    if (supabase) {
      const { data, error } = await supabase.from('transition_cases').select('*');
      if (error) {
        console.error('Supabase listCases error:', error);
        throw new Error(`Database listCases failed: ${error.message}`);
      }
      if (data) {
        return data.map((d) => ({
          id: d.id,
          transitionType: d.transition_type,
          urgency: d.urgency,
          zipCode: d.zip_code,
          targetDate: d.target_date || undefined,
          dischargeDate: d.discharge_date || undefined,
          housingStatus: d.housing_status || undefined,
          destinationStatus: d.destination_status || undefined,
          budget: Number(d.budget),
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
      }
    }
    return Array.from(memoryStore.cases.values());
  }

  // --- Senior Profiles ---
  async saveSeniorProfile(profile: SeniorProfile): Promise<SeniorProfile> {
    memoryStore.seniorProfiles.set(profile.id, { ...profile });

    if (supabase) {
      const { error } = await supabase.from('senior_profiles').upsert({
        id: profile.id,
        case_id: profile.caseId,
        name: profile.name,
        age_range: profile.ageRange || null,
        lives_alone: profile.livesAlone,
        mobility_constraint: profile.mobilityConstraint,
        stairs_constraint: profile.stairsConstraint,
        immediate_safety_concern: profile.immediateSafetyConcern,
        home_type: profile.homeType || null,
        owns_home: profile.ownsHome,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Supabase saveSeniorProfile error:', error);
        throw new Error(`Database saveSeniorProfile failed: ${error.message}`);
      }
    }

    return profile;
  }

  async getSeniorProfileByCaseId(caseId: string): Promise<SeniorProfile | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('senior_profiles')
        .select('*')
        .eq('case_id', caseId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          for (const profile of memoryStore.seniorProfiles.values()) {
            if (profile.caseId === caseId) return profile;
          }
          return null;
        }
        console.error('Supabase getSeniorProfileByCaseId error:', error);
        throw new Error(`Database getSeniorProfileByCaseId failed: ${error.message}`);
      }

      if (data) {
        const p: SeniorProfile = {
          id: data.id,
          caseId: data.case_id,
          name: data.name,
          ageRange: data.age_range || undefined,
          livesAlone: data.lives_alone,
          mobilityConstraint: data.mobility_constraint,
          stairsConstraint: data.stairs_constraint,
          immediateSafetyConcern: data.immediate_safety_concern,
          homeType: data.home_type || undefined,
          ownsHome: data.owns_home,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        memoryStore.seniorProfiles.set(p.id, p);
        return p;
      }
    }

    for (const profile of memoryStore.seniorProfiles.values()) {
      if (profile.caseId === caseId) return profile;
    }
    return null;
  }

  // --- Case Members ---
  async saveCaseMember(member: CaseMember): Promise<CaseMember> {
    memoryStore.caseMembers.set(member.id, { ...member });

    if (supabase) {
      const { error } = await supabase.from('case_members').upsert({
        id: member.id,
        case_id: member.caseId,
        name: member.name,
        relationship: member.relationship || null,
        city: member.city || null,
        is_local: member.isLocal,
        availability: member.availability || null,
        role: member.role,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Supabase saveCaseMember error:', error);
        throw new Error(`Database saveCaseMember failed: ${error.message}`);
      }
    }

    return member;
  }

  async deleteCaseMember(id: string, caseId?: string): Promise<boolean> {
    const mem = memoryStore.caseMembers.get(id);
    if (caseId && mem && mem.caseId !== caseId) {
      throw new Error(`Member ${id} does not belong to case ${caseId}`);
    }
    memoryStore.caseMembers.delete(id);

    if (supabase) {
      let query = supabase.from('case_members').delete().eq('id', id);
      if (caseId) {
        query = query.eq('case_id', caseId);
      }
      const { error } = await query;
      if (error) {
        console.error('Supabase deleteCaseMember error:', error);
        throw new Error(`Database deleteCaseMember failed: ${error.message}`);
      }
    }

    return true;
  }

  async getCaseMembers(caseId: string): Promise<CaseMember[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('case_members')
        .select('*')
        .eq('case_id', caseId);

      if (error) {
        console.error('Supabase getCaseMembers error:', error);
        throw new Error(`Database getCaseMembers failed: ${error.message}`);
      }

      if (data) {
        const list = data.map((m) => ({
          id: m.id,
          caseId: m.case_id,
          name: m.name,
          relationship: m.relationship || undefined,
          city: m.city || undefined,
          isLocal: m.is_local,
          availability: m.availability || undefined,
          role: m.role,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
        }));
        list.forEach((m) => memoryStore.caseMembers.set(m.id, m));
        return list;
      }
    }

    return Array.from(memoryStore.caseMembers.values()).filter(
      (m) => m.caseId === caseId
    );
  }

  // --- Tasks ---
  async saveTask(task: TransitionTask): Promise<TransitionTask> {
    memoryStore.tasks.set(task.id, { ...task });

    if (supabase) {
      const { error } = await supabase.from('tasks').upsert({
        id: task.id,
        case_id: task.caseId,
        template_id: task.templateId || null,
        title: task.title,
        description: task.description || null,
        why_it_matters: task.whyItMatters || null,
        completion_notes: task.completionNotes || null,
        status: task.status,
        priority: task.priority,
        phase: task.phase,
        due_date: task.dueDate || null,
        assignee_id: task.assigneeId || null,
        min_estimated_cost: task.minEstimatedCost,
        max_estimated_cost: task.maxEstimatedCost,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Supabase saveTask error:', error);
        throw new Error(`Database saveTask failed: ${error.message}`);
      }
    }

    return task;
  }

  async saveTasks(tasks: TransitionTask[]): Promise<TransitionTask[]> {
    for (const t of tasks) {
      await this.saveTask(t);
    }
    return tasks;
  }

  async getTasksByCaseId(caseId: string): Promise<TransitionTask[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('priority', { ascending: true });

      if (error) {
        console.error('Supabase getTasksByCaseId error:', error);
        throw new Error(`Database getTasksByCaseId failed: ${error.message}`);
      }

      if (data) {
        const list = data.map((t) => ({
          id: t.id,
          caseId: t.case_id,
          templateId: t.template_id || undefined,
          title: t.title,
          description: t.description || undefined,
          whyItMatters: t.why_it_matters || undefined,
          completionNotes: t.completion_notes || undefined,
          status: t.status,
          priority: t.priority,
          phase: t.phase,
          dueDate: t.due_date || undefined,
          assigneeId: t.assignee_id || undefined,
          minEstimatedCost: Number(t.min_estimated_cost),
          maxEstimatedCost: Number(t.max_estimated_cost),
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
        list.forEach((t) => memoryStore.tasks.set(t.id, t));
        return list;
      }
    }

    return Array.from(memoryStore.tasks.values())
      .filter((t) => t.caseId === caseId)
      .sort((a, b) => a.priority - b.priority);
  }

  async getTaskById(taskId: string): Promise<TransitionTask | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return memoryStore.tasks.get(taskId) || null;
        }
        console.error('Supabase getTaskById error:', error);
        throw new Error(`Database getTaskById failed: ${error.message}`);
      }

      if (data) {
        const t: TransitionTask = {
          id: data.id,
          caseId: data.case_id,
          templateId: data.template_id || undefined,
          title: data.title,
          description: data.description || undefined,
          whyItMatters: data.why_it_matters || undefined,
          completionNotes: data.completion_notes || undefined,
          status: data.status,
          priority: data.priority,
          phase: data.phase,
          dueDate: data.due_date || undefined,
          assigneeId: data.assignee_id || undefined,
          minEstimatedCost: Number(data.min_estimated_cost),
          maxEstimatedCost: Number(data.max_estimated_cost),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        memoryStore.tasks.set(t.id, t);
        return t;
      }
    }

    return memoryStore.tasks.get(taskId) || null;
  }

  // --- Task Dependencies ---
  async saveTaskDependencies(deps: TaskDependency[]): Promise<TaskDependency[]> {
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

    if (supabase && deps.length > 0) {
      const rows = deps.map((d) => ({
        task_id: d.taskId,
        depends_on_task_id: d.dependsOnTaskId,
      }));
      const { error } = await supabase.from('task_dependencies').upsert(rows);
      if (error) {
        console.error('Supabase saveTaskDependencies error:', error);
        throw new Error(`Database saveTaskDependencies failed: ${error.message}`);
      }
    }

    return memoryStore.taskDependencies;
  }

  async getTaskDependenciesByCaseId(caseId: string): Promise<TaskDependency[]> {
    if (supabase) {
      const caseTasks = await this.getTasksByCaseId(caseId);
      const caseTaskIds = caseTasks.map((t) => t.id);
      if (caseTaskIds.length > 0) {
        const { data, error } = await supabase
          .from('task_dependencies')
          .select('*')
          .in('task_id', caseTaskIds);

        if (error) {
          console.error('Supabase getTaskDependenciesByCaseId error:', error);
          throw new Error(`Database getTaskDependenciesByCaseId failed: ${error.message}`);
        }

        if (data) {
          return data.map((d) => ({
            taskId: d.task_id,
            dependsOnTaskId: d.depends_on_task_id,
          }));
        }
      }
    }

    const caseTasks = await this.getTasksByCaseId(caseId);
    const caseTaskIds = new Set(caseTasks.map((t) => t.id));
    return memoryStore.taskDependencies.filter((dep) =>
      caseTaskIds.has(dep.taskId)
    );
  }

  // --- Case Events ---
  async saveCaseEvent(event: CaseEvent): Promise<CaseEvent> {
    memoryStore.caseEvents.push(event);

    if (supabase) {
      const { error } = await supabase.from('case_events').insert({
        id: event.id,
        case_id: event.caseId,
        type: event.type,
        actor_type: event.actorType,
        actor_id: event.actorId || null,
        payload: event.payload,
        created_at: event.createdAt,
      });
      if (error) {
        console.error('Supabase saveCaseEvent error:', error);
        throw new Error(`Database saveCaseEvent failed: ${error.message}`);
      }
    }

    return event;
  }

  async getCaseEvents(caseId: string): Promise<CaseEvent[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('case_events')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getCaseEvents error:', error);
        throw new Error(`Database getCaseEvents failed: ${error.message}`);
      }

      if (data) {
        return data.map((e) => ({
          id: e.id,
          caseId: e.case_id,
          type: e.type,
          actorType: e.actor_type,
          actorId: e.actor_id || undefined,
          payload: e.payload,
          createdAt: e.created_at,
        }));
      }
    }

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

  // --- Resources (Open Referral HSDS & ZIP Area Matching) ---
  async findServices(category?: string, zipCode?: string): Promise<ServiceResource[]> {
    const services = Array.from(memoryStore.services.values());

    return services
      .filter((s) => {
        const matchesCategory = !category || category === 'ALL' || s.category === category;
        const loc = Array.from(memoryStore.locations.values()).find(
          (l) => l.organizationId === s.organizationId
        );
        // ZIP Code area matching (e.g. 770xx Houston Harris County area)
        const matchesZip =
          !zipCode ||
          !loc ||
          loc.zipCode === zipCode ||
          (zipCode.slice(0, 3) === loc.zipCode.slice(0, 3));

        return matchesCategory && matchesZip;
      })
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
