import { test, expect } from '@playwright/test';

const API_RE = /^https?:\/\/(?:127\.0\.0\.1|localhost):\d+\/interviews\/([^/]+)(\/.*)?$/;
const APP_ORIGIN = process.env.PW_BASE_URL || 'http://127.0.0.1:5173';
const ROOM_ID = 'group-room-1';
const HR_USER = {
  id: 'hr-live-1',
  role: 'hr',
  name: 'Live Test HR',
  email: 'hr-live@example.com',
  isEmailVerified: true,
  isHrApproved: true
};
const STUDENTS = Array.from({ length: 20 }, (_, index) => ({
  id: `student-live-${index + 1}`,
  role: 'student',
  name: `Student ${String(index + 1).padStart(2, '0')}`,
  email: `student-${index + 1}@example.com`,
  isEmailVerified: true
}));
const STUDENT_ONE = STUDENTS[0];
const STUDENT_TWO = STUDENTS[1];

test.use({
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  }
});

const participantRows = STUDENTS.map((student, index) => ({
  interviewId: index === 0 ? ROOM_ID : `group-room-${index + 1}`,
  candidateId: student.id,
  name: student.name,
  email: student.email,
  status: 'scheduled',
  roomStatus: 'live',
  joinedAt: new Date().toISOString(),
  leftAt: null,
  hrJoinedAt: new Date().toISOString(),
  hrLeftAt: null,
  isHrOnline: true,
  isOnline: true
}));

const baseInterview = {
  id: ROOM_ID,
  participant_interview_id: ROOM_ID,
  room_interview_id: ROOM_ID,
  title: 'Live group calling test',
  job_title: 'Frontend Developer',
  scheduled_at: new Date(Date.now() + 60_000).toISOString(),
  duration_minutes: 45,
  round_label: 'Technical Round',
  mode: 'in_app',
  room_status: 'live',
  is_group_room: true,
  room_participant_count: STUDENTS.length,
  whiteboard_data: { lines: [], updatedAt: null },
  code_editor_language: 'javascript',
  code_editor_content: '// group call test',
  transcript_segments: [],
  candidate_consent_required: false,
  candidate_recording_consent: false,
  candidate_ai_consent: false
};

const roomPayloadFor = (viewer) => {
  const isHr = viewer.role === 'hr';
  const currentParticipant = participantRows.find((participant) => participant.candidateId === viewer.id) || participantRows[0];
  const currentStudent = STUDENTS.find((student) => student.id === viewer.id) || STUDENT_ONE;

  return {
    status: true,
    interview: {
      ...baseInterview,
      participant_interview_id: isHr ? ROOM_ID : currentParticipant.interviewId,
      room_participant_count: isHr ? participantRows.length : 1,
      is_group_room: isHr
    },
    job: {
      id: 'job-live-1',
      job_title: 'Frontend Developer',
      company_name: 'Live Test Company'
    },
    application: {
      id: `app-${viewer.id}`,
      status: 'interview_scheduled'
    },
    candidate: isHr
      ? {
          id: STUDENT_ONE.id,
          name: STUDENT_ONE.name,
          email: STUDENT_ONE.email,
          headline: 'React candidate',
          skills: ['React', 'JavaScript']
        }
      : {
          id: currentStudent.id,
          name: currentStudent.name,
          email: currentStudent.email,
          headline: 'React candidate',
          skills: ['React', 'JavaScript']
        },
    hr: {
      id: HR_USER.id,
      name: HR_USER.name,
      email: HR_USER.email,
      companyName: 'Live Test Company',
      logoUrl: ''
    },
    roomParticipants: isHr
      ? participantRows
      : participantRows.filter((participant) => participant.candidateId === viewer.id),
    permissions: {
      canManage: isHr,
      canJoin: true,
      canConsent: !isHr,
      isCandidateViewer: !isHr
    },
    rtcConfig: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  };
};

const createRoomContext = async (browser, viewer, sharedSignals) => {
  const context = await browser.newContext({
    permissions: ['camera', 'microphone'],
    storageState: {
      cookies: [],
      origins: [
        {
          origin: APP_ORIGIN,
          localStorage: [
            { name: 'job_portal_token', value: `managed-${viewer.id}` },
            { name: 'job_portal_user', value: JSON.stringify(viewer) }
          ]
        }
      ]
    }
  });
  const page = await context.newPage();

  await page.route(/^https?:\/\/(?:127\.0\.0\.1|localhost):\d+\/notifications(?:\/.*)?(?:\?.*)?$/, async (route) => {
    if (route.request().resourceType() === 'document') return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notifications: [] }) });
  });

  await page.route(/^https?:\/\/(?:127\.0\.0\.1|localhost):\d+\/pricing\/role-subscriptions\/current(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: true, subscription: null, plan: null })
    });
  });

  await page.route(/^https?:\/\/(?:127\.0\.0\.1|localhost):\d+\/student\/profile(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ profile: { name: viewer.name, email: viewer.email } })
    });
  });

  await page.route(API_RE, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const match = url.href.match(API_RE);
    if (!match) return route.continue();

    const suffix = match[2] || '';
    if (request.resourceType() === 'document') return route.continue();

    if (suffix === '/signals' && request.method() === 'GET') {
      const signals = sharedSignals.filter((signal) => signal.sender_id !== viewer.id);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: true, signals }) });
      return;
    }

    if (suffix === '/signals' && request.method() === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      const signal = {
        id: `signal-${sharedSignals.length + 1}`,
        interview_id: ROOM_ID,
        sender_id: viewer.id,
        recipient_id: body.recipientId || null,
        signal_type: body.signalType,
        payload: body.payload || {},
        created_at: new Date(Date.now() + sharedSignals.length).toISOString()
      };
      sharedSignals.push(signal);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ status: true, signal }) });
      return;
    }

    if ((suffix === '/join' || suffix === '/leave') && request.method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(roomPayloadFor(viewer)) });
      return;
    }

    if (suffix === '/workspace' && request.method() === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(roomPayloadFor(viewer)) });
      return;
    }

    if (request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(roomPayloadFor(viewer)) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: true }) });
  });

  return { context, page };
};

