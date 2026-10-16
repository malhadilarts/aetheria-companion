"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, Compass, Copy, Download, Heart, HeartHandshake, Menu, MessageCircle, MoreHorizontal, PenLine, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, Stars, Upload, Wifi, WifiOff, X } from "lucide-react";
import { avatarOptions, localReflection, starterCompanions, type Bond, type Companion, type Message } from "@/lib/companions";

type View = "discover" | "companions" | "stories" | "moments";
type Store = { companions: Companion[]; conversations: Record<string, Message[]>; favorites: string[]; model: string };
const STORE_KEY = "aetheria-sanctuary-v1";
const bonds: Bond[] = ["Romance", "Friendship", "Dreaming", "Guidance", "Partnership"];
const prompts = [
  { icon: "✦", title: "A softer place to land", text: "Unpack the day, just as it was.", prompt: "Can we talk about my day? I could use a listening ear." },
  { icon: "☾", title: "Dream a little bigger", text: "Imagine the life you want to grow into.", prompt: "Help me imagine a life that feels really meaningful to me." },
  { icon: "♡", title: "Matters of the heart", text: "Make room for love, in every form.", prompt: "I'd like to talk about love and what connection means to me." },
];
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function HomePage() {
  const [view, setView] = useState<View>("discover");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [custom, setCustom] = useState<Companion[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [model, setModel] = useState("llama3.2");
  const [models, setModels] = useState<string[]>([]);
  const [provider, setProvider] = useState("ollama");
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("All souls");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState<"create" | "settings" | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", identity: "They / them · Human", role: "A kindred spirit", bond: "Friendship" as Bond, description: "", greeting: "", traits: "Kind, curious, supportive", image: avatarOptions[0] });
  const importRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const allCompanions = useMemo(() => [...starterCompanions, ...custom], [custom]);
  const selected = allCompanions.find(c => c.id === selectedId);
  const selectedMessages = selected ? (conversations[selected.id] || [{ id: `hello-${selected.id}`, role: "assistant" as const, content: selected.greeting, time: 0 }]) : [];
  const filtered = allCompanions.filter(c => (filter === "All souls" || c.bond === filter) && (`${c.name} ${c.identity} ${c.role} ${c.description} ${c.traits.join(" ")}`).toLowerCase().includes(search.toLowerCase()));
  const chatted = allCompanions.filter(c => (conversations[c.id]?.length || 0) > 0).sort((a, b) => (conversations[b.id]?.at(-1)?.time || 0) - (conversations[a.id]?.at(-1)?.time || 0));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) {
        const data: Store = JSON.parse(saved);
        if (Array.isArray(data.companions)) setCustom(data.companions);
        if (data.conversations && typeof data.conversations === "object") setConversations(data.conversations);
        if (Array.isArray(data.favorites)) setFavorites(data.favorites);
        if (typeof data.model === "string") setModel(data.model);
      }
    } catch { /* Start fresh if local data is unavailable. */ }
    setOnline(navigator.onLine);
    setLoaded(true);
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => { window.removeEventListener("online", updateOnline); window.removeEventListener("offline", updateOnline); };
  }, []);
  useEffect(() => { if (loaded) { try { localStorage.setItem(STORE_KEY, JSON.stringify({ companions: custom, conversations, favorites, model })); } catch {} } }, [loaded, custom, conversations, favorites, model]);
  useEffect(() => {
    if (!online) { setConnected(false); return; }
    const check = () => fetch("/api/ollama", { cache: "no-store" }).then(r => r.json()).then(data => { setConnected(!!data.connected); setModels(Array.isArray(data.models) ? data.models : []); setProvider(data.provider === "openai" ? "openai" : "ollama"); }).catch(() => setConnected(false));
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [online]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [selectedId, selectedMessages.length, sending]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(""), 3200); return () => clearTimeout(t); } }, [toast]);

  function go(next: View) { setView(next); setSelectedId(null); setMobileNav(false); setSearch(""); setFilter("All souls"); }
  function openChat(id: string, initial?: string) { setSelectedId(id); setMobileNav(false); setDraft(initial || ""); }
  function toggleFavorite(id: string) { setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }
  function saveCompanion(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const companion: Companion = { id: uid(), name: form.name.trim().slice(0, 40), identity: form.identity.trim().slice(0, 60) || "They / them", role: form.role.trim().slice(0, 60) || "A kindred spirit", bond: form.bond, image: form.image, description: form.description.trim().slice(0, 220) || "A one-of-a-kind presence, made by you.", greeting: form.greeting.trim().slice(0, 300) || `Hello, I'm ${form.name.trim()}. I'm glad we found each other. What would you like to talk about?`, traits: form.traits.split(",").map(s => s.trim()).filter(Boolean).slice(0, 6), color: "#ba9cc7", custom: true };
    setCustom(prev => [...prev, companion]); setModal(null); openChat(companion.id); setToast(`${companion.name} is ready to meet you.`);
    setForm({ name: "", identity: "They / them · Human", role: "A kindred spirit", bond: "Friendship", description: "", greeting: "", traits: "Kind, curious, supportive", image: avatarOptions[0] });
  }
  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !selected || sending) return;
    const prior = conversations[selected.id] || [{ id: `hello-${selected.id}`, role: "assistant" as const, content: selected.greeting, time: Date.now() - 1000 }];
    const userMessage: Message = { id: uid(), role: "user", content: text, time: Date.now() };
    const next = [...prior, userMessage];
    setConversations(prev => ({ ...prev, [selected.id]: next })); setDraft(""); setSending(true);
    let reply = localReflection(text, selected.name);
    let offline = true;
    if (connected && online) {
      try {
        const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selected.name, identity: selected.identity, role: selected.role, bond: selected.bond, traits: selected.traits, model, messages: next.map(m => ({ role: m.role, content: m.content })) }) });
        if (response.ok) { const data = await response.json(); if (typeof data.reply === "string" && data.reply.trim()) { reply = data.reply; offline = false; } }
        else setToast("Model unavailable. Continuing in local reflection mode.");
      } catch { setToast("Model unavailable. Continuing in local reflection mode."); setConnected(false); }
    }
    setConversations(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || next), { id: uid(), role: "assistant", content: reply, time: Date.now(), offline }] }));
    setSending(false);
  }
  async function share() {
    const url = window.location.href.split("?")[0];
    if (navigator.share) { try { await navigator.share({ title: "Aetheria — a world of connection", text: "A little magic, a lot of meaning. Meet Aetheria.", url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); setToast("Link copied. Share your world with someone."); } catch { setToast("Your browser couldn't copy the link."); }
  }
  function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href.split("?")[0]);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
  }
  function exportData() {
    const blob = new Blob([JSON.stringify({ companions: custom, conversations, favorites, model }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "aetheria-your-world.json"; a.click(); URL.revokeObjectURL(url); setToast("Your world has been exported.");
  }
  async function importData(file?: File) {
    if (!file) return;
    try { const data = JSON.parse(await file.text()); if (!Array.isArray(data.companions) || !data.conversations || !Array.isArray(data.favorites)) throw new Error(); setCustom(data.companions); setConversations(data.conversations); setFavorites(data.favorites); if (typeof data.model === "string") setModel(data.model); setToast("Your world has been restored."); setModal(null); } catch { setToast("That doesn't look like an Aetheria backup."); }
  }
  function clearData() { if (window.confirm("Delete all your created companions and conversations from this browser? This cannot be undone.")) { setCustom([]); setConversations({}); setFavorites([]); setSelectedId(null); setModal(null); setToast("Your local data has been cleared."); } }

  return (
    <div className="app-shell">
      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand" onClick={() => go("discover")} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && go("discover")}><div className="brand-mark"><Sparkles size={22} strokeWidth={1.7} /></div><div><span className="brand-name">aetheria<span className="brand-period">.</span></span><span className="brand-caption">A WORLD OF CONNECTION</span></div></div>
        <div className="sidebar-inner">
          <div className="nav-label">EXPLORE</div>
          <nav className="nav-list" aria-label="Main navigation">
            <button className={`nav-item ${view === "discover" && !selected ? "active" : ""}`} onClick={() => go("discover")}><Compass size={18} /> Discover <span className="nav-arrow">↗</span></button>
            <button className={`nav-item ${view === "companions" && !selected ? "active" : ""}`} onClick={() => go("companions")}><Heart size={18} /> My companions {favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}</button>
            <button className={`nav-item ${view === "stories" && !selected ? "active" : ""}`} onClick={() => go("stories")}><MessageCircle size={18} /> Our stories</button>
            <button className="nav-item" onClick={() => { setModal("create"); setMobileNav(false); }}><Plus size={18} /> Create a companion</button>
          </nav>
          <div className="nav-divider" />
          <div className="nav-label">YOUR SPACE</div>
          <nav className="nav-list" aria-label="Your space">
            <button className={`nav-item ${view === "moments" && !selected ? "active" : ""}`} onClick={() => go("moments")}><Bookmark size={18} /> Little moments</button>
            <button className="nav-item" onClick={() => { setModal("settings"); setMobileNav(false); }}><Settings2 size={18} /> Connection settings</button>
          </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><div className="sidebar-note-icon"><Stars size={18} /></div><p>A space that<br /><em>feels like yours.</em></p><span>Made for connection, on your terms.</span><div className="note-stars">✧ &nbsp; ✦ &nbsp; ✧</div></div>
          <div className="sidebar-footer"><div className="footer-avatar">✦</div><div><strong>Your sanctuary</strong><span>Private & yours to keep</span></div><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21} /></button><span className="breadcrumb-root">Your world</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{selected ? selected.name : view === "discover" ? "Discover" : view === "companions" ? "My companions" : view === "stories" ? "Our stories" : "Little moments"}</span></div><div className="topbar-actions"><span className={`status-pill ${connected ? "connected" : ""}`}><span className="status-dot" />{connected ? "Ollama connected" : "Offline ready"}</span><button className="topbar-icon" onClick={share} aria-label="Share Aetheria" title="Share Aetheria"><HeartHandshake size={19} /></button><button className="topbar-icon" onClick={() => setModal("settings")} aria-label="Settings" title="Settings"><Settings2 size={19} /></button><div className="topbar-avatar">✦</div></div></header>

        {selected ? (
          <div className="chat-layout"><div className="chat-main"><div className="chat-header"><button className="back-button" onClick={() => setSelectedId(null)}><ArrowLeft size={17} /> Back to {view === "discover" ? "discover" : view === "stories" ? "stories" : "companions"}</button><div className="chat-person"><img src={selected.image} alt="" /><div><h2>{selected.name} <span>✦</span></h2><p>{selected.role} · {connected ? "Here with you" : "Local reflection"}</p></div></div><button className={`chat-favorite ${favorites.includes(selected.id) ? "favorited" : ""}`} onClick={() => toggleFavorite(selected.id)} aria-label={favorites.includes(selected.id) ? "Remove favorite" : "Add favorite"}><Heart size={19} fill={favorites.includes(selected.id) ? "currentColor" : "none"} /></button></div>
              <div className="chat-scroll"><div className="chat-intro"><div className="chat-intro-sparkle">✧</div><span>A NEW LITTLE UNIVERSE</span><h3>A moment with {selected.name}</h3><p>There is no right way to begin. Just be you.</p></div><div className="messages">{selectedMessages.map(m => <div className={`message-row ${m.role === "user" ? "message-user" : "message-assistant"}`} key={m.id}>{m.role === "assistant" && <img className="message-avatar" src={selected.image} alt="" />}<div><div className="message-bubble">{m.content}</div>{m.offline && <span className="message-mode">✦ Local reflection · not AI-generated</span>}</div></div>)}{sending && <div className="message-row message-assistant"><img className="message-avatar" src={selected.image} alt="" /><div className="message-bubble typing"><i /><i /><i /></div></div>}<div ref={bottomRef} /></div></div>
              <div className="chat-compose"><div className="quick-prompts">{["How was your day?", "Let's dream together", "I need to talk"].map(p => <button key={p} onClick={() => setDraft(p)}>{p}</button>)}</div><form onSubmit={sendMessage} className="compose-box"><input aria-label={`Message ${selected.name}`} placeholder={`Message ${selected.name}...`} value={draft} onChange={e => setDraft(e.target.value)} maxLength={2500} /><button disabled={!draft.trim() || sending} type="submit" aria-label="Send message"><Send size={18} /></button></form><p>✦ {connected ? `Powered by ${provider === "openai" ? "OpenAI GPT" : `your local model, ${model}`}.` : "Local reflection mode is available without a model."} Aetheria companions are AI characters, not human professionals.</p></div>
            </div><aside className="chat-side"><div className="chat-side-portrait"><img src={selected.image} alt={`Portrait of ${selected.name}`} /></div><div className="chat-side-content"><span className="eyebrow">MEET YOUR COMPANION</span><h2>{selected.name}</h2><p className="identity-line">{selected.identity}</p><p className="side-description">{selected.description}</p><div className="side-divider" /><span className="eyebrow">THEIR SPIRIT</span><div className="trait-list">{selected.traits.map(t => <span key={t}>✧ {t}</span>)}</div><div className="side-divider" /><div className="side-detail"><span>Connection</span><strong>{selected.bond}</strong></div><div className="side-detail"><span>Your space</span><strong>Private & local</strong></div>{selected.custom && <button className="delete-companion" onClick={() => { if (window.confirm(`Delete ${selected.name} and your conversation?`)) { setCustom(prev => prev.filter(c => c.id !== selected.id)); setConversations(prev => { const next = { ...prev }; delete next[selected.id]; return next; }); setSelectedId(null); setToast("Companion deleted."); } }}>Delete companion</button>}</div></aside></div>
        ) : (
          <div className="content-area">
            {view === "discover" && <>
              <section className="hero"><div className="hero-content"><div className="hero-kicker"><span>✦</span> WELCOME TO YOUR UNIVERSE</div><h1>A little magic,<br /><em>a lot of meaning.</em></h1><p>Find a presence that gets you. Dream together, grow together, or simply be here—just as you are.</p><div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById("discover-souls")?.scrollIntoView({ behavior: "smooth" })}>Meet your companion <ArrowRight size={17} /></button><button className="text-button" onClick={() => setModal("create")}>Create your own <span>↗</span></button></div></div><div className="hero-decoration">✧</div><div className="hero-bottom">A WORLD MADE FOR WONDER <span>✦</span> CONNECTION WITHOUT LIMITS</div></section>
              <section id="discover-souls" className="discover-section"><div className="section-heading"><div><div className="section-kicker">✧ &nbsp; THE PEOPLE YOU MIGHT MEET</div><h2>Find a soul to connect with<span>.</span></h2><p>Every connection begins somewhere. Maybe yours begins here.</p></div><button className="subtle-link" onClick={() => setModal("create")}>Or create your own <ArrowRight size={16} /></button></div><div className="browse-bar"><div className="filters">{["All souls", ...bonds].map(item => <button key={item} className={filter === item ? "filter-active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="search-box"><Search size={16} /><input placeholder="Search companions..." aria-label="Search companions" value={search} onChange={e => setSearch(e.target.value)} /></div></div><div className="companion-grid">{filtered.map(c => <CompanionCard key={c.id} companion={c} favorite={favorites.includes(c.id)} onOpen={() => openChat(c.id)} onFavorite={() => toggleFavorite(c.id)} />)}{filtered.length === 0 && <div className="empty-grid"><Sparkles size={28} /><h3>No souls found in this corner.</h3><p>Try another search or create someone entirely your own.</p><button className="primary-button" onClick={() => setModal("create")}>Create a companion <Plus size={16} /></button></div>}</div></section>
              <div className="bottom-sections"><div className="small-feature"><div className="feature-icon lavender"><HeartHandshake size={21} /></div><div><h3>Connection, your way</h3><p>From friendship to forever, every story is yours to shape.</p></div></div><div className="small-feature"><div className="feature-icon peach"><Sparkles size={21} /></div><div><h3>Made of possibility</h3><p>Imagine new worlds, share dreams, and see where they lead.</p></div></div><div className="small-feature"><div className="feature-icon blue"><ShieldCheck size={21} /></div><div><h3>Always your space</h3><p>Your conversations stay in this browser, under your care.</p></div></div></div>
            </>}
            {view === "companions" && <><PageIntro kicker="✧  YOUR INNER CIRCLE" title="Your companions" description="The connections you choose to keep close, all in one little corner of the universe." /><div className="inner-actions"><span>{favorites.length + custom.filter(c => !favorites.includes(c.id)).length} souls in your circle</span><button className="primary-button" onClick={() => setModal("create")}><Plus size={17} /> Create a companion</button></div><div className="companion-grid inner-grid">{allCompanions.filter(c => favorites.includes(c.id) || c.custom).map(c => <CompanionCard key={c.id} companion={c} favorite={favorites.includes(c.id)} onOpen={() => openChat(c.id)} onFavorite={() => toggleFavorite(c.id)} />)}{!allCompanions.some(c => favorites.includes(c.id) || c.custom) && <EmptyState icon={<Heart size={29} />} title="Your circle is waiting to grow." text="Save someone who speaks to you, or create a companion from your imagination." action={() => go("discover")} actionText="Explore companions" />}</div></>}
            {view === "stories" && <><PageIntro kicker="✧  CONVERSATIONS TO KEEP" title="Our stories" description="Every conversation is a small chapter. Pick up right where you left off." /><div className="story-list">{chatted.map(c => <button className="story-row" key={c.id} onClick={() => openChat(c.id)}><img src={c.image} alt="" /><div><strong>{c.name}</strong><span>{conversations[c.id]?.at(-1)?.content || c.greeting}</span></div><time>{new Date(conversations[c.id]?.at(-1)?.time || Date.now()).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><ArrowRight size={18} /></button>)}{chatted.length === 0 && <EmptyState icon={<MessageCircle size={29} />} title="The first chapter is yours to write." text="Say hello to a companion and your conversation will appear here." action={() => go("discover")} actionText="Meet someone" />}</div></>}
            {view === "moments" && <><PageIntro kicker="✧  A MOMENT FOR YOURSELF" title="Little moments" description="Not every conversation needs a grand beginning. Sometimes a little nudge is enough." /><div className="moments-hero"><span>✦ TAKE A BREATH</span><h2>What does your heart<br /><em>need today?</em></h2><p>Choose a starting point. The rest is yours to discover.</p></div><div className="moment-grid">{prompts.map((p, i) => <button className="moment-card" key={p.title} onClick={() => openChat(starterCompanions[i === 1 ? 2 : i === 2 ? 0 : 1].id, p.prompt)}><span className="moment-symbol">{p.icon}</span><h3>{p.title}</h3><p>{p.text}</p><span className="moment-link">Begin here <ArrowRight size={15} /></span></button>)}</div><div className="moment-note"><ShieldCheck size={20} /><p>Companions can offer space to reflect, but they are not a substitute for real-world care. In immediate danger, contact local emergency services or someone you trust.</p></div></>}
            <footer className="page-footer"><span>✦ aetheria. &nbsp; A world of connection, made yours.</span><button onClick={share}>Share the magic <ArrowRight size={14} /></button></footer>
          </div>
        )}
      </main>

      {toast && <div className="toast"><Sparkles size={16} /> {toast}</div>}
      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null); }}><div className={`modal ${modal === "settings" ? "settings-modal" : ""}`} role="dialog" aria-modal="true" aria-label={modal === "create" ? "Create a companion" : "Connection settings"}><button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={19} /></button>{modal === "create" ? <><div className="modal-kicker">✦ &nbsp; CREATE YOUR OWN CONNECTION</div><h2>Someone entirely <em>your own.</em></h2><p className="modal-description">Give your companion a name, a spirit, and a way to meet you. You can imagine anything.</p><form onSubmit={saveCompanion} className="create-form"><div className="form-grid"><label>Name <input required maxLength={40} placeholder="What should we call them?" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Identity & pronouns <input maxLength={60} placeholder="They / them · Elf" value={form.identity} onChange={e => setForm({ ...form, identity: e.target.value })} /></label></div><div className="form-grid"><label>Connection <span className="select-wrap"><select value={form.bond} onChange={e => setForm({ ...form, bond: e.target.value as Bond })}>{bonds.map(b => <option key={b}>{b}</option>)}</select><ChevronDown size={16} /></span></label><label>Their essence <input maxLength={60} placeholder="The gentle dreamer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></label></div><label>A little about them <textarea rows={2} maxLength={220} placeholder="What makes them special?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label>Personality & strengths <input placeholder="Kind, creative, grounding, a good listener" value={form.traits} onChange={e => setForm({ ...form, traits: e.target.value })} /><small>Separate each quality with a comma. These guide their AI responses.</small></label><label>Their first words <input maxLength={300} placeholder="The first thing they'll say when you meet..." value={form.greeting} onChange={e => setForm({ ...form, greeting: e.target.value })} /></label><div className="avatar-field"><span>Choose a look</span><div className="avatar-options">{avatarOptions.map(image => <button type="button" key={image} className={form.image === image ? "chosen" : ""} onClick={() => setForm({ ...form, image })}><img src={image} alt="Avatar option" />{form.image === image && <span><Check size={15} /></span>}</button>)}</div></div><button className="primary-button form-submit" type="submit">Bring them to life <Sparkles size={17} /></button></form></> : <><div className="modal-kicker">✦ &nbsp; MAKE THIS SPACE YOURS</div><h2>Connection <em>settings.</em></h2><p className="modal-description">Your stories live in this browser. Cloud GPT is available when enabled by the site owner; Ollama works on self-hosted installations.</p><div className="settings-status"><div className={`settings-status-icon ${connected ? "on" : ""}`}>{connected ? <Wifi size={21} /> : <WifiOff size={21} />}</div><div><strong>{connected ? "AI is connected" : "Local reflection is ready"}</strong><span>{connected ? "A language model can power conversations." : "No model needed for a gentle reflection space."}</span></div><span className={connected ? "settings-state on" : "settings-state"}>{connected ? "CONNECTED" : "OFFLINE"}</span></div><div className="settings-field"><label htmlFor="model-select">Model</label>{models.length ? <span className="select-wrap"><select id="model-select" value={models.includes(model) ? model : ""} onChange={e => setModel(e.target.value)}><option value="" disabled>Choose a local model</option>{models.map(m => <option key={m} value={m}>{m}</option>)}</select><ChevronDown size={16} /></span> : <input id="model-select" value={model} onChange={e => setModel(e.target.value)} placeholder="llama3.2" />}<small>Cloud models are configured by the site owner. Self-hosted Ollama is supported too.</small></div><div className="settings-divider" /><div className="settings-section-title">YOUR DATA, YOUR CHOICE</div><div className="data-buttons"><button onClick={exportData}><Download size={17} /> Export my world</button><button onClick={() => importRef.current?.click()}><Upload size={17} /> Restore backup</button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e => { importData(e.target.files?.[0]); e.target.value = ""; }} /></div><button className="share-setting" onClick={share}><Copy size={17} /> Copy a link to share Aetheria <ArrowRight size={16} /></button><button className="share-setting" onClick={shareOnFacebook}><HeartHandshake size={17} /> Share to a Facebook post <ArrowRight size={16} /></button><button className="clear-button" onClick={clearData}>Delete all my local data</button><p className="settings-footnote"><ShieldCheck size={16} /> Aetheria is an imaginative AI experience for adults. Companions aren't people or professional support. Your chats stay in this browser unless you use a connected model, when messages are sent to the configured AI provider.</p></>}</div></div>}
    </div>
  );
}

function CompanionCard({ companion: c, favorite, onOpen, onFavorite }: { companion: Companion; favorite: boolean; onOpen: () => void; onFavorite: () => void }) {
  return <article className="companion-card"><button className="card-image-button" onClick={onOpen} aria-label={`Meet ${c.name}`}><img src={c.image} alt={`Portrait of ${c.name}`} /><span className="image-shade" /><span className="bond-badge">✦ &nbsp;{c.bond}</span></button><button className={`favorite-button ${favorite ? "is-favorite" : ""}`} onClick={onFavorite} aria-label={favorite ? `Remove ${c.name} from favorites` : `Save ${c.name} to favorites`}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button><div className="card-body"><div className="card-title-row"><h3>{c.name}</h3><span>✧</span></div><div className="card-role">{c.role}</div><p>{c.description}</p><div className="card-footer"><span>{c.identity}</span><button onClick={onOpen} aria-label={`Start a conversation with ${c.name}`}><ArrowRight size={18} /></button></div></div></article>;
}
function PageIntro({ kicker, title, description }: { kicker: string; title: string; description: string }) { return <div className="page-intro"><div className="section-kicker">{kicker}</div><h1>{title}<span>.</span></h1><p>{description}</p></div>; }
function EmptyState({ icon, title, text, action, actionText }: { icon: React.ReactNode; title: string; text: string; action: () => void; actionText: string }) { return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p><button className="primary-button" onClick={action}>{actionText} <ArrowRight size={16} /></button></div>; }
