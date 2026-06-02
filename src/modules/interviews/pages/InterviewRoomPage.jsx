/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  FiArrowLeft,
  FiCalendar,
  FiCast,
  FiCheckCircle,
  FiClock,
  FiCode,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiInfo,
  FiLink,
  FiMic,
  FiMicOff,
  FiMonitor,
  FiPhoneOff,
  FiPlay,
  FiRefreshCw,
  FiRepeat,
  FiSave,
  FiStar,
  FiUsers,
  FiVideo,
  FiVideoOff,
  FiAlertTriangle
} from 'react-icons/fi';
import {
  endInterviewRoom,
  getInterviewRecording,
  getInterviewRoom,
  getInterviewSignals,
  joinInterviewRoom,
  leaveInterviewRoom,
  sendInterviewSignal,
  executeInterviewCode as executeInterviewCodeRequest,
  updateInterviewConsent,
  updateInterviewWorkspace,
  uploadInterviewRecording
} from '../services/interviewRoomApi';

const SPEECH_RECOGNITION =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
    : null;

const defaultWhiteboard = { lines: [], updatedAt: null };
const defaultCodeEditorContent = '// Add prompts or coding questions here.\nfunction solve(input) {\n  return input;\n}\n';
const defaultRtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const serializeWorkspaceValue = (value) => JSON.stringify(value ?? null);

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const normalizeExternalMeetingUrl = (value = '') => {
  try {
    const parsed = new URL(String(value || '').trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch (error) {
    return '';
  }
};

const canEmbedMeetingUrl = (value = '') => {
  const url = normalizeExternalMeetingUrl(value);
  return /^https:\/\/meet\.jit\.si\//i.test(url);
};

const readAsConnectionLabel = (state = 'new') => {
  switch (String(state || '').toLowerCase()) {
    case 'connected':
      return { label: 'Connected', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    case 'connecting':
      return { label: 'Connecting', className: 'border-sky-200 bg-sky-50 text-sky-700' };
    case 'failed':
      return { label: 'Reconnect needed', className: 'border-amber-200 bg-amber-50 text-amber-700' };
    case 'disconnected':
      return { label: 'Disconnected', className: 'border-red-200 bg-red-50 text-red-700' };
    default:
      return { label: 'Waiting', className: 'border-slate-200 bg-slate-50 text-slate-600' };
  }
};

const mergeUniqueSegments = (currentSegments = [], incomingSegments = []) => {
  const merged = new Map();
  [...currentSegments, ...incomingSegments].forEach((segment, index) => {
    const text = String(segment?.text || '').trim();
    if (!text) return;

    const createdAt = segment?.createdAt || segment?.created_at || new Date().toISOString();
    const id = String(segment?.id || `${segment?.speaker || 'participant'}-${createdAt}-${index}`);
    merged.set(id, {
      id,
      speaker: segment?.speaker || 'participant',
      text,
      createdAt
    });
  });

  return Array.from(merged.values()).sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
};

const INTERVIEW_SIDEBAR_MIN_WIDTH = 280;
const INTERVIEW_SIDEBAR_MAX_WIDTH = 520;
const INTERVIEW_SIDEBAR_DEFAULT_WIDTH = 320;
const INTERVIEW_STAGE_STACK_BREAKPOINT = 980;
const INTERVIEW_PREVIEW_MARGIN = 16;
const P2P_INTERVIEW_ROOM_PARTICIPANTS = 25;
const CODE_RUN_TIMEOUT_MS = 3000;
const SIGNAL_LOOKBACK_MS = 15000;
const SIGNAL_POLL_INTERVAL_MS = 500;
const LIVE_CODE_SYNC_DEBOUNCE_MS = 180;
const SIGNAL_CURSOR_OVERLAP_MS = 2000;
const MAX_TRACKED_SIGNAL_IDS = 5000;
const MEDIA_RETRY_INTERVAL_MS = 5000;
const PRESENCE_HEARTBEAT_INTERVAL_MS = 4000;
const HR_OFFER_COOLDOWN_MS = 12000;

const createSignalSessionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const isWorkspaceTab = (tab) => ['video', 'code', 'whiteboard', 'transcript'].includes(String(tab || ''));

const CandidateVideoTile = ({ participant, mediaState, isSelected, onSelect, onReconnect }) => {
  const videoRef = useRef(null);
  const stream = mediaState?.stream || null;
  const isReady = Boolean(mediaState?.ready || stream);
  const connectionLabel = readAsConnectionLabel(mediaState?.connectionState || (participant?.isOnline ? 'connecting' : 'new'));
  const lastSeenAt = mediaState?.lastSeenAt || participant?.lastSeenAt || participant?.joinedAt || '';

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.srcObject = stream || null;
    if (stream && typeof element.play === 'function') {
      const playAttempt = element.play();
      if (playAttempt && typeof playAttempt.catch === 'function') {
        playAttempt.catch(() => {});
      }
    }
  }, [stream]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.();
        }
      }}
      className={`group overflow-hidden rounded-lg border bg-slate-950 text-left shadow-sm transition ${
        isSelected ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="relative aspect-video">
        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <FiUsers size={18} />
            <p className="text-[10px]">Waiting...</p>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-2 py-2">
          <span className="truncate text-[10px] font-bold text-white">{participant?.name || 'Candidate'}</span>
          <span className="ml-2 flex shrink-0 items-center gap-1">
            <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${connectionLabel.className}`}>
              {isReady ? 'Live' : connectionLabel.label}
            </span>
            {onReconnect && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onReconnect();
                }}
                className="rounded-md border border-white/20 bg-white/10 p-1 text-white transition hover:bg-white/20"
                title="Reconnect this candidate"
              >
                <FiRefreshCw size={9} />
              </button>
            )}
          </span>
        </div>
        {!isReady && lastSeenAt && (
          <div className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-[9px] font-semibold text-white/80">
            Seen {formatDateTime(lastSeenAt)}
          </div>
        )}
      </div>
    </div>
  );
};

