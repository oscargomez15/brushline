import { useCallback, useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import brushlineLogo from "../../Assets/logo/brushline-logo-white-letters.webp";
import {
  Bot,
  CalendarClock,
  Check,
  LockKeyhole,
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import "./VoiceAssistantTest.css";
import LiveAppointmentPicker from "./LiveAppointmentPicker";
import { createCallCompletion } from "./callCompletion";

const emptyLead = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  service: "",
  servicesMentioned: [],
  projectDetails: "",
  propertyType: "",
  preferredContact: "",
  preferredAppointment: "",
  serviceAreaStatus: "",
  excludedArea: "",
  requestedHuman: false,
};

const fieldLabels = {
  fullName: "Customer",
  phone: "Phone",
  email: "Email",
  address: "Project address",
  service: "Service",
  servicesMentioned: "Services mentioned",
  projectDetails: "Project details",
  propertyType: "Property type",
  preferredContact: "Preferred contact",
  preferredAppointment: "Preferred appointment",
  serviceAreaStatus: "Service area",
  excludedArea: "Excluded area",
  requestedHuman: "Live human requested",
};

function VoiceAssistantTest({ publicMode = false }) {
  const [showConsent, setShowConsent] = useState(false);
  const [status, setStatus] = useState("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [lead, setLead] = useState(emptyLead);
  const [showHuman, setShowHuman] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [appointmentResult, setAppointmentResult] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [showInactivity, setShowInactivity] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(10);
  const peerRef = useRef(null);
  const channelRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const transcriptRef = useRef([]);
  const appointmentCallRef = useRef(null);
  const selectedSlotRef = useRef(null);
  const bookingTokenRef = useRef(null);
  const captureInFlightRef = useRef(false);
  const captureResultRef = useRef(null);
  const completionRef = useRef(null);
  const lastCallerActivityRef = useRef(Date.now());
  const inactivityShownRef = useRef(false);

  const connected = status === "connected";
  const busy = status === "connecting";
  const disconnect = useCallback(() => {
    completionRef.current?.dispose();
    channelRef.current?.close();
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    channelRef.current = null;
    peerRef.current = null;
    streamRef.current = null;
  }, []);

  const endCall = useCallback(() => {
    disconnect();
    setStatus("ended");
    setMuted(false);
    setShowInactivity(false);
    setFinishing(false);
  }, [disconnect]);

  if (!completionRef.current) completionRef.current = createCallCompletion({ sendEvent, endCall, onClosing: () => {
    setFinishing(true); setShowInactivity(false);
    streamRef.current?.getAudioTracks().forEach(track => { track.enabled = false; });
  } });

  useEffect(() => {
    if (!connected) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [connected]);

  useEffect(() => {
    if (!connected || showHuman || showCalendar || finishing) return undefined;
    const check = window.setInterval(() => {
      if (captureInFlightRef.current) return;
      if (!inactivityShownRef.current && Date.now() - lastCallerActivityRef.current >= 30000) {
        inactivityShownRef.current = true;
        setInactivityCountdown(10);
        setShowInactivity(true);
      }
    }, 1000);
    return () => window.clearInterval(check);
  }, [connected, showHuman, showCalendar, finishing]);

  useEffect(() => {
    if (!showInactivity || !connected) return undefined;
    if (inactivityCountdown <= 0) {
      setShowInactivity(false);
      endCall();
      return undefined;
    }
    const timer = window.setTimeout(() => setInactivityCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [showInactivity, inactivityCountdown, connected, endCall]);

  useEffect(() => () => disconnect(), [disconnect]);

  function addTranscript(role, text) {
    const cleanText = String(text || "").trim();
    if (!cleanText) return;
    setTranscript((current) => {
      const next = [...current, { role, text: cleanText }].slice(-80);
      transcriptRef.current = next;
      return next;
    });
  }

  function sendEvent(event) {
    if (channelRef.current?.readyState === "open") {
      channelRef.current.send(JSON.stringify(event));
    }
  }

  async function handleRealtimeEvent(message) {
    let event;
    try {
      event = JSON.parse(message.data);
    } catch {
      return;
    }
    completionRef.current?.handle(event);

    if (["response.output_audio_transcript.done", "response.audio_transcript.done"].includes(event.type)) {
      addTranscript("assistant", event.transcript);
      if (!inactivityShownRef.current) lastCallerActivityRef.current = Date.now();
    }
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      addTranscript("caller", event.transcript);
      lastCallerActivityRef.current = Date.now();
      inactivityShownRef.current = false;
      setShowInactivity(false);
    }
    if (event.type === "response.function_call_arguments.done" && event.name === "request_live_human") {
      setShowHuman(true);
      sendEvent({ type: "conversation.item.create", item: { type: "function_call_output", call_id: event.call_id, output: JSON.stringify({ shown: true, phone: "+1 239-777-3713" }) } });
      sendEvent({ type: "response.create" });
    }
    if (event.type === "response.function_call_arguments.done" && event.name === "show_appointment_picker") {
      appointmentCallRef.current = event.call_id;
      setShowCalendar(true);
    }
    if (event.type === "response.function_call_arguments.done" && event.name === "capture_lead") {
      if (captureInFlightRef.current) return;
      captureInFlightRef.current = true;
      try {
        const completedLead = { ...emptyLead, ...JSON.parse(event.arguments) };
        const slot = selectedSlotRef.current;
        const booking = Boolean(slot && bookingTokenRef.current && completedLead.serviceAreaStatus === "eligible");
        let result = captureResultRef.current;
        if (!result) {
          const response = await fetch(booking ? "/.netlify/functions/book-estimate-appointment" : "/.netlify/functions/save-website-lead", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(booking ? { bookingToken: bookingTokenRef.current, start: slot.start, confirmed: true, lead: completedLead, transcript: transcriptRef.current } : { ...completedLead, transcript: transcriptRef.current }),
          });
          result = await response.json().catch(() => ({}));
          if (!response.ok) {
            if (result.refreshAvailability) selectedSlotRef.current = null;
            throw new Error(result.error || "The request could not be confirmed.");
          }
          if (result.leadSaved !== false) captureResultRef.current = result;
        }
        setLead({ ...completedLead, preferredAppointment: result.preferredAppointment || completedLead.preferredAppointment });
        setAppointmentResult(result);
        setError("");
        sendEvent({ type: "conversation.item.create", item: { type: "function_call_output", call_id: event.call_id, output: JSON.stringify({ saved: result.leadSaved !== false, leadId: result.leadId || result.id, ownerEmailSent: result.ownerEmailSent || result.emailSent, appointmentBooked: Boolean(result.appointmentBooked), selectedAppointment: result.preferredAppointment }) } });
        completionRef.current.begin(result);
      } catch (saveError) {
        setError(saveError.message || "The request could not be confirmed.");
        sendEvent({ type: "conversation.item.create", item: { type: "function_call_output", call_id: event.call_id, output: JSON.stringify({ saved: false, appointmentBooked: false, error: saveError.message }) } });
        sendEvent({ type: "response.create" });
      } finally { captureInFlightRef.current = false; }
    }
    if (event.type === "error") {
      setError(event.error?.message || "The voice assistant encountered an error.");
    }
  }

  async function startCall() {
    setShowConsent(false);
    setError("");
    setStatus("connecting");
    setSeconds(0);
    setTranscript([]);
    transcriptRef.current = [];
    setLead(emptyLead);
    setAppointmentResult(null);
    setFinishing(false);
    selectedSlotRef.current = null;
    captureResultRef.current = null;
    bookingTokenRef.current = null;
    appointmentCallRef.current = null;
    lastCallerActivityRef.current = Date.now();
    inactivityShownRef.current = false;
    setShowInactivity(false);

    try {
      const user = netlifyIdentity.currentUser();
      const token = user ? await user.jwt() : null;
      const sessionResponse = await fetch("/.netlify/functions/create-realtime-session", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const session = await sessionResponse.json();
      if (!sessionResponse.ok) throw new Error(session.error || "Could not start the assistant.");
      bookingTokenRef.current = session.bookingToken;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      const peer = new RTCPeerConnection();
      peerRef.current = peer;
      stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));
      peer.ontrack = (event) => {
        if (audioRef.current) audioRef.current.srcObject = event.streams[0];
      };
      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(peer.connectionState)) {
          setError("The voice connection was interrupted.");
          endCall();
        }
      };

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.onmessage = handleRealtimeEvent;
      channel.onopen = () => {
        setStatus("connected");
        lastCallerActivityRef.current = Date.now();
        sendEvent({
          type: "response.create",
          response: { instructions: "Say only a brief greeting, disclose that you are Brushline's AI assistant, and ask which service or services they need. Do not ask for or preview any contact information." },
        });
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const answerResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (!answerResponse.ok) throw new Error("The realtime voice connection could not be completed.");
      await peer.setRemoteDescription({ type: "answer", sdp: await answerResponse.text() });
    } catch (callError) {
      disconnect();
      setStatus("idle");
      setError(callError?.name === "NotAllowedError"
        ? "Microphone access was not allowed. Enable it in your browser settings and try again."
        : callError.message || "Unable to start the voice assistant.");
    }
  }

  function toggleMute() {
    const nextMuted = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
  }

  function resetTest() {
    disconnect();
    setStatus("idle");
    setMuted(false);
    setSeconds(0);
    setTranscript([]);
    setLead(emptyLead);
    setAppointmentResult(null);
    selectedSlotRef.current = null;
    captureResultRef.current = null;
    bookingTokenRef.current = null;
    appointmentCallRef.current = null;
    setError("");
    setShowHuman(false);
    setShowCalendar(false);
    setShowInactivity(false);
    inactivityShownRef.current = false;
  }

  function continueAfterInactivity() {
    lastCallerActivityRef.current = Date.now();
    inactivityShownRef.current = false;
    setShowInactivity(false);
    sendEvent({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text: "I want to continue the call." }] } });
    sendEvent({ type: "response.create", response: { instructions: "Acknowledge briefly, then resume with only the single next unanswered intake question." } });
  }

  function submitAppointment(slot) {
    if (!appointmentCallRef.current) return;
    selectedSlotRef.current = slot || null;
    const selectedAppointment = slot ? new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", dateStyle: "full", timeStyle: "short" }).format(new Date(slot.start)) + " Eastern" : "No live appointment selected";
    lastCallerActivityRef.current = Date.now();
    inactivityShownRef.current = false;
    sendEvent({ type: "conversation.item.create", item: { type: "function_call_output", call_id: appointmentCallRef.current, output: JSON.stringify({ selectedAppointment, appointmentBooked: false, liveSlotSelected: Boolean(slot), bookingAvailable: Boolean(bookingTokenRef.current) }) } });
    sendEvent({ type: "response.create" });
    appointmentCallRef.current = null;
    setShowCalendar(false);
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const hasLead = Boolean(appointmentResult);

  return (
    <main className="voice-test-page">
      <audio ref={audioRef} autoPlay aria-hidden="true" />
      <header className="voice-test-header">
        <div>
          <span className="voice-test-eyebrow"><LockKeyhole size={14} /> {publicMode ? "Private conversation" : "Internal test page"}</span>
          <h1>{publicMode ? "Let’s talk about your project" : "AI voice assistant"}</h1>
          <p>{publicMode ? "Request a free in-home estimate through a simple guided conversation." : "Test a conversational intake experience before placing it on the public website."}</p>
        </div>
        <div className="voice-test-mode"><ShieldCheck size={19} /><span><strong>{publicMode ? "No-pressure request" : "Safe test mode"}</strong>{publicMode ? "Choose an opening and confirm your details" : "Confirming a time creates a real booking"}</span></div>
      </header>

      <section className="voice-test-grid">
        <div className="voice-demo-card">
          <div className="voice-demo-heading">
            <span className="voice-icon"><Sparkles size={21} /></span>
            <div><h2>{publicMode ? "Brushline project assistant" : "Website widget preview"}</h2><p>{publicMode ? "Answer at your own pace—one question at a time." : "This is how the starting experience can feel to a visitor."}</p></div>
          </div>

          <div className={`voice-widget ${connected ? "is-live" : ""}`}>
            <div className="voice-widget-brand"><span className="voice-brand-logo"><img src={brushlineLogo} alt="Brushline Services" /></span><div><strong>Brushline Project Assistant</strong><span>{connected ? "Live · Listening for your response" : busy ? "Connecting…" : "Free estimate concierge"}</span></div></div>
            {connected || status === "ended" ? (
              <>
                <div className="voice-call-visual" aria-label={connected ? "Voice call connected" : "Voice call ended"}>
                  <div className="voice-pulse"><span className="voice-brush-mark">B</span></div>
                  <strong>{connected ? "Let’s plan your project" : "Conversation complete"}</strong>
                  <span>{connected ? time : "Review the captured details below"}</span>
                  {connected && <div className="voice-wave" aria-hidden="true">{[1,2,3,4,5,6,7].map((bar) => <i key={bar} />)}</div>}
                </div>
                {connected && <div className="voice-journey" aria-label="Conversation stages"><span className="active">Project</span><i/><span>Contact</span><i/><span>Schedule</span></div>}
                <div className="voice-controls">
                  {connected && <button type="button" className="voice-control" onClick={toggleMute}>{muted ? <MicOff /> : <Mic />}<span>{muted ? "Unmute" : "Mute"}</span></button>}
                  {connected ? <button type="button" className="voice-control danger" onClick={endCall}><PhoneOff /><span>End call</span></button> : <button type="button" className="voice-restart" onClick={resetTest}><RotateCcw size={18} /> Start over</button>}
                </div>
              </>
            ) : (
              <div className="voice-widget-intro">
                <h3>Tell us about your project</h3>
                <p>Speak with our AI assistant to share project details and request an appointment.</p>
                <button type="button" className="voice-start-button" onClick={() => setShowConsent(true)} disabled={busy}><Mic size={20} />{busy ? "Connecting…" : "Start voice conversation"}</button>
                <small><LockKeyhole size={13} /> Your microphone is used only during this conversation.</small>
              </div>
            )}
          </div>
          {finishing && <div className="voice-test-notice" role="status"><Check size={17} /><span><strong>Your details have been recorded.</strong>The assistant is saying goodbye. This call will end automatically.</span></div>}
          {error && <div className="voice-error" role="alert">{error}</div>}
        </div>

        <aside className="voice-results-card">
          <div className="voice-results-heading"><CalendarClock size={21} /><div><h2>Captured request</h2><p>Populated after the assistant confirms the details.</p></div></div>
          {hasLead ? (
            <div className="voice-lead-list">
              {Object.entries(lead).map(([key, value]) => <div key={key}><span>{fieldLabels[key]}</span><strong>{Array.isArray(value) ? value.join(", ") || "Not provided" : typeof value === "boolean" ? (value ? "Yes" : "No") : value || "Not provided"}</strong></div>)}
              <div className="voice-test-notice"><Check size={17} /><span><strong>{appointmentResult?.appointmentBooked ? "Your estimate is booked" : "Request sent successfully"}</strong>{appointmentResult?.appointmentBooked ? "45-minute visit confirmed. Google Calendar sends your invitation." : "A team member will confirm your requested time."}</span></div>
            </div>
          ) : (
            <div className="voice-empty-state"><Bot size={34} /><strong>{publicMode ? "No request sent yet" : "No test conversation yet"}</strong><p>The confirmed customer and project details will appear here.</p></div>
          )}
          {transcript.length > 0 && <details className="voice-transcript"><summary>View conversation transcript</summary>{transcript.map((line, index) => <p key={`${line.role}-${index}`}><strong>{line.role === "caller" ? "Caller" : "Assistant"}:</strong> {line.text}</p>)}</details>}
        </aside>
      </section>

      {!publicMode && <section className="voice-test-notes"><h2>What this prototype tests</h2><div><span><Check />Natural voice conversation</span><span><Check />CRM lead and owner email</span><span><Check />Live calendar availability</span><span><Check />Service-area screening</span></div><p>This page uses live availability. Confirming a selected time creates a real appointment when Google Calendar is connected.</p></section>}

      {showConsent && <div className="voice-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowConsent(false)}><section className="voice-consent-modal" role="dialog" aria-modal="true" aria-labelledby="voice-consent-title"><button type="button" className="voice-modal-close" onClick={() => setShowConsent(false)} aria-label="Close"><X /></button><span className="voice-modal-icon"><Mic /></span><h2 id="voice-consent-title">Before we begin</h2><p>You’ll speak with an AI assistant. Your microphone will be active during the conversation so it can understand and respond to you.</p><ul>{!publicMode && <li>This is an internal test.</li>}<li>An available time is booked only after you confirm your details.</li><li>Do not share sensitive financial or medical information.</li></ul><button type="button" className="voice-consent-button" onClick={startCall}>Allow microphone &amp; start</button><button type="button" className="voice-cancel-button" onClick={() => setShowConsent(false)}>Not now</button></section></div>}
      {showHuman && <div className="voice-modal-backdrop"><section className="voice-consent-modal" role="dialog" aria-modal="true"><button className="voice-modal-close" onClick={() => setShowHuman(false)} aria-label="Close"><X/></button><span className="voice-modal-icon"><PhoneCall/></span><h2>Talk with Brushline</h2><p>Tap below to call a live team member now.</p><a className="voice-consent-button voice-call-link" href="tel:+12397773713"><PhoneCall size={19}/> Call (239) 777-3713</a><button className="voice-cancel-button" onClick={() => setShowHuman(false)}>Continue with assistant</button></section></div>}
      {showCalendar && <LiveAppointmentPicker bookingToken={bookingTokenRef.current} onSelect={submitAppointment} onCancel={() => submitAppointment(null)} />}
      {showInactivity && <div className="voice-modal-backdrop voice-inactivity-backdrop"><section className="voice-consent-modal voice-inactivity-modal" role="alertdialog" aria-modal="true" aria-labelledby="inactivity-title"><span className="voice-inactivity-ring" style={{ "--progress": inactivityCountdown / 10 }}><strong>{inactivityCountdown}</strong></span><h2 id="inactivity-title">Still with us?</h2><p>We haven’t heard a response. Would you like to continue your conversation?</p><button type="button" className="voice-consent-button" onClick={continueAfterInactivity}>Yes, continue</button><button type="button" className="voice-cancel-button" onClick={endCall}>End conversation</button></section></div>}
    </main>
  );
}

export default VoiceAssistantTest;
