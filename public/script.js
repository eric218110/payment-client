const payments = [];

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const data = {
    type: "credit_card",
    currency: "BRL",
    cardHolder: formData.get('cardHolder'),
    cardNumber: formData.get('cardNumber'),
    expirationMonth: formData.get('expirationMonth'),
    expirationYear: formData.get('expirationYear'),
    cvv: formData.get('cvv'),
    amount: parseInt(formData.get('amount')),
    installments: parseInt(formData.get('installments')),
  };

  const response = await fetch('http://localhost:3000/payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'x-service-provider': 'bbb2adfb-d684-413f-96c4-0d0d247d7eb0'
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  payments.push({ id: result.payment_id, status: result.status });
  renderPayments();
});

async function startCallbackServer() {
  console.log(window.EventSource)

  if (window.EventSource) {
    const source = new EventSource('http://localhost:8080/malga.io/process_payment_out/listener');
    source.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        const index = payments.findIndex(p => p.id === data.paymentId);
        if (index !== -1) {
          payments[index].status = data.status;
          renderPayments();
        }
      } catch (e) {
        console.error('Erro no callback:', e);
      }
    };
  } else {
    console.warn('EventSource não suportado.');
  }
}

function renderPayments() {
  const list = document.getElementById('paymentsList');
  list.innerHTML = '';

  payments.forEach(p => {
    const div = document.createElement('div');
    div.className = 'payment-item';

    let statusIcon = '';
    switch (p.status) {
      case 'IN_PROGRESS':
        statusIcon = '🔄';
        break;
      case 'SUCCESS':
        statusIcon = '✅';
        break;
      case 'FAIL':
      case 'NONE':
        statusIcon = '❌';
        break;
      default:
        statusIcon = 'ℹ️';
    }

    div.textContent = `Id: ${p.id} | Status: ${p.status} ${statusIcon}`;
    list.appendChild(div);
  });
}

window.addEventListener('load', () => {
  startCallbackServer();
  // Para simular, use fetch local ou mock externo via ngrok/backend.
});
