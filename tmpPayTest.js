const fetch = global.fetch;
(async () => {
  try {
    const res = await fetch('https://sdsprotech-backend.pages.dev/paydunya-pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_nom: 'Test Client',
        client_tel: '770000000',
        client_email: 'test@gmail.com',
        client_address: 'Dakar',
        user_id: null,
        articles: 'Test Produit (128GB · Noir · Chargeur · x1)',
        commande_id: 'CMD-TEST-0001',
        items: [
          {
            id: '26',
            name: 'Test Produit',
            price: 100000,
            qty: 1,
            storage: '128GB',
            color: 'Noir',
            charger: true,
            icloud: false,
            boutique_id: 'test-boutique',
          },
        ],
        boutique_id: 'test-boutique',
        livraison: 10000,
        total_fallback: 110000,
      }),
    });
    console.log('status', res.status);
    const data = await res.text();
    console.log('body', data);
  } catch (err) {
    console.error('ERR', err.message || err);
  }
})();
