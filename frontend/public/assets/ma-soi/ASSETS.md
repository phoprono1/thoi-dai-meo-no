# 🐺 Assets — Ma Sói (Werewolf)

Danh sách **toàn bộ ảnh** cần chuẩn bị cho game Ma Sói.
Đặt ảnh đúng tên file và đúng thư mục như bên dưới.

**Thư mục gốc:** `frontend/public/assets/ma-soi/`

---

## 📐 Quy cách ảnh chung

| Nhóm                    | Kích thước khuyến nghị   | Format |
| ----------------------- | ------------------------ | ------ |
| Ảnh thẻ vai trò (roles) | 200×300 px (tỉ lệ 2:3)   | `.png` |
| Mặt sau thẻ bài         | 200×300 px               | `.png` |
| Phông nền phase         | 1280×720 px hoặc 16:9    | `.jpg` |
| UI icons / phase icons  | 64×64 px, nền trong suốt | `.png` |
| Avatar làng             | 512×512 px               | `.png` |

> **Phong cách gợi ý:** Gothic/fairy-tale tối màu, phong cách làng quê Á Đông về đêm. Mỗi thẻ vai trò nên có chân dung nhân vật + tên vai trò + biểu tượng phe.

---

## 🃏 1. Thẻ Vai Trò — `roles/`

### Phe Làng (Team Village) — Viền xanh lá

Mục tiêu: Tiêu diệt toàn bộ Ma Sói.

| Tên file         | Tên vai trò      | Mô tả hình ảnh gợi ý                                      |
| ---------------- | ---------------- | --------------------------------------------------------- |
| `villager.png`   | Dân Làng         | Người nông dân bình thường, nét mặt lo lắng, ban ngày     |
| `seer.png`       | Tiên Tri         | Bà lão hoặc thầy tu nhìn vào quả cầu pha lê, ánh mắt sáng |
| `doctor.png`     | Thầy Thuốc       | Thầy lang với túi thuốc, cây thuốc, ánh nến               |
| `hunter.png`     | Thợ Săn          | Người cầm nỏ/cung, tư thế sẵn sàng chiến đấu              |
| `witch.png`      | Phù Thủy         | Phù thủy già với 2 bình thuốc (1 xanh cứu - 1 đỏ hại)     |
| `bodyguard.png`  | Vệ Sĩ            | Chiến binh/lính với khiên, đứng bảo vệ                    |
| `elder.png`      | Trưởng Làng      | Cụ già đầu làng, áo dài, quyền trượng, khí phách          |
| `detective.png`  | Thám Tử          | Mặc áo choàng, kính lúp, vẻ suy nghĩ                      |
| `little_red.png` | Cô Bé Quàng Khăn | Cô bé áo đỏ trong rừng đêm, nhìn thấy bóng sói            |
| `wild_child.png` | Đứa Trẻ Hoang Dã | Đứa trẻ ngồi cạnh bóng sói/sư tử, vẻ bí ẩn                |
| `cupid.png`      | Thần Tình Ái     | Thiên thần nhỏ với cung tên vàng, trái tim hồng           |
| `servant.png`    | Người Hầu Trung  | Người hầu cúi đầu, sẵn sàng nhận nhiệm vụ                 |
| `mayor.png`      | Thị Trưởng       | Người đeo huy hiệu mayor, phong thái tự tin               |
| `medium.png`     | Đồng Cốt         | Người đang ngồi thiền, xung quanh có hồn ma mờ ảo         |
| `knight.png`     | Hiệp Sĩ          | Kỵ sĩ áo giáp, kiếm trong tay, khẩu hiệu danh dự          |

### Phe Ma Sói (Team Werewolf) — Viền đỏ tối

Mục tiêu: Số lượng Ma Sói ≥ Dân Làng còn sống.

| Tên file              | Tên vai trò        | Mô tả hình ảnh gợi ý                                      |
| --------------------- | ------------------ | --------------------------------------------------------- |
| `werewolf.png`        | Ma Sói             | Người biến thành sói dưới trăng, nanh vuốt, mắt đỏ rực    |
| `alpha_wolf.png`      | Sói Già            | Sói lớn đầu đàn, sẹo trên mặt, nanh to hơn, oai nghiêm    |
| `wolf_cub.png`        | Sói Con            | Sói nhỏ tức giận, nhưng nguy hiểm khi bị hại              |
| `cursed_villager.png` | Dân Làng Bị Nguyền | Người bình thường nhưng có vết sói cắn, chưa biết số phận |

### Phe Độc Lập (Solo/Neutral) — Viền tím

Mục tiêu riêng, không thuộc phe nào.

| Tên file            | Tên vai trò   | Mô tả hình ảnh gợi ý                                      |
| ------------------- | ------------- | --------------------------------------------------------- |
| `jester.png`        | Kẻ Phá Đám    | Thằng hề cười man dại, muốn bị treo cổ để thắng           |
| `white_wolf.png`    | Sói Trắng     | Sói lông trắng cô độc, đứng tách khỏi đàn, vẻ mặt buồn    |
| `serial_killer.png` | Kẻ Giết Người | Bóng đen cầm dao, mặt nạ, đêm tối — không theo phe nào    |
| `fox.png`           | Cáo           | Cáo orange khéo léo, sniffing, hóa thân giữa người và thú |

