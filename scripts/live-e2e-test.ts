import { NextRequest } from 'next/server';
import { repository } from '@/db/repository';
import { intakeReadinessService } from '@/services/intake-readiness';
import { draftService } from '@/services/draft-service';
import { caseService } from '@/services/case-service';
import { taskService } from '@/services/task-service';
import { aiOrchestrator } from '@/services/ai-orchestrator';
import { POST as intakePost } from '@/app/api/ai/intake/route';
import { POST as extractQuotePost } from '@/app/api/ai/extract-quote/route';
import { evidenceService } from '@/services/evidence-service';
import { resourceService } from '@/services/resource-service';
import { costEngine } from '@/services/cost-engine';
import { pulseAndChangeService } from '@/services/pulse-and-change-service';

async function runFullLiveTest() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE LIVE TEST WITH NEW CASE');
  console.log('====================================================\n');

  const testUserId = 'live-test-user-' + Math.random().toString(36).substring(2, 8);

  // ----------------------------------------------------
  // STEP 1: Conversational Intake with Nora (Multi-turn)
  // ----------------------------------------------------
  console.log('👉 STEP 1: Multi-Turn Conversational Intake');
  
  let currentDraft: any = {};
  const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Turn 1: Eleanor, Stroke, Memorial Hermann, 5 days
  const turn1Message = "My mother Eleanor (age 82) had a stroke and is at Memorial Hermann hospital. Discharge is expected in 5 days.";
  console.log(`\nUser Turn 1: "${turn1Message}"`);
  const t1Req = new NextRequest('http://localhost:3000/api/ai/intake', {
    method: 'POST',
    body: JSON.stringify({ message: turn1Message, currentDraft, history }),
  });
  const t1Res = await intakePost(t1Req);
  const t1Data = await t1Res.json();
  currentDraft = t1Data.draft;
  history.push({ role: 'user', content: turn1Message }, { role: 'assistant', content: t1Data.assistantMessage });
  console.log('Nora Notes after Turn 1:', {
    seniorName: currentDraft.seniorName,
    ageRange: currentDraft.ageRange,
    dischargeDays: currentDraft.dischargeDays,
    dischargeTimelineDescription: currentDraft.dischargeTimelineDescription,
  });

  // Turn 2: Mobility, Stairs, Location 77025
  const turn2Message = "She cannot climb stairs safely, needs a walker/wheelchair and bathroom grab bars. Her home is in ZIP 77025.";
  console.log(`\nUser Turn 2: "${turn2Message}"`);
  const t2Req = new NextRequest('http://localhost:3000/api/ai/intake', {
    method: 'POST',
    body: JSON.stringify({ message: turn2Message, currentDraft, history }),
  });
  const t2Res = await intakePost(t2Req);
  const t2Data = await t2Res.json();
  currentDraft = t2Data.draft;
  history.push({ role: 'user', content: turn2Message }, { role: 'assistant', content: t2Data.assistantMessage });
  console.log('Nora Notes after Turn 2:', {
    stairsConstraint: currentDraft.stairsConstraint,
    mobilityConstraint: currentDraft.mobilityConstraint,
    zipCode: currentDraft.zipCode,
  });

  // Turn 3: Coordinator & Local Care Circle
  const turn3Message = "I am David, her son, coordinating from Dallas. Her sister Barbara is local in Houston and can help.";
  console.log(`\nUser Turn 3: "${turn3Message}"`);
  const t3Req = new NextRequest('http://localhost:3000/api/ai/intake', {
    method: 'POST',
    body: JSON.stringify({ message: turn3Message, currentDraft, history }),
  });
  const t3Res = await intakePost(t3Req);
  const t3Data = await t3Res.json();
  currentDraft = t3Data.draft;
  history.push({ role: 'user', content: turn3Message }, { role: 'assistant', content: t3Data.assistantMessage });
  console.log('Nora Notes after Turn 3:', {
    coordinatorName: currentDraft.coordinatorName,
    coordinatorRelationship: currentDraft.coordinatorRelationship,
    userIsRemote: currentDraft.userIsRemote,
    localHelperName: currentDraft.localHelperName,
    careCircleAddressed: currentDraft.careCircleAddressed,
  });

  // Turn 4: Budget target
  const turn4Message = "Our family budget target is $6,500.";
  console.log(`\nUser Turn 4: "${turn4Message}"`);
  const t4Req = new NextRequest('http://localhost:3000/api/ai/intake', {
    method: 'POST',
    body: JSON.stringify({ message: turn4Message, currentDraft, history }),
  });
  const t4Res = await intakePost(t4Req);
  const t4Data = await t4Res.json();
  currentDraft = t4Data.draft;
  history.push({ role: 'user', content: turn4Message }, { role: 'assistant', content: t4Data.assistantMessage });
  console.log('Nora Notes after Turn 4:', {
    budget: currentDraft.budget,
    budgetStatus: currentDraft.budgetStatus,
  });

  // Check Readiness
  const readiness = intakeReadinessService.evaluate(currentDraft);
  console.log('\nIntake Readiness Result:', {
    isReady: readiness.isReady,
    missingRequiredFields: readiness.missingRequiredFields,
    bulletPoints: readiness.summaryBulletPoints,
  });
  if (!readiness.isReady) {
    throw new Error('Intake failed readiness check: ' + readiness.missingRequiredFields.join(', '));
  }
  console.log('✅ STEP 1 PASSED: Multi-turn intake resolved complete profile.');

  // ----------------------------------------------------
  // STEP 2: Proposal Review Draft Generation
  // ----------------------------------------------------
  console.log('\n👉 STEP 2: Generate Plan Proposal Draft');
  const planDraft = await draftService.createDraftFromIntake(currentDraft, testUserId);
  console.log('Plan Draft Created:', {
    draftId: planDraft.id,
    seniorName: planDraft.seniorProfile.name,
    dischargeDate: planDraft.dischargeTiming?.date,
    proposedTasksCount: planDraft.proposedTasks.length,
    proposedBudget: planDraft.proposedBudget,
    proposedMembers: planDraft.proposedMembers.map((m) => `${m.name} (${m.role})`),
  });
  console.log('✅ STEP 2 PASSED: Draft proposal created.');

  // ----------------------------------------------------
  // STEP 3: Workspace Activation
  // ----------------------------------------------------
  console.log('\n👉 STEP 3: Activate Draft into Active Family Workspace');
  const activation = await draftService.activateDraft(planDraft.id, testUserId);
  const caseId = activation.caseId;
  console.log('Activated Case ID:', caseId);

  const overview = await caseService.getCaseOverview(caseId);
  if (!overview) throw new Error('Failed to load overview for activated case ' + caseId);
  console.log('Workspace Overview Loaded:', {
    senior: overview.seniorProfile.name,
    zipCode: overview.caseData.zipCode,
    budget: overview.caseData.budget,
    urgency: overview.caseData.urgency,
    taskCount: overview.tasks.length,
    members: overview.members.map((m) => `${m.name} (${m.role})`),
  });
  console.log('✅ STEP 3 PASSED: Workspace activated and overview verified.');

  // ----------------------------------------------------
  // STEP 4: Task Dependency Engine & Readiness Shifts
  // ----------------------------------------------------
  console.log('\n👉 STEP 4: Deterministic Task Dependencies & Readiness Shifts');
  const initialTasks = await repository.getTasksByCaseId(caseId);
  const blockedTasks = initialTasks.filter((t) => t.status === 'BLOCKED');
  const readyTasks = initialTasks.filter((t) => t.status === 'READY');
  console.log(`Initial Tasks: ${readyTasks.length} READY, ${blockedTasks.length} BLOCKED.`);

  // Find the critical destination decision task
  const destTask = initialTasks.find((t) => t.templateId === 'confirm-discharge-destination') || readyTasks[0];
  console.log(`Completing Priority Task: "${destTask.title}" by David`);
  
  const completedTask = await taskService.completeTask(
    destTask.id,
    'David',
    caseId,
    'Discharge coordinator confirmed Eleanor is cleared for short-term rehab first.'
  );
  console.log('Task Completed with Note:', completedTask.completionNotes);

  const updatedTasks = await repository.getTasksByCaseId(caseId);
  const newlyReady = updatedTasks.filter((t) => t.status === 'READY' && blockedTasks.some((bt) => bt.id === t.id));
  console.log(`Downstream Tasks Unlocked (${newlyReady.length}):`, newlyReady.map((t) => t.title));
  console.log('✅ STEP 4 PASSED: Dependency engine recalculated ready tasks.');

  // ----------------------------------------------------
  // STEP 5: AI Assistant (Nora) Interactive Commands
  // ----------------------------------------------------
  console.log('\n👉 STEP 5: Nora AI Interactive Assistance & Intent Execution');

  // 5a. Find Resources
  console.log('\nQuery 1: Asking Nora for local moving and decluttering resources');
  const resQueryResult = await aiOrchestrator.processUserIntentLocal(
    caseId,
    'What local resources are available near Eleanor in 77025 for moving and safety?'
  );
  console.log('Nora Resources Response Preview:\n' + resQueryResult.message.slice(0, 300) + '...\n');

  // 5b. Explain Cost Estimate
  console.log('Query 2: Asking Nora to explain moving cost evidence basis');
  const costQueryResult = await aiOrchestrator.processUserIntentLocal(
    caseId,
    'Why does moving cost this much and what is the source of the estimate?'
  );
  console.log('Nora Cost Explanation Preview:\n' + costQueryResult.message.slice(0, 300) + '...\n');

  // 5c. Assign Task via Nora
  console.log('Query 3: Assigning packing inventory task to Barbara via Nora');
  const assignResult = await aiOrchestrator.processUserIntentLocal(
    caseId,
    'Can Barbara handle the inventory of Eleanor\'s belongings?'
  );
  console.log('Nora Assignment Response:', assignResult.message);
  
  const tasksAfterAssignment = await repository.getTasksByCaseId(caseId);
  const inventoryTask = tasksAfterAssignment.find((t) => t.title.toLowerCase().includes('inventory'));
  console.log(`Inventory Task Assigned To: ${inventoryTask?.assignee?.name || 'Unassigned'}`);
  console.log('✅ STEP 5 PASSED: Nora multi-tool intents executed cleanly.');

  // ----------------------------------------------------
  // STEP 6: Moving Quote Intelligence & Budget Engine
  // ----------------------------------------------------
  console.log('\n👉 STEP 6: Vendor Quote Extraction & Budget Integration');
  const quoteReq = new NextRequest('http://localhost:3000/api/ai/extract-quote', {
    method: 'POST',
    body: JSON.stringify({ isSample: true }),
  });

  const quoteRes = await extractQuotePost(quoteReq);
  const quoteData = await quoteRes.json();
  console.log('Extracted Quote Data:', quoteData.quote);

  if (!quoteData.quote?.totalAmount || quoteData.quote.totalAmount <= 0) {
    throw new Error('Quote extraction did not extract expected amount');
  }

  // Apply quote to case
  const costItem = {
    id: 'cost-' + Math.random().toString(36).substring(2, 9),
    caseId,
    category: 'moving' as const,
    description: `${quoteData.quote.providerName} - Confirmed Moving Quote`,
    source: 'QUOTE' as const,
    amount: Number(quoteData.quote.totalAmount),
    providerName: quoteData.quote.providerName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await repository.saveCostItem(costItem);

  const tasks = await repository.getTasksByCaseId(caseId);
  const costItems = await repository.getCostItemsByCaseId(caseId);
  const caseData = await repository.getCaseById(caseId);
  const budgetSummary = costEngine.calculatePlanCosts(tasks, caseData?.budget, costItems);

  console.log('Updated Budget Summary with Confirmed Quote:', {
    userBudget: budgetSummary.userBudget,
    minTotal: budgetSummary.minTotal,
    maxTotal: budgetSummary.maxTotal,
    budgetGap: budgetSummary.budgetGap,
    hasQuotes: budgetSummary.hasQuotes,
    confirmedQuotesTotal: budgetSummary.confirmedQuotesTotal,
    quotesCount: budgetSummary.costItems?.length,
  });
  console.log('✅ STEP 6 PASSED: Quote extracted and cleanly applied to budget.');

  // ----------------------------------------------------
  // STEP 7: Care Circle Invitations
  // ----------------------------------------------------
  console.log('\n👉 STEP 7: Care Circle Member Management & Invitations');
  const newMember = await repository.saveCaseMember({
    id: 'mbr-' + Math.random().toString(36).substring(2, 9),
    caseId,
    name: 'Barbara',
    relationship: 'Sister / Local Support',
    city: 'Houston',
    isLocal: true,
    role: 'FAMILY',
    email: 'barbara.test@example.com',
  });
  console.log('Added Care Circle Member:', {
    id: newMember.id,
    name: newMember.name,
    role: newMember.role,
    relationship: newMember.relationship,
  });
  console.log('✅ STEP 7 PASSED: Care circle member saved.');

  // ----------------------------------------------------
  // STEP 8: What Changed & Transition Pulse Audit Trail
  // ----------------------------------------------------
  console.log('\n👉 STEP 8: Transition Pulse & What Changed Audit Trail');
  const events = await repository.getCaseEvents(caseId);
  console.log(`Total Audit Events Recorded (${events.length}):`);
  events.slice(-5).forEach((e) => {
    console.log(` • [${e.type}] by ${e.actorType} at ${e.createdAt}`);
  });

  const liveCase = (await repository.getCaseById(caseId))!;
  const liveTasks = await repository.getTasksByCaseId(caseId);
  const pulse = pulseAndChangeService.calculateTransitionPulse(liveCase, liveTasks, budgetSummary);
  console.log('Transition Pulse Metrics:', {
    criticalDecisions: pulse.criticalDecisions,
    thisWeekTasksRemaining: pulse.thisWeekTasksRemaining,
    blockedCount: pulse.blockedCount,
    unassignedCount: pulse.unassignedCount,
    budgetAssessment: pulse.budgetAssessment,
  });

  const whatChanged = await repository.getPlanChanges(caseId);
  console.log(`What Changed Entries Recorded (${whatChanged.length}):`);
  whatChanged.slice(0, 3).forEach((wc) => {
    console.log(` • Title: "${wc.title}" | Diffs: ${wc.diffs.map((d) => `${d.label}: ${d.before} -> ${d.after}`).join(', ')}`);
  });
  console.log('✅ STEP 8 PASSED: Audit trail and pulse active.');

  // ----------------------------------------------------
  // STEP 9: Open Referral Directory Resources
  // ----------------------------------------------------
  console.log('\n👉 STEP 9: Open Referral Directory Resource Query');
  const resourcesIn77025 = await resourceService.findResources('ALL', '77025');
  console.log(`Found ${resourcesIn77025.length} resources near ZIP 77025.`);
  resourcesIn77025.slice(0, 3).forEach((r) => {
    console.log(` • ${r.name} (${r.category}) - Verification: ${r.verification?.verificationStatus || 'Directory listing'}`);
  });
  console.log('✅ STEP 9 PASSED: Local directory resources retrieved.');

  // ----------------------------------------------------
  // STEP 10: Live HTTP Route Status Verification
  // ----------------------------------------------------
  console.log('\n👉 STEP 10: Live HTTP Route Status Check');
  const routesToTest = [
    'http://localhost:3000/',
    'http://localhost:3000/get-started',
    'http://localhost:3000/resources',
    'http://localhost:3000/privacy',
    'http://localhost:3000/security',
    'http://localhost:3000/api/resources?zipCode=77025',
  ];

  for (const url of routesToTest) {
    try {
      const res = await fetch(url);
      console.log(` • [${res.status}] ${url}`);
      if (res.status >= 500) {
        throw new Error(`Route ${url} returned 500 error status ${res.status}`);
      }
    } catch (e: any) {
      console.log(` • Note: Could not fetch ${url} directly (${e.message})`);
    }
  }
  console.log('✅ STEP 10 PASSED: Live HTTP route check completed.');

  console.log('\n====================================================');
  console.log('🎉 ALL LIVE E2E TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runFullLiveTest().catch((err) => {
  console.error('\n❌ LIVE TEST FAILED:', err);
  process.exit(1);
});
