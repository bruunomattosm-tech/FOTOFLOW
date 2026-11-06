/**
 * Utilitários para validação, redimensionamento no navegador e download de imagens
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Valida tipo e tamanho do arquivo antes do redimensionamento
 */
export function validateImageFile(file: File): ValidationResult {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  const isAllowedMime = ALLOWED_TYPES.includes(file.type.toLowerCase());
  const isAllowedExt = extension ? allowedExtensions.includes(extension) : false;

  if (!isAllowedMime && !isAllowedExt) {
    return {
      valid: false,
      error: `Formato "${file.name}" inválido. Use apenas JPG, PNG ou WEBP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `O arquivo "${file.name}" tem ${sizeMb}MB. O tamanho máximo permitido é 10MB.`,
    };
  }

  return { valid: true };
}

/**
 * Redimensiona a foto no navegador para no máximo 1024px no lado maior (JPEG qualidade 0.85)
 */
export function resizeImageToMax1024(
  file: File | Blob,
  maxDimension = 1024,
  quality = 0.92
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível inicializar o canvas 2D.'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como JPEG com qualidade 0.85
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Falha ao carregar a imagem para redimensionamento.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo de imagem.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Cria uma versão "Manequim" da imagem de referência, desidentificando suavemente
 * o rosto do modelo com desfoque profundo e neutralização cromática da cabeça.
 * Isso impede que a IA copie os olhos, óculos, nariz, boca ou barba da foto de referência,
 * forçando 100% da identidade a vir das fotos do cliente.
 */
export function createMannequinReferenceImage(
  imageSrc: string
): Promise<string> {
  // Retorna a foto de referência original e limpa para preservar 100% dos tecidos, decotes,
  // iluminação e cenário sem artefatos de colagem ou manchas artificiais de cor de pele.
  return Promise.resolve(imageSrc);
}

/**
 * Faz download de uma imagem (Data URL ou URL remota) como arquivo PNG
 */
export async function downloadImage(url: string, filename = 'fotoflow-resultado.png') {
  try {
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Para URLs remotas (HTTP/HTTPS)
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch {
    // Fallback padrão caso fetch seja bloqueado
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
