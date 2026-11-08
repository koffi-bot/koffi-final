const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

export const printInvoice = (order) => {
  if (!order) return;

  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    return `<tr>
      <td>${escapeHtml(item.product_name || 'Article')}</td>
      <td>${quantity}</td>
      <td>${money(price)}</td>
      <td>${money(price * quantity)}</td>
    </tr>`;
  }).join('');

  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  const orderNumber = escapeHtml(order.order_number || order.id || '—');
  const customer = escapeHtml(order.user_name || 'Client KOFFI SHOP');
  const email = escapeHtml(order.user_email || '');
  const address = [
    order.shipping_address,
    order.shipping_city,
    order.shipping_postal_code,
    order.shipping_country,
  ].filter(Boolean).map(escapeHtml).join(', ');
  const phone = escapeHtml(order.phone || '—');

  const popup = window.open('', '_blank', 'width=900,height=700');
  if (!popup) {
    window.alert("Autorisez les fenêtres contextuelles pour générer la facture.");
    return;
  }

  popup.document.open();
  popup.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Facture ${orderNumber} - KOFFI SHOP</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; color: #171717; font: 14px Arial, sans-serif; }
  .invoice { max-width: 800px; margin: 0 auto; }
  header { display:flex; justify-content:space-between; gap:24px; border-bottom:3px solid #00b84a; padding-bottom:20px; }
  h1 { margin:0 0 8px; font-size:28px; } h2 { margin:28px 0 12px; font-size:17px; }
  .brand { color:#00a844; font-weight:800; letter-spacing:1px; font-size:22px; }
  .muted { color:#666; line-height:1.6; }
  .meta { text-align:right; }
  .details { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin:24px 0; }
  table { width:100%; border-collapse:collapse; margin-top:18px; }
  th,td { padding:12px 8px; border-bottom:1px solid #ddd; text-align:left; }
  th { background:#f2f7f3; } td:nth-child(n+2), th:nth-child(n+2) { text-align:right; }
  .totals { width:min(320px,100%); margin:20px 0 0 auto; }
  .total { display:flex; justify-content:space-between; padding:10px 0; border-top:1px solid #ddd; font-weight:700; font-size:17px; }
  footer { margin-top:42px; border-top:1px solid #ddd; padding-top:16px; text-align:center; color:#666; }
  .actions { margin:24px auto; text-align:center; }
  button { background:#00b84a; border:0; border-radius:6px; padding:12px 22px; font-weight:700; cursor:pointer; }
  @media(max-width:600px) { body{padding:16px} header{flex-direction:column} .meta{text-align:left} .details{grid-template-columns:1fr} th,td{padding:8px 4px;font-size:12px} }
  @media print { body{padding:0} .actions{display:none} @page{size:A4;margin:16mm} }
</style>
</head>
<body>
<div class="invoice">
  <header>
    <div><div class="brand">KOFFI SHOP</div><p class="muted">Votre boutique n’a plus besoin d’un trottoir.<br>Elle a besoin d’Internet.</p></div>
    <div class="meta"><h1>FACTURE</h1><div>Commande : #${orderNumber}</div><div>Date : ${escapeHtml(date)}</div></div>
  </header>
  <div class="details">
    <section><h2>Facturé à</h2><strong>${customer}</strong><div class="muted">${email}<br>${phone}<br>${address}</div></section>
    <section><h2>Informations de paiement</h2><div class="muted">Méthode : ${escapeHtml(order.payment_method || '—')}<br>Statut : ${escapeHtml(order.payment_status || '—')}</div></section>
  </div>
  <table><thead><tr><th>Article</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr></thead><tbody>${rows || '<tr><td colspan="4">Aucun article</td></tr>'}</tbody></table>
  <div class="totals">
    <div class="total"><span>Sous-total</span><span>${money(order.subtotal)}</span></div>
    <div class="total"><span>Livraison</span><span>${money(order.shipping)}</span></div>
    <div class="total"><span>Total à payer</span><span>${money(order.total)}</span></div>
  </div>
  <footer>Merci d’avoir choisi KOFFI SHOP.</footer>
  <div class="actions"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`);
  popup.document.close();
};
