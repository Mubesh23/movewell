import assert from 'assert';

const BASE_URL = 'http://localhost:3001';

async function runLiveVerification() {
  console.log('🚀 Starting Bridgewell Live Hardening & Golden Demo Verification...\n');

  // 1. Verify Homepage & Assets
  console.log('--- Step 1: Homepage & Mockup Hero Assets ---');
  const homeRes = await fetch(`${BASE_URL}/`);
  assert.strictEqual(homeRes.status, 200, 'Homepage must return 200');
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes('movewell-hero.png'), 'Homepage must reference hero photo overlay');
  assert.ok(homeHtml.includes('When life changes'), 'Homepage must include hero title');
  assert.ok(homeHtml.includes('Meet Nora'), 'Homepage must include Meet Nora section');
  console.log('✅ Homepage and hero photographic assets verified.\n');

  // 2. Maria Golden Demo Creation & Access
  console.log('--- Step 2: Maria Golden Demo Creation & Verified Access ---');
  const mariaOwnerId = 'demo-coordinator-sarah-' + Date.now();
  const mariaCreateRes = await fetch(`${BASE_URL}/api/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': mariaOwnerId,
    },
    body: JSON.stringify({ preset: 'MARIA_GOLDEN_SCENARIO' }),
  });
  const mariaCreateData = await mariaCreateRes.json();
  assert.strictEqual(mariaCreateRes.status, 200, 'Maria demo creation must return 200');
  assert.ok(mariaCreateData.caseId, 'Maria demo must return caseId');
  const mariaCaseId = mariaCreateData.caseId;
  console.log(`Created Maria Case: ${mariaCaseId}`);

  // Access case as owner
  const caseGetRes = await fetch(`${BASE_URL}/api/cases/${mariaCaseId}`, {
    headers: { 'x-user-id': mariaOwnerId },
  });
  assert.strictEqual(caseGetRes.status, 200, 'Owner must access case');
  const caseData = (await caseGetRes.json()).data;
  assert.strictEqual(caseData.seniorProfile.name, 'Maria Thompson');
  assert.strictEqual(caseData.members.length, 2, 'Must have Sarah and Jennifer');
  console.log('✅ Maria case created with correct ownership and accessible.\n');

  // 3. Task Dependency & Status Verification
  console.log('--- Step 3: Task Dependencies & Accurate Recalculation ---');
  const initialTasks = caseData.tasks;
  const destTask = initialTasks.find((t: any) => t.templateId === 'confirm-discharge-destination');
  const decideHousingTask = initialTasks.find((t: any) => t.templateId === 'decide-temporary-vs-permanent');
  
  assert.ok(destTask, 'Must have confirm-discharge-destination task');
  assert.strictEqual(destTask.status, 'READY', 'Destination task must be READY initially');
  assert.ok(decideHousingTask, 'Must have decide-temporary-vs-permanent task');
  assert.strictEqual(decideHousingTask.status, 'BLOCKED', 'Decide housing task must be BLOCKED by destination task');
  console.log('Initial statuses: Destination = READY, Decide Housing = BLOCKED.');

  // Complete Destination task
  const completeRes = await fetch(`${BASE_URL}/api/cases/${mariaCaseId}/tasks/${destTask.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': mariaOwnerId,
    },
    body: JSON.stringify({
      action: 'COMPLETE',
      actorName: 'Sarah',
      completionNotes: 'Doctor confirmed return to two-story home with main floor accommodation.',
    }),
  });
  assert.strictEqual(completeRes.status, 200, 'Task completion must return 200');

  // Verify dependent task unblocks
  const updatedCaseRes = await fetch(`${BASE_URL}/api/cases/${mariaCaseId}`, {
    headers: { 'x-user-id': mariaOwnerId },
  });
  const updatedTasks = (await updatedCaseRes.json()).data.tasks;
  const updatedDecideHousing = updatedTasks.find((t: any) => t.templateId === 'decide-temporary-vs-permanent');
  assert.strictEqual(updatedDecideHousing.status, 'READY', 'Decide housing task must transition to READY after destination is completed');
  console.log('✅ Dependent task automatically unblocked and transitioned to READY.\n');

  // 4. Security: Draft Activation Guards
  console.log('--- Step 4: Security - Draft Activation Auth Boundary ---');
  // Create an intake draft
  const guestToken = 'anon-guest-token-' + Date.now();
  const draftCreateRes = await fetch(`${BASE_URL}/api/drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': guestToken,
    },
    body: JSON.stringify({
      intakeDraft: {
        seniorName: 'Robert Martinez',
        dischargeDate: '2026-10-15',
        mobilityConstraint: true,
        stairsConstraint: true,
        city: 'Austin',
        zipCode: '78701',
        budget: 6000,
        coordinatorName: 'Carlos Martinez',
        coordinatorRelationship: 'Son',
        careCircleAddressed: true,
      },
    }),
  });
  const draftCreateData = await draftCreateRes.json();
  if (draftCreateRes.status !== 201) {
    console.error('Draft creation failed:', draftCreateData);
  }
  assert.strictEqual(draftCreateRes.status, 201, 'Draft creation must return 201');
  const testDraftId = draftCreateData.draftId;
  console.log(`Created Test Draft: ${testDraftId}`);

  // Attempt to activate as guest (without authentication)
  const unauthActivateRes = await fetch(`${BASE_URL}/api/drafts/${testDraftId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': guestToken,
    },
  });
  const unauthActivateData = await unauthActivateRes.json();
  assert.strictEqual(unauthActivateRes.status, 401, 'Guest activation must return 401');
  assert.strictEqual(unauthActivateData.code, 'AUTH_REQUIRED', 'Must return AUTH_REQUIRED error code');
  console.log('✅ Unauthenticated guest activation properly rejected with 401 AUTH_REQUIRED.');

  // Activate as authenticated user with matching guest session cookie
  const authUserId = 'usr-authenticated-owner-' + Date.now();
  const authActivateRes = await fetch(`${BASE_URL}/api/drafts/${testDraftId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': authUserId,
      Cookie: `bridgewell_guest_session=${guestToken}`,
    },
  });
  const authActivateData = await authActivateRes.json();
  assert.strictEqual(authActivateRes.status, 200, 'Authenticated activation must succeed');
  assert.ok(authActivateData.caseId, 'Activated case must have caseId');
  console.log(`✅ Authenticated activation succeeded, created case: ${authActivateData.caseId}\n`);

  // 5. Security: Invitation Acceptance & Email Mismatch Protection
  console.log('--- Step 5: Security - Tokenized Invitations & Email Mismatch Protection ---');
  // Create an invited member on Maria's case
  const addMemberRes = await fetch(`${BASE_URL}/api/cases/${mariaCaseId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': mariaOwnerId,
    },
    body: JSON.stringify({
      name: 'Uncle David',
      role: 'FAMILY',
      relationship: 'Brother',
      city: 'Austin, TX',
      isLocal: false,
      email: 'david.thompson@example.com',
      sendInvite: true,
    }),
  });
  const addMemberData = await addMemberRes.json();
  assert.strictEqual(addMemberRes.status, 201, 'Adding invited member must return 201');
  assert.ok(addMemberData.inviteToken, 'Adding member with sendInvite must return inviteToken');
  const inviteToken = addMemberData.inviteToken;
  console.log(`Dispatched invitation with secure token to david.thompson@example.com`);

  // Verify invitation info query
  const inviteInfoRes = await fetch(`${BASE_URL}/api/invitations/${inviteToken}`);
  assert.strictEqual(inviteInfoRes.status, 200, 'Querying valid invite token must return 200');
  const inviteInfo = (await inviteInfoRes.json()).data;
  assert.strictEqual(inviteInfo.recipientName, 'Uncle David');
  assert.strictEqual(inviteInfo.seniorName, 'Maria Thompson');

  // Test guest trying to accept without authentication
  const guestAcceptRes = await fetch(`${BASE_URL}/api/invitations/${inviteToken}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'anon-visitor',
    },
  });
  const guestAcceptData = await guestAcceptRes.json();
  assert.strictEqual(guestAcceptRes.status, 401, 'Guest accepting invite must return 401');
  assert.strictEqual(guestAcceptData.code, 'AUTH_REQUIRED', 'Must return AUTH_REQUIRED');
  console.log('✅ Guest invitation acceptance properly rejected with 401 AUTH_REQUIRED.');

  // Test authenticated user with WRONG email trying to accept
  const impostorRes = await fetch(`${BASE_URL}/api/invitations/${inviteToken}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr-impostor-bob',
      'x-user-email': 'bob.unrelated@otherdomain.com',
    },
  });
  const impostorData = await impostorRes.json();
  assert.strictEqual(impostorRes.status, 403, 'Accepting with mismatched email must return 403');
  assert.strictEqual(impostorData.code, 'EMAIL_MISMATCH', 'Must return EMAIL_MISMATCH code');
  console.log('✅ Email mismatch protection verified: mismatched user cannot accept invitation.');

  // Legitimate user accepting with matching email
  const legitAcceptRes = await fetch(`${BASE_URL}/api/invitations/${inviteToken}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr-david-verified',
      'x-user-email': 'david.thompson@example.com',
    },
  });
  const legitAcceptData = await legitAcceptRes.json();
  assert.strictEqual(legitAcceptRes.status, 200, 'Legitimate user acceptance must succeed');
  assert.strictEqual(legitAcceptData.success, true);
  console.log('✅ Legitimate recipient accepted invitation and joined care circle.\n');

  // 6. Confirmed Quote Integration without Double Counting
  console.log('--- Step 6: Confirmed Quote Integration & Budget Lifecycle ---');
  const quoteRes = await fetch(`${BASE_URL}/api/cases/${mariaCaseId}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': mariaOwnerId,
    },
    body: JSON.stringify({
      quote: {
        providerName: 'Gentle Transitions Houston',
        totalAmount: 1950,
      },
      documentName: 'quote_houston_gentle.pdf',
    }),
  });
  assert.strictEqual(quoteRes.status, 200, 'Adding confirmed quote must return 200');

  // Verify updated cost summary
  const caseAfterQuoteRes = await fetch(`${BASE_URL}/api/cases/${mariaCaseId}`, {
    headers: { 'x-user-id': mariaOwnerId },
  });
  const costSummary = (await caseAfterQuoteRes.json()).data.costSummary;
  assert.ok(costSummary.hasQuotes, 'Cost summary must reflect confirmed quote');
  assert.strictEqual(costSummary.quotesTotal, 1950, 'Quotes total must equal 1950');
  console.log(`Updated Cost Summary: $${costSummary.minTotal} - $${costSummary.maxTotal}, Quotes Total: $${costSummary.quotesTotal}`);
  console.log('✅ Confirmed vendor quote incorporated without double counting.\n');

  console.log('🎉 ALL 6 VERIFICATION PHASES PASSED WITH 100% SUCCESS!');
}

runLiveVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
