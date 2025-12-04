import sharp from "sharp";

export async function enlargeSplash(
  original: Buffer,
  px: number,
  left: number,
  top: number,
  width: number,
  height: number,
  size: number
): Promise<{ result: Buffer; left: number; top: number; width: number; height: number; size: number }> {
  const splash = sharp(original);
  const metadata = await splash.metadata();

  if (!metadata || !metadata.width || !metadata.height) return {
    result: original,
    left: left,
    top: top,
    width: width,
    height: height,
    size: size
  };

  // constrain extraction to not exceed the original image dimensions
  if (height >= metadata.height) {
    const result = await splash
      .extract({
        left: metadata.width / 2 - metadata.height / 2,
        top: 0,
        width: metadata.height,
        height: metadata.height,
      })
      .toBuffer();
    return {
      result: result,
      left: left,
      top: top,
      width: width,
      height: height,
      size: size,
    };
  }

  left = Math.max(left - px, 0);
  top = Math.max(top - px, 0);
  const temp = width;
  width = left + width + px * 2 > metadata.width ? metadata.width - left : width + px * 2;
  height = top + height + px * 2 > metadata.height ? metadata.height - top : height + px * 2;
  const scaleFactor = width / temp;
  size = Math.floor(size * scaleFactor);

  const result = await splash
    .extract({
      left: left,
      top: top,
      width: width,
      height: height,
    })
    .resize(size, size)
    .toBuffer();

  return {
    result: result,
    left: left,
    top: top,
    width: width,
    height: height,
    size: size,
  };
}
