interface Props {
  remaining: number;
  isMyTurn: boolean;
}

export function TurnTimer({ remaining, isMyTurn }: Props) {
  const percentage = (remaining / 30) * 100;
  const isUrgent = remaining <= 10;
  const isCritical = remaining <= 5;

  return (
    <div
      className={`turn-timer ${isMyTurn ? "my-turn" : ""} ${isUrgent ? "urgent" : ""} ${isCritical ? "critical" : ""}`}
    >
      <svg viewBox="0 0 36 36" className="timer-circle">
        <path
          className="timer-bg"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="timer-progress"
          strokeDasharray={`${percentage}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <span className="timer-text">{remaining}</span>
    </div>
  );
}