const InterviewRoomPage = ({ portalRole = 'hr' }) => {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const [roomState, setRoomState] = useState({ loading: true, error: '', payload: null });
  const [localMediaError, setLocalMediaError] = useState('');
  const [connectionState, setConnectionState] = useState('new');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [transcriptionActive, setTranscriptionActive] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [liveNotes, setLiveNotes] = useState('');
  const [finalNotes, setFinalNotes] = useState('');
  const [rating, setRating] = useState(4);
  const [applicationStatus, setApplicationStatus] = useState('interviewed');
  const [noShowCandidate, setNoShowCandidate] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [whiteboardData, setWhiteboardData] = useState(defaultWhiteboard);
  const [codeEditorLanguage, setCodeEditorLanguage] = useState('javascript');
  const [codeEditorContent, setCodeEditorContent] = useState(defaultCodeEditorContent);
  const [codeRunState, setCodeRunState] = useState({
    status: 'idle',
    output: '',
    error: '',
    ranAt: '',
    language: 'javascript',
    meta: ''
  });
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isEndingRoom, setIsEndingRoom] = useState(false);
  const [isStartingMedia, setIsStartingMedia] = useState(false);
  const [remoteStreamReady, setRemoteStreamReady] = useState(false);
  const [recordingState, setRecordingState] = useState({ active: false, uploading: false, message: '', url: '' });
  const [videoSource, setVideoSource] = useState('camera');
  const [remoteVideoSource, setRemoteVideoSource] = useState('camera');
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  const [isStageSwapped, setIsStageSwapped] = useState(false);
  const [activeRoomTab, setActiveRoomTab] = useState('video');
  const [sidebarWidth, setSidebarWidth] = useState(INTERVIEW_SIDEBAR_DEFAULT_WIDTH);
  const [isStageStacked, setIsStageStacked] = useState(false);
  const [previewPosition, setPreviewPosition] = useState(null);
  const [activeInterviewId, setActiveInterviewId] = useState(interviewId);
  const [isSwitchingCandidate, setIsSwitchingCandidate] = useState(false);
  const [candidateControls, setCandidateControls] = useState({});
  const [candidateTaskInput, setCandidateTaskInput] = useState('');
  const [assignedTask, setAssignedTask] = useState(null);
  const [forcedMutedByHr, setForcedMutedByHr] = useState(false);
  const [hrControlNotice, setHrControlNotice] = useState('');
  const [hrCandidateMedia, setHrCandidateMedia] = useState({});

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const compactLocalVideoRef = useRef(null);
  const compactRemoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const workspacePaneRef = useRef(null);
  const mainStageContainerRef = useRef(null);
  const previewStageRef = useRef(null);
  const whiteboardCanvasRef = useRef(null);
  const drawingRef = useRef({ active: false, currentLine: null });
  const peerConnectionRef = useRef(null);
  const hrPeerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const signalCursorRef = useRef('');
  const pendingTranscriptSegmentsRef = useRef([]);
  const recognitionRef = useRef(null);
  const didHydrateRef = useRef(false);
  const isMountedRef = useRef(true);
  const recorderRef = useRef(null);
  const recorderChunksRef = useRef([]);
  const recordingCanvasRef = useRef(null);
  const recordingAnimationRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioDestinationRef = useRef(null);
  const cameraVideoTrackRef = useRef(null);
  const screenShareStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const remoteDescriptionReadyRef = useRef(false);
  const activeSignalSessionRef = useRef('');
  const lastPresenceSignalAtRef = useRef(0);
  const lastReconnectAttemptAtRef = useRef(0);
  const offerInFlightRef = useRef(false);
  const pendingPresenceRequestRef = useRef(false);
  const offerStartedAtRef = useRef(0);
  const stuckResetAtRef = useRef(0);
  const activeCandidateIdRef = useRef('');
  const sidebarResizeStateRef = useRef(null);
  const previewDragStateRef = useRef(null);
  const codeRunnerRef = useRef(null);
  const liveWorkspaceSyncTimerRef = useRef(null);
  const latestCodeEditorLanguageRef = useRef('javascript');
  const latestCodeEditorContentRef = useRef(defaultCodeEditorContent);
  const localCodeEditVersionRef = useRef(0);
  const lastLocalCodeEditAtRef = useRef(0);
  const activeRoomTabRef = useRef('video');
  const pendingWorkspaceSyncRef = useRef({});
  const processedSignalIdsRef = useRef(new Set());
  const hrCandidateMediaRef = useRef({});
  const lastSyncedWhiteboardRef = useRef(serializeWorkspaceValue(defaultWhiteboard));
  const lastSyncedCodeLanguageRef = useRef('javascript');
  const lastSyncedCodeContentRef = useRef(defaultCodeEditorContent);

  const payload = roomState.payload;
  const interview = payload?.interview || null;
  const permissions = payload?.permissions || {};
  const job = payload?.job || {};
  const candidate = payload?.candidate || {};
  const hr = payload?.hr || {};
  const roomParticipants = Array.isArray(payload?.roomParticipants) ? payload.roomParticipants : [];
  const rtcConfig = payload?.rtcConfig || defaultRtcConfig;
  const externalMeetingUrl = normalizeExternalMeetingUrl(interview?.meeting_link || interview?.meetingLink || '');
  const usesExternalMeeting = Boolean(externalMeetingUrl && interview?.mode === 'virtual');
  const embedsExternalMeeting = usesExternalMeeting && canEmbedMeetingUrl(externalMeetingUrl);

  const returnPath = portalRole === 'student' ? '/portal/student/interviews' : '/portal/hr/interviews';
  const transcriptText = useMemo(
    () => transcriptSegments.map((segment) => `${segment.speaker}: ${segment.text}`).join('\n'),
    [transcriptSegments]
  );
  const connectionMeta = readAsConnectionLabel(connectionState);
  const calendarUrl = interview?.calendar_event_url || '';
  const recordingAllowed = Boolean(interview?.candidate_recording_consent);
  const aiAllowed = Boolean(interview?.candidate_ai_consent);
  const isManager = Boolean(permissions?.canManage);
  const isCandidateViewer = Boolean(permissions?.isCandidateViewer);
  const localActor = isManager ? 'hr' : 'candidate';
  const currentCandidateId = candidate?.id || '';
  const visibleRoomParticipants = isManager
    ? roomParticipants
    : roomParticipants.filter((participant) => !currentCandidateId || participant.candidateId === currentCandidateId);
  const currentRoomParticipant = roomParticipants.find((participant) => participant.candidateId === currentCandidateId) || null;
  const isRecruiterOnline = Boolean(
    currentRoomParticipant?.isHrOnline
    || remoteStreamReady
    || ['connected', 'connecting'].includes(String(connectionState || '').toLowerCase())
  );
  const visibleRoomMembers = isManager
    ? roomParticipants.map((participant) => ({
        id: participant.interviewId || participant.candidateId,
        name: participant.name || 'Candidate',
        meta: participant.email || participant.status || 'Scheduled',
        role: 'Candidate',
        isOnline: Boolean(participant.isOnline)
      }))
    : [
        {
          id: hr?.id || 'recruiter',
          name: hr?.name || 'Recruiter',
          meta: hr?.companyName || job?.company_name || hr?.email || 'Hiring team',
          role: 'Recruiter',
          isOnline: isRecruiterOnline
        },
        ...visibleRoomParticipants.map((participant) => ({
          id: participant.interviewId || participant.candidateId,
          name: participant.name || candidate?.name || 'You',
          meta: participant.email || candidate?.email || participant.status || 'Candidate',
          role: 'You',
          isOnline: Boolean(participant.isOnline)
        }))
      ];
  const roomApiInterviewId = activeInterviewId || interviewId;
  const videoRecipientId = isManager ? currentCandidateId : (hr?.id || '');
  const workspaceRecipientId = videoRecipientId;
  const participantLabel = isManager ? 'Recruiter' : 'Candidate';
  const remoteParticipantLabel = isManager ? 'Candidate' : 'Recruiter';
  const isLocalPrimaryStage = isStageSwapped;
  const mainStageLabel = isLocalPrimaryStage
    ? (videoSource === 'screen' ? 'Your screen' : participantLabel)
    : `${remoteVideoSource === 'screen' ? 'Screen' : 'Camera'} · ${remoteParticipantLabel}`;
  const previewStageLabel = isLocalPrimaryStage
    ? `${remoteVideoSource === 'screen' ? 'Screen' : 'Camera'} · ${remoteParticipantLabel}`
    : (videoSource === 'screen' ? 'Your screen' : participantLabel);
  const hasFloatingPreviewPosition = !isStageStacked && Boolean(previewPosition);

  const getPreviewBounds = () => {
    const stageNode = mainStageContainerRef.current;
    const previewNode = previewStageRef.current;
    if (!stageNode || !previewNode) return null;

    return {
      minX: INTERVIEW_PREVIEW_MARGIN,
      minY: INTERVIEW_PREVIEW_MARGIN,
      maxX: Math.max(INTERVIEW_PREVIEW_MARGIN, stageNode.clientWidth - previewNode.offsetWidth - INTERVIEW_PREVIEW_MARGIN),
      maxY: Math.max(INTERVIEW_PREVIEW_MARGIN, stageNode.clientHeight - previewNode.offsetHeight - INTERVIEW_PREVIEW_MARGIN)
    };
  };

  const clampPreviewPosition = (x, y) => {
    const bounds = getPreviewBounds();
    if (!bounds) return null;

    return {
      x: Math.min(bounds.maxX, Math.max(bounds.minX, x)),
      y: Math.min(bounds.maxY, Math.max(bounds.minY, y))
    };
  };

  const getDefaultPreviewPosition = () => {
    const bounds = getPreviewBounds();
    if (!bounds) return null;

    return {
      x: bounds.maxX,
      y: bounds.minY
    };
  };

  const clearCodeRunner = () => {
    const activeRunner = codeRunnerRef.current;
    if (!activeRunner) return;

    if (activeRunner.timeoutId) {
      window.clearTimeout(activeRunner.timeoutId);
    }
    if (activeRunner.worker) {
      activeRunner.worker.terminate();
    }
    if (activeRunner.objectUrl) {
      URL.revokeObjectURL(activeRunner.objectUrl);
    }
    codeRunnerRef.current = null;
  };

  const formatCompilerOutput = (executionResult) => {
    const outputSections = [];
    const compileOutput = String(executionResult?.compile?.output || '').trim();
    const runOutput = String(executionResult?.run?.output || '').trim();
    const runSignal = String(executionResult?.run?.signal || '').trim();
    const runCode = executionResult?.run?.code;

    if (compileOutput) {
      outputSections.push(`Compile:\n${compileOutput}`);
    }

    if (runOutput) {
      outputSections.push(`Run:\n${runOutput}`);
    }

    if (runSignal) {
      outputSections.push(`Signal: ${runSignal}`);
    }

    if (runCode !== undefined && runCode !== null) {
      outputSections.push(`Exit code: ${runCode}`);
    }

    return outputSections.join('\n\n').trim();
  };

  const executeJavaScriptSnippet = (source) =>
    new Promise((resolve, reject) => {
      if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
        reject(new Error('This browser does not support in-room code execution.'));
        return;
      }

      clearCodeRunner();

      const workerSource = `
        self.onmessage = async (event) => {
          const source = String(event.data?.source || '');
          const logs = [];
          const serialize = (value) => {
            if (typeof value === 'string') return value;
            if (typeof value === 'undefined') return 'undefined';
            if (typeof value === 'function') return '[Function]';
            if (typeof value === 'symbol') return value.toString();
            try {
              return JSON.stringify(value);
            } catch (error) {
              return String(value);
            }
          };

          const consoleProxy = {
            log: (...args) => logs.push({ level: 'log', text: args.map(serialize).join(' ') }),
            info: (...args) => logs.push({ level: 'info', text: args.map(serialize).join(' ') }),
            warn: (...args) => logs.push({ level: 'warn', text: args.map(serialize).join(' ') }),
            error: (...args) => logs.push({ level: 'error', text: args.map(serialize).join(' ') }),
            clear: () => { logs.length = 0; }
          };

          try {
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
            const runner = new AsyncFunction('console', '"use strict";\\n' + source + '\\n//# sourceURL=interview-room-runner.js');
            const result = await runner(consoleProxy);
            self.postMessage({
              status: 'success',
              logs,
              result: serialize(result)
            });
          } catch (error) {
            self.postMessage({
              status: 'error',
              logs,
              error: error?.stack || error?.message || String(error)
            });
          }
        };
      `;

      const objectUrl = URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' }));
      const worker = new Worker(objectUrl);

      const timeoutId = window.setTimeout(() => {
        clearCodeRunner();
        reject(new Error(`Execution timed out after ${CODE_RUN_TIMEOUT_MS / 1000} seconds.`));
      }, CODE_RUN_TIMEOUT_MS);

      codeRunnerRef.current = { worker, objectUrl, timeoutId };

      worker.onmessage = (event) => {
        clearCodeRunner();
        resolve(event.data || {});
      };

      worker.onerror = (event) => {
        clearCodeRunner();
        reject(new Error(event.message || 'Unable to execute the current code snippet.'));
      };

      worker.postMessage({ source });
    });

  const playMediaElement = (element) => {
    if (!element || typeof element.play !== 'function') return;
    const playAttempt = element.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {});
    }
  };

  const syncVideoElement = (element, stream) => {
    if (!element) return;
    element.srcObject = stream || null;
    playMediaElement(element);
  };

  const syncLocalVideo = (stream) => {
    syncVideoElement(localVideoRef.current, stream);
    syncVideoElement(compactLocalVideoRef.current, stream);
  };

  const syncRemoteVideo = (stream) => {
    syncVideoElement(remoteVideoRef.current, stream);
    syncVideoElement(compactRemoteVideoRef.current, stream);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream || null;
      playMediaElement(remoteAudioRef.current);
    }
  };

  const bindLocalVideoRef = (targetRef) => (element) => {
    targetRef.current = element;
    syncVideoElement(element, localStreamRef.current);
  };

  const bindRemoteVideoRef = (targetRef) => (element) => {
    targetRef.current = element;
    syncVideoElement(element, remoteStreamRef.current);
  };

  const bindRemoteAudioRef = (element) => {
    remoteAudioRef.current = element;
    syncVideoElement(element, remoteStreamRef.current);
  };

  const applyRemoteWorkspaceSnapshot = (workspace = {}, { preserveLocalCode = false } = {}) => {
    if (isWorkspaceTab(workspace.activeRoomTab)) {
      activeRoomTabRef.current = workspace.activeRoomTab;
      setActiveRoomTab(workspace.activeRoomTab);
    }

    if (workspace.whiteboardData && typeof workspace.whiteboardData === 'object') {
      lastSyncedWhiteboardRef.current = serializeWorkspaceValue(workspace.whiteboardData);
      setWhiteboardData(workspace.whiteboardData);
    }

    if (!preserveLocalCode && workspace.codeEditorLanguage !== undefined) {
      const nextLanguage = String(workspace.codeEditorLanguage || 'javascript').trim() || 'javascript';
      latestCodeEditorLanguageRef.current = nextLanguage;
      lastSyncedCodeLanguageRef.current = nextLanguage;
      setCodeEditorLanguage(nextLanguage);
    }

    if (!preserveLocalCode && workspace.codeEditorContent !== undefined) {
      const nextContent = String(workspace.codeEditorContent || '');
      latestCodeEditorContentRef.current = nextContent;
      lastSyncedCodeContentRef.current = nextContent;
      setCodeEditorContent(nextContent);
    }

    if (workspace.liveNotes !== undefined && isManager) {
      setLiveNotes(String(workspace.liveNotes || ''));
    }
  };

  const applyPayload = (nextPayload, { hydrateDrafts = false, forceWorkspace = false, preserveLocalCode = false } = {}) => {
    setRoomState({ loading: false, error: '', payload: nextPayload });
    const nextInterview = nextPayload?.interview || {};
    const nextPermissions = nextPayload?.permissions || {};
    const nextWhiteboardData = nextInterview.whiteboard_data || defaultWhiteboard;
    const nextCodeEditorLanguage = nextInterview.code_editor_language || 'javascript';
    const nextCodeEditorContent = nextInterview.code_editor_content || defaultCodeEditorContent;
    const previousWhiteboardSnapshot = lastSyncedWhiteboardRef.current;
    const previousCodeLanguage = lastSyncedCodeLanguageRef.current;
    const previousCodeContent = lastSyncedCodeContentRef.current;

    lastSyncedWhiteboardRef.current = serializeWorkspaceValue(nextWhiteboardData);
    lastSyncedCodeLanguageRef.current = nextCodeEditorLanguage;
    lastSyncedCodeContentRef.current = nextCodeEditorContent;

    const serverSegments = mergeUniqueSegments([], nextInterview.transcript_segments || []);
    setTranscriptSegments((current) => {
      if (!didHydrateRef.current || !nextPermissions.canManage) {
        return serverSegments;
      }
      return mergeUniqueSegments(current, serverSegments);
    });

    if (hydrateDrafts || !didHydrateRef.current) {
      setLiveNotes(nextInterview.live_notes || '');
      setFinalNotes(nextInterview.final_notes || '');
      setRating(Number(nextInterview.rating || 4));
      setNoShowCandidate(Boolean(nextInterview.no_show_candidate));
      setNoShowReason(nextInterview.no_show_reason || '');
      setWhiteboardData(nextWhiteboardData);
      setCodeEditorLanguage(nextCodeEditorLanguage);
      setCodeEditorContent(nextCodeEditorContent);
      latestCodeEditorLanguageRef.current = nextCodeEditorLanguage;
      latestCodeEditorContentRef.current = nextCodeEditorContent;
      didHydrateRef.current = true;
    } else {
      if (forceWorkspace || !nextPermissions.canManage || serializeWorkspaceValue(whiteboardData) === previousWhiteboardSnapshot) {
        setWhiteboardData(nextWhiteboardData);
      }
      if (!preserveLocalCode && (forceWorkspace || !nextPermissions.canManage || codeEditorLanguage === previousCodeLanguage)) {
        setCodeEditorLanguage(nextCodeEditorLanguage);
        latestCodeEditorLanguageRef.current = nextCodeEditorLanguage;
      }
      if (!preserveLocalCode && (forceWorkspace || !nextPermissions.canManage || codeEditorContent === previousCodeContent)) {
        setCodeEditorContent(nextCodeEditorContent);
        latestCodeEditorContentRef.current = nextCodeEditorContent;
      }
    }
  };

  const loadRoom = async ({ join = false, hydrateDrafts = false, forceWorkspace = false, targetInterviewId = roomApiInterviewId } = {}) => {
    try {
      const response = join ? await joinInterviewRoom(targetInterviewId) : await getInterviewRoom(targetInterviewId);
      if (!isMountedRef.current) return;
      applyPayload(response, { hydrateDrafts, forceWorkspace });
    } catch (error) {
      if (!isMountedRef.current) return;
      setRoomState({ loading: false, error: error.message || 'Unable to load interview room.', payload: null });
    }
  };

  const destroyPeerConnection = () => {
    remoteDescriptionReadyRef.current = false;
    pendingIceCandidatesRef.current = [];
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onnegotiationneeded = null;
        peerConnectionRef.current.close();
      } catch (error) {
        // no-op
      }
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    activeSignalSessionRef.current = '';
    setRemoteStreamReady(false);
    syncRemoteVideo(null);
  };

  const updateHrCandidateMedia = (candidateId, patch = {}) => {
    const normalizedCandidateId = String(candidateId || '').trim();
    if (!normalizedCandidateId) return;

    setHrCandidateMedia((current) => {
      const nextState = {
        ...current,
        [normalizedCandidateId]: {
          ...(current[normalizedCandidateId] || {}),
          ...patch,
          updatedAt: new Date().toISOString()
        }
      };
      hrCandidateMediaRef.current = nextState;
      return nextState;
    });
  };

  const destroyHrCandidatePeer = (candidateId = '') => {
    const normalizedCandidateId = String(candidateId || '').trim();
    const entries = normalizedCandidateId
      ? [[normalizedCandidateId, hrPeerConnectionsRef.current.get(normalizedCandidateId)]]
      : Array.from(hrPeerConnectionsRef.current.entries());

    entries.forEach(([entryCandidateId, entry]) => {
      if (!entry) return;
      try {
        entry.peerConnection.ontrack = null;
        entry.peerConnection.onicecandidate = null;
        entry.peerConnection.onconnectionstatechange = null;
        entry.peerConnection.oniceconnectionstatechange = null;
        entry.peerConnection.onnegotiationneeded = null;
        entry.peerConnection.close();
      } catch (error) {
        // no-op
      }
      hrPeerConnectionsRef.current.delete(entryCandidateId);
      updateHrCandidateMedia(entryCandidateId, {
        stream: null,
        ready: false,
        connectionState: 'disconnected'
      });
    });
  };

  const flushHrPendingIceCandidates = async (candidateId) => {
    const entry = hrPeerConnectionsRef.current.get(candidateId);
    if (!entry || !entry.remoteDescriptionReady || entry.pendingIceCandidates.length === 0) return;

    const queuedCandidates = [...entry.pendingIceCandidates];
    entry.pendingIceCandidates = [];

    for (const candidatePayload of queuedCandidates) {
      try {
        await entry.peerConnection.addIceCandidate(new RTCIceCandidate(candidatePayload));
      } catch (error) {
        entry.pendingIceCandidates.push(candidatePayload);
      }
    }
  };

  const ensureHrCandidatePeer = (candidateId) => {
    const normalizedCandidateId = String(candidateId || '').trim();
    if (!normalizedCandidateId) return null;

    const existingEntry = hrPeerConnectionsRef.current.get(normalizedCandidateId);
    if (existingEntry?.peerConnection && existingEntry.peerConnection.connectionState !== 'closed') {
      return existingEntry;
    }

    const peerConnection = new RTCPeerConnection(rtcConfig);
    const entry = {
      peerConnection,
      pendingIceCandidates: [],
      remoteDescriptionReady: false,
      sessionId: '',
      offerInFlight: false,
      offerStartedAt: 0
    };

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;

      updateHrCandidateMedia(normalizedCandidateId, {
        stream,
        ready: true,
        connectionState: 'connected'
      });

      if (normalizedCandidateId === currentCandidateId) {
        remoteStreamRef.current = stream;
        syncRemoteVideo(stream);
        setRemoteStreamReady(true);
        setConnectionState('connected');
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !entry.sessionId) return;
      sendInterviewSignal(roomApiInterviewId, {
        signalType: 'ice-candidate',
        recipientId: normalizedCandidateId,
        payload: {
          candidate: event.candidate.toJSON(),
          candidateId: normalizedCandidateId,
          sessionId: entry.sessionId
        }
      }).catch(() => {});
    };

    const markConnectionState = () => {
      const nextState = peerConnection.connectionState || peerConnection.iceConnectionState || 'new';
      updateHrCandidateMedia(normalizedCandidateId, { connectionState: nextState });
      if (normalizedCandidateId === currentCandidateId) {
        setConnectionState(nextState);
      }
      if (['failed', 'disconnected'].includes(nextState) && localStreamRef.current) {
        createHrCandidateOffer(normalizedCandidateId, { iceRestart: true }).catch(() => {});
      }
    };

    peerConnection.onconnectionstatechange = markConnectionState;
    peerConnection.oniceconnectionstatechange = markConnectionState;
    peerConnection.onnegotiationneeded = () => {
      if (!localStreamRef.current) return;
      createHrCandidateOffer(normalizedCandidateId).catch(() => {});
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    hrPeerConnectionsRef.current.set(normalizedCandidateId, entry);
    updateHrCandidateMedia(normalizedCandidateId, { connectionState: 'connecting' });
    return entry;
  };

  const createHrCandidateOffer = async (candidateId, { iceRestart = false, force = false } = {}) => {
    const normalizedCandidateId = String(candidateId || '').trim();
    if (!isManager || !localStreamRef.current || !normalizedCandidateId) return;

    const entry = ensureHrCandidatePeer(normalizedCandidateId);
    if (!entry || entry.offerInFlight) return;

    const { peerConnection } = entry;
    const peerState = peerConnection.connectionState || peerConnection.iceConnectionState || 'new';
    const recentOfferAge = Date.now() - (entry.offerStartedAt || 0);
    const hasRecentOffer = entry.sessionId && recentOfferAge >= 0 && recentOfferAge < HR_OFFER_COOLDOWN_MS;
    const canRenegotiateNow = ['failed', 'disconnected', 'closed'].includes(peerState);
    if (!force && hasRecentOffer && !canRenegotiateNow) return;

    if (peerConnection.signalingState !== 'stable') {
      const stuckMs = Date.now() - (entry.offerStartedAt || 0);
      if (peerConnection.signalingState === 'have-local-offer' && stuckMs > 8000) {
        try {
          await peerConnection.setLocalDescription({ type: 'rollback' });
        } catch (error) {
          destroyHrCandidatePeer(normalizedCandidateId);
          return;
        }
      } else {
        return;
      }
    }

    entry.offerInFlight = true;
    entry.offerStartedAt = Date.now();
    try {
      const sessionId = createSignalSessionId();
      entry.sessionId = sessionId;
      const offer = await peerConnection.createOffer({ iceRestart });
      await peerConnection.setLocalDescription(offer);
      updateHrCandidateMedia(normalizedCandidateId, { connectionState: 'connecting' });
      if (normalizedCandidateId === currentCandidateId) {
        setConnectionState('connecting');
      }
      await sendInterviewSignal(roomApiInterviewId, {
        signalType: 'offer',
        recipientId: normalizedCandidateId,
        payload: {
          sdp: peerConnection.localDescription || offer,
          candidateId: normalizedCandidateId,
          sessionId
        }
      });
    } finally {
      entry.offerInFlight = false;
    }
  };

  const flushPendingIceCandidates = async (peerConnection) => {
    if (!peerConnection || !remoteDescriptionReadyRef.current || pendingIceCandidatesRef.current.length === 0) return;

    const queuedCandidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of queuedCandidates) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        pendingIceCandidatesRef.current.push(candidate);
      }
    }
  };

  const broadcastMediaState = (nextVideoSource, sharingScreen) =>
    videoRecipientId
      ?
    sendInterviewSignal(roomApiInterviewId, {
      signalType: 'workspace-sync',
      recipientId: videoRecipientId,
      payload: {
        kind: 'media-state',
        videoSource: nextVideoSource,
        sharingScreen,
        actor: localActor,
        candidateId: currentCandidateId
      }
    }).catch(() => {})
      : Promise.resolve();

  const sendWorkspaceSignal = (kind, workspace) =>
    workspaceRecipientId
      ?
    sendInterviewSignal(roomApiInterviewId, {
      signalType: 'workspace-sync',
      recipientId: workspaceRecipientId,
      payload: {
        kind,
        updatedAt: new Date().toISOString(),
        actor: localActor,
        candidateId: currentCandidateId,
        clientId: `${localActor}-${currentCandidateId || hr?.id || 'participant'}`,
        workspace
      }
    }).catch(() => {})
      : Promise.resolve();

  const queueLiveWorkspaceSync = (workspace) => {
    pendingWorkspaceSyncRef.current = {
      ...pendingWorkspaceSyncRef.current,
      ...workspace
    };

    if (liveWorkspaceSyncTimerRef.current) {
      window.clearTimeout(liveWorkspaceSyncTimerRef.current);
    }

    liveWorkspaceSyncTimerRef.current = window.setTimeout(() => {
      liveWorkspaceSyncTimerRef.current = null;
      const workspacePatch = pendingWorkspaceSyncRef.current;
      pendingWorkspaceSyncRef.current = {};
      sendWorkspaceSignal('workspace-live', workspacePatch);
    }, LIVE_CODE_SYNC_DEBOUNCE_MS);
  };

  const queueLiveCodeSync = ({ language, content }) => {
    latestCodeEditorLanguageRef.current = language;
    latestCodeEditorContentRef.current = content;

    queueLiveWorkspaceSync({
      activeRoomTab: 'code',
      codeEditorLanguage: latestCodeEditorLanguageRef.current,
      codeEditorContent: latestCodeEditorContentRef.current
    });
  };

  const handleRoomTabChange = (nextTab, { broadcast = true } = {}) => {
    if (!isWorkspaceTab(nextTab)) return;
    activeRoomTabRef.current = nextTab;
    setActiveRoomTab(nextTab);
    if (broadcast) {
      sendWorkspaceSignal('workspace-focus', { activeRoomTab: nextTab });
    }
  };

  const handleCodeLanguageChange = (nextLanguage) => {
    const normalizedLanguage = String(nextLanguage || 'javascript').trim() || 'javascript';
    localCodeEditVersionRef.current += 1;
    lastLocalCodeEditAtRef.current = Date.now();
    setCodeEditorLanguage(normalizedLanguage);
    setWorkspaceVersion((value) => value + 1);
    queueLiveCodeSync({
      language: normalizedLanguage,
      content: latestCodeEditorContentRef.current
    });
    setCodeRunState({
      status: 'idle',
      output: '',
      error: '',
      ranAt: '',
      language: normalizedLanguage,
      meta: ''
    });
  };

  const handleCodeEditorChange = (value) => {
    const nextContent = value || '';
    localCodeEditVersionRef.current += 1;
    lastLocalCodeEditAtRef.current = Date.now();
    setCodeEditorContent(nextContent);
    setWorkspaceVersion((count) => count + 1);
    queueLiveCodeSync({
      language: latestCodeEditorLanguageRef.current,
      content: nextContent
    });
  };

  const replaceOutgoingVideoTrack = async (nextTrack, nextSource) => {
    if (!localStreamRef.current || !nextTrack) return;

    if (isManager) {
      const existingTracks = localStreamRef.current.getVideoTracks();
      existingTracks.forEach((track) => {
        if (track !== nextTrack) {
          localStreamRef.current.removeTrack(track);
        }
      });

      if (!localStreamRef.current.getVideoTracks().includes(nextTrack)) {
        localStreamRef.current.addTrack(nextTrack);
      }

      const replaceTasks = Array.from(hrPeerConnectionsRef.current.values()).map(async (entry) => {
        const sender = entry.peerConnection.getSenders().find((candidateSender) => candidateSender.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(nextTrack);
        } else {
          entry.peerConnection.addTrack(nextTrack, localStreamRef.current);
        }
      });
      await Promise.all(replaceTasks);

      nextTrack.enabled = isCameraOn;
      syncLocalVideo(localStreamRef.current);
      setVideoSource(nextSource);
      return;
    }

    const peerConnection = ensurePeerConnection();
    const existingTracks = localStreamRef.current.getVideoTracks();
    existingTracks.forEach((track) => {
      if (track !== nextTrack) {
        localStreamRef.current.removeTrack(track);
      }
    });

    if (!localStreamRef.current.getVideoTracks().includes(nextTrack)) {
      localStreamRef.current.addTrack(nextTrack);
    }

    const sender = peerConnection.getSenders().find((candidateSender) => candidateSender.track?.kind === 'video');
    if (sender) {
      await sender.replaceTrack(nextTrack);
    } else {
      peerConnection.addTrack(nextTrack, localStreamRef.current);
    }

    nextTrack.enabled = isCameraOn;
    syncLocalVideo(localStreamRef.current);
    setVideoSource(nextSource);
  };

  const ensurePeerConnection = () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const peerConnection = new RTCPeerConnection(rtcConfig);

    const requestReconnect = (reason) => {
      if (!localStreamRef.current) return;
      if (!videoRecipientId) return;
      const now = Date.now();
      if (now - lastReconnectAttemptAtRef.current < 2500) return;
      lastReconnectAttemptAtRef.current = now;

      if (isManager) {
        maybeCreateOffer({ iceRestart: true }).catch(() => {});
        return;
      }

      sendInterviewSignal(roomApiInterviewId, {
        signalType: 'reconnect',
        recipientId: videoRecipientId || null,
        payload: {
          requestedBy: 'candidate',
          reason,
          candidateId: currentCandidateId,
          sessionId: activeSignalSessionRef.current || '',
          sentAt: new Date().toISOString()
        }
      }).catch(() => {});
    };

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        syncRemoteVideo(stream);
        setRemoteStreamReady(true);
        setConnectionState((current) => (['new', 'connecting'].includes(current) ? 'connected' : current));
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const sessionId = activeSignalSessionRef.current;
        if (!sessionId) return;
        sendInterviewSignal(roomApiInterviewId, {
          signalType: 'ice-candidate',
          recipientId: videoRecipientId || null,
          payload: {
            candidate: event.candidate.toJSON(),
            candidateId: currentCandidateId,
            sessionId
          }
        }).catch(() => {});
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const nextState = peerConnection.connectionState || 'new';
      setConnectionState(nextState);

      if (['failed', 'disconnected'].includes(nextState)) {
        requestReconnect(nextState);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      const nextState = peerConnection.iceConnectionState || '';
      if (['failed', 'disconnected'].includes(nextState)) {
        requestReconnect(`ice-${nextState}`);
      }
    };

    peerConnection.onnegotiationneeded = () => {
      if (!isManager || !localStreamRef.current) return;
      maybeCreateOffer().catch(() => {});
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const sendPresenceSignal = (reason = 'ready', { force = false, recipientId = videoRecipientId } = {}) => {
    if (!recipientId) return;
    const now = Date.now();
    if (!force && now - lastPresenceSignalAtRef.current < 1500) return;
    lastPresenceSignalAtRef.current = now;

    sendInterviewSignal(roomApiInterviewId, {
      signalType: 'presence',
      recipientId: recipientId || null,
      payload: {
        actor: localActor,
        reason,
        candidateId: currentCandidateId,
        roomInterviewId: interview?.room_interview_id || interview?.id || roomApiInterviewId,
        sessionId: createSignalSessionId(),
        sentAt: new Date().toISOString()
      }
    }).catch(() => {});
  };

  const maybeCreateOffer = async ({ iceRestart = false } = {}) => {
    if (!isManager || !localStreamRef.current) return;
    if (!videoRecipientId) return;
    if (isManager) {
      await createHrCandidateOffer(videoRecipientId, { iceRestart });
      return;
    }
    if (offerInFlightRef.current) return;

    const peerConnection = ensurePeerConnection();
    if (peerConnection.signalingState !== 'stable') {
      const stuckMs = Date.now() - (offerStartedAtRef.current || 0);
      if (peerConnection.signalingState === 'have-local-offer' && stuckMs > 8000) {
        try {
          peerConnection.setLocalDescription({ type: 'rollback' });
        } catch (rollbackError) {
          destroyPeerConnection();
        }
      } else {
        return;
      }
    }

    offerInFlightRef.current = true;
    offerStartedAtRef.current = Date.now();
    try {
      const activePeer = ensurePeerConnection();
      const sessionId = createSignalSessionId();
      activeSignalSessionRef.current = sessionId;
      const offer = await activePeer.createOffer({ iceRestart });
      await activePeer.setLocalDescription(offer);
      setConnectionState((current) => (current === 'connected' ? current : 'connecting'));
      await sendInterviewSignal(roomApiInterviewId, {
        signalType: 'offer',
        recipientId: videoRecipientId,
        payload: {
          sdp: activePeer.localDescription || offer,
          candidateId: currentCandidateId,
          sessionId
        }
      });
    } finally {
      offerInFlightRef.current = false;
    }
  };

  const startSpeechRecognition = () => {
    if (!SPEECH_RECOGNITION || recognitionRef.current || !aiAllowed) return;

    const recognition = new SPEECH_RECOGNITION();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const latest = event.results[event.results.length - 1];
      const text = String(latest?.[0]?.transcript || '').trim();
      if (!text) return;

      const segment = {
        id: `local-${Date.now()}`,
        speaker: isManager ? 'hr' : 'candidate',
        text,
        createdAt: new Date().toISOString()
      };
      pendingTranscriptSegmentsRef.current.push(segment);
      setTranscriptSegments((current) => mergeUniqueSegments(current, [segment]));
      setWorkspaceVersion((value) => value + 1);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setTranscriptionActive(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setTranscriptionActive(true);
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setTranscriptionActive(false);
  };

  const startLocalMedia = async ({ createOffer = true, announcePresence = true } = {}) => {
    if (localStreamRef.current) {
      if (announcePresence) sendPresenceSignal('media-ready');
      if (createOffer) {
        if (isManager && roomParticipants.length > 1) {
          await Promise.all(roomParticipants
            .filter((participant) => participant.candidateId)
            .map((participant) => createHrCandidateOffer(participant.candidateId, { iceRestart: true }).catch(() => null)));
        } else {
          await maybeCreateOffer();
        }
      }
      return;
    }

    setIsStartingMedia(true);
    setLocalMediaError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      cameraVideoTrackRef.current = stream.getVideoTracks()[0] || null;
      setIsCameraOn(true);
      setIsMicOn(true);
      setVideoSource('camera');
      setConnectionState((current) => (current === 'connected' ? current : 'connecting'));
      syncLocalVideo(stream);
      if (!isManager) {
        ensurePeerConnection();
      }
      if (announcePresence) sendPresenceSignal('media-ready');

      if (createOffer) {
        if (isManager && roomParticipants.length > 1) {
          await Promise.all(roomParticipants
            .filter((participant) => participant.candidateId)
            .map((participant) => createHrCandidateOffer(participant.candidateId).catch(() => null)));
        } else {
          await maybeCreateOffer();
        }
      }
    } catch (error) {
      setLocalMediaError(error.message || 'Unable to access camera and microphone.');
    } finally {
      setIsStartingMedia(false);
    }
  };

  const stopScreenShare = async ({ notify = true } = {}) => {
    const screenShareStream = screenShareStreamRef.current;
    if (!screenShareStream) return;

    screenShareStream.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    screenShareStreamRef.current = null;

    if (cameraVideoTrackRef.current) {
      await replaceOutgoingVideoTrack(cameraVideoTrackRef.current, 'camera');
    }

    setIsScreenShareActive(false);
    if (notify) {
      broadcastMediaState('camera', false);
    }
  };

  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setLocalMediaError('Screen sharing is not supported in this browser.');
      return;
    }

    if (!localStreamRef.current) {
      await startLocalMedia({ createOffer: isManager });
    }

    const screenShareStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });
    const screenTrack = screenShareStream.getVideoTracks()[0];
    if (!screenTrack) {
      screenShareStream.getTracks().forEach((track) => track.stop());
      throw new Error('No screen track was returned.');
    }

    screenTrack.onended = () => {
      stopScreenShare().catch(() => {});
    };

    screenShareStreamRef.current = screenShareStream;
    await replaceOutgoingVideoTrack(screenTrack, 'screen');
    setIsScreenShareActive(true);
    broadcastMediaState('screen', true);
  };

  const stopRecordingLoop = () => {
    if (recordingAnimationRef.current) {
      cancelAnimationFrame(recordingAnimationRef.current);
      recordingAnimationRef.current = null;
    }
  };

  const startRecordingLoop = () => {
    if (!recordingCanvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      recordingCanvasRef.current = canvas;
    }

    const canvas = recordingCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const paint = () => {
      const localVideo = localVideoRef.current || compactLocalVideoRef.current;
      const remoteVideo = remoteVideoRef.current || compactRemoteVideoRef.current;

      context.fillStyle = '#0f172a';
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (remoteVideo && remoteVideo.readyState >= 2) {
        context.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
      }

      if (localVideo && localVideo.readyState >= 2) {
        context.drawImage(localVideo, canvas.width - 360, canvas.height - 220, 320, 180);
      }

      recordingAnimationRef.current = requestAnimationFrame(paint);
    };

    paint();
  };

  const stopCompositeRecording = async ({ upload = true } = {}) => {
    if (!recorderRef.current) return;

    const recorder = recorderRef.current;
    recorderRef.current = null;
    stopRecordingLoop();

    await new Promise((resolve) => {
      recorder.addEventListener('stop', resolve, { once: true });
      recorder.stop();
    });

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      audioDestinationRef.current = null;
    }

    setRecordingState((current) => ({ ...current, active: false }));

    if (!upload || !isManager) return;

    const mimeType = recorder.mimeType || 'video/webm';
    const blob = new Blob(recorderChunksRef.current, { type: mimeType });
    recorderChunksRef.current = [];

    if (!blob.size) return;

    try {
      setRecordingState((current) => ({ ...current, uploading: true, message: 'Uploading interview recording…' }));
      const recording = await uploadInterviewRecording(roomApiInterviewId, blob, `interview-${Date.now()}.webm`);
      setRecordingState({
        active: false,
        uploading: false,
        message: 'Recording saved to the candidate profile.',
        url: recording?.url || ''
      });
    } catch (error) {
      setRecordingState({
        active: false,
        uploading: false,
        message: error.message || 'Unable to upload interview recording.',
        url: ''
      });
    }
  };

  const startCompositeRecording = async () => {
    if (!isManager || recorderRef.current || !localStreamRef.current || !remoteStreamRef.current) return;

    startRecordingLoop();

    const canvasStream = recordingCanvasRef.current.captureStream(24);
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    [localStreamRef.current, remoteStreamRef.current].forEach((stream) => {
      if (!stream || stream.getAudioTracks().length === 0) return;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(destination);
    });

    audioContextRef.current = audioContext;
    audioDestinationRef.current = destination;

    const compositeStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ]);

    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mimeType = mimeTypes.find((candidateMimeType) => MediaRecorder.isTypeSupported(candidateMimeType)) || '';
    const recorder = new MediaRecorder(compositeStream, mimeType ? { mimeType } : undefined);

    recorderChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) {
        recorderChunksRef.current.push(event.data);
      }
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecordingState({
      active: true,
      uploading: false,
      message: 'Recording is running with candidate consent.',
      url: ''
    });
  };

  const isSignalForCurrentParticipant = (payloadBody = {}) => {
    const signalCandidateId = String(payloadBody.candidateId || '').trim();
    return !signalCandidateId || !currentCandidateId || signalCandidateId === currentCandidateId;
  };

  const markRoomParticipantOnline = (candidateId, isOnline = true) => {
    const normalizedCandidateId = String(candidateId || '').trim();
    if (!normalizedCandidateId) return;

    setRoomState((current) => {
      const currentPayload = current.payload;
      const participants = Array.isArray(currentPayload?.roomParticipants)
        ? currentPayload.roomParticipants
        : [];

      if (participants.length === 0) return current;

      return {
        ...current,
        payload: {
          ...currentPayload,
          roomParticipants: participants.map((participant) =>
            participant.candidateId === normalizedCandidateId
              ? {
                  ...participant,
                  isOnline,
                  lastSeenAt: new Date().toISOString()
                }
              : participant
          )
        }
      };
    });
  };

  const updateCandidateControlState = (candidateId, patch = {}) => {
    const normalizedCandidateId = String(candidateId || '').trim();
    if (!normalizedCandidateId) return;

    setCandidateControls((current) => ({
      ...current,
      [normalizedCandidateId]: {
        ...(current[normalizedCandidateId] || {}),
        ...patch,
        updatedAt: new Date().toISOString()
      }
    }));
  };

  const sendCandidateControl = async ({ candidateId, action, taskText = '', taskMode = '' }) => {
    if (!isManager) return;
    const targetCandidateId = String(candidateId || '').trim();
    if (!targetCandidateId) return;

    const controlPayload = {
      kind: 'candidate-control',
      actor: 'hr',
      candidateId: targetCandidateId,
      action,
      taskText: String(taskText || '').trim(),
      taskMode: String(taskMode || '').trim(),
      sentAt: new Date().toISOString()
    };

    updateCandidateControlState(targetCandidateId, {
      muted: action === 'mute' ? true : action === 'unmute' ? false : candidateControls[targetCandidateId]?.muted,
      taskText: controlPayload.taskText || candidateControls[targetCandidateId]?.taskText || '',
      taskMode: controlPayload.taskMode || candidateControls[targetCandidateId]?.taskMode || ''
    });

    await sendInterviewSignal(roomApiInterviewId, {
      signalType: 'workspace-sync',
      recipientId: targetCandidateId,
      payload: controlPayload
    });
  };

  const muteAllCandidates = async () => {
    if (!isManager || roomParticipants.length === 0) return;
    await Promise.all(roomParticipants
      .filter((participant) => participant.candidateId)
      .map((participant) => sendCandidateControl({
        candidateId: participant.candidateId,
        action: 'mute'
      }).catch(() => null)));
  };

  const unmuteSelectedCandidate = async () => {
    await sendCandidateControl({
      candidateId: currentCandidateId,
      action: 'unmute'
    });
  };

  const assignTaskToSelectedCandidate = async (taskMode = 'custom') => {
    const taskText = String(candidateTaskInput || '').trim();
    if (!taskText) return;
    await sendCandidateControl({
      candidateId: currentCandidateId,
      action: 'task',
      taskText,
      taskMode
    });
    setCandidateTaskInput('');
  };

  const assignPresetTaskToSelectedCandidate = async (taskText, taskMode) => {
    const normalizedTaskText = String(taskText || '').trim();
    if (!normalizedTaskText) return;
    setCandidateTaskInput(normalizedTaskText);
    await sendCandidateControl({
      candidateId: currentCandidateId,
      action: 'task',
      taskText: normalizedTaskText,
      taskMode
    });
    setCandidateTaskInput('');
  };

  const selectRoomParticipant = async (participant) => {
    if (!participant?.interviewId || participant.interviewId === roomApiInterviewId) return;
    setIsSwitchingCandidate(true);
    setLocalMediaError('');
    try {
      const response = await getInterviewRoom(participant.interviewId);
      setActiveInterviewId(participant.interviewId);
      if (!isManager) {
        destroyPeerConnection();
      }
      const mediaState = hrCandidateMedia[participant.candidateId] || {};
      if (mediaState.stream) {
        remoteStreamRef.current = mediaState.stream;
        syncRemoteVideo(mediaState.stream);
        setRemoteStreamReady(true);
        setConnectionState(mediaState.connectionState || 'connected');
      } else {
        setRemoteStreamReady(false);
        setConnectionState('connecting');
        if (isManager && localStreamRef.current) {
          createHrCandidateOffer(participant.candidateId, { iceRestart: true }).catch(() => {});
        }
      }
      setRemoteVideoSource(mediaState.videoSource || 'camera');
      setAssignedTask(null);
      applyPayload(response, { hydrateDrafts: true, forceWorkspace: true });
    } catch (error) {
      setRoomState((current) => ({ ...current, error: error.message || 'Unable to switch candidate.' }));
    } finally {
      setIsSwitchingCandidate(false);
    }
  };

  const handleSignal = async (signal) => {
    const type = signal?.signal_type;
    const payloadBody = signal?.payload || {};
    const signalSessionId = String(payloadBody.sessionId || '').trim();

    if (signal?.created_at) {
      signalCursorRef.current = signal.created_at;
    }

    if (type === 'offer') {
      if (!isSignalForCurrentParticipant(payloadBody)) return;
      if (!signalSessionId) return;
      setConnectionState('connecting');
      if (activeSignalSessionRef.current && activeSignalSessionRef.current !== signalSessionId) {
        destroyPeerConnection();
      }
      activeSignalSessionRef.current = signalSessionId;
      await startLocalMedia({ createOffer: false, announcePresence: false });
      let peerConnection = ensurePeerConnection();
      if (peerConnection.signalingState !== 'stable') {
        try {
          await peerConnection.setLocalDescription({ type: 'rollback' });
        } catch (error) {
          destroyPeerConnection();
          peerConnection = ensurePeerConnection();
        }
      }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payloadBody.sdp));
      remoteDescriptionReadyRef.current = true;
      await flushPendingIceCandidates(peerConnection);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      setConnectionState((current) => (current === 'connected' ? current : 'connecting'));
      await sendInterviewSignal(roomApiInterviewId, {
        signalType: 'answer',
        recipientId: videoRecipientId || null,
        payload: {
          sdp: peerConnection.localDescription || answer,
          candidateId: currentCandidateId,
          sessionId: signalSessionId
        }
      });
      return;
    }

    if (type === 'answer' && isManager) {
      const answerCandidateId = String(payloadBody.candidateId || '').trim();
      const entry = hrPeerConnectionsRef.current.get(answerCandidateId);
      if (!answerCandidateId || !entry || !signalSessionId || signalSessionId !== entry.sessionId) return;
      updateHrCandidateMedia(answerCandidateId, { connectionState: 'connecting' });
      await entry.peerConnection.setRemoteDescription(new RTCSessionDescription(payloadBody.sdp));
      entry.remoteDescriptionReady = true;
      await flushHrPendingIceCandidates(answerCandidateId);
      return;
    }

    if (type === 'answer' && peerConnectionRef.current) {
      if (!isSignalForCurrentParticipant(payloadBody)) return;
      if (!signalSessionId || signalSessionId !== activeSignalSessionRef.current) return;
      setConnectionState((current) => (current === 'connected' ? current : 'connecting'));
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payloadBody.sdp));
      remoteDescriptionReadyRef.current = true;
      await flushPendingIceCandidates(peerConnectionRef.current);
      return;
    }

    if (type === 'ice-candidate' && payloadBody.candidate) {
      if (isManager) {
        const iceCandidateId = String(payloadBody.candidateId || '').trim();
        const entry = hrPeerConnectionsRef.current.get(iceCandidateId);
        if (!iceCandidateId || !entry || !signalSessionId || signalSessionId !== entry.sessionId) return;
        if (!entry.remoteDescriptionReady) {
          entry.pendingIceCandidates.push(payloadBody.candidate);
          return;
        }
        try {
          await entry.peerConnection.addIceCandidate(new RTCIceCandidate(payloadBody.candidate));
        } catch (error) {
          entry.pendingIceCandidates.push(payloadBody.candidate);
        }
        return;
      }

      if (!isSignalForCurrentParticipant(payloadBody)) return;
      if (!signalSessionId || signalSessionId !== activeSignalSessionRef.current) return;
      if (!peerConnectionRef.current || !remoteDescriptionReadyRef.current) {
        pendingIceCandidatesRef.current.push(payloadBody.candidate);
        return;
      }

      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payloadBody.candidate));
      } catch (error) {
        pendingIceCandidatesRef.current.push(payloadBody.candidate);
      }
      return;
    }

    if (type === 'workspace-sync' && payloadBody.kind === 'media-state') {
      if (isManager && payloadBody.candidateId) {
        updateHrCandidateMedia(payloadBody.candidateId, {
          videoSource: payloadBody.videoSource === 'screen' ? 'screen' : 'camera'
        });
      }
      if (!isSignalForCurrentParticipant(payloadBody)) return;
      setRemoteVideoSource(payloadBody.videoSource === 'screen' ? 'screen' : 'camera');
      return;
    }

    if (type === 'workspace-sync' && payloadBody.kind === 'candidate-control') {
      const controlCandidateId = String(payloadBody.candidateId || '').trim();
      const action = String(payloadBody.action || '').trim().toLowerCase();
      const taskText = String(payloadBody.taskText || '').trim();
      const taskMode = String(payloadBody.taskMode || '').trim();

      if (controlCandidateId) {
        updateCandidateControlState(controlCandidateId, {
          muted: action === 'mute' ? true : action === 'unmute' ? false : candidateControls[controlCandidateId]?.muted,
          taskText: taskText || candidateControls[controlCandidateId]?.taskText || '',
          taskMode: taskMode || candidateControls[controlCandidateId]?.taskMode || ''
        });
      }

      if (isManager || !isSignalForCurrentParticipant(payloadBody)) return;

      if (action === 'mute') {
        setForcedMutedByHr(true);
        setIsMicOn(false);
        setHrControlNotice('Recruiter muted your microphone.');
        return;
      }

      if (action === 'unmute') {
        setForcedMutedByHr(false);
        setIsMicOn(true);
        setHrControlNotice('Recruiter allowed your microphone.');
        return;
      }

      if (action === 'task' && taskText) {
        setAssignedTask({
          text: taskText,
          mode: taskMode || 'custom',
          createdAt: payloadBody.sentAt || new Date().toISOString()
        });
        setHrControlNotice('Recruiter assigned a task.');
        if (taskMode === 'coding') {
          handleRoomTabChange('code', { broadcast: false });
        } else if (taskMode === 'whiteboard') {
          handleRoomTabChange('whiteboard', { broadcast: false });
        }
        return;
      }

      return;
    }

    if (
      type === 'workspace-sync'
      && ['workspace-live', 'workspace-updated', 'workspace-focus'].includes(payloadBody.kind)
    ) {
      if (!isSignalForCurrentParticipant(payloadBody)) return;
      if (payloadBody.workspace && typeof payloadBody.workspace === 'object') {
        const actor = String(payloadBody.actor || '').toLowerCase();
        const hasRecentLocalCodeEdits = Date.now() - lastLocalCodeEditAtRef.current < 1200;
        const preserveLocalCode =
          actor !== localActor
          && hasRecentLocalCodeEdits
          && (
            payloadBody.workspace.codeEditorLanguage !== undefined
            || payloadBody.workspace.codeEditorContent !== undefined
          );
        applyRemoteWorkspaceSnapshot(payloadBody.workspace, { preserveLocalCode });
        return;
      }

      if (payloadBody.kind === 'workspace-live') {
        return;
      }

      await loadRoom({ hydrateDrafts: false, forceWorkspace: true });
      return;
    }

    if (type === 'presence' && isManager && signalSessionId) {
      markRoomParticipantOnline(payloadBody.candidateId, true);
      const presenceCandidateId = String(payloadBody.candidateId || '').trim();
      if (presenceCandidateId) {
        updateHrCandidateMedia(presenceCandidateId, {
          lastSeenAt: payloadBody.sentAt || new Date().toISOString()
        });
      }
      if (!localStreamRef.current) {
        pendingPresenceRequestRef.current = true;
        await startLocalMedia({ createOffer: false, announcePresence: false });
      }
      if (presenceCandidateId) {
        const mediaState = hrCandidateMediaRef.current[presenceCandidateId] || {};
        const hasLiveConnection = Boolean(mediaState.ready && mediaState.connectionState === 'connected');
        if (!hasLiveConnection || ['media-ready', 'media-waiting', 'reconnect-request'].includes(String(payloadBody.reason || ''))) {
          await createHrCandidateOffer(presenceCandidateId, { iceRestart: true });
        }
        return;
      }
      return;
    }

    if (type === 'presence' && !isManager) {
      if (!isSignalForCurrentParticipant(payloadBody)) return;
      if (!remoteStreamReady) {
        setConnectionState((current) => (current === 'connected' ? current : 'connecting'));
      }
      return;
    }

    if (type === 'reconnect') {
      if (isManager) {
        const reconnectCandidateId = String(payloadBody.candidateId || '').trim();
        if (reconnectCandidateId && localStreamRef.current) {
          await createHrCandidateOffer(reconnectCandidateId, { iceRestart: true, force: true });
        }
        return;
      }

      if (!isSignalForCurrentParticipant(payloadBody)) return;
      destroyPeerConnection();
      await startLocalMedia({ createOffer: false, announcePresence: true });
      sendPresenceSignal('reconnect-ack', { force: true });
    }
  };

  const handleReconnect = async () => {
    if (isManager) {
      destroyHrCandidatePeer();
    } else {
      destroyPeerConnection();
    }
    setConnectionState('connecting');
    await startLocalMedia({ createOffer: isManager, announcePresence: true });

    if (isManager) {
      await Promise.all((roomParticipants.length > 0 ? roomParticipants : [{ candidateId: currentCandidateId }])
        .filter((participant) => participant.candidateId)
        .map((participant) => createHrCandidateOffer(participant.candidateId, { iceRestart: true, force: true }).catch(() => null)));
      return;
    }

    sendPresenceSignal('reconnect-request', { force: true });
    await sendInterviewSignal(roomApiInterviewId, {
      signalType: 'reconnect',
      recipientId: videoRecipientId || null,
      payload: {
        requestedBy: 'candidate',
        reason: 'manual',
        candidateId: currentCandidateId,
        sessionId: activeSignalSessionRef.current || '',
        sentAt: new Date().toISOString()
      }
    });
  };

  const requestCandidateReconnect = async (candidateId) => {
    const targetCandidateId = String(candidateId || '').trim();
    if (!isManager || !targetCandidateId) return;

    destroyHrCandidatePeer(targetCandidateId);
    updateHrCandidateMedia(targetCandidateId, {
      stream: null,
      ready: false,
      connectionState: 'connecting'
    });

    await startLocalMedia({ createOffer: false, announcePresence: false });
    if (localStreamRef.current) {
      await createHrCandidateOffer(targetCandidateId, { iceRestart: true, force: true });
    }

    await sendInterviewSignal(roomApiInterviewId, {
      signalType: 'reconnect',
      recipientId: targetCandidateId,
      payload: {
        requestedBy: 'hr',
        reason: 'manual-candidate',
        candidateId: targetCandidateId,
        sessionId: createSignalSessionId(),
        sentAt: new Date().toISOString()
      }
    });
  };

  const getSignalPollCursor = () => {
    if (!signalCursorRef.current) return '';
    const cursorTime = new Date(signalCursorRef.current).getTime();
    if (Number.isNaN(cursorTime)) return signalCursorRef.current;
    return new Date(Math.max(0, cursorTime - SIGNAL_CURSOR_OVERLAP_MS)).toISOString();
  };

  const rememberSignalForProcessing = (signal) => {
    const signalKey = String(signal?.id || `${signal?.sender_id || 'sender'}-${signal?.created_at || ''}-${signal?.signal_type || ''}`);
    if (!signalKey.trim()) return true;

    const seenSignals = processedSignalIdsRef.current;
    if (seenSignals.has(signalKey)) return false;

    seenSignals.add(signalKey);
    if (seenSignals.size > MAX_TRACKED_SIGNAL_IDS) {
      const oldestKey = seenSignals.values().next().value;
      if (oldestKey) seenSignals.delete(oldestKey);
    }
    return true;
  };

  const handleEndInterview = async () => {
    if (!isManager) return;

    setIsEndingRoom(true);
    try {
      await stopSpeechRecognition();
      await stopCompositeRecording({ upload: true });
      const response = await endInterviewRoom(roomApiInterviewId, {
        status: noShowCandidate ? 'no_show' : 'completed',
        rating,
        applicationStatus,
        liveNotes,
        finalNotes,
        noShowCandidate,
        noShowReason
      });
      applyPayload(response, { hydrateDrafts: false });
      navigate(returnPath);
    } catch (error) {
      setRoomState((current) => ({ ...current, error: error.message || 'Unable to end interview.' }));
    } finally {
      setIsEndingRoom(false);
    }
  };

  const handleRecordingDownload = async () => {
    try {
      const recording = await getInterviewRecording(roomApiInterviewId);
      if (recording?.url) {
        window.open(recording.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      setRoomState((current) => ({ ...current, error: error.message || 'Unable to load recording.' }));
    }
  };

  // The room boot sequence intentionally runs once per interview id so media,
  // peer connection, and leave-room cleanup stay coordinated.
  useEffect(() => {
    isMountedRef.current = true;
    setActiveInterviewId(interviewId);
    signalCursorRef.current = new Date(Date.now() - SIGNAL_LOOKBACK_MS).toISOString();
    activeSignalSessionRef.current = '';
    loadRoom({ hydrateDrafts: true, targetInterviewId: interviewId })
      .then(() => loadRoom({ join: true, targetInterviewId: interviewId }))
      .catch(() => {});

    return () => {
      isMountedRef.current = false;
      stopSpeechRecognition();
      stopScreenShare({ notify: false }).catch(() => {});
      stopCompositeRecording({ upload: false }).catch(() => {});
      destroyPeerConnection();
      destroyHrCandidatePeer();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      leaveInterviewRoom(interviewId).catch(() => {});
    };
  }, [interviewId]);

  useEffect(() => {
    if (usesExternalMeeting || !payload?.permissions?.canJoin || localStreamRef.current || isStartingMedia) return undefined;

    const timer = setTimeout(() => {
      startLocalMedia({ createOffer: isManager }).catch(() => {});
    }, 250);

    return () => clearTimeout(timer);
  }, [payload?.permissions?.canJoin, isStartingMedia, isManager, usesExternalMeeting]);

  useEffect(() => {
    hrCandidateMediaRef.current = hrCandidateMedia;
  }, [hrCandidateMedia]);

  useEffect(() => {
    if (usesExternalMeeting || !isManager || !payload?.permissions?.canJoin || !localStreamRef.current) return undefined;
    if (roomParticipants.length <= 1) return undefined;

    const timer = setTimeout(() => {
      roomParticipants.forEach((participant) => {
        if (!participant.candidateId) return;
        const mediaState = hrCandidateMedia[participant.candidateId] || {};
        if (mediaState.ready && mediaState.connectionState === 'connected') return;
        createHrCandidateOffer(participant.candidateId, { iceRestart: false }).catch(() => {});
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [isManager, payload?.permissions?.canJoin, roomParticipants.length, roomApiInterviewId, usesExternalMeeting]);

  // Live room updates flow through signals; avoid periodic room reloads because
  // they remount editor/video surfaces and interrupt typing.
  useEffect(() => {
    if (usesExternalMeeting || !payload?.permissions?.canJoin) return undefined;

    let polling = false;
    const pollSignals = async () => {
      if (polling) return;
      polling = true;
      try {
        const signals = await getInterviewSignals(roomApiInterviewId, getSignalPollCursor());
        for (const signal of signals) {
          if (!rememberSignalForProcessing(signal)) continue;
          await handleSignal(signal);
        }
      } catch (error) {
        // Ignore temporary polling failures.
      } finally {
        polling = false;
      }
    };

    pollSignals();
    const signalInterval = setInterval(pollSignals, SIGNAL_POLL_INTERVAL_MS);

    return () => {
      clearInterval(signalInterval);
    };
  }, [roomApiInterviewId, payload?.permissions?.canJoin, usesExternalMeeting]);

  useEffect(() => {
    if (usesExternalMeeting || !payload?.permissions?.canJoin || !videoRecipientId || !currentCandidateId) return undefined;

    const sendHeartbeat = () => {
      sendPresenceSignal('heartbeat', { force: true });
    };

    sendHeartbeat();
    const heartbeatTimer = setInterval(sendHeartbeat, PRESENCE_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(heartbeatTimer);
  }, [roomApiInterviewId, payload?.permissions?.canJoin, videoRecipientId, currentCandidateId, usesExternalMeeting]);

  useEffect(() => {
    if (usesExternalMeeting || !payload?.permissions?.canJoin) return undefined;

    const retryTimer = setInterval(() => {
      if (!localStreamRef.current) return;
      if (!videoRecipientId) return;

      if (isManager) {
        const participantsToConnect = roomParticipants.length > 0
          ? roomParticipants
          : [{ candidateId: currentCandidateId }];
        participantsToConnect.forEach((participant) => {
          const mediaState = hrCandidateMedia[participant.candidateId] || {};
          if (mediaState.ready && mediaState.connectionState === 'connected') return;
          createHrCandidateOffer(participant.candidateId, { iceRestart: true }).catch(() => {});
        });

        if (remoteStreamRef.current && remoteStreamReady) return;
        const peerConnection = peerConnectionRef.current;
        const stuckLong =
          peerConnection
          && peerConnection.signalingState !== 'stable'
          && Date.now() - (offerStartedAtRef.current || 0) > 12000;
        const cooledDown = Date.now() - (stuckResetAtRef.current || 0) > 15000;
        if (stuckLong && cooledDown) {
          stuckResetAtRef.current = Date.now();
          destroyPeerConnection();
        }
        maybeCreateOffer({ iceRestart: true }).catch(() => {});
        return;
      }

      if (remoteStreamRef.current && remoteStreamReady) return;

      sendPresenceSignal('media-waiting');
      sendInterviewSignal(roomApiInterviewId, {
        signalType: 'reconnect',
        recipientId: videoRecipientId || null,
        payload: {
          requestedBy: 'candidate',
          reason: 'media-waiting',
          candidateId: currentCandidateId,
          sessionId: activeSignalSessionRef.current || '',
          sentAt: new Date().toISOString()
        }
      }).catch(() => {});
    }, MEDIA_RETRY_INTERVAL_MS);

    return () => clearInterval(retryTimer);
  }, [roomApiInterviewId, payload?.permissions?.canJoin, isManager, remoteStreamReady, videoRecipientId, currentCandidateId, usesExternalMeeting]);

  useEffect(() => {
    if (!isManager || !currentCandidateId) return;
    if (activeCandidateIdRef.current === currentCandidateId) return;

    const previousCandidateId = activeCandidateIdRef.current;
    activeCandidateIdRef.current = currentCandidateId;
    if (!previousCandidateId || !localStreamRef.current) return;

    const mediaState = hrCandidateMedia[currentCandidateId] || {};
    if (mediaState.stream) {
      remoteStreamRef.current = mediaState.stream;
      syncRemoteVideo(mediaState.stream);
      setRemoteStreamReady(true);
      setConnectionState(mediaState.connectionState || 'connected');
      return;
    }

    setRemoteStreamReady(false);
    setConnectionState('connecting');
    const timer = setTimeout(() => {
      createHrCandidateOffer(currentCandidateId, { iceRestart: true }).catch(() => {});
    }, 150);

    return () => clearTimeout(timer);
  }, [isManager, currentCandidateId, roomApiInterviewId]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return undefined;
    const observedNode = workspacePaneRef.current;
    if (!observedNode) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setIsStageStacked(entry.contentRect.width < INTERVIEW_STAGE_STACK_BREAKPOINT);
    });

    observer.observe(observedNode);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isStageStacked) {
      setPreviewPosition(null);
      return undefined;
    }

    const syncPreviewPosition = () => {
      setPreviewPosition((current) => {
        if (!current) {
          return getDefaultPreviewPosition();
        }

        return clampPreviewPosition(current.x, current.y) || current;
      });
    };

    syncPreviewPosition();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const stageNode = mainStageContainerRef.current;
    const previewNode = previewStageRef.current;
    if (!stageNode || !previewNode) return undefined;

    const observer = new ResizeObserver(() => {
      syncPreviewPosition();
    });

    observer.observe(stageNode);
    observer.observe(previewNode);

    return () => observer.disconnect();
  }, [isStageStacked, isLocalPrimaryStage, sidebarWidth]);

  useEffect(() => () => {
    if (sidebarResizeStateRef.current?.cleanup) {
      sidebarResizeStateRef.current.cleanup();
    }
    if (previewDragStateRef.current?.cleanup) {
      previewDragStateRef.current.cleanup();
    }
    if (liveWorkspaceSyncTimerRef.current) {
      window.clearTimeout(liveWorkspaceSyncTimerRef.current);
      liveWorkspaceSyncTimerRef.current = null;
    }
    clearCodeRunner();
  }, []);

  // Auto-recording starts from room consent + stream readiness and should not
  // restart just because helper identities change between renders.
  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = isCameraOn;
    });
  }, [isCameraOn]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = isMicOn && !forcedMutedByHr;
    });
  }, [isMicOn, forcedMutedByHr]);

  useEffect(() => {
    activeRoomTabRef.current = activeRoomTab;
    syncLocalVideo(localStreamRef.current);
    syncRemoteVideo(remoteStreamRef.current);
  }, [activeRoomTab, isLocalPrimaryStage, remoteStreamReady]);

  useEffect(() => {
    if (!whiteboardCanvasRef.current) return;
    const canvas = whiteboardCanvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f8fafc';
    context.fillRect(0, 0, canvas.width, canvas.height);

    (whiteboardData?.lines || []).forEach((line) => {
      if (!Array.isArray(line.points) || line.points.length < 2) return;
      context.strokeStyle = line.color || '#2563eb';
      context.lineWidth = Number(line.width || 3);
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(line.points[0].x, line.points[0].y);
      line.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.stroke();
    });
  }, [whiteboardData]);

  useEffect(() => {
    if (!payload?.interview || workspaceVersion === 0) return;

    const timer = setTimeout(async () => {
      const transcriptAppend = pendingTranscriptSegmentsRef.current.splice(0);
      const submittedCodeEditVersion = localCodeEditVersionRef.current;
      const submittedCodeEditorLanguage = latestCodeEditorLanguageRef.current;
      const submittedCodeEditorContent = latestCodeEditorContentRef.current;
      const updatePayload = {
        whiteboardData,
        codeEditorLanguage: submittedCodeEditorLanguage,
        codeEditorContent: submittedCodeEditorContent
      };

      if (isManager) {
        updatePayload.liveNotes = liveNotes;
      }

      if (transcriptAppend.length > 0) {
        updatePayload.transcriptAppend = transcriptAppend;
      }

      if (!transcriptAppend.length && !whiteboardData && !codeEditorContent && !liveNotes) {
        return;
      }

      try {
        setIsSavingWorkspace(true);
        const response = await updateInterviewWorkspace(roomApiInterviewId, updatePayload);
        const hasNewerLocalCodeEdits = localCodeEditVersionRef.current !== submittedCodeEditVersion;
        applyPayload(response, {
          hydrateDrafts: false,
          preserveLocalCode: true
        });
        if (!hasNewerLocalCodeEdits) {
          lastSyncedCodeLanguageRef.current = submittedCodeEditorLanguage;
          lastSyncedCodeContentRef.current = submittedCodeEditorContent;
        }
        sendWorkspaceSignal('workspace-updated', {
          whiteboardData,
          codeEditorLanguage: submittedCodeEditorLanguage,
          codeEditorContent: submittedCodeEditorContent,
          ...(isManager ? { liveNotes } : {})
        });
      } catch (error) {
        pendingTranscriptSegmentsRef.current = transcriptAppend.concat(pendingTranscriptSegmentsRef.current);
      } finally {
        setIsSavingWorkspace(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [workspaceVersion, isManager, roomApiInterviewId]);

  useEffect(() => {
    if (!isManager) return;
    if (!recordingAllowed) return;
    if (!localStreamRef.current || !remoteStreamRef.current) return;
    if (recorderRef.current) return;

    startCompositeRecording().catch(() => {});
  }, [isManager, recordingAllowed, remoteStreamReady]);

  const handleSidebarResizeStart = (event) => {
    if (typeof window === 'undefined') return;
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const handlePointerMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const nextWidth = Math.max(
        INTERVIEW_SIDEBAR_MIN_WIDTH,
        Math.min(INTERVIEW_SIDEBAR_MAX_WIDTH, startWidth + delta)
      );
      setSidebarWidth(nextWidth);
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      sidebarResizeStateRef.current = null;
    };

    const handlePointerUp = () => {
      cleanup();
    };

    sidebarResizeStateRef.current = { cleanup };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handlePreviewDragStart = (event) => {
    if (typeof window === 'undefined' || isStageStacked) return;
    const stageNode = mainStageContainerRef.current;
    const previewNode = previewStageRef.current;
    if (!stageNode || !previewNode) return;

    event.preventDefault();

    const stageRect = stageNode.getBoundingClientRect();
    const previewRect = previewNode.getBoundingClientRect();
    const pointerOffsetX = event.clientX - previewRect.left;
    const pointerOffsetY = event.clientY - previewRect.top;

    const handlePointerMove = (moveEvent) => {
      const nextX = moveEvent.clientX - stageRect.left - pointerOffsetX;
      const nextY = moveEvent.clientY - stageRect.top - pointerOffsetY;
      const clampedPosition = clampPreviewPosition(nextX, nextY);
      if (clampedPosition) {
        setPreviewPosition(clampedPosition);
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      previewDragStateRef.current = null;
    };

    const handlePointerUp = () => {
      cleanup();
    };

    previewDragStateRef.current = { cleanup };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleRunCode = async () => {
    if (!codeEditorContent.trim()) {
      setCodeRunState({
        status: 'error',
        output: '',
        error: 'Write some code before running it.',
        ranAt: new Date().toISOString(),
        language: codeEditorLanguage,
        meta: ''
      });
      return;
    }

    setCodeRunState({
      status: 'running',
      output: '',
      error: '',
      ranAt: '',
      language: codeEditorLanguage,
      meta: ''
    });

    try {
      const executionResult = await executeInterviewCodeRequest(roomApiInterviewId, {
        language: codeEditorLanguage,
        source: codeEditorContent
      });
      const formattedOutput = formatCompilerOutput(executionResult);
      const hasError = Boolean(
        (executionResult?.compile?.code ?? 0) !== 0
        || (executionResult?.run?.code ?? 0) !== 0
        || String(executionResult?.run?.signal || '').trim()
      );

      setCodeRunState({
        status: hasError ? 'error' : 'success',
        output: formattedOutput || 'Execution completed with no output.',
        error: '',
        ranAt: new Date().toISOString(),
        language: codeEditorLanguage,
        meta: executionResult?.runtime
          ? `${executionResult.runtime.language} ${executionResult.runtime.version}`
          : ''
      });
    } catch (error) {
      if (codeEditorLanguage === 'javascript') {
        try {
          const executionResult = await executeJavaScriptSnippet(codeEditorContent);
          const outputLines = (executionResult.logs || []).map((entry) =>
            entry.level === 'log' ? entry.text : `[${entry.level}] ${entry.text}`
          );

          if (executionResult.status === 'success') {
            if (executionResult.result && executionResult.result !== 'undefined') {
              outputLines.push(`Return: ${executionResult.result}`);
            }
            setCodeRunState({
              status: 'success',
              output: outputLines.length > 0 ? outputLines.join('\n') : 'Execution completed with no console output.',
              error: '',
              ranAt: new Date().toISOString(),
              language: codeEditorLanguage,
              meta: 'browser fallback'
            });
            return;
          }

          setCodeRunState({
            status: 'error',
            output: outputLines.join('\n'),
            error: executionResult.error || error.message || 'Execution failed.',
            ranAt: new Date().toISOString(),
            language: codeEditorLanguage,
            meta: 'browser fallback'
          });
          return;
        } catch (fallbackError) {
          setCodeRunState({
            status: 'error',
            output: '',
            error: fallbackError.message || error.message || 'Execution failed.',
            ranAt: new Date().toISOString(),
            language: codeEditorLanguage,
            meta: ''
          });
          return;
        }
      }

      setCodeRunState({
        status: 'error',
        output: '',
        error: error.message || 'Execution failed.',
        ranAt: new Date().toISOString(),
        language: codeEditorLanguage,
        meta: ''
      });
    }
  };

  const ROOM_TABS = [
    { key: 'video', label: 'Video', icon: FiVideo },
    { key: 'code', label: 'Code', icon: FiCode },
    { key: 'whiteboard', label: 'Whiteboard', icon: FiEdit3 },
    { key: 'transcript', label: 'Transcript', icon: FiFileText }
  ];

  if (roomState.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <FiRefreshCw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (roomState.error && !payload) {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-[16px] font-bold text-red-700">Interview room unavailable</h1>
        <p className="text-[13px] text-red-600">{roomState.error}</p>
        <Link to={returnPath} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-red-700 border border-red-200">
          <FiArrowLeft size={12} /> Back to interviews
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-96px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <audio ref={bindRemoteAudioRef} autoPlay className="hidden" />
      {roomState.error && (
        <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-[12px] font-medium text-red-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />{roomState.error}
        </div>
      )}

      {/* Compact Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={returnPath} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
            <FiArrowLeft size={11} /> Back
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="truncate text-[14px] font-bold text-slate-900">
            {interview?.title || job?.job_title || 'Interview'}
          </h1>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${connectionMeta.className}`}>
            {connectionMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="hidden items-center gap-1 sm:inline-flex"><FiClock size={10} /> {formatDateTime(interview?.scheduled_at)}</span>
          <span className="hidden items-center gap-1 md:inline-flex">{interview?.duration_minutes || 45}m</span>
          <span className="hidden items-center gap-1 md:inline-flex">{interview?.round_label || 'Interview'}</span>
          {calendarUrl && (
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
              <FiCalendar size={10} /> Calendar
            </a>
          )}
          {isSavingWorkspace ? (
            <span className="inline-flex items-center gap-1 text-amber-600"><FiRefreshCw size={10} className="animate-spin" /> Saving</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-600"><FiSave size={10} /> Synced</span>
          )}
        </div>
      </div>

      {/* Consent banner */}
      {isCandidateViewer && interview?.candidate_consent_required && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2">
          <p className="text-[12px] text-amber-800"><FiInfo size={12} className="mr-1 inline" />Recording and AI transcript require your consent.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => updateInterviewConsent(roomApiInterviewId, { recordingConsent: true, aiConsent: true }).then((r) => applyPayload(r, { hydrateDrafts: false })).catch((e) => setRoomState((c) => ({ ...c, error: e.message })))} className="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white">Allow</button>
            <button type="button" onClick={() => updateInterviewConsent(roomApiInterviewId, { recordingConsent: false, aiConsent: false }).then((r) => applyPayload(r, { hydrateDrafts: false })).catch((e) => setRoomState((c) => ({ ...c, error: e.message })))} className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700">Decline</button>
          </div>
        </div>
      )}

      {isCandidateViewer && (assignedTask || hrControlNotice || forcedMutedByHr) && (
        <div className="shrink-0 border-b border-indigo-100 bg-indigo-50 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                {assignedTask ? 'Recruiter task' : 'Recruiter control'}
              </p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-900">
                {assignedTask?.text || hrControlNotice || 'Your microphone is muted by the recruiter.'}
              </p>
            </div>
            {assignedTask?.mode && (
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-indigo-700">
                {assignedTask.mode}
              </span>
            )}
          </div>
        </div>
      )}

      {usesExternalMeeting ? (
        <div className="flex min-h-[680px] flex-1 flex-col bg-slate-50 xl:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">External video room</p>
                <p className="mt-1 truncate text-[13px] font-semibold text-slate-800">
                  {isManager && roomParticipants.length > P2P_INTERVIEW_ROOM_PARTICIPANTS
                    ? `${roomParticipants.length} participants`
                    : (isManager ? 'Video meeting' : 'Recruiter meeting')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={externalMeetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800"
                >
                  <FiMonitor size={12} /> Open room
                </a>
                <button type="button" onClick={() => navigate(returnPath)} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 transition hover:bg-red-100">
                  <FiPhoneOff size={12} /> Leave
                </button>
              </div>
            </div>

            <div className="min-h-[560px] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {embedsExternalMeeting ? (
                <iframe
                  title="External interview room"
                  src={externalMeetingUrl}
                  allow="camera; microphone; display-capture; fullscreen; clipboard-write"
                  className="h-full min-h-[560px] w-full border-0"
                />
              ) : (
                <div className="flex h-full min-h-[560px] flex-col items-center justify-center gap-3 p-6 text-center">
                  <FiVideo size={34} className="text-slate-300" />
                  <p className="max-w-md text-[13px] font-semibold text-slate-700">This interview is hosted in an external video room.</p>
                  <a
                    href={externalMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
                  >
                    <FiMonitor size={13} /> Open video room
                  </a>
                </div>
              )}
            </div>
          </div>

          <aside className="flex max-h-[560px] w-full shrink-0 flex-col overflow-hidden border-t border-slate-200 bg-white xl:max-h-none xl:w-[320px] xl:border-l xl:border-t-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Room</p>
              <p className="mt-1 text-[13px] font-bold text-slate-900">{interview?.title || job?.job_title || 'Interview'}</p>
              <p className="mt-1 text-[11px] text-slate-500">{formatDateTime(interview?.scheduled_at)} &middot; {interview?.duration_minutes || 45}m</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{isManager ? 'Participants' : 'Your room'}</p>
              <div className="mt-2 space-y-1.5">
                {visibleRoomMembers.map((member) => (
                  <div key={member.id} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-semibold text-slate-800">{member.name}</p>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${
                        member.isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${member.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {member.isOnline ? 'Online' : 'Waiting'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[9px] text-slate-500">{member.role} · {member.meta}</p>
                  </div>
                ))}
                {!visibleRoomMembers.length ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-500">
                    Recruiter room details will appear after joining.
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <>
      {/* Compact Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-1.5">
        <button type="button" onClick={() => (localStreamRef.current ? handleReconnect() : startLocalMedia({ createOffer: true })).catch(() => {})} disabled={isStartingMedia} className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
          {isStartingMedia ? <FiRefreshCw size={11} className="animate-spin" /> : <FiPlay size={11} />}
          {localStreamRef.current ? 'Restart' : 'Start camera'}
        </button>
        <button type="button" onClick={() => setIsMicOn((v) => !v)} disabled={forcedMutedByHr} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isMicOn && !forcedMutedByHr ? 'border-slate-200 bg-white text-slate-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {isMicOn && !forcedMutedByHr ? <FiMic size={11} /> : <FiMicOff size={11} />}
          {forcedMutedByHr ? 'Muted by HR' : (isMicOn ? 'Mic on' : 'Muted')}
        </button>
        <button type="button" onClick={() => setIsCameraOn((v) => !v)} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition ${isCameraOn ? 'border-slate-200 bg-white text-slate-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          {isCameraOn ? <FiVideo size={11} /> : <FiVideoOff size={11} />}
          {isCameraOn ? 'Cam on' : 'Cam off'}
        </button>
        <button type="button" onClick={() => (isScreenShareActive ? stopScreenShare() : startScreenShare()).catch((e) => setLocalMediaError(e.message))} disabled={!localStreamRef.current} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">
          <FiCast size={11} /> {isScreenShareActive ? 'Stop share' : 'Share'}
        </button>
        <button type="button" onClick={() => (transcriptionActive ? stopSpeechRecognition() : startSpeechRecognition())} disabled={!aiAllowed || !localStreamRef.current} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40">
          <FiFileText size={11} /> {transcriptionActive ? 'Stop AI' : 'Transcript'}
        </button>
        <button type="button" onClick={() => handleReconnect().catch(() => {})} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">
          <FiRefreshCw size={11} /> Reconnect
        </button>
        <button type="button" onClick={() => setIsStageSwapped((v) => !v)} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50">
          <FiRepeat size={11} /> Swap
        </button>
        <button type="button" onClick={() => { stopSpeechRecognition(); navigate(returnPath); }} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100">
          <FiPhoneOff size={11} /> Leave
        </button>
        {localMediaError && <span className="ml-1 text-[10px] text-red-600">{localMediaError}</span>}
      </div>

      {/* Main content: Tabs + Sidebar */}
      <div className="flex min-h-[680px] flex-1 flex-col xl:flex-row">
        {/* Left: Tabbed workspace */}
        <div ref={workspacePaneRef} className="flex min-w-0 flex-1 flex-col">
          {/* Tab bar */}
          <div className="flex shrink-0 items-center gap-0.5 border-b border-slate-200 bg-white px-4">
            {ROOM_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} type="button" onClick={() => handleRoomTabChange(tab.key)} className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] font-semibold transition ${activeRoomTab === tab.key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <Icon size={12} /> {tab.label}
                </button>
              );
            })}
            {recordingState.active && <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-red-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Recording</span>}
          </div>

          {/* Tab content */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
            {activeRoomTab !== 'video' && (
              <div className="grid shrink-0 gap-3 lg:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                  <div className="relative aspect-video max-h-[180px]">
                    <video ref={bindRemoteVideoRef(compactRemoteVideoRef)} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
                    {!remoteStreamReady && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <FiUsers size={18} />
                        <p className="text-[10px]">Waiting for {remoteParticipantLabel.toLowerCase()}...</p>
                      </div>
                    )}
                    <div className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      {remoteVideoSource === 'screen' ? 'Screen' : 'Camera'} · {remoteParticipantLabel}
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                  <div className="relative aspect-video max-h-[180px]">
                    <video ref={bindLocalVideoRef(compactLocalVideoRef)} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
                    {!localStreamRef.current && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                        <FiVideoOff size={18} />
                        <p className="text-[10px]">Camera off</p>
                      </div>
                    )}
                    <div className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      {videoSource === 'screen' ? 'Your screen' : participantLabel}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeRoomTab === 'video' && (
              <div className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col gap-3">
                {isManager && roomParticipants.length > 1 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Live candidate gallery</p>
                        <p className="text-[10px] text-slate-400">Click a tile to focus, assign work, or unmute that candidate.</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={muteAllCandidates} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-100">
                          <FiMicOff size={10} /> Mute all
                        </button>
                        <button type="button" onClick={unmuteSelectedCandidate} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100">
                          <FiMic size={10} /> Unmute focus
                        </button>
                      </div>
                    </div>
                    <div
                      className="grid gap-[clamp(0.5rem,0.7vw,0.85rem)]"
                      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, max(220px, 18vw)), 1fr))' }}
                    >
                      {roomParticipants.map((participant) => (
                        <CandidateVideoTile
                          key={participant.interviewId || participant.candidateId}
                          participant={participant}
                          mediaState={hrCandidateMedia[participant.candidateId]}
                          isSelected={participant.candidateId === currentCandidateId}
                          onSelect={() => selectRoomParticipant(participant)}
                          onReconnect={() => requestCandidateReconnect(participant.candidateId).catch((error) => {
                            setRoomState((current) => ({ ...current, error: error.message || 'Unable to reconnect candidate.' }));
                          })}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={mainStageContainerRef} className="relative">
                  <div className="relative aspect-video overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-[0_22px_54px_rgba(15,23,42,0.18)]">
                    {isLocalPrimaryStage ? (
                      <video ref={bindLocalVideoRef(localVideoRef)} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
                    ) : (
                      <video ref={bindRemoteVideoRef(remoteVideoRef)} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
                    )}

                    {isLocalPrimaryStage ? (
                      !localStreamRef.current && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <FiVideoOff size={26} />
                          <p className="text-[12px]">Click &quot;Start camera&quot; above</p>
                        </div>
                      )
                    ) : (
                      !remoteStreamReady && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <FiUsers size={26} />
                          <p className="text-[12px]">Waiting for other participant...</p>
                        </div>
                      )
                    )}

                    <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      {mainStageLabel}
                    </div>
                  </div>

                  <div
                    ref={previewStageRef}
                    onPointerDown={handlePreviewDragStart}
                    className={`${isStageStacked ? 'mt-4 ml-auto w-full max-w-[320px]' : `absolute z-10 w-[24%] min-w-[170px] max-w-[260px] cursor-grab active:cursor-grabbing ${hasFloatingPreviewPosition ? '' : 'right-4 top-4'}`} select-none`}
                    style={
                      !hasFloatingPreviewPosition
                        ? undefined
                        : { left: `${previewPosition.x}px`, top: `${previewPosition.y}px` }
                    }
                  >
                    <div className="relative aspect-video overflow-hidden rounded-[18px] border border-white/20 bg-slate-900 shadow-[0_20px_42px_rgba(15,23,42,0.34)] ring-1 ring-black/10 backdrop-blur-sm">
                      {isLocalPrimaryStage ? (
                        <video ref={bindRemoteVideoRef(remoteVideoRef)} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
                      ) : (
                        <video ref={bindLocalVideoRef(localVideoRef)} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-contain" />
                      )}

                      {isLocalPrimaryStage ? (
                        !remoteStreamReady && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                            <FiUsers size={18} />
                            <p className="text-[10px]">Waiting...</p>
                          </div>
                        )
                      ) : (
                        !localStreamRef.current && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                            <FiVideoOff size={18} />
                            <p className="text-[10px]">Camera off</p>
                          </div>
                        )
                      )}

                      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/75 via-black/35 to-transparent px-3 py-2">
                        <div className="rounded-md bg-black/45 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          {previewStageLabel}
                        </div>
                        <div className="rounded-md bg-white/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/80">
                          Drag
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeRoomTab === 'code' && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={codeEditorLanguage}
                      onChange={(e) => handleCodeLanguageChange(e.target.value)}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                      Compiler: Java, TypeScript, Python, C++, JavaScript
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunCode()}
                      disabled={codeRunState.status === 'running'}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {codeRunState.status === 'running' ? <FiRefreshCw size={11} className="animate-spin" /> : <FiPlay size={11} />}
                      Run code
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeRunState({ status: 'idle', output: '', error: '', ranAt: '', language: codeEditorLanguage, meta: '' })}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Clear output
                    </button>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><FiCode size={10} /> Autosaved</span>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
                  <div className="min-h-[320px] min-w-0 flex-1 border-b border-slate-200 xl:min-h-0 xl:border-b-0 xl:border-r xl:border-slate-200">
                    <Editor
                      height="100%"
                      language={codeEditorLanguage}
                      theme="vs-light"
                      value={codeEditorContent}
                      onChange={handleCodeEditorChange}
                      options={{
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 }
                      }}
                    />
                  </div>
                  <div className="flex min-h-[220px] w-full shrink-0 flex-col bg-slate-950 text-slate-100 xl:min-h-0 xl:w-[320px]">
                    <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                      <div>
                        <p className="text-[11px] font-semibold text-white">Output</p>
                        <p className="text-[10px] text-slate-400">
                          {codeRunState.status === 'running'
                            ? 'Running current snippet...'
                            : codeRunState.ranAt
                              ? `Last run ${formatDateTime(codeRunState.ranAt)}`
                              : 'Run JavaScript to inspect output here.'}
                        </p>
                        {codeRunState.meta && (
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            Runtime: {codeRunState.meta}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
                          codeRunState.status === 'success'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : codeRunState.status === 'error'
                              ? 'bg-red-500/15 text-red-300'
                              : codeRunState.status === 'unsupported'
                                ? 'bg-amber-500/15 text-amber-300'
                                : codeRunState.status === 'running'
                                  ? 'bg-sky-500/15 text-sky-300'
                                  : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {codeRunState.status === 'idle' ? 'Ready' : codeRunState.status}
                      </span>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                      {codeRunState.output ? (
                        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-slate-100">
                          {codeRunState.output}
                        </pre>
                      ) : (
                        <p className="text-[11px] leading-6 text-slate-400">
                          Compile output, runtime output, and exit code will appear here after each run.
                        </p>
                      )}
                      {codeRunState.error && (
                        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-300">Execution error</p>
                          <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-red-100">
                            {codeRunState.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeRoomTab === 'whiteboard' && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-[11px] font-semibold text-slate-700">Whiteboard</span>
                  <button type="button" onClick={() => {
                    const nextWhiteboard = { lines: [], updatedAt: new Date().toISOString() };
                    setWhiteboardData(nextWhiteboard);
                    setWorkspaceVersion((v) => v + 1);
                    sendWorkspaceSignal('workspace-live', { activeRoomTab: 'whiteboard', whiteboardData: nextWhiteboard });
                  }} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50">
                    Clear
                  </button>
                </div>
                <canvas
                  ref={whiteboardCanvasRef}
                  width={920}
                  height={520}
                  className="h-[calc(100vh-280px)] w-full touch-none bg-slate-50"
                  onPointerDown={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const point = {
                      x: ((event.clientX - rect.left) * event.currentTarget.width) / Math.max(1, rect.width),
                      y: ((event.clientY - rect.top) * event.currentTarget.height) / Math.max(1, rect.height)
                    };
                    drawingRef.current = { active: true, currentLine: { id: `line-${Date.now()}`, color: '#2563eb', width: 3, points: [point] } };
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (!drawingRef.current.active || !drawingRef.current.currentLine) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    const point = {
                      x: ((event.clientX - rect.left) * event.currentTarget.width) / Math.max(1, rect.width),
                      y: ((event.clientY - rect.top) * event.currentTarget.height) / Math.max(1, rect.height)
                    };
                    drawingRef.current.currentLine.points.push(point);
                    const activeLine = drawingRef.current.currentLine;
                    if (!activeLine) return;
                    setWhiteboardData((current) => {
                      const nextWhiteboard = {
                        lines: [...(current?.lines || []).filter((line) => line && line.id !== activeLine.id), activeLine],
                        updatedAt: new Date().toISOString()
                      };
                      queueLiveWorkspaceSync({ activeRoomTab: 'whiteboard', whiteboardData: nextWhiteboard });
                      return nextWhiteboard;
                    });
                  }}
                  onPointerUp={() => {
                    drawingRef.current = { active: false, currentLine: null };
                    setWorkspaceVersion((v) => v + 1);
                  }}
                  onPointerLeave={() => { drawingRef.current = { active: false, currentLine: null }; }}
                />
              </div>
            )}

            {activeRoomTab === 'transcript' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <span className="text-[11px] font-semibold text-slate-700">Live Transcript</span>
                    <span className="text-[10px] text-slate-400">{transcriptSegments.length} segments</span>
                  </div>
                  <div className="max-h-[calc(100vh-360px)] divide-y divide-slate-50 overflow-y-auto">
                    {transcriptSegments.length > 0 ? transcriptSegments.map((segment) => (
                      <div key={segment.id} className="px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">{segment.speaker}</span>
                          <span className="text-[9px] text-slate-400">{formatDateTime(segment.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{segment.text}</p>
                      </div>
                    )) : (
                      <div className="px-4 py-10 text-center text-[12px] text-slate-400">
                        Start transcript to see live speech-to-text here.
                      </div>
                    )}
                  </div>
                </div>
                {(interview?.sentiment_hints || []).length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">AI Hints</p>
                    <div className="mt-2 space-y-1">
                      {(interview?.sentiment_hints || []).map((hint) => (
                        <p key={hint} className="rounded-md bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">{hint}</p>
                      ))}
                    </div>
                  </div>
                )}
                {(interview?.red_flags || []).length > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                    <FiAlertTriangle size={12} /> {(interview?.red_flags || []).join(' • ')}
                  </div>
                )}
                {recordingState.message && (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
                    <span>{recordingState.message}</span>
                    {recordingState.url && (
                      <button type="button" onClick={handleRecordingDownload} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600"><FiDownload size={10} /> Download</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize interview details panel"
          onPointerDown={handleSidebarResizeStart}
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-transparent transition hover:bg-slate-200 xl:block"
        />
        <aside
          className="flex max-h-[560px] w-full shrink-0 flex-col overflow-hidden border-t border-slate-200 bg-white xl:max-h-none xl:w-[var(--interview-sidebar-width)] xl:border-l xl:border-t-0"
          style={{ '--interview-sidebar-width': `${sidebarWidth}px` }}
        >
          <div className="flex-1 overflow-y-auto pr-1.5">
            {/* Interview Info */}
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Interview</p>
              <p className="mt-1 text-[13px] font-bold text-slate-900">{job?.job_title || 'Interview'}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{job?.company_name || hr?.companyName || ''}</p>
              <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                <p className="flex items-center gap-1"><FiCalendar size={9} /> {formatDateTime(interview?.scheduled_at)}</p>
                <p className="flex items-center gap-1"><FiClock size={9} /> {interview?.room_status || 'Scheduled'} &middot; {interview?.duration_minutes || 45}m</p>
                <p className="flex items-center gap-1"><FiUsers size={9} /> {interview?.panel_mode ? 'Panel' : 'Single'}</p>
              </div>
            </div>

            {isManager ? (
              <>
                {roomParticipants.length > 1 ? (
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Control room</p>
                      {isSwitchingCandidate && <FiRefreshCw size={11} className="animate-spin text-indigo-500" />}
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {roomParticipants.map((participant) => {
                        const isActiveParticipant = participant.candidateId === currentCandidateId;
                        const isOnlineParticipant = Boolean(participant.isOnline);
                        const controlState = candidateControls[participant.candidateId] || {};
                        return (
                          <button
                            type="button"
                            key={participant.interviewId || participant.candidateId}
                            onClick={() => selectRoomParticipant(participant)}
                            className={`flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[10px] font-semibold transition ${
                              isActiveParticipant
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate">{participant.name || 'Candidate'}</span>
                              {controlState.taskText && (
                                <span className="mt-0.5 block truncate text-[9px] font-medium text-slate-400">
                                  Task: {controlState.taskText}
                                </span>
                              )}
                            </span>
                            <span className="ml-2 flex shrink-0 items-center gap-1">
                              {controlState.muted && <FiMicOff size={10} className="text-red-500" />}
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] uppercase tracking-wide ${
                                  isOnlineParticipant
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isOnlineParticipant ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                {isActiveParticipant ? 'Selected' : (isOnlineParticipant ? 'Online' : 'Open')}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={muteAllCandidates} className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] font-semibold text-red-700 transition hover:bg-red-100">
                        <FiMicOff size={10} /> Mute all
                      </button>
                      <button type="button" onClick={unmuteSelectedCandidate} disabled={!currentCandidateId} className="inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                        <FiMic size={10} /> Unmute selected
                      </button>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <textarea
                        rows={2}
                        value={candidateTaskInput}
                        onChange={(event) => setCandidateTaskInput(event.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                        placeholder="Give selected candidate a task..."
                      />
                      <div className="grid grid-cols-3 gap-1">
                        <button type="button" onClick={() => assignPresetTaskToSelectedCandidate('Please introduce yourself and summarize your latest project.', 'intro')} className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-slate-600 hover:bg-slate-50">
                          Intro
                        </button>
                        <button type="button" onClick={() => assignPresetTaskToSelectedCandidate('Open the Code tab and solve the problem shared by the recruiter.', 'coding')} className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[9px] font-semibold text-slate-600 hover:bg-slate-50">
                          Coding
                        </button>
                        <button type="button" onClick={() => assignTaskToSelectedCandidate('custom')} disabled={!candidateTaskInput.trim()} className="rounded-md bg-slate-900 px-1.5 py-1 text-[9px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                          Send
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-slate-500">
                      Select changes focus inside this tab; candidates can keep joining from their links.
                    </p>
                  </div>
                ) : null}

                {/* Candidate */}
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Candidate</p>
                  <p className="mt-1 text-[12px] font-semibold text-slate-900">{candidate?.name || 'Candidate'}</p>
                  {candidate?.headline && <p className="text-[10px] text-slate-500">{candidate.headline}</p>}
                  {candidate?.resume_url && (
                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600">
                      <FiFileText size={9} /> Resume
                    </a>
                  )}
                </div>

                {/* Notes */}
                <div className="border-b border-slate-100 px-4 py-3 space-y-2.5">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Live notes</label>
                    <textarea rows={3} value={liveNotes} onChange={(e) => { setLiveNotes(e.target.value); setWorkspaceVersion((v) => v + 1); }} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" placeholder="Candidate answers, signals..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Wrap-up</label>
                    <textarea rows={2} value={finalNotes} onChange={(e) => setFinalNotes(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" placeholder="Decision, next steps..." />
                  </div>
                </div>

                {/* Rating + Status */}
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rating</label>
                      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700">
                        {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} star{v > 1 ? 's' : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</label>
                      <select value={applicationStatus} onChange={(e) => setApplicationStatus(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-700">
                        <option value="interviewed">Interviewed</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                    </div>
                  </div>

                  <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5">
                    <input type="checkbox" checked={noShowCandidate} onChange={(e) => setNoShowCandidate(e.target.checked)} className="h-3 w-3 rounded border-slate-300 text-indigo-600" />
                    <span className="text-[10px] font-medium text-slate-600">No-show</span>
                  </label>

                  {noShowCandidate && (
                    <textarea rows={2} value={noShowReason} onChange={(e) => setNoShowReason(e.target.value)} className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 outline-none" placeholder="No-show reason..." />
                  )}
                </div>

                {/* End interview */}
                <div className="px-4 py-3">
                  <button type="button" onClick={handleEndInterview} disabled={isEndingRoom} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                    {isEndingRoom ? <FiRefreshCw size={11} className="animate-spin" /> : <FiCheckCircle size={11} />}
                    Save &amp; end interview
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Recruiter</p>
                  <div className="mt-2 flex items-start gap-2.5">
                    {hr?.logoUrl ? (
                      <img src={hr.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-contain" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 text-[12px] font-bold text-white">
                        {(hr?.name || hr?.companyName || 'H')[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-slate-900">{hr?.name || 'Recruiter'}</p>
                      <p className="truncate text-[10px] text-slate-500">{hr?.companyName || job?.company_name || 'Hiring team'}</p>
                      {hr?.email && <p className="mt-1 truncate text-[10px] text-slate-400">{hr.email}</p>}
                    </div>
                  </div>
                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600">
                    {isRecruiterOnline
                      ? 'Recruiter is in this room.'
                      : 'Recruiter will appear here when they join or reconnect.'}
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tips</p>
                  <p className="rounded-md bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600">Resume is shared with the recruiter.</p>
                  <p className="rounded-md bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600">Use Code and Whiteboard tabs for technical rounds.</p>
                  <p className="rounded-md bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600">Enable transcript if you consent to AI notes.</p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
        </>
      )}
    </div>
  );
};

export default InterviewRoomPage;
