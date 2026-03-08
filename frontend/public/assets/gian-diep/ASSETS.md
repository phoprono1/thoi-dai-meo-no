# 🕵️ Assets — Ai Là Gián Điệp? (Undercover)

Danh sách **toàn bộ ảnh và âm thanh** cần chuẩn bị cho game Ai Là Gián Điệp.
Đặt ảnh đúng tên file và đúng thư mục như bên dưới.

**Thư mục gốc:** `frontend/public/assets/gian-diep/`

---

## 📐 Quy cách ảnh chung

| Nhóm                | Kích thước khuyến nghị   | Format |
| ------------------- | ------------------------ | ------ |
| Thẻ vai trò (roles) | 240×340 px (tỉ lệ ~2:3)  | `.png` |
| Mặt sau thẻ bài     | 240×340 px               | `.png` |
| Phông nền phase     | 1280×720 px (16:9)       | `.jpg` |
| UI icons            | 64×64 px, nền trong suốt | `.png` |
| Logo / banner game  | 600×200 px               | `.png` |

> **Phong cách gợi ý:** Thriller/spy hiện đại — tối màu, bóng đổ dài, neon accent màu tím/xanh lạnh.
> Cảm giác như phim gián điệp đô thị, kết hợp chút hài hước nhẹ nhàng.
> Các thẻ vai trò nên có chân dung nhân vật + tên vai trò bằng tiếng Việt.

---

## 🃏 1. Thẻ Vai Trò — `roles/`

Ba loại vai trò chính trong game, thể hiện rõ sự khác biệt qua màu viền / màu nền thẻ.

| Tên file       | Tên vai trò | Màu nhấn     | Mô tả hình ảnh gợi ý                                                                                                                                      |
| -------------- | ----------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `civilian.png` | Dân Thường  | Xanh dương   | Người bình thường, nét mặt tin tưởng — đứng giữa đám đông, ánh sáng ban ngày, trang phục đơn giản. Toát lên cảm giác ngây thơ, chưa biết gián điệp là ai. |
| `spy.png`      | Gián Điệp   | Đỏ tối / cam | Nhân vật mặc áo choàng tối màu, đứng trong bóng tối, nụ cười tinh ranh — biết bí mật nhưng không nói thật. Có thể là bóng người hoặc mặt che một phần.    |
| `mr-white.png` | Mr. White   | Trắng / xám  | Nhân vật mặc toàn trắng, mắt trống rỗng hoặc nhìn mơ hồ — không biết gì cả, nhưng liều lĩnh. Cảm giác ngây ngô nhưng nguy hiểm.                           |

---

## 🂠 2. Mặt Sau Thẻ Bài — `roles/`

| Tên file        | Dùng cho                   | Gợi ý thiết kế                                                                                                        |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `card-back.png` | Mặt sau tất cả thẻ vai trò | Nền tối với kính lúp hoặc dấu hỏi lớn ở giữa, logo "?" bằng neon tím. Phía dưới có thể in nhỏ chữ "AI LÀ GIÁN ĐIỆP?". |

---

## 🌆 3. Phông Nền Phase — `backgrounds/`

Mỗi giai đoạn trong game có một không khí riêng, thể hiện qua background.

| Tên file              | Phase hiển thị         | Mô tả gợi ý                                                                                                        |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `lobby.jpg`           | Phòng chờ / Lobby      | Phòng họp tối, bàn dài với ghế trống, ánh đèn spotlight từ trên xuống — không khí bí ẩn trước khi bắt đầu.         |
| `word-reveal.jpg`     | Xem từ bí mật          | Màn hình tối với một phong bì được mở — ánh sáng vàng từ bên trong chiếu ra, bầu không khí hồi hộp, bí mật.        |
| `describe.jpg`        | Vòng mô tả / phát biểu | Bàn tròn với người đang nói, spotlight chiếu vào người phát biểu, người khác ngồi nghe — cảm giác như phiên xử án. |
| `vote.jpg`            | Vòng bỏ phiếu          | Những tờ phiếu kín trên bàn, tay đang bỏ phiếu vào hộp, ánh đèn đỏ căng thẳng.                                     |
| `vote-result.jpg`     | Công bố kết quả vote   | Spotlight chiếu vào một ghế trống — người vừa bị loại, không khí im lặng nặng nề.                                  |
| `spy-guess.jpg`       | Gián điệp đoán từ      | Nhân vật gián điệp đứng một mình dưới đèn hỏi cung — khoảnh khắc cuối cùng, được hay thua.                         |
| `game-over-win.jpg`   | Dân thường chiến thắng | Nhóm người ăn mừng, ánh sáng vàng ấm áp, gián điệp bị lộ — ảnh khải hoàn.                                          |
| `game-over-spy.jpg`   | Gián điệp chiến thắng  | Nhân vật gián điệp bước đi trong đêm tối, áo choàng bay, đã thoát thành công — đầy vẻ khinh xuất.                  |
| `game-over-white.jpg` | Mr. White chiến thắng  | Nhân vật trắng đứng giữa hai phe nhìn nhau, nụ cười bí ẩn — kẻ thắng không ai ngờ tới.                             |

---

## 🖼️ 4. UI Icons — `ui/`

Các icon nhỏ dùng trong giao diện, nền trong suốt (PNG).

