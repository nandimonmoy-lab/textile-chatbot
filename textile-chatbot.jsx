import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are TextileGPT — a world-class expert chatbot specializing in the textile industry. You have deep knowledge across all the following domains:

1. **Fabrics & Materials**: Natural fibers (cotton, wool, silk, linen, jute, hemp), synthetic fibers (polyester, nylon, acrylic, spandex, rayon/viscose), technical and performance fabrics, fabric weights, thread counts, GSM (grams per square meter), fabric construction types (woven, knit, non-woven), and fabric properties.

2. **Yarn**: Yarn count systems (Ne, Nm, Tex, Denier), yarn types (spun, filament, textured, core-spun, fancy/novelty), twist direction, ply and folded yarns, yarn strength and elongation, specialty yarns.

3. **Weaving & Manufacturing**: Loom types, weave structures (plain, twill, satin, dobby, jacquard, pile, leno), knitting types, fabric defects and quality control, production efficiency.

4. **Dyeing & Finishing**: Dye classes (reactive, disperse, acid, vat, direct, pigment), dyeing methods, color fastness standards, finishing processes, sustainable dyeing practices.

5. **Textile Business & Trade**: Industry certifications (OEKO-TEX, GOTS, BCI), Incoterms, HS codes, sourcing hubs, costing structures, MOQ, AQL inspection, sustainability regulations.

