"use client";

import { useState, useEffect, useRef } from "react";
import { AVATARS, ChatMessage } from "@/lib/types";
import ImageWithFallback from "@/components/ImageWithFallback";
import { User, MessageCircle } from "lucide-react";

interface Props {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ChatBox({ messages, onSend, isOpen, onClose }: Props) {
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg("");
  };

  return (
    <>
      {/* Overlay backdrop for mobile */}
      <div
        className={`modal-overlay mobile-only ${isOpen ? "active" : ""}`}
        style={{
          display: isOpen ? "flex" : "none",
          zIndex: 999,
          background: "rgba(0,0,0,0.5)",
        }}
        onClick={onClose}
      />

      <div className={`chat-panel ${isOpen ? "mobile-open" : ""}`}>
        <div
          className="chat-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>💬 Chat</span>
          <button className="chat-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-msg ${m.isSystem ? "system" : "player"}`}
            >
              {m.isSystem ? (
                m.message
              ) : (
                <>
                  <div className="chat-msg-author">
                    {m.playerAvatar &&
                    AVATARS.find((a) => a.id === m.playerAvatar)?.image ? (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          overflow: "hidden",
                          display: "inline-block",
                          verticalAlign: "middle",
                          marginRight: 4,
                        }}
                      >
                        <ImageWithFallback
                          src={
                            AVATARS.find((a) => a.id === m.playerAvatar)!.image
                          }
                          alt=""
                          width={16}
                          height={16}
                        />
                      </div>
                    ) : (
                      <User
                        size={14}
                        style={{ marginRight: 4, verticalAlign: "middle" }}
                      />
                    )}
                    {m.playerName}
                  </div>
                  <div className="chat-msg-text">{m.message}</div>
                </>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <input
            className="input"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập tin nhắn..."
            maxLength={500}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSend}>
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
