import { repository } from '../db/repository';
import { CaseEvent, CaseEventType } from '../types';

export class EventService {
  async recordEvent(
    caseId: string,
    type: CaseEventType,
    payload: Record<string, any>,
    actorType: 'USER' | 'AI' | 'SYSTEM' = 'USER',
    actorId?: string
  ): Promise<CaseEvent> {
    const event: CaseEvent = {
      id: 'evt-' + Math.random().toString(36).substring(2, 11),
      caseId,
      type,
      actorType,
      actorId,
      payload,
      createdAt: new Date().toISOString(),
    };

    return await repository.saveCaseEvent(event);
  }

  async getCaseEvents(caseId: string): Promise<CaseEvent[]> {
    return await repository.getCaseEvents(caseId);
  }
}

export const eventService = new EventService();
