import { AVATARS } from "@/lib/types";

interface GameOverData {
  winner?: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface Props {
  gameOver: GameOverData;
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

export function GameOverModal({ gameOver, isHost, onRestart, onLeave }: Props) {
  const winnerAvatar = AVATARS.find((a) => a.id === gameOver.winner?.avatar);

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
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {isHost && (
            <button className="btn btn-gold btn-lg" onClick={onRestart}>
              🔄 Chơi Lại
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
