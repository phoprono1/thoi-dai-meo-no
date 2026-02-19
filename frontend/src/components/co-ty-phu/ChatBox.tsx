"use client";
import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  playerName: string;
  message: string;
  timestamp: number;
}

interface Props {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  myName?: string;
}

export default function ChatBox({ messages, onSend, myName }: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div
      style={{
        width: 280,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0d1f12",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #1a3a22",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#86efac" }}>
          Chat phòng
        </span>
        {messages.length > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {messages.length} tin nhắn
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 10px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          minHeight: 180,
          maxHeight: 280,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "#374151",
              fontSize: 12,
              marginTop: 20,
            }}
          >
            Chưa có tin nhắn nào.
          </div>
        )}
        {messages.slice(-60).map((m, i) => {
          const isMe = m.playerName === myName;
          const time = new Date(m.timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
              }}
            >
              {/* Name + time */}
              {(!isMe ||
                i === 0 ||
                messages[i - 1]?.playerName !== m.playerName) && (
                <div
                  style={{
                    fontSize: 10,
                    color: isMe ? "#86efac" : "#60a5fa",
                    fontWeight: 600,
                    marginBottom: 2,
                    paddingLeft: isMe ? 0 : 2,
                    paddingRight: isMe ? 2 : 0,
                  }}
                >
                  {isMe ? "Bạn" : m.playerName}
                </div>
              )}
              {/* Bubble */}
              <div
                title={time}
                style={{
                  maxWidth: "82%",
                  padding: "6px 10px",
                  borderRadius: isMe
                    ? "12px 4px 12px 12px"
                    : "4px 12px 12px 12px",
                  backgroundColor: isMe ? "#14532d" : "#1a2e1a",
                  border: `1px solid ${isMe ? "#16a34a" : "#1a3a22"}`,
                  fontSize: 12,
                  color: isMe ? "#dcfce7" : "#d1fae5",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                  cursor: "default",
                }}
              >
                {m.message}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "#1a3a22" }} />

      {/* Input */}
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          maxLength={200}
          placeholder="Nhắn tin..."
          style={{
            flex: 1,
            backgroundColor: "#0f2818",
            border: "1px solid #1a3a22",
            borderRadius: 8,
            padding: "7px 10px",
            fontSize: 12,
            color: "#e5e7eb",
            outline: "none",
            fontFamily: "inherit",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "#16a34a";
            (e.currentTarget as HTMLInputElement).style.boxShadow =
              "0 0 0 2px rgba(22,163,74,0.2)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "#1a3a22";
            (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "none",
            cursor: input.trim() ? "pointer" : "default",
            backgroundColor: input.trim() ? "#16a34a" : "#14532d",
            color: input.trim() ? "#fff" : "#374151",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.15s",
            boxShadow: input.trim() ? "0 2px 8px rgba(22,163,74,0.35)" : "none",
          }}
          title="Gửi (Enter)"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
