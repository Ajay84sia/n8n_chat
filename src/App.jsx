import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  FiCopy,
  FiCheck,
  FiSend,
  FiMoon,
  FiSun,
  FiMenu,
  FiPlus,
  FiTrash2,
  FiMoreVertical,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMessageSquare,
  FiChevronDown,
  FiX,
} from "react-icons/fi";

import { BsRobot } from "react-icons/bs";

const N8N_CHAT_URL = import.meta.env.VITE_N8N_CHAT_URL;

const STORAGE_KEY = "mindflow-chats";

function createSessionId() {
  return crypto.randomUUID();
}

function createChat() {
  return {
    id: crypto.randomUUID(),
    sessionId: createSessionId(),
    title: "New conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatChatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return formatTime(timestamp);
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);

  const language =
    className?.replace("language-", "") || "text";

  const code = String(children).replace(/\n$/, "");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-white/10">
      <div className="flex items-center justify-between bg-black/40 px-4 py-2">
        <span className="text-xs text-slate-400">
          {language}
        </span>

        <button
          onClick={copyCode}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <FiCheck /> : <FiCopy />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "16px",
          background: "rgba(2, 6, 23, 0.75)",
          fontSize: "13px",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function MarkdownMessage({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children }) {
            if (inline) {
              return (
                <code className="rounded bg-black/20 px-1.5 py-0.5 text-sm">
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock className={className}>
                {children}
              </CodeBlock>
            );
          },

          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                {children}
              </a>
            );
          },

          ul({ children }) {
            return (
              <ul className="my-3 list-disc space-y-1 pl-6">
                {children}
              </ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="my-3 list-decimal space-y-1 pl-6">
                {children}
              </ol>
            );
          },

          h1({ children }) {
            return (
              <h1 className="mb-3 mt-5 text-2xl font-bold">
                {children}
              </h1>
            );
          },

          h2({ children }) {
            return (
              <h2 className="mb-3 mt-5 text-xl font-bold">
                {children}
              </h2>
            );
          },

          h3({ children }) {
            return (
              <h3 className="mb-2 mt-4 text-lg font-semibold">
                {children}
              </h3>
            );
          },

          p({ children }) {
            return (
              <p className="mb-3 last:mb-0">
                {children}
              </p>
            );
          },

          blockquote({ children }) {
            return (
              <blockquote className="my-3 border-l-2 border-blue-400 pl-4 text-slate-300">
                {children}
              </blockquote>
            );
          },

          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            );
          },

          th({ children }) {
            return (
              <th className="border border-white/10 bg-white/5 px-3 py-2 text-left">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td className="border border-white/10 px-3 py-2">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function MessageActions({ content }) {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
      <button
        onClick={copyMessage}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
      >
        {copied ? <FiCheck /> : <FiCopy />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function App() {
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }

    return [createChat()];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed.length > 0) {
          return parsed[0].id;
        }
      }
    } catch {
      // Ignore storage errors
    }

    return null;
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat =
    chats.find((chat) => chat.id === activeChatId) ||
    chats[0];

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );
  }, [chats]);

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [activeChat?.messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChatId]);

  const updateChat = (chatId, updater) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? updater(chat)
          : chat
      )
    );
  };

  const createNewChat = () => {
    const newChat = createChat();

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setSidebarOpen(false);
    setMessage("");
  };

  const deleteChat = (chatId) => {
    if (chats.length === 1) {
      const freshChat = createChat();

      setChats([freshChat]);
      setActiveChatId(freshChat.id);
      return;
    }

    const remaining = chats.filter(
      (chat) => chat.id !== chatId
    );

    setChats(remaining);

    if (activeChatId === chatId) {
      setActiveChatId(remaining[0].id);
    }
  };

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    setSidebarOpen(false);
  };

  const sendMessage = async (quickMessage = null) => {
    const text = (quickMessage || message).trim();

    if (!text || loading || !activeChat) {
      return;
    }

    if (!N8N_CHAT_URL) {
      console.error(
        "VITE_N8N_CHAT_URL is not configured."
      );

      return;
    }

    const now = Date.now();

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: now,
    };

    updateChat(activeChat.id, (chat) => ({
      ...chat,
      title:
        chat.messages.length === 0
          ? text.slice(0, 40)
          : chat.title,
      messages: [...chat.messages, userMessage],
      updatedAt: now,
    }));

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(N8N_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sendMessage",
          chatInput: text,
          sessionId: activeChat.sessionId,
          metadata: {},
        }),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const contentType =
        response.headers.get("content-type") || "";

      /*
       * Streaming response.
       *
       * If n8n returns text/event-stream, process
       * the response progressively.
       */
      if (
        contentType.includes("text/event-stream") &&
        response.body
      ) {
        await handleStreamingResponse(
          response,
          activeChat.id
        );
      } else {
        const data = await response.json();

        const aiResponse =
          data["CHAT DATA"] ??
          data.output ??
          data.text ??
          data.response ??
          "No response received from n8n.";

        addAssistantMessage(
          activeChat.id,
          aiResponse
        );
      }
    } catch (error) {
      console.error("n8n error:", error);

      addAssistantMessage(
        activeChat.id,
        "Sorry, I couldn't connect to the AI assistant. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const addAssistantMessage = (
    chatId,
    content
  ) => {
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content,
      timestamp: Date.now(),
    };

    updateChat(chatId, (chat) => ({
      ...chat,
      messages: [
        ...chat.messages,
        assistantMessage,
      ],
      updatedAt: Date.now(),
    }));
  };

  const handleStreamingResponse = async (
    response,
    chatId
  ) => {
    const reader =
      response.body.getReader();

    const decoder = new TextDecoder();

    let assistantText = "";

    const assistantId = crypto.randomUUID();

    updateChat(chatId, (chat) => ({
      ...chat,
      messages: [
        ...chat.messages,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          streaming: true,
        },
      ],
      updatedAt: Date.now(),
    }));

    let buffer = "";

    while (true) {
      const { value, done } =
        await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) continue;

        let chunk = trimmed;

        if (trimmed.startsWith("data:")) {
          chunk = trimmed
            .replace(/^data:\s*/, "")
            .trim();
        }

        if (chunk === "[DONE]") {
          continue;
        }

        try {
          const parsed = JSON.parse(chunk);

          chunk =
            parsed["CHAT DATA"] ??
            parsed.output ??
            parsed.text ??
            parsed.response ??
            parsed.content ??
            parsed.message ??
            "";
        } catch {
          // Plain text chunk
        }

        if (!chunk) continue;

        assistantText += chunk;

        updateChat(chatId, (chat) => ({
          ...chat,
          messages: chat.messages.map(
            (msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: assistantText,
                  }
                : msg
          ),
          updatedAt: Date.now(),
        }));
      }
    }

    updateChat(chatId, (chat) => ({
      ...chat,
      messages: chat.messages.map(
        (msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                streaming: false,
              }
            : msg
      ),
    }));
  };

  const themeClasses = darkMode
    ? "bg-[#030712] text-white"
    : "bg-slate-100 text-slate-900";

  const glassClasses = darkMode
    ? "border-white/10 bg-white/[0.04] backdrop-blur-2xl"
    : "border-slate-200/80 bg-white/70 backdrop-blur-2xl";

  const sidebarClasses = darkMode
    ? "border-white/10 bg-slate-950/80"
    : "border-slate-200 bg-white/90";

  return (
    <div
      className={`relative flex h-[100dvh] overflow-hidden ${themeClasses}`}
    >
      {/* Background glow */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Mobile overlay */}

      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          flex w-[280px] flex-col
          border-r
          ${sidebarClasses}
          shadow-2xl
          transition-transform duration-300
          lg:relative lg:z-20 lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Brand */}

        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20">
              <BsRobot size={23} />
            </div>

            <div>
              <h1 className="text-lg font-bold">
                MindFlow AI
              </h1>

              <p className="text-xs text-slate-400">
                Your intelligent assistant
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setSidebarOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden"
          >
            <FiX />
          </button>
        </div>

        {/* New Chat */}

        <div className="px-4">
          <button
            onClick={createNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 font-medium shadow-lg shadow-blue-600/20 transition hover:scale-[1.01] hover:shadow-blue-600/30"
          >
            <FiPlus />
            New Chat
          </button>
        </div>

        {/* History */}

        <div className="mt-6 flex-1 overflow-y-auto px-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recent Chats
            </span>

            <FiMessageSquare className="text-slate-500" />
          </div>

          <div className="space-y-1">
            {chats
              .sort(
                (a, b) =>
                  b.updatedAt - a.updatedAt
              )
              .map((chat) => (
                <div
                  key={chat.id}
                  className={`
                    group flex items-center gap-2
                    rounded-xl p-3
                    transition
                    ${
                      activeChatId === chat.id
                        ? darkMode
                          ? "bg-blue-500/10 ring-1 ring-blue-500/20"
                          : "bg-blue-50 ring-1 ring-blue-100"
                        : "hover:bg-white/5"
                    }
                  `}
                >
                  <button
                    onClick={() =>
                      selectChat(chat.id)
                    }
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium">
                      {chat.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatChatDate(
                        chat.updatedAt
                      )}
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      deleteChat(chat.id)
                    }
                    className="rounded-lg p-2 text-slate-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    title="Delete chat"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Bottom */}

        <div className="border-t border-white/10 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/5">
            <FiSettings className="text-slate-400" />

            <span className="text-sm">
              Settings
            </span>
          </button>

          {/* Profile */}

          <div className="relative mt-2">
            {profileOpen && (
              <div
                className={`
                  absolute bottom-full left-0 mb-2 w-full
                  rounded-xl border p-2 shadow-2xl
                  ${glassClasses}
                `}
              >
                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                  <FiUser />
                  Profile
                </button>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                  <FiSettings />
                  Settings
                </button>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                  <FiLogOut />
                  Sign out
                </button>
              </div>
            )}

            <button
              onClick={() =>
                setProfileOpen(!profileOpen)
              }
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 p-3 transition hover:bg-white/5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold">
                AC
              </div>

              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium">
                  Ajay Chaurasia
                </p>

                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </div>
              </div>

              <FiChevronDown className="text-slate-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}

      <section className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}

        <header
          className={`
            relative z-10 flex h-[72px] shrink-0
            items-center justify-between
            border-b px-4 sm:px-6
            ${glassClasses}
          `}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="rounded-xl p-2 hover:bg-white/10 lg:hidden"
            >
              <FiMenu size={22} />
            </button>

            <div>
              <h2 className="font-semibold">
                {activeChat?.title ||
                  "New conversation"}
              </h2>

              <p className="text-xs text-slate-500">
                Powered by n8n
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              title={
                darkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="rounded-xl p-3 transition hover:bg-white/10"
            >
              {darkMode ? (
                <FiSun size={19} />
              ) : (
                <FiMoon size={19} />
              )}
            </button>

            <button className="hidden rounded-xl p-3 transition hover:bg-white/10 sm:block">
              <FiMoreVertical />
            </button>
          </div>
        </header>

        {/* Messages */}

        <main className="flex-1 overflow-y-auto px-3 py-6 sm:px-6">
          <div className="mx-auto max-w-4xl">
            {activeChat?.messages.length === 0 && (
              <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/20">
                  <BsRobot size={34} />
                </div>

                <h2 className="text-3xl font-bold sm:text-4xl">
                  How can I help you?
                </h2>

                <p className="mt-3 max-w-md text-sm text-slate-500 sm:text-base">
                  Ask me anything. I can help you
                  brainstorm, learn, write, analyze,
                  and much more.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {[
                    "Tell me a joke",
                    "Help me with ideas",
                    "Explain something",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() =>
                        sendMessage(
                          item.replace(
                            / [^\x00-\x7F]/g,
                            ""
                          )
                        )
                      }
                      className={`
                        rounded-xl border px-4 py-2.5
                        text-sm transition
                        ${glassClasses}
                        hover:-translate-y-0.5
                        hover:border-blue-500/30
                      `}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-7">
              {activeChat?.messages.map(
                (msg) => (
                  <div
                    key={msg.id}
                    className={`group flex ${
                      msg.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[92%] gap-3 sm:max-w-[80%] ${
                        msg.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      {msg.role ===
                        "assistant" && (
                        <div className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 sm:flex">
                          <BsRobot size={15} />
                        </div>
                      )}

                      <div>
                        <div
                          className={`
                            rounded-2xl px-4 py-3
                            shadow-lg
                            ${
                              msg.role ===
                              "user"
                                ? "rounded-br-md bg-gradient-to-r from-blue-600 to-purple-600"
                                : darkMode
                                ? "rounded-bl-md border border-white/10 bg-white/[0.06] backdrop-blur-xl"
                                : "rounded-bl-md border border-slate-200 bg-white shadow-sm"
                            }
                          `}
                        >
                          {msg.role ===
                          "assistant" ? (
                            <MarkdownMessage
                              content={
                                msg.content
                              }
                            />
                          ) : (
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {msg.content}
                            </p>
                          )}
                        </div>

                        <div
                          className={`mt-1 flex items-center gap-2 text-[10px] text-slate-500 ${
                            msg.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {formatTime(
                            msg.timestamp
                          )}

                          {msg.role ===
                            "user" && (
                            <span>✓✓</span>
                          )}
                        </div>

                        {msg.role ===
                          "assistant" &&
                          !msg.streaming && (
                            <MessageActions
                              content={
                                msg.content
                              }
                            />
                          )}
                      </div>
                    </div>
                  </div>
                )
              )}

              {loading &&
                !activeChat?.messages.some(
                  (msg) =>
                    msg.streaming
                ) && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                      <BsRobot size={15} />
                    </div>

                    <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Composer */}

        <footer
          className={`
            shrink-0 border-t p-3 sm:p-4
            ${glassClasses}
          `}
        >
          <div className="mx-auto max-w-4xl">
            <div
              className={`
                flex items-end gap-2 rounded-2xl
                border p-2 shadow-2xl
                ${glassClasses}
              `}
            >
              <textarea
                ref={inputRef}
                value={message}
                disabled={loading}
                rows={1}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Message MindFlow AI..."
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-500"
              />

              <button
                onClick={() =>
                  sendMessage()
                }
                disabled={
                  !message.trim() ||
                  loading
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-600/20 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <FiSend size={18} />
              </button>
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-500 sm:text-xs">
              MindFlow AI can make mistakes.
              Consider checking important
              information.
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default App;