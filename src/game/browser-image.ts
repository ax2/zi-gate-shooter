/** Complete decoding during loading, rather than defer it to the first combat draw. */
export function browserImage(src: string, create: () => HTMLImageElement = () => new Image()): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = create();
    const clear = () => { image.onload = null; image.onerror = null; };
    image.onload = () => {
      clear();
      Promise.resolve().then(() => typeof image.decode === 'function' ? image.decode() : undefined)
        .then(() => resolve(image), reject);
    };
    image.onerror = () => { clear(); reject(new Error(`Image load failed: ${src}`)); };
    image.src = src;
  });
}
