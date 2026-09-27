import {
  TransitionCase,
  SeniorProfile,
  CaseMember,
  TransitionTask,
  TaskDependency,
  CaseEvent,
  CostModel,
  ServiceResource,
  CostItem,
  IntakeDraftRecord,
  PlanDraft,
  CaseLocation,
  UserProfile,
} from '../types';
import { memoryStore } from './memory-store';
import { supabase } from './client';

export class Repository {
  // --- Transition Cases ---
  async saveCase(caseData: TransitionCase): Promise<TransitionCase> {
    memoryStore.cases.set(caseData.id, { ...caseData });

    if (supabase) {
      const dbZip = caseData.zipCode?.trim() || 'UNSET';
      const dbBudget =
        caseData.budget !== undefined && caseData.budget !== null && !isNaN(Number(caseData.budget))
          ? Number(caseData.budget)
          : 0;

      const { error } = await supabase.from('transition_cases').upsert({
        id: caseData.id,
        owner_user_id: caseData.ownerUserId || null,
        transition_type: caseData.transitionType,
        urgency: caseData.urgency,
        zip_code: dbZip,
        target_date: caseData.targetDate || null,
        discharge_date: caseData.dischargeDate || null,
        housing_status: caseData.housingStatus || null,
        destination_status: caseData.destinationStatus || null,
        budget: dbBudget,
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
          ownerUserId: data.owner_user_id || undefined,
          transitionType: data.transition_type,
          urgency: data.urgency,
          zipCode: data.zip_code && data.zip_code !== 'UNSET' && data.zip_code !== '' ? data.zip_code : undefined,
          targetDate: data.target_date || undefined,
          dischargeDate: data.discharge_date || undefined,
          housingStatus: data.housing_status || undefined,
          destinationStatus: data.destination_status || undefined,
          budget: data.budget && Number(data.budget) > 0 ? Number(data.budget) : undefined,
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
          zipCode: d.zip_code && d.zip_code !== 'UNSET' && d.zip_code !== '' ? d.zip_code : undefined,
          targetDate: d.target_date || undefined,
          dischargeDate: d.discharge_date || undefined,
          housingStatus: d.housing_status || undefined,
          destinationStatus: d.destination_status || undefined,
          budget: d.budget && Number(d.budget) > 0 ? Number(d.budget) : undefined,
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
        user_id: member.userId || null,
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
        const list: CaseMember[] = data.map((m) => ({
          id: m.id,
          caseId: m.case_id,
          userId: m.user_id || undefined,
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

  // --- Cost Items ---
  async saveCostItem(item: CostItem): Promise<CostItem> {
    memoryStore.costItems.set(item.id, { ...item });

    if (supabase) {
      try {
        const { error } = await supabase.from('cost_items').upsert({
          id: item.id,
          case_id: item.caseId,
          category: item.category,
          description: item.description,
          source: item.source,
          amount: item.amount || null,
          min_amount: item.minAmount || null,
          max_amount: item.maxAmount || null,
          provider_name: item.providerName || null,
          document_name: item.documentName || null,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        });
        if (error) {
          console.warn('Supabase saveCostItem warning (using memory):', error.message);
        }
      } catch (err) {
        // Fallback to memoryStore
      }
    }

    return item;
  }

  async getCostItemsByCaseId(caseId: string): Promise<CostItem[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('cost_items')
          .select('*')
          .eq('case_id', caseId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            caseId: d.case_id,
            category: d.category,
            description: d.description,
            source: d.source,
            amount: d.amount ? Number(d.amount) : undefined,
            minAmount: d.min_amount ? Number(d.min_amount) : undefined,
            maxAmount: d.max_amount ? Number(d.max_amount) : undefined,
            providerName: d.provider_name || undefined,
            documentName: d.document_name || undefined,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err) {
        // Fallback to memoryStore
      }
    }

    return Array.from(memoryStore.costItems.values()).filter(
      (item) => item.caseId === caseId
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
          website: org?.website,
          location: loc,
          verification: ver,
        };
      });
  }

  // --- Intake Drafts ---
  async saveIntakeDraft(record: IntakeDraftRecord): Promise<IntakeDraftRecord> {
    memoryStore.intakeDrafts.set(record.id, { ...record });
    if (supabase) {
      const { error } = await supabase.from('intake_drafts').upsert({
        id: record.id,
        owner_user_id: record.ownerUserId,
        data: record.data,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
      if (error) {
        console.error('Supabase saveIntakeDraft error:', error);
      }
    }
    return record;
  }

  async getIntakeDraftById(id: string): Promise<IntakeDraftRecord | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('intake_drafts')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        const record: IntakeDraftRecord = {
          id: data.id,
          ownerUserId: data.owner_user_id,
          data: data.data,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        memoryStore.intakeDrafts.set(record.id, record);
        return record;
      }
    }
    return memoryStore.intakeDrafts.get(id) || null;
  }

  // --- Plan Drafts ---
  async savePlanDraft(draft: PlanDraft): Promise<PlanDraft> {
    memoryStore.planDrafts.set(draft.id, { ...draft });
    if (supabase) {
      const { error } = await supabase.from('plan_drafts').upsert({
        id: draft.id,
        owner_user_id: draft.ownerUserId,
        intake_draft_id: draft.intakeDraftId || null,
        senior_profile: draft.seniorProfile,
        discharge_timing: draft.dischargeTiming || null,
        proposed_tasks: draft.proposedTasks,
        proposed_members: draft.proposedMembers,
        proposed_budget: draft.proposedBudget !== undefined ? draft.proposedBudget : null,
        budget_status: draft.budgetStatus,
        proposed_locations: draft.proposedLocations,
        proposed_resource_needs: draft.proposedResourceNeeds,
        status: draft.status,
        case_id: draft.caseId || null,
        created_at: draft.createdAt,
        updated_at: draft.updatedAt,
      });
      if (error) {
        console.error('Supabase savePlanDraft error:', error);
      }
    }
    return draft;
  }

  async getPlanDraftById(id: string): Promise<PlanDraft | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('plan_drafts')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        const draft: PlanDraft = {
          id: data.id,
          ownerUserId: data.owner_user_id,
          intakeDraftId: data.intake_draft_id || undefined,
          seniorProfile: data.senior_profile,
          dischargeTiming: data.discharge_timing || undefined,
          proposedTasks: data.proposed_tasks || [],
          proposedMembers: data.proposed_members || [],
          proposedBudget: data.proposed_budget !== null && data.proposed_budget !== undefined ? Number(data.proposed_budget) : undefined,
          budgetStatus: data.budget_status || 'UNSET',
          proposedLocations: data.proposed_locations || [],
          proposedResourceNeeds: data.proposed_resource_needs || [],
          status: data.status,
          caseId: data.case_id || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        memoryStore.planDrafts.set(draft.id, draft);
        return draft;
      }
    }
    return memoryStore.planDrafts.get(id) || null;
  }

  async updatePlanDraft(id: string, updates: Partial<PlanDraft>): Promise<PlanDraft> {
    const existing = await this.getPlanDraftById(id);
    if (!existing) {
      throw new Error(`PlanDraft not found: ${id}`);
    }
    const updated: PlanDraft = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.savePlanDraft(updated);
  }

  // --- Case Locations ---
  async saveCaseLocation(loc: CaseLocation): Promise<CaseLocation> {
    memoryStore.caseLocations.set(loc.id, { ...loc });
    if (supabase) {
      const { error } = await supabase.from('case_locations').upsert({
        id: loc.id,
        plan_draft_id: loc.planDraftId || null,
        case_id: loc.caseId || null,
        type: loc.type,
        label: loc.label,
        address: loc.address || null,
        city: loc.city || null,
        state: loc.state || null,
        zip_code: loc.zipCode || null,
        latitude: loc.latitude || null,
        longitude: loc.longitude || null,
        external_place_id: loc.externalPlaceId || null,
        created_at: loc.createdAt || new Date().toISOString(),
      });
      if (error) {
        console.error('Supabase saveCaseLocation error:', error);
      }
    }
    return loc;
  }

  async getLocationsForDraft(planDraftId: string): Promise<CaseLocation[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('case_locations')
        .select('*')
        .eq('plan_draft_id', planDraftId);
      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          planDraftId: d.plan_draft_id || undefined,
          caseId: d.case_id || undefined,
          type: d.type,
          label: d.label,
          address: d.address || undefined,
          city: d.city || undefined,
          state: d.state || undefined,
          zipCode: d.zip_code || undefined,
          latitude: d.latitude ? Number(d.latitude) : undefined,
          longitude: d.longitude ? Number(d.longitude) : undefined,
          externalPlaceId: d.external_place_id || undefined,
          createdAt: d.created_at,
        }));
      }
    }
    return Array.from(memoryStore.caseLocations.values()).filter(
      (l) => l.planDraftId === planDraftId
    );
  }

  async getLocationsForCase(caseId: string): Promise<CaseLocation[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('case_locations')
        .select('*')
        .eq('case_id', caseId);
      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          planDraftId: d.plan_draft_id || undefined,
          caseId: d.case_id || undefined,
          type: d.type,
          label: d.label,
          address: d.address || undefined,
          city: d.city || undefined,
          state: d.state || undefined,
          zipCode: d.zip_code || undefined,
          latitude: d.latitude ? Number(d.latitude) : undefined,
          longitude: d.longitude ? Number(d.longitude) : undefined,
          externalPlaceId: d.external_place_id || undefined,
          createdAt: d.created_at,
        }));
      }
    }
    return Array.from(memoryStore.caseLocations.values()).filter(
      (l) => l.caseId === caseId
    );
  }

  // --- Authorization & Access Control ---
  async checkDraftAccess(draftId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    const draft = await this.getPlanDraftById(draftId);
    if (!draft) return false;
    return draft.ownerUserId === userId;
  }

  async checkCaseAccess(caseId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    const c = await this.getCaseById(caseId);
    if (!c) return false;
    if (c.ownerUserId === userId) return true;
    const members = await this.getCaseMembers(caseId);
    return members.some((m) => m.userId === userId);
  }

  // Clear helper for tests
  async resetAll(): Promise<void> {
    memoryStore.clear();
  }
}

export const repository = new Repository();
