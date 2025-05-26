# Build và Test Plugin

## 1. Build Plugin

Chạy lệnh sau trong terminal:

```bash
cd '/Users/macbook/Downloads/Leon Figma to Cursor'
npm run build
```

## 2. Reload Plugin trong Figma

1. Mở Figma Desktop
2. Vào menu **Plugins** → **Development** → **FigVibe** (right click) → **Remove**
3. Sau đó **Import plugin from manifest...** lại
4. Chọn file `manifest.json` trong folder dự án
5. Run plugin

## 3. Kiểm tra Console (nếu có lỗi)

1. Trong Figma: **Plugins** → **Development** → **Open Console**
2. Xem có error messages không

## 4. Clear Cache (nếu cần)

Nếu vẫn không thấy thay đổi:

1. Đóng Figma hoàn toàn
2. Mở lại và import plugin mới

## Những thay đổi bạn sẽ thấy:

### ✨ UI Mới:

- **Header**: Logo FigVibe với icon ⚡ và nút toggle theme 🌙/☀️
- **Sidebar**: Background trắng/đen với các options được organize lại
- **Selection Card**: Hiển thị thông tin selection với màu purple
- **Code Editor**: Dark theme với syntax highlighting
- **Buttons**: Rounded corners với hover effects
- **Theme**: Light/Dark mode toggle

### 🎨 Colors:

- Brand purple (#8B5CF6)
- Clean white/black backgrounds
- Smooth shadows và transitions

### 📐 Layout:

- Sidebar 320px cố định bên trái
- Code editor chiếm full màn hình bên phải
- Header với height 56px

Nếu sau khi build vẫn không thấy thay đổi, có thể cần check:

- Console errors
- CSS file có load đúng không
- Component imports