test('HR can open one group call room with two students visible in Playwright', async ({ browser }) => {
  test.setTimeout(90_000);
  const sharedSignals = [];
  const hr = await createRoomContext(browser, HR_USER, sharedSignals);
  const studentOne = await createRoomContext(browser, STUDENT_ONE, sharedSignals);
  const studentTwo = await createRoomContext(browser, STUDENT_TWO, sharedSignals);

  try {
    await Promise.all([
      hr.page.goto(`/portal/hr/interviews/${ROOM_ID}/room`, { waitUntil: 'domcontentloaded' }),
      studentOne.page.goto(`/portal/student/interviews/${ROOM_ID}/room`, { waitUntil: 'domcontentloaded' }),
      studentTwo.page.goto(`/portal/student/interviews/${ROOM_ID}/room`, { waitUntil: 'domcontentloaded' })
    ]);

    await expect(hr.page.getByText('Live candidate gallery')).toBeVisible({ timeout: 25_000 });
    await expect(hr.page.getByText(STUDENT_ONE.name).first()).toBeVisible();
    await expect(hr.page.getByText(STUDENT_TWO.name).first()).toBeVisible();

    await expect(studentOne.page.getByText('Recruiter').first()).toBeVisible({ timeout: 25_000 });
    await expect(studentOne.page.getByText('Live Test HR').first()).toBeVisible();
    await expect(studentOne.page.getByText('Recruiter is in this room.').first()).toBeVisible();

    await expect(studentTwo.page.getByText('Recruiter').first()).toBeVisible({ timeout: 25_000 });
    await expect(studentTwo.page.getByText('Live Test HR').first()).toBeVisible();
    await expect(studentTwo.page.getByText('Recruiter is in this room.').first()).toBeVisible();

    await hr.page.screenshot({ path: 'playwright-audit/group-call-hr-two-students.png', fullPage: true });
    await studentOne.page.screenshot({ path: 'playwright-audit/group-call-student-one-hr-visible.png', fullPage: true });
    await studentTwo.page.screenshot({ path: 'playwright-audit/group-call-student-two-hr-visible.png', fullPage: true });

    expect(sharedSignals.some((signal) => signal.signal_type === 'offer' || signal.signal_type === 'presence')).toBeTruthy();
  } finally {
    await Promise.all([
      hr.context.close(),
      studentOne.context.close(),
      studentTwo.context.close()
    ]);
  }
});

test('HR can run a group discussion room with twenty students in Playwright', async ({ browser }) => {
  test.setTimeout(180_000);
  const sharedSignals = [];
  const hr = await createRoomContext(browser, HR_USER, sharedSignals);
  const studentRooms = [];

  try {
    for (const student of STUDENTS) {
      studentRooms.push(await createRoomContext(browser, student, sharedSignals));
    }

    await Promise.all([
      hr.page.goto(`/portal/hr/interviews/${ROOM_ID}/room`, { waitUntil: 'domcontentloaded' }),
      ...studentRooms.map(({ page }) =>
        page.goto(`/portal/student/interviews/${ROOM_ID}/room`, { waitUntil: 'domcontentloaded' })
      )
    ]);

    await expect(hr.page.getByText('Live candidate gallery')).toBeVisible({ timeout: 30_000 });

    for (const student of STUDENTS) {
      await expect(hr.page.getByText(student.name).first()).toBeVisible();
    }

    for (const { page } of studentRooms) {
      await expect(page.getByText('Live Test HR').first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText('Recruiter is in this room.').first()).toBeVisible();
    }

    await hr.page.screenshot({ path: 'playwright-audit/group-call-hr-twenty-students.png', fullPage: true });
    await studentRooms[0].page.screenshot({ path: 'playwright-audit/group-call-student-01-hr-visible.png', fullPage: true });
    await studentRooms[19].page.screenshot({ path: 'playwright-audit/group-call-student-20-hr-visible.png', fullPage: true });

    expect(sharedSignals.filter((signal) => ['offer', 'presence'].includes(signal.signal_type)).length).toBeGreaterThanOrEqual(20);
  } finally {
    await Promise.all([
      hr.context.close(),
      ...studentRooms.map(({ context }) => context.close())
    ]);
  }
});
