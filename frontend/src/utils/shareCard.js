const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("L'image du produit ne peut pas être intégrée à la carte."));
  image.src = src;
});

const roundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
};

const fitText = (ctx, text, maxWidth) => {
  let value = String(text || '');
  while (value.length > 3 && ctx.measureText(value).width > maxWidth) value = value.slice(0, -2) + '…';
  return value;
};

export const createProductStoryCard = async (product, imageUrl) => {
  if (!imageUrl) throw new Error("Aucune photo n'est disponible pour cet article.");
  const image = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Impossible de créer la carte de partage.");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#050505');
  gradient.addColorStop(0.58, '#101510');
  gradient.addColorStop(1, '#020302');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // KOFFI SHOP signature
  ctx.fillStyle = '#00FF66';
  roundedRect(ctx, 72, 76, 12, 92, 6);
  ctx.fill();
  ctx.font = 'bold 58px Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('KOFFI', 112, 130);
  ctx.fillStyle = '#00FF66';
  ctx.fillText('SHOP', 304, 130);
  ctx.font = '26px Arial, sans-serif';
  ctx.fillStyle = '#B8C4B9';
  ctx.fillText('LE STYLE À PORTÉE DE MAIN', 112, 174);

  // Product photo in a large story-friendly frame
  const frame = { x: 72, y: 260, w: 936, h: 1050 };
  ctx.save();
  roundedRect(ctx, frame.x, frame.y, frame.w, frame.h, 34);
  ctx.clip();
  const scale = Math.max(frame.w / image.width, frame.h / image.height);
  const sw = frame.w / scale;
  const sh = frame.h / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, frame.x, frame.y, frame.w, frame.h);
  ctx.restore();

  // Product information
  ctx.font = 'bold 56px Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(fitText(ctx, product.name || 'Article KOFFI SHOP', 920), 76, 1430);
  ctx.fillStyle = '#00FF66';
  ctx.font = 'bold 76px Arial, sans-serif';
  const price = Number(product.price);
  const priceText = Number.isFinite(price) ? '$' + price.toFixed(2) : String(product.price || '');
  ctx.fillText(priceText, 76, 1550);

  ctx.fillStyle = '#D1D5D1';
  ctx.font = '32px Arial, sans-serif';
  ctx.fillText('Disponible chez KOFFI SHOP', 76, 1640);

  ctx.strokeStyle = 'rgba(0,255,102,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(76, 1710);
  ctx.lineTo(1004, 1710);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px Arial, sans-serif';
  ctx.fillText('Votre style. Votre boutique.', 76, 1790);
  ctx.fillStyle = '#00FF66';
  ctx.font = '28px Arial, sans-serif';
  ctx.fillText('KOFFI SHOP', 76, 1840);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("La carte image n'a pas pu être exportée.")), 'image/png');
  });
  return new File([blob], 'koffi-shop-' + (product.id || 'article') + '.png', { type: 'image/png' });
};
