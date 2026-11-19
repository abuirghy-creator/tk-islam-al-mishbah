export interface CompressImageOptions {
  maxSize?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export const compressImageDataUrl = (
  dataUrl: string,
  options: CompressImageOptions = {}
): Promise<string> => {
  const { maxSize = 360, quality = 0.78, mimeType = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width || maxSize;
        let height = img.height || maxSize;

        if (width > maxSize || height > maxSize) {
          if (width >= height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL(mimeType, quality);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Gagal memproses gambar.'));
    img.src = dataUrl;
  });
};

export const compressImageFile = (
  file: File,
  options: CompressImageOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl !== 'string') {
        reject(new Error('File gambar tidak valid.'));
        return;
      }
      try {
        const compressed = await compressImageDataUrl(rawDataUrl, options);
        resolve(compressed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
};
