import "../Styling/VoiceOrb.css";

export default function VoiceOrb({ speaking = false, connected = false }) {
  return <div className={`brushline-voice-orb ${speaking ? "is-speaking" : connected ? "is-listening" : "is-idle"}`} aria-hidden="true"><div className="voice-orb-halo"/><div className="voice-orb-core"><i/><i/><i/></div></div>;
}
