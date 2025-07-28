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
        console.error('Error in callback:', e);
      }
    };
  } else {
    console.warn('EventSource not is supported.');
  }
}

function renderPayments() {
  const list = document.getElementById('paymentsList');
  list.innerHTML = '';

  console.log(payments, 'payeme')

  payments.forEach(p => {
    const div = document.createElement('div');
    div.className = 'payment-item';

    const statusIcon = {
      IN_PROGRESS: '🔄',
      SUCCESS: '✅',
      FAIL: '❌',
      NONE: '❌'
    }[p.status] || 'ℹ️';

    const now = p.date || new Date().toLocaleString();
    if (!p.date) p.date = now;

    div.innerHTML = `
      <div class="payment-item-header">
        <div class="payment-id">ID: ${p.id}</div>
        <div class="payment-status">Status: ${p.status} ${statusIcon}</div>
      </div>
      <div class="payment-meta">Data da transação: ${now}</div>
    `;

    list.appendChild(div);
  });
}

window.addEventListener('load', () => {
  startCallbackServer();
  fetchPaymentHistory();
});

async function fetchPaymentHistory() {
  try {
    const response = await fetch('http://localhost:3000/paymentHistory', {
      headers: {
        'accept': 'application/json',
        'x-service-provider': 'bbb2adfb-d684-413f-96c4-0d0d247d7eb0'
      }
    });

    const history = await response.json();

    history.forEach(item => {
      payments.push({
        id: item.payment_id,
        status: item.status,
        date: new Date(item.created_at).toLocaleString()
      });
    });

    renderPayments();
  } catch (error) {
    console.error('Error on list payment histories:', error);
  }
}
