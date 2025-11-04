import { ImageManipulator, useImageManipulator } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { encode } from 'blurhash';
import jpeg from "jpeg-js";

export async function compressImage(uri: string) {
    const fileSize = await FileSystem.getInfoAsync(uri).then(info => info.size);
    const manipRes = await ImageManipulator.manipulate(uri).renderAsync();
    if(fileSize > 500*1024){
        return(manipRes.saveAsync({compress:0.5}));
    }else if (fileSize > 1000*1024){
        return(manipRes.saveAsync({compress:0.45}));
    }else if(fileSize > 1600*1024) {
        return(manipRes.saveAsync({compress:0.40}));
    }else{
        return(manipRes.saveAsync({compress:0.8}));
    }
}


/**
 * Convertit un base64 (sans préfixe data:) en Uint8Array
 * Utilise atob() si disponible, sinon Buffer (si installé).
 */
function base64ToUint8Array(base64: string): Uint8Array {
  // strip data:*/*;base64, si présent
  const cleaned = base64.replace(/^data:.*;base64,/, "");

  if (typeof atob === "function") {
    const cleaned = base64.replace(/^data:.*;base64,/, "");
    const binary = globalThis.atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  // fallback : Buffer (si "buffer" est disponible)
  // npm install buffer si besoin et import { Buffer } from 'buffer';
  // then: return Uint8Array.from(Buffer.from(cleaned, 'base64'));
  // ici on tente Buffer global (souvent disponible dans Expo managed + polyfill)
  // @ts-ignore
  if (typeof Buffer !== "undefined") {
    // @ts-ignore
    return Uint8Array.from(Buffer.from(cleaned, "base64"));
  }

  throw new Error("No base64 decode available (install 'base-64' or 'buffer' polyfill).");
}

/**
 * Génère un BlurHash à partir d'une URI locale (file://) ou distante.
 * @param uri string - URI de l'image (local ou remote)
 * @param scaledWidth number - largeur de l'image réduite pour le calcul, ex: 32
 * @param componentsX number - composantes X pour blurhash (1-9)
 * @param componentsY number - composantes Y pour blurhash (1-9)
 */
export async function generateBlurHashFromUri(
  uri: string,
  width_orig: number,
  height_orig: number,
  scaledWidth = 32,
  componentsX = 4,
  componentsY = 4,
): Promise<string | null> {
  try {

    const scale = scaledWidth / width_orig;
    const scaledHeight = Math.round(height_orig * scale);
    // Resize and get base64 JPEG using new API
    const manipulator = ImageManipulator.manipulate(uri);
    const resized = manipulator.resize({width: scaledWidth, height: scaledHeight});
    const rendered = await resized.renderAsync();
    const manipResult = await rendered.saveAsync({
    //   format: ImageManipulator.ImageFormat.JPEG,
      base64: true,
      compress: 0.4,
    });

    if (!manipResult.base64) {
      console.warn("No base64 returned from ImageManipulator");
      return null;
    }

    // Decode base64 to bytes
    const imageBuffer = base64ToUint8Array(manipResult.base64);

    // Decode JPEG to raw RGBA
    const decoded = jpeg.decode(imageBuffer, { useTArray: true });
    const { width, height, data } = decoded;

    // Convert RGBA -> RGB
    const rgb = new Uint8ClampedArray(width * height * 3);
    for (let i = 0, j = 0; i < data.length; i += 4) {
      rgb[j++] = data[i];     // R
      rgb[j++] = data[i + 1]; // G
      rgb[j++] = data[i + 2]; // B
    }  

    // Validate dimensions
    if (rgb.length !== width * height * 3) {
      console.error("Pixel length mismatch:", {
        width,
        height,
        expected: width * height * 3,
        got: rgb.length,
      });
      return null;
    }

    // Encode blurhash
    // console.log("Decoded:", { width, height, dataLength: data.length },"rgb",rgb.length);
    const blurhash = encode(data, width, height, componentsX, componentsY);
    return blurhash;
  } catch (err) {
    console.error("generateBlurHashFromUri error:", err);
    return null;
  }
}