---

## 🂠 2. Mặt Sau Thẻ Bài — `roles/`

| Tên file        | Dùng cho                   | Gợi ý thiết kế                                             |
| --------------- | -------------------------- | ---------------------------------------------------------- |
| `card-back.png` | Mặt sau tất cả thẻ vai trò | Logo trăng lưỡi liềm + cây, nền đen/xanh đậm, chữ "MA SÓI" |

---

## 🌙 3. Phông Nền Phase — `backgrounds/`

| Tên file                | Phase                 | Gợi ý nội dung                                                  |
| ----------------------- | --------------------- | --------------------------------------------------------------- |
| `night.jpg`             | Đêm (Night Phase)     | Làng quê dưới ánh trăng rằm, sương mờ, nhà tranh tối, rợn ngợp  |
| `day.jpg`               | Ngày (Day Phase)      | Làng sáng bình minh, dân làng tụ tập ở sân đình, không khí căng |
| `voting.jpg`            | Bỏ Phiếu              | Dân làng chỉ tay về một người, không khí xét xử                 |
| `game-over-village.jpg` | Kết thúc — Làng thắng | Bình minh rạng rỡ, dân làng ăn mừng, ánh sáng chiếu sáng        |
| `game-over-wolf.jpg`    | Kết thúc — Sói thắng  | Màn đêm u tối, trăng đỏ, bóng sói gầm trên đồi cao              |
| `lobby.jpg`             | Phòng chờ             | Cổng làng ban ngày, yên bình trước khi đêm xuống                |

---

## 🖼️ 4. UI Icons — `ui/`

### Phase & Action Icons

| Tên file           | Dùng cho                    | Gợi ý                             |
| ------------------ | --------------------------- | --------------------------------- |
| `moon.png`         | Icon phase đêm              | Trăng lưỡi liềm vàng trên nền tối |
| `sun.png`          | Icon phase ngày             | Mặt trời cam/vàng                 |
| `vote.png`         | Icon bỏ phiếu               | Thùng phiếu với tờ giấy           |
| `skull.png`        | Icon chết/bị loại           | Đầu lâu đơn giản                  |
| `shield.png`       | Icon được bảo vệ            | Khiên xanh                        |
| `eye.png`          | Icon kiểm tra/tiên tri      | Mắt mở to, ánh sáng               |
| `heart.png`        | Icon tình nhân (Cupid link) | Trái tim đỏ                       |
| `heart-broken.png` | Icon tình nhân chết         | Trái tim vỡ đôi                   |
| `potion-save.png`  | Thuốc cứu (Phù Thủy)        | Bình thuốc xanh lam               |
| `potion-kill.png`  | Thuốc độc (Phù Thủy)        | Bình thuốc đỏ tối, có đầu lâu     |
| `arrow.png`        | Icon thợ săn bắn            | Mũi tên                           |
| `crown.png`        | Icon Thị Trưởng             | Vương miện vàng nhỏ               |
| `ghost.png`        | Icon Đồng Cốt / hồn ma      | Bóng ma trắng mờ                  |
| `wolf-paw.png`     | Icon Ma Sói hành động       | Dấu chân sói đỏ                   |
| `question.png`     | Icon vai trò ẩn             | Dấu hỏi trên nền tối              |
| `timer.png`        | Icon đếm ngược              | Đồng hồ cát                       |
| `chat-bubble.png`  | Icon chat thảo luận         | Bong bóng thoại                   |
| `mute.png`         | Icon bị câm (sau khi chết)  | Biểu tượng micro gạch đỏ          |

### Team Badges

| Tên file            | Dùng cho          | Gợi ý                            |
| ------------------- | ----------------- | -------------------------------- |
| `badge-village.png` | Badge phe Làng    | Lá cờ xanh lá hoặc hình ngôi nhà |
| `badge-wolf.png`    | Badge phe Sói     | Đầu sói đỏ                       |
| `badge-solo.png`    | Badge phe Độc Lập | Hình người cô độc, màu tím       |

---

## 🎭 5. Avatar Làng (tuỳ chọn) — `ui/avatars/`

6–12 avatar ngẫu nhiên cho người chơi khi chưa upload ảnh:

| Tên file       | Gợi ý nhân vật |
| -------------- | -------------- |
| `avatar-1.png` | Lão nông       |
| `avatar-2.png` | Người thợ      |
| `avatar-3.png` | Cô gái làng    |
| `avatar-4.png` | Người lính     |
| `avatar-5.png` | Thầy đồ        |
| `avatar-6.png` | Bà lão         |
| `avatar-7.png` | Tên cướp       |
| `avatar-8.png` | Thương nhân    |

---

## 📝 Ghi chú

- Ảnh **không bắt buộc phải có ngay** — game hiển thị emoji/màu mặc định nếu thiếu ảnh.
- **Ưu tiên trước:** `card-back.png`, `night.jpg`, `day.jpg`, và thẻ 4 vai trò cơ bản: `villager`, `werewolf`, `seer`, `doctor`.
- Các vai trò phe độc lập và một số vai trò làng nâng cao có thể để sau.
- Phong cách đề xuất: tham khảo board game "Bất Tử Ma Sói" (VN), "Ultimate Werewolf", hoặc style anime/illust.
