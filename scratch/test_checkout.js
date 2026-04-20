const req = await fetch("http://localhost:3000/api/checkout/process", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId: 999,
    transactionId: `test_txn_${Date.now()}`,
    amount: "100.00",
    customerName: "Test Name",
    paymentInfo: {
      cardNumber: "4242424242424242",
      expiryDate: "12/25",
      cvv: "123",
      cardName: "Test Name",
      billingAddress: {
        line1: "123 Test St",
        city: "Test City",
        state: "TS",
        postal_code: "12345",
        country: "US"
      }
    }
  })
});
console.log(await req.json());
