import { AVATARS } from "@/lib/types";

interface GameOverData {
  winner?: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  /** true when this player was eliminated mid-game (game still running) */
  eliminated?: boolean;
}

interface RestartVotes {
  votes: number;
  total: number;
  voters: string[];
}

interface Props {
  gameOver: GameOverData;
  playerId: string | null;
  restartVotes: RestartVotes | null;
  onRestart: () => void;
  onLeave: () => void;
  onSpectate?: () => void;
}

export function GameOverModal({
  gameOver,
  playerId,
  restartVotes,
  onRestart,
  onLeave,
  onSpectate,
}: Props) {
  const winnerAvatar = AVATARS.find((a) => a.id === gameOver.winner?.avatar);
  const hasVoted = !!(playerId && restartVotes?.voters.includes(playerId));
  const voteCount = restartVotes?.votes ?? 0;
  const voteTotal = restartVotes?.total ?? 0;

  // Player was eliminated mid-game and the game is still running (no winner yet)
  const isEliminatedMidGame = gameOver.eliminated && !gameOver.winner;

  if (isEliminatedMidGame) {
    return (
      <div className="winner-overlay">
        <div className="winner-modal">
          <div className="winner-trophy bounce-in">💀</div>
          <div className="winner-title" style={{ color: "var(--tet-red)" }}>
            BỊ LOẠI!
          </div>
          <div
            className="winner-name"
            style={{
              fontSize: "14px",
              color: "var(--tet-text-muted)",
              marginBottom: "8px",
            }}
          >
            Bạn đã bị Phao Mèo loại.
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--tet-text-muted)",
              marginBottom: "20px",
            }}
          >
            Ván đấu vẫn đang tiếp tục...
          </div>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            {onSpectate && (
              <button className="btn btn-gold btn-lg" onClick={onSpectate}>
                👁️ Xem tiếp
              </button>
            )}
            <button className="btn btn-outline btn-lg" onClick={onLeave}>
              🚪 Rời Phòng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="winner-overlay">
      <div className="winner-modal confetti-bg">
        <div className="winner-trophy bounce-in">🏆</div>
        <div className="winner-title">CHIẾN THẮNG!</div>
        <div className="winner-name">
          {gameOver.winner ? (
            <>
              {winnerAvatar?.emoji} {gameOver.winner.name}
            </>
          ) : (
            "Không ai"
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Restart vote button — available to all players */}
          <button
            className={`btn btn-lg ${hasVoted ? "btn-outline" : "btn-gold"}`}
            onClick={onRestart}
            disabled={hasVoted}
            title={hasVoted ? "Bạn đã sẵn sàng chơi lại" : "Bỏ phiếu chơi lại"}
          >
            {hasVoted ? "✅ Đã sẵn sàng" : "🔄 Chơi Lại"}
          </button>

          {/* Vote progress — only shown after at least 1 person voted */}
          {voteCount > 0 && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--tet-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ display: "flex", gap: "2px" }}>
                {Array.from({ length: voteTotal }).map((_, i) => (
                  <span key={i} style={{ fontSize: "16px" }}>
                    {i < voteCount ? "✅" : "⬜"}
                  </span>
                ))}
              </span>
              <span>
                {voteCount}/{voteTotal} người muốn chơi lại
              </span>
            </div>
          )}

          <button className="btn btn-outline btn-lg" onClick={onLeave}>
            🚪 Rời Phòng
          </button>
        </div>
      </div>
    </div>
  );
}
