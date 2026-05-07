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
  updateInterviewConsent,
  updateInterviewWorkspace,
  uploadInterviewRecording
} from '../services/interviewRoomApi';

const SPEECH_RECOGNITION =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
    : null;

const defaultWhiteboard = { lines: [], updatedAt: null };
const defaultRtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
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
  const [codeEditorContent, setCodeEditorContent] = useState('// Add prompts or coding questions here.\nfunction solve(input) {\n  return input;\n}\n');
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isEndingRoom, setIsEndingRoom] = useState(false);
  const [isStartingMedia, setIsStartingMedia] = useState(false);
  const [remoteStreamReady, setRemoteStreamReady] = useState(false);
  const [recordingState, setRecordingState] = useState({ active: false, uploading: false, message: '', url: '' });
  const [videoSource, setVideoSource] = useState('camera');
  const [remoteVideoSource, setRemoteVideoSource] = useState('camera');
  const [isScreenShareActive, setIsScreenShareActive] = useState(false);
  const [isStageSwapped, setIsStageSwapped] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const whiteboardCanvasRef = useRef(null);
  const drawingRef = useRef({ active: false, currentLine: null });
  const peerConnectionRef = useRef(null);
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

  const payload = roomState.payload;
  const interview = payload?.interview || null;
  const permissions = payload?.permissions || {};
  const job = payload?.job || {};
  const candidate = payload?.candidate || {};
  const hr = payload?.hr || {};
  const rtcConfig = payload?.rtcConfig || defaultRtcConfig;

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
  const participantLabel = isManager ? 'Recruiter' : 'Candidate';
  const remoteParticipantLabel = isManager ? 'Candidate' : 'Recruiter';

  const syncLocalVideo = (stream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream || null;
    }
  };

  const syncRemoteVideo = (stream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream || null;
    }
  };

  const applyPayload = (nextPayload, { hydrateDrafts = false } = {}) => {
    setRoomState({ loading: false, error: '', payload: nextPayload });
    const nextInterview = nextPayload?.interview || {};
    const nextPermissions = nextPayload?.permissions || {};
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
      setWhiteboardData(nextInterview.whiteboard_data || defaultWhiteboard);
      setCodeEditorLanguage(nextInterview.code_editor_language || 'javascript');
      setCodeEditorContent(nextInterview.code_editor_content || '// Add prompts or coding questions here.\nfunction solve(input) {\n  return input;\n}\n');
      didHydrateRef.current = true;
    } else if (!nextPermissions.canManage) {
      setWhiteboardData(nextInterview.whiteboard_data || defaultWhiteboard);
      setCodeEditorLanguage(nextInterview.code_editor_language || 'javascript');
      setCodeEditorContent(nextInterview.code_editor_content || '');
    }
  };

  const loadRoom = async ({ join = false, hydrateDrafts = false } = {}) => {
    try {
      const response = join ? await joinInterviewRoom(interviewId) : await getInterviewRoom(interviewId);
      if (!isMountedRef.current) return;
      applyPayload(response, { hydrateDrafts });
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
        peerConnectionRef.current.close();
      } catch (error) {
        // no-op
      }
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    setRemoteStreamReady(false);
    syncRemoteVideo(null);
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
    sendInterviewSignal(interviewId, {
      signalType: 'workspace-sync',
      payload: {
        kind: 'media-state',
        videoSource: nextVideoSource,
        sharingScreen,
        actor: isManager ? 'hr' : 'candidate'
      }
    }).catch(() => {});

  const replaceOutgoingVideoTrack = async (nextTrack, nextSource) => {
    if (!localStreamRef.current || !nextTrack) return;

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

    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        syncRemoteVideo(stream);
        setRemoteStreamReady(true);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendInterviewSignal(interviewId, {
          signalType: 'ice-candidate',
          payload: { candidate: event.candidate.toJSON() }
        }).catch(() => {});
      }
    };

    peerConnection.onconnectionstatechange = () => {
      setConnectionState(peerConnection.connectionState || 'new');
      if (['failed', 'disconnected'].includes(peerConnection.connectionState || '') && isManager && localStreamRef.current) {
        sendInterviewSignal(interviewId, {
          signalType: 'reconnect',
          payload: { requestedBy: 'hr', reason: peerConnection.connectionState }
        }).catch(() => {});
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const maybeCreateOffer = async () => {
    if (!isManager || !localStreamRef.current) return;

    const peerConnection = ensurePeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await sendInterviewSignal(interviewId, {
      signalType: 'offer',
      payload: { sdp: offer }
    });
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

  const startLocalMedia = async ({ createOffer = true } = {}) => {
    if (localStreamRef.current) {
      if (createOffer) await maybeCreateOffer();
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
      syncLocalVideo(stream);
      ensurePeerConnection();

      if (createOffer) {
        await maybeCreateOffer();
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
      const localVideo = localVideoRef.current;
      const remoteVideo = remoteVideoRef.current;

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
      const recording = await uploadInterviewRecording(interviewId, blob, `interview-${Date.now()}.webm`);
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

  const handleSignal = async (signal) => {
    const type = signal?.signal_type;
    const payloadBody = signal?.payload || {};

    if (signal?.created_at) {
      signalCursorRef.current = signal.created_at;
    }

    if (type === 'offer') {
      await startLocalMedia({ createOffer: false });
      const peerConnection = ensurePeerConnection();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payloadBody.sdp));
      remoteDescriptionReadyRef.current = true;
      await flushPendingIceCandidates(peerConnection);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await sendInterviewSignal(interviewId, {
        signalType: 'answer',
        payload: { sdp: answer }
      });
      return;
    }

    if (type === 'answer' && peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payloadBody.sdp));
      remoteDescriptionReadyRef.current = true;
      await flushPendingIceCandidates(peerConnectionRef.current);
      return;
    }

    if (type === 'ice-candidate' && payloadBody.candidate) {
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
      setRemoteVideoSource(payloadBody.videoSource === 'screen' ? 'screen' : 'camera');
      return;
    }

    if (type === 'reconnect' && isManager && localStreamRef.current) {
      await maybeCreateOffer();
    }
  };

  const handleEndInterview = async () => {
    if (!isManager) return;

    setIsEndingRoom(true);
    try {
      await stopSpeechRecognition();
      await stopCompositeRecording({ upload: true });
      const response = await endInterviewRoom(interviewId, {
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
      const recording = await getInterviewRecording(interviewId);
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
    loadRoom({ hydrateDrafts: true })
      .then(() => loadRoom({ join: true }))
      .catch(() => {});

    return () => {
      isMountedRef.current = false;
      stopSpeechRecognition();
      stopScreenShare({ notify: false }).catch(() => {});
      stopCompositeRecording({ upload: false }).catch(() => {});
      destroyPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      leaveInterviewRoom(interviewId).catch(() => {});
    };
  }, [interviewId]);

  useEffect(() => {
    if (!payload?.permissions?.canJoin || localStreamRef.current || isStartingMedia) return undefined;

    const timer = setTimeout(() => {
      startLocalMedia({ createOffer: isManager }).catch(() => {});
    }, 250);

    return () => clearTimeout(timer);
  }, [payload?.permissions?.canJoin, isStartingMedia, isManager]);

  // Signal and room polling are intentionally tied to the current interview id.
  useEffect(() => {
    if (!payload?.permissions?.canJoin) return undefined;

    const signalInterval = setInterval(async () => {
      try {
        const signals = await getInterviewSignals(interviewId, signalCursorRef.current);
        for (const signal of signals) {
          await handleSignal(signal);
        }
      } catch (error) {
        // Ignore temporary polling failures.
      }
    }, 1200);

    const roomInterval = setInterval(() => {
      loadRoom({ hydrateDrafts: false }).catch(() => {});
    }, 5000);

    return () => {
      clearInterval(signalInterval);
      clearInterval(roomInterval);
    };
  }, [interviewId, payload?.permissions?.canJoin]);

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
      track.enabled = isMicOn;
    });
  }, [isMicOn]);

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
      const updatePayload = {
        whiteboardData,
        codeEditorLanguage,
        codeEditorContent
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
        const response = await updateInterviewWorkspace(interviewId, updatePayload);
        applyPayload(response, { hydrateDrafts: false });
      } catch (error) {
        pendingTranscriptSegmentsRef.current = transcriptAppend.concat(pendingTranscriptSegmentsRef.current);
      } finally {
        setIsSavingWorkspace(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [workspaceVersion, isManager, interviewId]);

  useEffect(() => {
    if (!isManager) return;
    if (!recordingAllowed) return;
    if (!localStreamRef.current || !remoteStreamRef.current) return;
    if (recorderRef.current) return;

    startCompositeRecording().catch(() => {});
  }, [isManager, recordingAllowed, remoteStreamReady]);

  if (roomState.loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (roomState.error && !payload) {
    return (
      <div className="space-y-4 rounded-[2rem] border border-red-200 bg-red-50 p-8">
        <h1 className="text-2xl font-extrabold text-red-700">Interview room unavailable</h1>
        <p className="text-sm text-red-600">{roomState.error}</p>
        <Link to={returnPath} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-red-700">
          <FiArrowLeft />
          Back to interviews
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {roomState.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {roomState.error}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#eff6ff_45%,#f8fafc_100%)] p-6 shadow-[0_30px_70px_-48px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Link to={returnPath} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
              <FiArrowLeft />
              Back
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-brand-700">
                Interview Room
              </span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${connectionMeta.className}`}>
                {connectionMeta.label}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-navy">
                {interview?.title || `${job?.job_title || 'Interview'} session`}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {job?.company_name || hr?.companyName || 'HHH Jobs'} • {formatDateTime(interview?.scheduled_at)} • {interview?.round_label || 'Interview'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <div className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Schedule</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{formatDateTime(interview?.scheduled_at)}</p>
              <p className="mt-1 text-xs text-slate-500">{interview?.duration_minutes || 45} min • {interview?.timezone || 'Asia/Kolkata'}</p>
            </div>
            <div className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">AI status</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{aiAllowed ? 'Transcript active-ready' : 'Waiting for candidate consent'}</p>
              <p className="mt-1 text-xs text-slate-500">{recordingAllowed ? 'Recording permitted' : 'Recording disabled'}</p>
            </div>
          </div>
        </div>
      </section>

      {isCandidateViewer && interview?.candidate_consent_required ? (
        <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-amber-700">
                <FiInfo />
                Consent required
              </div>
              <p className="text-sm text-amber-900">
                Recording and AI transcription only start after you approve them for this interview.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateInterviewConsent(interviewId, { recordingConsent: true, aiConsent: aiAllowed || true }).then((response) => applyPayload(response, { hydrateDrafts: false })).catch((error) => setRoomState((current) => ({ ...current, error: error.message })))}
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white"
              >
                Allow recording
              </button>
              <button
                type="button"
                onClick={() => updateInterviewConsent(interviewId, { recordingConsent: false, aiConsent: false }).then((response) => applyPayload(response, { hydrateDrafts: false })).catch((error) => setRoomState((current) => ({ ...current, error: error.message })))}
                className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-700"
              >
                Decline
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
        <div className="space-y-6">
          <div className={`grid gap-4 ${isStageSwapped ? 'lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.45fr)]' : 'lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)]'}`}>
            <article className={`rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)] ${isStageSwapped ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">{remoteParticipantLabel} feed</span>
                <FiVideo className="text-brand-600" />
              </div>
              <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-950">
                <video ref={remoteVideoRef} autoPlay playsInline className="aspect-video w-full object-cover" />
                {remoteStreamReady ? (
                  <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                    {remoteVideoSource === 'screen' ? 'Screen shared live' : 'Camera live'}
                  </div>
                ) : null}
                {!remoteStreamReady ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-slate-300">
                    <FiUsers size={28} />
                    <p className="max-w-[220px] text-sm">Waiting for the other person to join and connect.</p>
                  </div>
                ) : null}
              </div>
            </article>

            <article className={`rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)] ${isStageSwapped ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500">{participantLabel} preview</span>
                <FiMonitor className="text-brand-600" />
              </div>
              <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-900">
                <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
                {localStreamRef.current ? (
                  <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
                    {isScreenShareActive ? 'You are sharing screen' : 'Camera preview'}
                  </div>
                ) : null}
                {!localStreamRef.current ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-slate-300">
                    <FiVideoOff size={28} />
                    <p className="max-w-[220px] text-sm">Enable your camera and microphone to start the room.</p>
                  </div>
                ) : null}
              </div>
            </article>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => startLocalMedia({ createOffer: true }).catch(() => {})}
              disabled={isStartingMedia}
              className="inline-flex items-center gap-2 rounded-full bg-[#2d5bff] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_22px_rgba(45,91,255,0.28)]"
            >
              {isStartingMedia ? <FiRefreshCw className="animate-spin" /> : <FiPlay />}
              {localStreamRef.current ? 'Restart camera check' : 'Start camera'}
            </button>
            <button
              type="button"
              onClick={() => setIsMicOn((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              {isMicOn ? <FiMic /> : <FiMicOff />}
              {isMicOn ? 'Mute mic' : 'Unmute mic'}
            </button>
            <button
              type="button"
              onClick={() => setIsCameraOn((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              {isCameraOn ? <FiVideo /> : <FiVideoOff />}
              {isCameraOn ? 'Pause camera' : 'Resume camera'}
            </button>
            <button
              type="button"
              onClick={() => (isScreenShareActive ? stopScreenShare() : startScreenShare()).catch((error) => setLocalMediaError(error.message || 'Unable to share screen.'))}
              disabled={!localStreamRef.current}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCast />
              {isScreenShareActive ? 'Switch to camera' : 'Share screen'}
            </button>
            <button
              type="button"
              onClick={() => (transcriptionActive ? stopSpeechRecognition() : startSpeechRecognition())}
              disabled={!aiAllowed || !localStreamRef.current}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiFileText />
              {transcriptionActive ? 'Stop transcript' : 'Start transcript'}
            </button>
            <button
              type="button"
              onClick={() => maybeCreateOffer().catch(() => {})}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              <FiRefreshCw />
              Reconnect
            </button>
            <button
              type="button"
              onClick={() => setIsStageSwapped((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              <FiRepeat />
              {isStageSwapped ? 'Focus remote screen' : 'Focus my screen'}
            </button>
            <button
              type="button"
              onClick={() => {
                stopSpeechRecognition();
                navigate(returnPath);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-700"
            >
              <FiPhoneOff />
              Leave room
            </button>
          </div>

          {localMediaError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {localMediaError}
            </div>
          ) : null}

          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Interview surface</p>
                <p className="mt-2 font-semibold text-slate-800">{isStageSwapped ? 'Your screen is primary' : 'Remote screen is primary'}</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Technical tools</p>
                <p className="mt-2 font-semibold text-slate-800">Live code editor + whiteboard</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Video mode</p>
                <p className="mt-2 font-semibold text-slate-800">{isScreenShareActive ? 'Screen share active' : 'Camera mode active'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Live transcript</p>
                <h2 className="mt-2 text-2xl font-extrabold text-navy">AI notes stream</h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-bold text-slate-700">{interview?.sentiment_summary || 'Listening for interview patterns…'}</p>
                {(interview?.red_flags || []).length > 0 ? (
                  <p className="mt-1 flex items-center gap-2 text-red-600">
                    <FiAlertTriangle />
                    {(interview?.red_flags || []).join(' • ')}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
              <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {transcriptSegments.length > 0 ? transcriptSegments.map((segment) => (
                    <div key={segment.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">{segment.speaker}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(segment.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{segment.text}</p>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                      Start the microphone and transcript controls to build the interview log in real time.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Sentiment hints</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {(interview?.sentiment_hints || []).length > 0 ? (interview?.sentiment_hints || []).map((hint) => (
                      <div key={hint} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">{hint}</div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center">
                        AI guidance appears once the conversation has enough signal.
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Recording</p>
                  <p className="mt-3 text-sm font-semibold text-slate-700">{recordingState.message || (recordingAllowed ? 'Ready to record after both video streams connect.' : 'Recording is blocked until consent is granted.')}</p>
                  {recordingState.url ? (
                    <button type="button" onClick={handleRecordingDownload} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                      <FiDownload />
                      Open saved recording
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Whiteboard</p>
                <h2 className="mt-2 text-2xl font-extrabold text-navy">Sketch ideas and solve visually</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWhiteboardData({ lines: [], updatedAt: new Date().toISOString() });
                  setWorkspaceVersion((value) => value + 1);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
              >
                Clear board
              </button>
            </div>
            <canvas
              ref={whiteboardCanvasRef}
              width={920}
              height={420}
              className="mt-5 h-[320px] w-full touch-none rounded-[1.5rem] border border-slate-200 bg-slate-50"
              onPointerDown={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
                drawingRef.current = {
                  active: true,
                  currentLine: {
                    id: `line-${Date.now()}`,
                    color: '#2563eb',
                    width: 3,
                    points: [point]
                  }
                };
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!drawingRef.current.active || !drawingRef.current.currentLine) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
                drawingRef.current.currentLine.points.push(point);
                setWhiteboardData((current) => ({
                  lines: [...(current?.lines || []).filter((line) => line.id !== drawingRef.current.currentLine.id), drawingRef.current.currentLine],
                  updatedAt: new Date().toISOString()
                }));
              }}
              onPointerUp={() => {
                drawingRef.current = { active: false, currentLine: null };
                setWorkspaceVersion((value) => value + 1);
              }}
              onPointerLeave={() => {
                drawingRef.current = { active: false, currentLine: null };
              }}
            />
          </article>

          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Technical round</p>
                <h2 className="mt-2 text-2xl font-extrabold text-navy">Monaco code editor</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={codeEditorLanguage}
                  onChange={(event) => {
                    setCodeEditorLanguage(event.target.value);
                    setWorkspaceVersion((value) => value + 1);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                  <FiCode />
                  Autosaved
                </span>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
              <Editor
                height="360px"
                language={codeEditorLanguage}
                theme="vs-light"
                value={codeEditorContent}
                onChange={(value) => {
                  setCodeEditorContent(value || '');
                  setWorkspaceVersion((current) => current + 1);
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Interview context</p>
            <h2 className="mt-2 text-2xl font-extrabold text-navy">{job?.job_title || 'Interview'}</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="flex items-center gap-2 font-bold text-slate-700"><FiCalendar /> Scheduled</p>
                <p className="mt-2">{formatDateTime(interview?.scheduled_at)}</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="flex items-center gap-2 font-bold text-slate-700"><FiClock /> Room status</p>
                <p className="mt-2 capitalize">{interview?.room_status || 'scheduled'}</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="flex items-center gap-2 font-bold text-slate-700"><FiUsers /> Panel mode</p>
                <p className="mt-2">{interview?.panel_mode ? 'Enabled' : 'Single interviewer'}</p>
                {(interview?.panel_members || []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {(interview?.panel_members || []).map((member) => (
                      <div key={member.id || member.email || member.name} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
                        <p className="font-bold text-slate-700">{member.name || member.email}</p>
                        {member.role ? <p className="text-slate-500">{member.role}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              {calendarUrl ? (
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                  <FiLink />
                  Add to Google Calendar
                </a>
              ) : null}
            </div>
          </article>

          {isManager ? (
            <article className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Recruiter workspace</p>
              <h2 className="mt-2 text-2xl font-extrabold text-navy">Resume, notes, and rating</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-bold text-slate-700">{candidate?.name || 'Candidate'}</p>
                  <p className="mt-1 text-sm text-slate-500">{candidate?.headline || 'Resume panel ready for review.'}</p>
                  {candidate?.resume_url ? (
                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
                      <FiFileText />
                      Open resume file
                    </a>
                  ) : null}
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Live notes</label>
                  <textarea
                    rows={6}
                    value={liveNotes}
                    onChange={(event) => {
                      setLiveNotes(event.target.value);
                      setWorkspaceVersion((value) => value + 1);
                    }}
                    className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-brand-300"
                    placeholder="Capture candidate answers, follow-up questions, and hiring signals."
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Final wrap-up</label>
                  <textarea
                    rows={4}
                    value={finalNotes}
                    onChange={(event) => setFinalNotes(event.target.value)}
                    className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-brand-300"
                    placeholder="Decision summary, follow-ups, next steps."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Rating</label>
                    <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">Application status</label>
                    <select value={applicationStatus} onChange={(event) => setApplicationStatus(event.target.value)} className="mt-2 w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      <option value="interviewed">Interviewed</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <input type="checkbox" checked={noShowCandidate} onChange={(event) => setNoShowCandidate(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
                  <span>
                    <span className="block font-bold text-slate-700">Mark candidate as no-show</span>
                    <span className="mt-1 block text-xs">Use this only if the student never joined the interview room.</span>
                  </span>
                </label>

                {noShowCandidate ? (
                  <textarea
                    rows={3}
                    value={noShowReason}
                    onChange={(event) => setNoShowReason(event.target.value)}
                    className="w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-brand-300"
                    placeholder="Reason for no-show tracking"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={handleEndInterview}
                  disabled={isEndingRoom}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-[#0f172a] px-4 py-3 text-sm font-bold text-white"
                >
                  {isEndingRoom ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                  Save interview wrap-up
                </button>
              </div>
            </article>
          ) : (
            <article className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Candidate checklist</p>
              <h2 className="mt-2 text-2xl font-extrabold text-navy">Stay ready inside one screen</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  Resume is already available to the recruiter through your profile and application.
                </div>
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  Use the whiteboard and code editor during technical questions without leaving HHH Jobs.
                </div>
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                  Turn on microphone and transcript if you consent to AI note-taking.
                </div>
              </div>
            </article>
          )}

          <article className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Sync state</p>
                <h2 className="mt-2 text-2xl font-extrabold text-navy">Workspace health</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                {isSavingWorkspace ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                {isSavingWorkspace ? 'Saving…' : 'Live'}
              </span>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-bold text-slate-700">Transcript lines</p>
                <p className="mt-2">{transcriptSegments.length}</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-bold text-slate-700">Whiteboard strokes</p>
                <p className="mt-2">{whiteboardData?.lines?.length || 0}</p>
              </div>
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-bold text-slate-700">Code editor</p>
                <p className="mt-2">{codeEditorLanguage}</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
};

export default InterviewRoomPage;
