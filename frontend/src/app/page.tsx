import Link from "next/link";

const GAMES = [
  {
    id: "meo-no",
    href: "/meo-no",
    emoji: "🐱💣",
    name: "Mèo Nổ",
    subtitle: "Exploding Kittens",
    description:
      "Trò chơi bài chiến thuật – tránh bốc phải Pháo Mèo! Hỗ trợ 2–10 người chơi cùng lúc.",
    tag: "2–10 người",
    tagColor: "#f59e0b",
    available: true,
    theme: "Tết Bính Ngọ 2026",
  },
  {
    id: "co-ty-phu",
    href: "/co-ty-phu",
    emoji: "🏦🎲",
    name: "Cờ Tỷ Phú",
    subtitle: "Vietnamese Monopoly",
    description:
      "Độc quyền bất động sản Việt Nam – mua đất, xây nhà, kiếm tiền thuê và trở thành tỷ phú số 1!",
    tag: "2–8 người",
    tagColor: "#22c55e",
    available: true,
    theme: "Phiên bản Việt Nam",
  },
  {
    id: "ma-soi",
    href: "/ma-soi",
    emoji: "🐺🌕",
    name: "Ma Sói",
    subtitle: "Werewolf",
    description:
      "Trò chơi suy luận xã hội kinh điển – dân làng vs bầy sói. 20 vai trò, hệ thống bật/tắt linh hoạt!",
    tag: "5–20 người",
    tagColor: "#a855f7",
    available: true,
    theme: "5–20 người chơi",
  },
];

const COMING_SOON = [
  { emoji: "🃏", name: "Bài Cào", description: "Sắp ra mắt..." },
  { emoji: "🎲", name: "Cờ Cá Ngựa", description: "Sắp ra mắt..." },
  { emoji: "🀄", name: "Mạt Chược", description: "Sắp ra mắt..." },
];

export default function HubPage() {
  return (
    <div className="hub-root">
      {/* Header */}
      <header className="hub-header">
        <div className="hub-logo-wrap">
          <span className="hub-logo-icon">🎮</span>
          <div>
            <h1 className="hub-logo-title">Ngạo Thiên 88</h1>
            <p className="hub-logo-sub">Mini-games online dành cho bạn bè</p>
          </div>
        </div>
      </header>

      <main className="hub-main">
        {/* Section: Available games */}
        <section>
          <h2 className="hub-section-title">
            <span>🎯</span> Chơi Ngay
          </h2>
          <div className="hub-games-grid">
            {GAMES.map((game) => (
              <Link key={game.id} href={game.href} className="hub-game-card">
                <div className="hub-game-emoji">{game.emoji}</div>
                <div className="hub-game-info">
                  <div className="hub-game-name-row">
                    <span className="hub-game-name">{game.name}</span>
                    <span
                      className="hub-game-tag"
                      style={{
                        background: game.tagColor + "22",
                        color: game.tagColor,
                        borderColor: game.tagColor + "55",
                      }}
                    >
                      {game.tag}
                    </span>
                  </div>
                  <p className="hub-game-subtitle">{game.subtitle}</p>
                  <p className="hub-game-desc">{game.description}</p>
                  <p className="hub-game-theme">🎋 {game.theme}</p>
                </div>
                <div className="hub-game-arrow">▶</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section: Coming soon */}
        <section style={{ marginTop: "40px" }}>
          <h2 className="hub-section-title">
            <span>🚀</span> Sắp Ra Mắt
          </h2>
          <div className="hub-coming-grid">
            {COMING_SOON.map((g) => (
              <div key={g.name} className="hub-coming-card">
                <span className="hub-coming-emoji">{g.emoji}</span>
                <span className="hub-coming-name">{g.name}</span>
                <span className="hub-coming-desc">{g.description}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="hub-footer">
        <p>🐾 Thời Đại Game • Tết Bính Ngọ 2026</p>
      </footer>
    </div>
  );
}
