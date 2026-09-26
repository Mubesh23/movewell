import { repository } from '../db/repository';
import { eventService } from './event-service';
import { TaskStatus, TransitionTask } from '../types';

export class TaskService {
  /**
   * Recalculates readiness for all tasks in a case.
   * A task is BLOCKED if any of its required dependencies are NOT COMPLETED or SKIPPED.
   * A task is READY if all dependencies are satisfied and its status was previously BLOCKED or NOT_STARTED.
   */
  public async recalculateDependencies(caseId: string): Promise<TransitionTask[]> {
    const tasks = await repository.getTasksByCaseId(caseId);
    const deps = await repository.getTaskDependenciesByCaseId(caseId);

    const taskMap = new Map<string, TransitionTask>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    // Map taskId -> array of dependsOnTaskIds
    const dependenciesForTask = new Map<string, string[]>();
    deps.forEach((d) => {
      const existing = dependenciesForTask.get(d.taskId) || [];
      existing.push(d.dependsOnTaskId);
      dependenciesForTask.set(d.taskId, existing);
    });

    const updatedTasks: TransitionTask[] = [];

    for (const task of tasks) {
      // Do not overwrite explicitly COMPLETED or SKIPPED statuses
      if (task.status === 'COMPLETED' || task.status === 'SKIPPED') {
        updatedTasks.push(task);
        continue;
      }

      const requiredDepIds = dependenciesForTask.get(task.id) || task.dependsOnTaskIds || [];
      
      let allDependenciesSatisfied = true;
      for (const depId of requiredDepIds) {
        const depTask = taskMap.get(depId);
        if (!depTask || (depTask.status !== 'COMPLETED' && depTask.status !== 'SKIPPED')) {
          allDependenciesSatisfied = false;
          break;
        }
      }

      let newStatus: TaskStatus = task.status;
      if (!allDependenciesSatisfied) {
        newStatus = 'BLOCKED';
      } else if (task.status === 'BLOCKED') {
        newStatus = 'READY';
      } else if (task.status === 'NOT_STARTED') {
        newStatus = 'READY';
      }

      if (newStatus !== task.status) {
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        await repository.saveTask(task);
      }
      updatedTasks.push(task);
    }

    return updatedTasks;
  }

  public async completeTask(
    taskId: string,
    actorName: string = 'Sarah',
    expectedCaseId?: string
  ): Promise<TransitionTask> {
    const task = await repository.getTaskById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (expectedCaseId && task.caseId !== expectedCaseId) {
      throw new Error(`Task ${taskId} does not belong to case ${expectedCaseId}`);
    }

    task.status = 'COMPLETED';
    task.updatedAt = new Date().toISOString();
    await repository.saveTask(task);

    // Record Event
    await eventService.recordEvent(task.caseId, 'TASK_COMPLETED', {
      taskId: task.id,
      taskTitle: task.title,
      completedBy: actorName,
    });

    // Recalculate downstream task dependencies
    await this.recalculateDependencies(task.caseId);

    return (await repository.getTaskById(taskId))!;
  }

  public async reopenTask(
    taskId: string,
    actorName: string = 'Sarah',
    expectedCaseId?: string
  ): Promise<TransitionTask> {
    const task = await repository.getTaskById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (expectedCaseId && task.caseId !== expectedCaseId) {
      throw new Error(`Task ${taskId} does not belong to case ${expectedCaseId}`);
    }

    task.status = 'READY'; // Temporary, recalculation will set to BLOCKED if dependencies aren't met
    task.updatedAt = new Date().toISOString();
    await repository.saveTask(task);

    // Record Event
    await eventService.recordEvent(task.caseId, 'TASK_REOPENED', {
      taskId: task.id,
      taskTitle: task.title,
      reopenedBy: actorName,
    });

    // Recalculate downstream task dependencies
    await this.recalculateDependencies(task.caseId);

    return (await repository.getTaskById(taskId))!;
  }

  public async assignTask(
    taskId: string,
    assigneeId: string,
    assigneeName: string,
    expectedCaseId?: string
  ): Promise<TransitionTask> {
    const task = await repository.getTaskById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (expectedCaseId && task.caseId !== expectedCaseId) {
      throw new Error(`Task ${taskId} does not belong to case ${expectedCaseId}`);
    }

    task.assigneeId = assigneeId;
    task.updatedAt = new Date().toISOString();
    await repository.saveTask(task);

    await eventService.recordEvent(task.caseId, 'TASK_ASSIGNED', {
      taskId: task.id,
      taskTitle: task.title,
      assigneeId,
      assigneeName,
    });

    return task;
  }
}

export const taskService = new TaskService();
