# WebSocket Real-time Orders

## Overview
WebSocket integration untuk monitoring order baru secara real-time di sistem POS.

## Features
- ✅ Real-time broadcast ketika order baru dibuat
- ✅ Semua connected clients menerima update
- ✅ Data format sama dengan GET /orders response
- ✅ Category grouping dengan quantity & total per kategori

## Server Setup

### Dependencies
```bash
npm install socket.io @types/socket.io
```

### Architecture
```
src/transports/websocket/index.ts    # WebSocket server initialization
src/transports/api/instance.ts        # Integration dengan HTTP server
src/transports/api/controllers/       # Emit events dari controller
  OrderController.ts
```

### Server Port
WebSocket server berjalan di port yang sama dengan REST API (default: 3000)

## Client Connection

### JavaScript/TypeScript
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('new-order', (order) => {
  console.log('New order received:', order);
  // Handle new order...
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### HTML Test Client
Buka di browser: `http://localhost:3000/websocket-test.html`

File test client ada di: `public/websocket-test.html`

## Event: `new-order`

### Trigger
Event ini di-emit ketika order baru berhasil dibuat via `POST /api/v1/orders`

### Data Structure
```json
{
  "invoice_number": "INV-20231103-0001",
  "date": "2023-11-03",
  "total_amount": 15000,
  "ISI CORNDOG": {
    "quantity": 1,
    "total_amount": 6000,
    "items": ["Corndog Sosis"]
  },
  "BALUTAN": {
    "quantity": 1,
    "total_amount": 2000,
    "items": ["Mie"]
  },
  "SAUS ASIN": {
    "quantity": 2,
    "total_amount": 2000,
    "items": ["Saus Tomat", "Mayonaise"]
  },
  "SAUS MANIS": {
    "quantity": 1,
    "total_amount": 1000,
    "items": ["Coklat"]
  }
}
```

### Properties
- `invoice_number`: Nomor invoice order
- `date`: Tanggal pembuatan (YYYY-MM-DD)
- `total_amount`: Total harga order
- `[CategoryName]`: Object untuk setiap kategori produk yang dipesan
  - `quantity`: Total quantity per kategori
  - `total_amount`: Total harga per kategori
  - `items`: Array nama produk dalam kategori tersebut

## Use Cases

### 1. POS Dashboard Real-time
```javascript
socket.on('new-order', (order) => {
  // Update dashboard statistics
  updateTotalSales(order.total_amount);
  updateOrderCount();
  showNotification(`New order: ${order.invoice_number}`);
});
```

### 2. Kitchen Display System
```javascript
socket.on('new-order', (order) => {
  // Add to kitchen queue
  addToKitchenQueue(order);
  playNotificationSound();
});
```

### 3. Order Tracking
```javascript
socket.on('new-order', (order) => {
  // Show in customer display
  displayOrder(order);
});
```

## Testing

### 1. Start Server
```bash
npm run dev
```

### 2. Open Test Client
Buka browser: `http://localhost:3000/websocket-test.html`

### 3. Create Order via API
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "payment_method": "CASH",
    "items": [
      {"product_id": 1, "qty": 1},
      {"product_id": 5, "qty": 1}
    ]
  }'
```

### 4. Verify
- Test client akan menampilkan order baru secara real-time
- Console server akan log: `📡 WebSocket: Broadcasted new order INV-XXXXXXXX-XXXX`

## Error Handling

WebSocket emit failure tidak akan menggagalkan request pembuatan order:
```typescript
try {
  io.emit('new-order', orderData);
} catch (wsError) {
  console.error('⚠️  WebSocket emit failed:', wsError);
  // Order tetap berhasil dibuat, hanya broadcast yang gagal
}
```

## CORS Configuration

Default CORS settings di `src/transports/websocket/index.ts`:
```typescript
cors: {
  origin: '*', // Ubah sesuai kebutuhan production
  methods: ['GET', 'POST'],
}
```

⚠️ **Production**: Ganti `origin: '*'` dengan domain spesifik untuk keamanan.

## Monitoring

### Server Logs
- `✅ Client connected: [socket-id]` - Client baru terhubung
- `❌ Client disconnected: [socket-id]` - Client terputus
- `📡 WebSocket: Broadcasted new order [invoice]` - Order baru di-broadcast

### Client Connection Status
```javascript
socket.on('connect', () => {
  console.log('Status: Connected');
});

socket.on('disconnect', () => {
  console.log('Status: Disconnected');
});
```

## Future Enhancements

Possible improvements:
- [ ] Room-based broadcasting (per outlet)
- [ ] Order status updates (preparing, ready, completed)
- [ ] Authentication untuk WebSocket connections
- [ ] Reconnection dengan exponential backoff
- [ ] Order update/delete events
- [ ] Rate limiting untuk prevent spam
