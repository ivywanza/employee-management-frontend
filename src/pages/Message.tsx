import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { ArrowLeft, Megaphone, Search, Send, Users } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/auth";
import { useLive, type ChatMessage } from "../context/live";

interface Conversation {
  user_id: string;
  full_name: string;
  last_message: string;
  last_at: string;
  unread: number;
}

interface Person {
  id: string;
  full_name: string;
}

type View = { kind: "announcements" } | { kind: "room" } | { kind: "chat"; userId: string; name: string };

const AVATAR_COLORS = ["bg-blue-900", "bg-red-700", "bg-sky-700", "bg-indigo-700", "bg-teal-700", "bg-rose-700"];

// The server sends UTC times without a "Z", so add it before reading them
const toDate = (value: string) => new Date(value.endsWith("Z") ? value : `${value}Z`);
const timeOf = (value: string) => toDate(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dateTimeOf = (value: string) =>
  toDate(value).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function dayLabel(value: string, now: Date) {
  const d = toDate(value);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

function errorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

const inputClass =
  "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";

const navButton = (active: boolean) =>
  `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
    active
      ? "bg-gradient-to-r from-blue-950 to-blue-800 text-white shadow"
      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
  }`;

function Avatar({ name, size = "h-10 w-10" }: { name: string; size?: string }) {
  const color = AVATAR_COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <div className={`${size} ${color} rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0`}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="ml-auto text-xs font-bold bg-red-600 text-white rounded-full px-2 py-0.5">{count}</span>;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{children}</p>
  );
}

function Bubbles({
  messages,
  meId,
  showSender,
  now,
}: {
  messages: ChatMessage[];
  meId?: string;
  showSender: boolean;
  now: Date;
}) {
  return (
    <>
      {messages.map((m, i) => {
        const mine = m.sender_id === meId;
        const day = dayLabel(m.created_at, now);
        const showDay = i === 0 || dayLabel(messages[i - 1].created_at, now) !== day;
        return (
          <Fragment key={m.id}>
            {showDay && (
              <div className="flex justify-center py-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 rounded-full px-3 py-0.5">
                  {day}
                </span>
              </div>
            )}
            <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && showSender && <Avatar name={m.sender_name} size="h-8 w-8" />}
              <div
                className={`max-w-[75%] px-4 py-2 text-sm shadow-sm ${
                  mine
                    ? "bg-blue-900 text-white rounded-2xl rounded-br-md"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-md"
                }`}
              >
                {!mine && showSender && (
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">{m.sender_name}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 text-right ${mine ? "text-blue-200" : "text-slate-400"}`}>
                  {timeOf(m.created_at)}
                </p>
              </div>
            </div>
          </Fragment>
        );
      })}
    </>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const { status, subscribe } = useLive();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const [now] = useState(() => new Date());

  const [view, setView] = useState<View>({ kind: "announcements" });
  const [panelOpen, setPanelOpen] = useState(false); // small screens: list or conversation
  const [query, setQuery] = useState("");
  const [broadcasts, setBroadcasts] = useState<ChatMessage[]>([]);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleError, setPeopleError] = useState("");
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [newBroadcasts, setNewBroadcasts] = useState(0);
  const [newRoom, setNewRoom] = useState(0);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await api.get<Conversation[]>("/messages/conversations");
    setConversations(res.data);
  }, []);

  const loadThread = useCallback(async (userId: string) => {
    const res = await api.get<ChatMessage[]>(`/messages/direct/${userId}`);
    setThread(res.data);
  }, []);

  const loadPeople = useCallback(async () => {
    try {
      const res = await api.get<Person[]>("/messages/people");
      setPeople(res.data);
      setPeopleError("");
    } catch (err) {
      const code = axios.isAxiosError(err) ? err.response?.status : undefined;
      setPeopleError(
        code === 404
          ? "The server has no /messages/people route (404). The backend messages router isn't loaded."
          : code
            ? `Could not load colleagues (error ${code}).`
            : "Could not reach the server. Is the backend running?"
      );
    }
  }, []);

  // First load: each request is handled separately, so one failure doesn't blank the page
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [b, r, c] = await Promise.allSettled([
        api.get<ChatMessage[]>("/messages/broadcasts"),
        api.get<ChatMessage[]>("/messages/room"),
        api.get<Conversation[]>("/messages/conversations"),
      ]);
      if (cancelled) return;
      if (b.status === "fulfilled") setBroadcasts(b.value.data);
      if (r.status === "fulfilled") setRoomMessages(r.value.data);
      if (c.status === "fulfilled") setConversations(c.value.data);
      if ([b, r, c].some((x) => x.status === "rejected")) {
        setError("Some messages could not be loaded. Check that the backend is running and up to date.");
      }
      await loadPeople();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPeople]);

  // Live updates
  useEffect(() => {
    return subscribe((event) => {
      const m = event.message;
      if (event.type === "broadcast") {
        setBroadcasts((prev) => (prev.some((b) => b.id === m.id) ? prev : [m, ...prev]));
        if (view.kind !== "announcements" && m.sender_id !== user?.id) setNewBroadcasts((n) => n + 1);
        return;
      }
      if (event.type === "room") {
        setRoomMessages((prev) => (prev.some((r) => r.id === m.id) ? prev : [...prev, m]));
        if (view.kind !== "room" && m.sender_id !== user?.id) setNewRoom((n) => n + 1);
        return;
      }
      loadConversations().catch(() => undefined);
      if (view.kind === "chat" && (m.sender_id === view.userId || m.recipient_id === view.userId)) {
        loadThread(view.userId).catch(() => undefined);
      }
    });
  }, [subscribe, view, user?.id, loadConversations, loadThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, roomMessages, view.kind]);

  const openAnnouncements = () => {
    setView({ kind: "announcements" });
    setNewBroadcasts(0);
    setPanelOpen(true);
    setError("");
  };

  const openRoom = () => {
    setView({ kind: "room" });
    setNewRoom(0);
    setPanelOpen(true);
    setError("");
  };

  const openChat = async (userId: string, name: string) => {
    setView({ kind: "chat", userId, name });
    setThread([]);
    setDraft("");
    setPanelOpen(true);
    setError("");
    try {
      await loadThread(userId); // opening a chat marks its messages as read
      await loadConversations();
    } catch {
      setError("Could not open this chat.");
    }
  };

  const sendBroadcast = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await api.post<ChatMessage>("/messages/broadcast", {
        title: title.trim() || null,
        content: draft,
      });
      setBroadcasts((prev) => (prev.some((b) => b.id === res.data.id) ? prev : [res.data, ...prev]));
      setDraft("");
      setTitle("");
    } catch (err) {
      setError(errorMessage(err, "Could not send the announcement."));
    } finally {
      setSending(false);
    }
  };

  const sendCurrent = async () => {
    if (view.kind === "announcements" || !draft.trim()) return;
    setSending(true);
    setError("");
    try {
      if (view.kind === "room") {
        const res = await api.post<ChatMessage>("/messages/room", { content: draft });
        setRoomMessages((prev) => (prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]));
      } else {
        const res = await api.post<ChatMessage>("/messages/direct", {
          recipient_id: view.userId,
          content: draft,
        });
        setThread((prev) => (prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]));
        loadConversations().catch(() => undefined);
      }
      setDraft("");
    } catch (err) {
      setError(errorMessage(err, "Could not send the message."));
    } finally {
      setSending(false);
    }
  };

  // One search box filters both your chats and your colleagues
  const q = query.trim().toLowerCase();
  const chatIds = new Set(conversations.map((c) => c.user_id));
  const shownConversations = conversations.filter((c) => c.full_name.toLowerCase().includes(q));
  const otherPeople = people.filter((p) => !chatIds.has(p.id) && p.full_name.toLowerCase().includes(q));

  return (
    <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-[21rem_1fr] h-[calc(100vh-8.5rem)] min-h-[32rem]">
      {/* Left column */}
      <div
        className={`${panelOpen ? "hidden" : "flex"} lg:flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Messages</h1>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className={`h-2 w-2 rounded-full ${status === "open" ? "bg-emerald-500" : "bg-amber-500"}`} />
            {status === "open" ? "Live" : "Reconnecting"}
          </span>
        </div>

        <div className="px-4 space-y-3">
          <div className="space-y-2">
            <button onClick={openAnnouncements} className={navButton(view.kind === "announcements")}>
              <Megaphone className="h-4 w-4" />
              Announcements
              <Badge count={newBroadcasts} />
            </button>
            <button onClick={openRoom} className={navButton(view.kind === "room")}>
              <Users className="h-4 w-4" />
              Team chat
              <Badge count={newRoom} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people and chats"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 pb-2">
          {shownConversations.length > 0 && (
            <>
              <SectionLabel>Recent chats</SectionLabel>
              {shownConversations.map((c) => (
                <button
                  key={c.user_id}
                  onClick={() => openChat(c.user_id, c.full_name)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition ${
                    view.kind === "chat" && view.userId === c.user_id
                      ? "bg-blue-50 dark:bg-slate-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Avatar name={c.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {c.full_name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">{timeOf(c.last_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.last_message}</p>
                      {c.unread > 0 && (
                        <span className="text-[10px] font-bold bg-red-600 text-white rounded-full px-1.5 py-0.5 shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          <SectionLabel>Colleagues</SectionLabel>
          {peopleError ? (
            <div className="mx-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              <p>{peopleError}</p>
              <button onClick={() => void loadPeople()} className="mt-1 font-semibold underline">
                Try again
              </button>
            </div>
          ) : otherPeople.length === 0 ? (
            <p className="px-5 py-2 text-sm text-slate-500 dark:text-slate-400">
              {people.length === 0
                ? "No colleagues found."
                : q
                  ? "Nobody matches your search."
                  : "You have a chat with everyone."}
            </p>
          ) : (
            otherPeople.map((p) => (
              <button
                key={p.id}
                onClick={() => openChat(p.id, p.full_name)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <Avatar name={p.full_name} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.full_name}</p>
                  <p className="text-xs text-slate-400">Start a chat</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right pane */}
      <div
        className={`${panelOpen ? "flex" : "hidden"} lg:flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden min-h-0`}
      >
        {view.kind === "announcements" ? (
          <>
            <div className="bg-gradient-to-r from-blue-950 to-blue-800 text-white px-6 py-5 flex items-center gap-3">
              <button onClick={() => setPanelOpen(false)} className="lg:hidden" aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold">Announcements</h2>
                <p className="text-xs text-blue-200">Important reminders for the whole team</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950/40">
              {isAdmin && (
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder="Title (optional)"
                    className={inputClass}
                  />
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Write a reminder for everyone..."
                    className={`${inputClass} resize-none`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{draft.length}/2000</span>
                    <button
                      onClick={sendBroadcast}
                      disabled={sending || !draft.trim()}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                    >
                      <Megaphone className="h-4 w-4" />
                      {sending ? "Sending..." : "Send to everyone"}
                    </button>
                  </div>
                </div>
              )}

              {broadcasts.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No announcements yet.</p>
              ) : (
                broadcasts.map((b) => (
                  <article
                    key={b.id}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-600 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={b.sender_name} size="h-7 w-7" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{b.sender_name}</span>
                      <span className="text-xs text-slate-400">· {dateTimeOf(b.created_at)}</span>
                    </div>
                    {b.title && <p className="font-semibold text-slate-800 dark:text-slate-100">{b.title}</p>}
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-0.5">{b.content}</p>
                  </article>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button onClick={() => setPanelOpen(false)} className="lg:hidden text-slate-600 dark:text-slate-300" aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {view.kind === "room" ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-blue-900 text-white flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">Team chat</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Open to everyone on the team</p>
                  </div>
                </>
              ) : (
                <>
                  <Avatar name={view.name} />
                  <h2 className="font-bold text-slate-800 dark:text-slate-100">{view.name}</h2>
                </>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 bg-slate-50 dark:bg-slate-950/40">
              {(view.kind === "room" ? roomMessages : thread).length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-6">
                  {view.kind === "room"
                    ? "Nothing here yet. Be the first to say something to the team."
                    : `No messages yet. Say hello to ${view.name.split(" ")[0]}.`}
                </p>
              ) : (
                <Bubbles
                  messages={view.kind === "room" ? roomMessages : thread}
                  meId={user?.id}
                  showSender={view.kind === "room"}
                  now={now}
                />
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendCurrent();
              }}
              className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-end gap-2"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendCurrent();
                  }
                }}
                maxLength={2000}
                rows={1}
                placeholder={view.kind === "room" ? "Message the whole team (Enter to send)" : "Type a message (Enter to send)"}
                className={`${inputClass} resize-none`}
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send"
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white h-10 w-11 rounded-xl flex items-center justify-center transition shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}

        {error && (
          <p className="mx-4 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}