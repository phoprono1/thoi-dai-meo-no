"use client";
import Image from "next/image";
import {
  TileInfo,
  ClientOwnedTile,
  ClientPlayer,
  PROPERTY_COLORS,
  PLAYER_COLORS,
  getTileFacing,
  formatMoney,
} from "@/lib/coTyPhuData";

interface Props {
  tile: TileInfo;
  owned?: ClientOwnedTile;
  playersHere: ClientPlayer[];
  allPlayers: ClientPlayer[];
  isCurrentPlayerTile?: boolean;
  onClick?: () => void;
}

const CORNER_ICONS: Record<string, string> = {
  go: "▶",
  jail: "🔒",
  free_parking: "🅿",
  go_to_jail: "👮",
};

const TYPE_ICONS: Record<string, string> = {
  chance: "?",
  community: "🎁",
  tax: "💸",
  station: "🚌",
  utility: "⚡",
};

const BUILDING_ICONS = ["", "🏠", "🏠🏠", "🏠×3", "🏠×4", "🏨"];

/** Small token avatars shown on the tile */
function PlayerTokens({
  playersHere,
  allPlayers,
}: {
  playersHere: ClientPlayer[];
  allPlayers: ClientPlayer[];
}) {
  if (playersHere.length === 0) return null;
  return (
    <div
      className="absolute inset-x-0 bottom-0.5 flex flex-wrap justify-center gap-0.5 z-20"
      style={{ pointerEvents: "none" }}
    >
      {playersHere.map((p) => {
        const pidx = allPlayers.findIndex((pl) => pl.id === p.id);
        const color = PLAYER_COLORS[pidx % PLAYER_COLORS.length];
        return (
          <div
            key={p.id}
            className="rounded-full overflow-hidden shadow shrink-0"
            style={{
              width: 16,
              height: 16,
              backgroundColor: "#ffffff",
              border: `2px solid ${color}`,
            }}
            title={p.name}
          >
            <img
              src={`/assets/co-ty-phu/tokens/${p.avatar}.png`}
              alt={p.avatar}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function BoardTile({
  tile,
  owned,
  playersHere,
  allPlayers,
  isCurrentPlayerTile,
  onClick,
}: Props) {
  const facing = getTileFacing(tile.index);
  const isCorner = facing === "none";
  const isPortrait = facing === "top" || facing === "bottom";
  const isLandscape = facing === "left" || facing === "right";

  const ownerIdx = owned
    ? allPlayers.findIndex((p) => p.id === owned.ownerId)
    : -1;
  const ownerColor =
    ownerIdx >= 0 ? PLAYER_COLORS[ownerIdx % PLAYER_COLORS.length] : null;
  const colorHex = tile.color ? PROPERTY_COLORS[tile.color] : null;
  const isMortgaged = owned?.isMortgaged ?? false;

  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    border: "1px solid #9ca3af",
    userSelect: "none",
    cursor: onClick ? "pointer" : "default",
    backgroundColor: isCurrentPlayerTile
      ? "#fef9c3"
      : isMortgaged
        ? "#d1d5db"
        : "#ffffff",
    boxShadow: ownerColor ? `inset 0 0 0 2.5px ${ownerColor}` : undefined,
    display: "flex",
  };

  const typeIcon = TYPE_ICONS[tile.type];

  // ── CORNER TILES (90×90) ──────────────────────────────────────
  if (isCorner) {
    return (
      <div style={baseStyle} onClick={onClick} title={tile.name}>
        {tile.image && (
          <Image
            src={`/assets/co-ty-phu/${tile.image}`}
            alt={tile.name}
            fill
            className="object-cover"
            sizes="90px"
          />
        )}
        {/* Name overlay — bottom strip */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-center"
          style={{
            background: tile.image
              ? "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 70%)"
              : "transparent",
            padding: "4px 3px 3px",
          }}
        >
          <span
            className="font-bold text-center leading-tight"
            style={{
              fontSize: 9,
              color: tile.image ? "#fff" : "#111",
              textShadow: tile.image ? "0 1px 3px rgba(0,0,0,0.9)" : undefined,
            }}
          >
            {tile.name}
          </span>
        </div>
        <PlayerTokens playersHere={playersHere} allPlayers={allPlayers} />
      </div>
    );
  }

  // ── PORTRAIT TILES (top/bottom rows) — 64w × 90h ─────────────
  // facing="top"    → bottom-row tiles → color strip at TOP (faces inward = up)
  // facing="bottom" → top-row tiles   → color strip at BOTTOM (faces inward = down)
  if (isPortrait) {
    const stripAtTop = facing === "top";
    const colorStrip =
      colorHex && !isMortgaged ? (
        <div
          style={{
            height: 8,
            width: "100%",
            backgroundColor: colorHex,
            flexShrink: 0,
          }}
        />
      ) : null;

    return (
      <div
        style={{ ...baseStyle, flexDirection: "column" }}
        onClick={onClick}
        title={tile.name}
      >
        {stripAtTop && colorStrip}

        {/* Image / icon area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 50,
            flexShrink: 0,
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
          }}
        >
          {tile.image ? (
            <>
              <Image
                src={`/assets/co-ty-phu/${tile.image}`}
                alt={tile.name}
                fill
                className="object-cover object-center"
                sizes="64px"
              />
              {isMortgaged && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(75,85,99,0.65)" }}
                >
                  <span
                    className="text-white font-bold"
                    style={{ fontSize: 9 }}
                  >
                    TC
                  </span>
                </div>
              )}
            </>
          ) : typeIcon ? (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: 22 }}>{typeIcon}</span>
            </div>
          ) : null}
        </div>

        {/* Name + price area — takes remaining space */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 2px",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            className="text-center font-semibold w-full"
            style={{
              fontSize: 7.5,
              lineHeight: 1.25,
              maxHeight: 20,
              overflow: "hidden",
              color: isMortgaged ? "#6b7280" : "#111827",
            }}
          >
            {tile.name}
          </div>
          {tile.price !== undefined && tile.type !== "tax" && (
            <div
              className="font-mono text-center"
              style={{ fontSize: 6.5, color: "#15803d", marginTop: 1 }}
            >
              {formatMoney(tile.price)}
            </div>
          )}
          {owned && owned.buildings > 0 && (
            <div style={{ fontSize: 7, marginTop: 1 }}>
              {BUILDING_ICONS[owned.buildings]}
            </div>
          )}
        </div>

        {!stripAtTop && colorStrip}
        <PlayerTokens playersHere={playersHere} allPlayers={allPlayers} />
      </div>
    );
  }

  // ── LANDSCAPE TILES (left/right cols) — 90w × 64h ────────────
  // facing="right" → left-col tiles  → color strip on RIGHT (faces inward = right)
  // facing="left"  → right-col tiles → color strip on LEFT  (faces inward = left)
  if (isLandscape) {
    const stripOnRight = facing === "right";

    return (
      <div
        style={{
          ...baseStyle,
          flexDirection: stripOnRight ? "row" : "row-reverse",
        }}
        onClick={onClick}
        title={tile.name}
      >
        {/* Main image/content area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            height: "100%",
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
          }}
        >
          {tile.image ? (
            <>
              <Image
                src={`/assets/co-ty-phu/${tile.image}`}
                alt={tile.name}
                fill
                className="object-cover object-center"
                sizes="83px"
              />
              {/* Gradient overlay for name readability */}
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
                  padding: "3px 4px 2px",
                }}
              >
                <div
                  className="text-white font-bold leading-tight"
                  style={{
                    fontSize: 7.5,
                    lineHeight: 1.2,
                    textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                  }}
                >
                  {tile.name}
                </div>
                {tile.price !== undefined && tile.type !== "tax" && (
                  <div
                    style={{
                      fontSize: 7,
                      color: "#86efac",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatMoney(tile.price)}
                  </div>
                )}
              </div>
              {isMortgaged && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(75,85,99,0.6)" }}
                >
                  <span
                    className="text-white font-bold"
                    style={{ fontSize: 9 }}
                  >
                    TC
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              {typeIcon && <span style={{ fontSize: 20 }}>{typeIcon}</span>}
              <span
                className="text-center font-semibold leading-tight px-1"
                style={{ fontSize: 8, color: "#111827" }}
              >
                {tile.name}
              </span>
              {tile.price !== undefined && tile.type !== "tax" && (
                <span
                  style={{
                    fontSize: 7,
                    color: "#15803d",
                    fontFamily: "monospace",
                  }}
                >
                  {formatMoney(tile.price)}
                </span>
              )}
            </div>
          )}
          {owned && owned.buildings > 0 && (
            <div
              className="absolute top-0.5 right-0.5 z-10"
              style={{ fontSize: 8, lineHeight: 1 }}
            >
              {BUILDING_ICONS[owned.buildings]}
            </div>
          )}
        </div>

        {/* Color strip (inward-facing side) */}
        {colorHex && !isMortgaged && (
          <div
            style={{
              width: 8,
              height: "100%",
              backgroundColor: colorHex,
              flexShrink: 0,
            }}
          />
        )}

        <PlayerTokens playersHere={playersHere} allPlayers={allPlayers} />
      </div>
    );
  }

  return null;
}