| Tên file                  | Kích thước | Dùng ở đâu                       | Gợi ý thiết kế                                                   |
| ------------------------- | ---------- | -------------------------------- | ---------------------------------------------------------------- |
| `icon-phase-reveal.png`   | 64×64 px   | Icon bên cạnh tên phase "Xem Từ" | Phong bì đang mở / mắt nhìn.                                     |
| `icon-phase-describe.png` | 64×64 px   | Icon phase "Mô Tả"               | Miệng đang nói / bong bóng chat.                                 |
| `icon-phase-vote.png`     | 64×64 px   | Icon phase "Bỏ Phiếu"            | Hộp phiếu / bàn tay bỏ phiếu.                                    |
| `icon-phase-result.png`   | 64×64 px   | Icon phase "Kết Quả"             | Dấu chấm than / lá phiếu được mở.                                |
| `icon-phase-guess.png`    | 64×64 px   | Icon phase "Gián Điệp Đoán"      | Kính lúp / dấu hỏi.                                              |
| `icon-civilian.png`       | 64×64 px   | Badge role "Dân Thường"          | Người đơn giản / silhouette xanh.                                |
| `icon-spy.png`            | 64×64 px   | Badge role "Gián Điệp"           | Kính mắt gián điệp / bóng tối.                                   |
| `icon-mr-white.png`       | 64×64 px   | Badge role "Mr. White"           | Dấu hỏi trắng trong vòng tròn.                                   |
| `icon-timer.png`          | 64×64 px   | Đồng hồ đếm ngược lượt mô tả     | Đồng hồ cát hoặc đồng hồ đếm ngược.                              |
| `icon-eliminated.png`     | 64×64 px   | Trên avatar người bị loại        | Dấu X đỏ / còng tay.                                             |
| `logo.png`                | 600×200 px | Header trang game, lobby         | Chữ "AI LÀ GIÁN ĐIỆP?" kiểu spy noir, kính lúp tích hợp vào chữ. |

---

## 🔊 5. Âm Thanh — `../sounds/gian-diep/` _(thư mục riêng)_

> Đặt tại: `frontend/public/assets/sounds/gian-diep/`

| Tên file                 | Khi nào phát                      | Gợi ý âm thanh                                 |
| ------------------------ | --------------------------------- | ---------------------------------------------- |
| `bgm-lobby.mp3`          | Nhạc nền phòng chờ                | Nhạc jazz/lounge tối, nhẹ nhàng bí ẩn.         |
| `bgm-game.mp3`           | Nhạc nền trong game               | Nhạc thriller căng thẳng nhưng không quá nặng. |
| `sfx-reveal.mp3`         | Khi lật xem từ bí mật             | Tiếng "whoosh" + tiếng chime bí ẩn.            |
| `sfx-describe-start.mp3` | Bắt đầu lượt mô tả của ai đó      | Tiếng microphone "bíp" bật lên.                |
| `sfx-timer-tick.mp3`     | 5 giây cuối đếm ngược             | Tiếng tick nhanh dần, hồi hộp.                 |
| `sfx-vote.mp3`           | Khi bỏ phiếu                      | Tiếng "bộp" giấy rơi vào hộp.                  |
| `sfx-eliminated.mp3`     | Khi ai đó bị loại                 | Tiếng chuông tòa án hoặc tiếng đóng cửa nặng.  |
| `sfx-spy-caught.mp3`     | Gián điệp bị bắt                  | Tiếng còi cảnh sát ngắn.                       |
| `sfx-spy-escape.mp3`     | Gián điệp thoát thành công        | Tiếng cười tinh quái + footsteps.              |
| `sfx-win.mp3`            | Dân thường thắng                  | Tiếng hoan hô vui vẻ.                          |
| `sfx-lose.mp3`           | Gián điệp thắng / Mr. White thắng | Âm thanh "game over" căng thẳng.               |
| `sfx-mr-white-win.mp3`   | Mr. White đoán đúng và thắng      | Tiếng "twist" bất ngờ, dramatic.               |

---

## 📝 Ghi chú thêm

### Từ điển từ bí mật (Word Pairs)

Game cần một file JSON chứa các cặp từ. **Bạn không cần cung cấp file này** — tôi sẽ tạo sẵn ~150 cặp từ tiếng Việt theo chủ đề khi bắt tay vào code.

Ví dụ cặp từ:

- `"Chó" / "Mèo"` (Động vật)
- `"Cà phê" / "Trà"` (Đồ uống)
- `"Biển" / "Hồ"` (Địa điểm)
- `"Bác sĩ" / "Y tá"` (Nghề nghiệp)

### Màu sắc chủ đạo gợi ý

| Yếu tố       | Màu hex gợi ý                |
| ------------ | ---------------------------- |
| Nền chính    | `#0a0f1e` (xanh đêm rất tối) |
| Accent chính | `#7c3aed` (tím gián điệp)    |
| Dân thường   | `#2563eb` (xanh tin tưởng)   |
| Gián điệp    | `#dc2626` (đỏ cảnh báo)      |
| Mr. White    | `#9ca3af` (xám trắng)        |
| Text sáng    | `#e2e8f0`                    |
| Text mờ      | `#64748b`                    |

---

## ✅ Checklist nhanh

### Bắt buộc (game không hoạt động đúng nếu thiếu)

- [ ] `roles/civilian.png`
- [ ] `roles/spy.png`
- [ ] `roles/mr-white.png`
- [ ] `roles/card-back.png`

### Khuyến nghị (nâng cao trải nghiệm)

- [ ] `backgrounds/lobby.jpg`
- [ ] `backgrounds/word-reveal.jpg`
- [ ] `backgrounds/describe.jpg`
- [ ] `backgrounds/vote.jpg`
- [ ] `backgrounds/vote-result.jpg`
- [ ] `backgrounds/spy-guess.jpg`
- [ ] `backgrounds/game-over-win.jpg`
- [ ] `backgrounds/game-over-spy.jpg`
- [ ] `backgrounds/game-over-white.jpg`
- [ ] `ui/logo.png`
- [ ] Tất cả 10 `ui/icon-*.png`

### Tùy chọn (có cũng được không có cũng không sao)

- [ ] Tất cả `sounds/gian-diep/*.mp3`
