/** Simple global store for passing an image from Image Generator → Image Animator */
let _pendingAnimateImage: string | null = null;

export function setPendingAnimateImage(url: string) {
  _pendingAnimateImage = url;
}

export function consumePendingAnimateImage(): string | null {
  const url = _pendingAnimateImage;
  _pendingAnimateImage = null;
  return url;
}
