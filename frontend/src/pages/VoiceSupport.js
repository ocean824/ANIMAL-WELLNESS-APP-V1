import { useEffect, useRef, useState } from "react";
import { api, errMsg } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { SafetyBadge } from "@/components/shared";
import { AlertTriangle, Mic, MicOff, Send, Ticket, Volume2 } from "lucide-react";

export default function VoiceSupport() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [lastEscalation, setLastEscalation] = useState(null);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setListening(false);
      send(text, true);
    };
    rec.onerror = () => { setListening(false); toast.error("Voice input failed — you can type instead."); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { setListening(true); recognitionRef.current.start(); }
  };

  const speak = (text) => {
    if (!speakReplies || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  };

  const send = async (text, viaVoice = false) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: message, viaVoice }]);
    try {
      const { data } = await api.post("/voice/message", { message, conversationId, viaVoice });
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: data.reply, safetyLevel: data.safetyLevel, escalation: data.escalation }]);
      setLastEscalation(data.escalation || null);
      if (data.escalation) toast.warning(`A ${data.escalation.priority} priority ticket was created (${data.escalation.category.replace(/_/g, " ")}).`);
      speak(data.reply);
    } catch (e) {
      toast.error(errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Voice Support</h1>
        <p className="text-sm text-muted-foreground mt-1">Ask about features, your account, or wellness guidance — by voice or text. Risky cases go straight to our human team.</p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <button
          onClick={toggleMic}
          disabled={!voiceSupported || busy}
          data-testid="voice-support-mic-button"
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-200 ${
            listening ? "bg-primary text-primary-foreground mic-pulse" : "bg-card border-2 border-primary text-primary hover:bg-secondary"
          } ${!voiceSupported ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {listening ? <Mic className="w-9 h-9" /> : voiceSupported ? <Mic className="w-9 h-9" /> : <MicOff className="w-9 h-9" />}
        </button>
        <p className="text-xs text-muted-foreground mt-3" data-testid="voice-mic-status">
          {listening ? "Listening... speak now" : voiceSupported ? "Tap to speak" : "Voice input isn't supported in this browser — the text box below works the same."}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Speak replies aloud</span>
          <Switch checked={speakReplies} onCheckedChange={setSpeakReplies} data-testid="voice-speak-toggle" />
        </div>
      </div>

      {lastEscalation && (
        <Alert className="mb-4 border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)]" data-testid="voice-escalation-alert">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
          <AlertTitle className="text-sm">Escalated to our human team</AlertTitle>
          <AlertDescription className="text-xs">
            A {lastEscalation.priority} priority ticket ({lastEscalation.category.replace(/_/g, " ")}) was created. Ticket ID: {lastEscalation.ticketId}
          </AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Ticket className="w-4 h-4 text-primary" /> Support conversation</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto mb-4" data-testid="voice-messages-container">
            {!messages.length && (
              <p className="text-sm text-muted-foreground text-center py-6">Try: "How does the Bond Score work?" · "I want a refund" · "How do I reset my password?"</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`chat-message-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-secondary" : "bg-card border border-border"}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  {m.role === "assistant" && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <SafetyBadge level={m.safetyLevel || "low"} />
                      {m.escalation && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]">Ticket created</span>}
                    </div>
                  )}
                  {m.viaVoice && <p className="text-[10px] text-muted-foreground mt-1">via voice</p>}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-muted-foreground">Thinking...</p>}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              data-testid="voice-text-input"
            />
            <Button onClick={() => send()} disabled={busy || !input.trim()} className="rounded-xl" data-testid="voice-send-button"><Send className="w-4 h-4" /></Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Emergencies always go to a veterinarian or emergency clinic — this agent cannot make emergency decisions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