Respond in a clear, professional, and helpful tone. Use markdown formatting — bold for key terms, bullet points for lists, and numbered steps for processes. Keep answers focused and practical.`;

const SUGGESTED = [
  { icon: "⚖️", text: "GSM 180 vs GSM 300 — what's the difference?" },
  { icon: "🎨", text: "How does reactive dyeing work on cotton?" },
  { icon: "🧶", text: "Explain Ne count vs Denier for yarn" },
  { icon: "📋", text: "What is AQL inspection in textile?" },
  { icon: "🌿", text: "Certifications needed for organic cotton export" },
  { icon: "🔧", text: "How to fix color fastness issues after dyeing?" },
];

const HISTORY = [
  { label: "Today", items: ["GSM and fabric weight guide", "Reactive dye process"] },
  { label: "Yesterday", items: ["AQL standard explained", "OEKO-TEX certification"] },
  { label: "Last week", items: ["Yarn count systems", "Loom types comparison"] },
];

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<div style="font-size:13px;font-weight:600;color:#e3e3e3;margin:14px 0 6px">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-size:14px;font-weight:700;color:#ececec;margin:16px 0 8px">$1</div>')
    .replace(/^\- (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#8e8ea0;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^• (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#8e8ea0;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div style="height:10px"></div>')
    .replace(/\n/g, "<br/>");
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 2px" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#8e8ea0", display: "inline-block",
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

function IconBtn({ children, title, onClick, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      width: 36, height: 36, borderRadius: 8, border: "none",
      background: hov || active ? "rgba(255,255,255,0.09)" : "transparent",
      color: hov || active ? "#ececec" : "#8e8ea0", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

export default function TextileChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  const send = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setStarted(true);
    const newMsgs = [...messages, { role: "user", content: userText }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", content: data?.content?.[0]?.text || "Sorry, try again." }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const newChat = () => { setMessages([]); setStarted(false); setInput(""); };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#212121", color: "#ececec", fontFamily: "-apple-system, ui-sans-serif, system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #404040; border-radius: 4px; }
        .msg-anim { animation: fadeUp 0.22s ease; }
        .suggest:hover { background: #303030 !important; border-color: #4a4a4a !important; }
        .hist-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .newchat:hover { background: rgba(255,255,255,0.09) !important; }
        textarea { font-family: inherit; caret-color: #ececec; }
        textarea::placeholder { color: #6b6b6b; }
      `}</style>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside style={{ width: 256, background: "#171717", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "10px 10px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#d4722a,#f0b060)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧵</div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>TextileGPT</span>
            </div>
            <IconBtn title="Toggle sidebar" onClick={() => setSidebarOpen(false)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
            </IconBtn>
          </div>

          <div style={{ padding: "2px 10px 8px" }}>
            <button className="newchat" onClick={newChat} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent", color: "#d1d1d1", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, transition: "background 0.15s", textAlign: "left" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New chat
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 6px" }}>
            {HISTORY.map(g => (
              <div key={g.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#6b6b6b", fontWeight: 500, padding: "3px 8px 5px", letterSpacing: 0.2 }}>{g.label}</div>
                {g.items.map(item => (
                  <button key={item} className="hist-btn" style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "none", background: "transparent", color: "#a8a8a8", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "background 0.15s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 10px 12px", borderTop: "1px solid #262626" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 8, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>T</div>
              <span style={{ fontSize: 13, color: "#a8a8a8" }}>Textile Pro</span>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div style={{ height: 48, display: "flex", alignItems: "center", padding: "0 14px", gap: 6, flexShrink: 0 }}>
          {!sidebarOpen && <>
            <IconBtn title="Open sidebar" onClick={() => setSidebarOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
            </IconBtn>
            <IconBtn title="New chat" onClick={newChat}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            </IconBtn>
          </>}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#d1d1d1" }}>TextileGPT</span>
          </div>
          <IconBtn title="Share">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          </IconBtn>
        </div>

        {/* Scroll area */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {!started ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px 100px" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg,#c96a1a,#e8a84a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 18, boxShadow: "0 6px 20px rgba(200,100,20,0.25)" }}>🧵</div>
              <h2 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 6px", color: "#ececec" }}>How can I help you?</h2>
              <p style={{ fontSize: 14, color: "#6b6b6b", margin: "0 0 32px", textAlign: "center", maxWidth: 380 }}>Expert textile knowledge — fabrics, yarn, weaving, dyeing & trade.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 580 }}>
                {SUGGESTED.map((s, i) => (
                  <button key={i} className="suggest" onClick={() => send(s.text)} style={{ padding: "13px 15px", borderRadius: 12, border: "1px solid #333", background: "#2a2a2a", color: "#c8c8c8", cursor: "pointer", textAlign: "left", fontSize: 13, lineHeight: 1.5, transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 5 }}>
                    <span style={{ fontSize: 17 }}>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 700, width: "100%", margin: "0 auto", padding: "20px 20px 32px" }}>
              {messages.map((msg, i) => (
                <div key={i} className="msg-anim" style={{ marginBottom: 24 }}>
                  {msg.role === "user" ? (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ maxWidth: "78%", padding: "11px 15px", borderRadius: 16, background: "#2f2f2f", color: "#ececec", fontSize: 15, lineHeight: 1.65 }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#c96a1a,#e8a84a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginTop: 3 }}>🧵</div>
                      <div style={{ flex: 1, fontSize: 15, lineHeight: 1.75, color: "#d1d1d1", paddingTop: 2 }}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="msg-anim" style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 24 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#c96a1a,#e8a84a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginTop: 3 }}>🧵</div>
                  <div style={{ paddingTop: 6 }}><TypingIndicator /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "0 20px 20px", flexShrink: 0 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ background: "#2f2f2f", borderRadius: 14, border: "1px solid #3d3d3d", transition: "border-color 0.2s" }}
              onFocusCapture={e => e.currentTarget.style.borderColor = "#5a5a5a"}
              onBlurCapture={e => e.currentTarget.style.borderColor = "#3d3d3d"}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message TextileGPT…"
                disabled={loading}
                rows={1}
                style={{ width: "100%", border: "none", background: "transparent", color: "#ececec", fontSize: 15, lineHeight: 1.6, padding: "13px 14px 4px", resize: "none", outline: "none", maxHeight: 180, overflowY: "auto" }}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px 8px" }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41A2 2 0 016.59 14.59l8.49-8.48"/></svg>, title: "Attach" },
                    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>, title: "Search" },
                  ].map((b, i) => {
                    const [h, setH] = useState(false);
                    return (
                      <button key={i} title={b.title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: h ? "rgba(255,255,255,0.08)" : "transparent", color: h ? "#ececec" : "#6b6b6b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                        {b.icon}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "none", background: input.trim() && !loading ? "#ececec" : "#424242", color: input.trim() && !loading ? "#1a1a1a" : "#6b6b6b", cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", flexShrink: 0 }}
                  onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.background = "#ffffff"; }}
                  onMouseLeave={e => { if (input.trim() && !loading) e.currentTarget.style.background = "#ececec"; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </button>
              </div>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#484848", marginTop: 9 }}>
              TextileGPT can make mistakes. Verify important specifications independently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
