import { useEffect, useRef, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";
import {
  Bot,
  CalendarClock,
  Check,
  LockKeyhole,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import "./VoiceAssistantTest.css";

const emptyLead = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  service: "",
  projectDetails: "",
  preferredAppointment: "",
};

const fieldLabels = {
  fullName: "Customer",
  phone: "Phone",
  email: "Email",
  address: "Project address",
  service: "Service",
  projectDetails: "Project details",
  preferredAppointment: "Preferred appointment",
};

function VoiceAssistantTest() {
  const [showConsent, setShowConsent] = useState(false);
  const [status, setStatus] = useState("idle");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [lead, setLead] = useState(emptyLead);
  const peerRef = useRef(null);
  const channelRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  const connected = status === "connected";
  const busy = status === "connecting";

  useEffect(() => {
    if (!connected) return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [connected]);

  useEffect(() => () => disconnect(), []);

  function addTranscript(role, text) {
    const cleanText = String(text || "").trim();
    if (!cleanText) return;
    setTranscript((current) => [...current, { role, text: cleanText }].slice(-12));
  }

  function disconnect() {
    channelRef.current?.close();
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioRef.current) audioRef.current.srcObject = null;
    channelRef.current = null;
    peerRef.current = null;
    streamRef.current = null;
  }

  function endCall() {
    disconnect();
    setStatus("ended");
    setMuted(false);
  }

  function sendEvent(event) {
    if (channelRef.current?.readyState === "open") {
      channelRef.current.send(JSON.stringify(event));
    }
  }

  function handleRealtimeEvent(message) {
    let event;
    try {
      event = JSON.parse(message.data);
    } catch {
      return;
    }

    if (["response.output_audio_transcript.done", "response.audio_transcript.done"].includes(event.type)) {
      addTranscript("assistant", event.transcript);
    }
    if (event.type === "conversation.item.input_audio_transcription.completed") {
      addTranscript("caller", event.transcript);
    }
    if (event.type === "response.function_call_arguments.done" && event.name === "capture_lead") {
      try {
        const details = JSON.parse(event.arguments);
        setLead({ ...emptyLead, ...details });
        sendEvent({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: event.call_id,
            output: JSON.stringify({ saved: true, mode: "internal_test", appointmentBooked: false }),
          },
        });
        sendEvent({ type: "response.create" });
      } catch {
        setError("The assistant could not format the lead summary. You can restart and try again.");
      }
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
    setLead(emptyLead);

    try {
      const user = netlifyIdentity.currentUser();
      const token = user ? await user.jwt() : null;
      const sessionResponse = await fetch("/.netlify/functions/create-realtime-session", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const session = await sessionResponse.json();
      if (!sessionResponse.ok) throw new Error(session.error || "Could not start the assistant.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        sendEvent({
          type: "response.create",
          response: { instructions: "Greet the caller now, disclose that you are an AI assistant, and begin the test intake." },
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
    setError("");
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const hasLead = Object.values(lead).some(Boolean);

  return (
    <main className="voice-test-page">
      <audio ref={audioRef} autoPlay aria-hidden="true" />
      <header className="voice-test-header">
        <div>
          <span className="voice-test-eyebrow"><LockKeyhole size={14} /> Internal test page</span>
          <h1>AI voice assistant</h1>
          <p>Test a conversational intake experience before placing it on the public website.</p>
        </div>
        <div className="voice-test-mode"><ShieldCheck size={19} /><span><strong>Safe test mode</strong>No appointment is actually booked</span></div>
      </header>

      <section className="voice-test-grid">
        <div className="voice-demo-card">
          <div className="voice-demo-heading">
            <span className="voice-icon"><Sparkles size={21} /></span>
            <div><h2>Website widget preview</h2><p>This is how the starting experience can feel to a visitor.</p></div>
          </div>

          <div className={`voice-widget ${connected ? "is-live" : ""}`}>
            <div className="voice-widget-brand"><span className="voice-avatar"><Bot size={28} /></span><div><strong>Brushline Assistant</strong><span>{connected ? "Listening now" : busy ? "Connecting…" : "Ready when you are"}</span></div></div>
            {connected || status === "ended" ? (
              <>
                <div className="voice-call-visual" aria-label={connected ? "Voice call connected" : "Voice call ended"}>
                  <div className="voice-pulse"><Bot size={32} /></div>
                  <strong>{connected ? "How can we help with your project?" : "Test call ended"}</strong>
                  <span>{connected ? time : "Review the captured details below"}</span>
                  {connected && <div className="voice-wave" aria-hidden="true">{[1,2,3,4,5,6,7].map((bar) => <i key={bar} />)}</div>}
                </div>
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
          {error && <div className="voice-error" role="alert">{error}</div>}
        </div>

        <aside className="voice-results-card">
          <div className="voice-results-heading"><CalendarClock size={21} /><div><h2>Captured request</h2><p>Populated after the assistant confirms the details.</p></div></div>
          {hasLead ? (
            <div className="voice-lead-list">
              {Object.entries(lead).map(([key, value]) => <div key={key}><span>{fieldLabels[key]}</span><strong>{value || "Not provided"}</strong></div>)}
              <div className="voice-test-notice"><Check size={17} /><span><strong>Test captured successfully</strong>Appointment request only—not booked.</span></div>
            </div>
          ) : (
            <div className="voice-empty-state"><Bot size={34} /><strong>No test conversation yet</strong><p>The confirmed customer and project details will appear here.</p></div>
          )}
          {transcript.length > 0 && <details className="voice-transcript"><summary>View conversation transcript</summary>{transcript.map((line, index) => <p key={`${line.role}-${index}`}><strong>{line.role === "caller" ? "Caller" : "Assistant"}:</strong> {line.text}</p>)}</details>}
        </aside>
      </section>

      <section className="voice-test-notes"><h2>What this prototype tests</h2><div><span><Check />Natural voice conversation</span><span><Check />Customer and project intake</span><span><Check />Preferred appointment capture</span><span><Check />Structured lead summary</span></div><p>CRM saving, calendar availability, SMS consent, and real appointment booking will be connected only after this experience is approved.</p></section>

      {showConsent && <div className="voice-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowConsent(false)}><section className="voice-consent-modal" role="dialog" aria-modal="true" aria-labelledby="voice-consent-title"><button type="button" className="voice-modal-close" onClick={() => setShowConsent(false)} aria-label="Close"><X /></button><span className="voice-modal-icon"><Mic /></span><h2 id="voice-consent-title">Before we begin</h2><p>You’ll speak with an AI assistant. Your microphone will be active during the conversation so it can understand and respond to you.</p><ul><li>This is an internal test.</li><li>No appointment will actually be booked.</li><li>Do not share sensitive financial or medical information.</li></ul><button type="button" className="voice-consent-button" onClick={startCall}>Allow microphone &amp; start</button><button type="button" className="voice-cancel-button" onClick={() => setShowConsent(false)}>Not now</button></section></div>}
    </main>
  );
}

export default VoiceAssistantTest;
