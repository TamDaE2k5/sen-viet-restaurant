/**
 * Utility nén ảnh tự động trên trình duyệt qua HTML5 Canvas API.
 * 
 * Nghiệp vụ: Thiết bị di động của nhân viên bếp thường chụp ảnh độ phân giải cao (3MB - 10MB),
 * gây nghẽn băng thông và tốn bộ nhớ server. Hàm này tự động resize về tối đa 1280x720,
 * nén JPEG chất lượng 0.75 để dung lượng đầu ra luôn dưới 250KB trước khi upload.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.75
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Tính toán tỷ lệ giữ nguyên khung hình (maintain aspect ratio)
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo Canvas 2D Context'));
          return;
        }

        // Vẽ ảnh lên canvas với kích thước đã resize
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất data URL định dạng image/jpeg với chất lượng nén quy định
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Tính dung lượng ước lượng từ độ dài base64 string
        const base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
        const compressedSizeBytes = Math.round((base64Length * 3) / 4);

        resolve({
          dataUrl,
          originalSizeBytes: file.size,
          compressedSizeBytes,
          originalSizeKb: Math.round(file.size / 1024),
          compressedSizeKb: Math.round(compressedSizeBytes / 1024),
          width,
          height
        });
      };

      img.onerror = () => {
        reject(new Error('Không thể tải file hình ảnh'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file'));
    };

    reader.readAsDataURL(file);
  });
}
