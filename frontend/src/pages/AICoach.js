import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { api, errMsg, streamChat } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ConfidenceBadge, PetSelect, SafetyBadge } from "@/components/shared";
import { PawPrint, Plus, Send, ShieldCheck, Sparkles } from "lucide-react";

export default function AICoach() {
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(location.state?.prompt || "");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get("/pet-profiles").then(({ data }) => {
      setPets(data);
      setPetId(location.state?.petId || data[0]?.id || null);
    }).catch(() => {});
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = async () => {
    try { const { data } = await api.get("/ai-conversations?limit=20"); setConversations(data); } catch (_) { /* silent */ }
  };

  const loadMessages = async (cid) => {
    try {
      const { data } = await api.get(`/ai-messages?conversationId=${cid}&limit=100`);
      setMessages(data.reverse());
    } catch (e) { toast.error(errMsg(e)); }
  };

  const selectConversation = (c) => {
    setConversationId(c.id);
    if (c.petId) setPetId(c.petId);
    loadMessages(c.id);
  };

  const newConversation = () => { setConversationId(null); setMessages([]); };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setStreaming(true);
    setStreamText("");
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: text }]);
    await streamChat(
      { message: text, conversationId, petId: petId || undefined },
      {
        onDelta: (chunk) => setStreamText((t) => t + chunk),
        onDone: (meta) => {
          setConversationId(meta.conversationId);
          setStreaming(false);
          setStreamText("");
          loadMessages(meta.conversationId);
          loadConversations();
        },
        onError: (e) => {
          setStreaming(false);
          setStreamText("");
          toast.error(e.message || "AI chat failed.");
        },
      }
    );
  };

  const pet = pets.find((p) => p.id === petId);

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 flex flex-col" style={{ minHeight: "70vh" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Bond Coach</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Warm, observation-based guidance. Never a diagnosis.</p>
          </div>
          <div className="flex gap-2">
            <PetSelect pets={pets} value={petId} onChange={setPetId} testId="coach-pet-select" />
            <Button variant="secondary" size="icon" className="rounded-xl shrink-0" onClick={newConversation} title="New conversation" data-testid="coach-new-conversation-button"><Plus className="w-4 h-4" /></Button>
          </div>
        </div>

        <Card className="rounded-2xl flex-1 flex flex-col">
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-4" style={{ maxHeight: "55vh", minHeight: "40vh" }} data-testid="coach-messages-container">
            {!messages.length && !streaming && (
              <div className="text-center py-12">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-sm font-medium">Ask anything about your bond with {pet?.name || "your pet"}.</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">"Why did our Bond Score change?" · "Suggest a calming evening routine" · "Summarize this week's wellness trends"</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`chat-message-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-card border border-border"}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  {m.role === "assistant" && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <SafetyBadge level={m.safetyLevel || "low"} />
                      <ConfidenceBadge level={m.confidence || "medium"} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {streaming && (
              <div className="chat-message-in flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-card border border-border">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamText || "Thinking gently..."}</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </CardContent>
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                rows={2}
                placeholder={`Message the coach about ${pet?.name || "your pet"}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                data-testid="coach-message-input"
              />
              <Button onClick={send} disabled={streaming || !input.trim()} className="rounded-xl self-end" data-testid="chat-send-message-button"><Send className="w-4 h-4" /></Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">The coach never diagnoses or prescribes. Urgent concerns always go to a veterinarian or emergency clinic.</p>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-4">
        <Card className="rounded-2xl" data-testid="coach-safety-rail">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Safety & Context</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>• Every reply carries a safety level + confidence label.</p>
            <p>• Emergency-sounding messages get immediate vet guidance.</p>
            <p>• The coach reads {pet?.name || "your pet"}'s profile, latest Bond Score, and recent logs for context.</p>
            <p>• All conversations are private to your account and audit-logged.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Conversations</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-72 overflow-y-auto">
            {!conversations.length && <p className="text-xs text-muted-foreground">No conversations yet.</p>}
            {conversations.map((c) => (
              <button key={c.id} onClick={() => selectConversation(c)} data-testid={`coach-conversation-${c.id}`}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${conversationId === c.id ? "bg-secondary font-medium" : "hover:bg-secondary/60"}`}>
                <p className="truncate">{c.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1"><PawPrint className="w-2.5 h-2.5" />{pets.find((p) => p.id === c.petId)?.name || "General"} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
