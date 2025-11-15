# WebSocket Stock Updates on New Order

## Overview
WebSocket integration untuk real-time stock updates ketika order baru dibuat. Ketika order berhasil dibuat, sistem akan emit dua event WebSocket untuk meng-update stock produk dan material.

## Features
- ✅ Real-time broadcast product stock saat order baru dibuat
- ✅ Real-time broadcast material stock saat order baru dibuat
- ✅ Include `outlet_id` dalam setiap emission
- ✅ Tanpa pagination metadata (hanya data saja)
- ✅ Emitted atomically ketika order creation succeed

## Event: `new-product-stock`

### Trigger
Event ini di-emit ketika order baru berhasil dibuat via `POST /api/v1/orders`

### Data Structure
```json
{
  "outlet_id": 1,
  "data": [
    {
      "date": "2023-11-03",
      "product_id": 1,
      "product_name": "Corndog Sosis",
      "first_stock": 100,
      "stock_in": 50,
      "sold_stock": 10,
      "remaining_stock": 140
    },
    {
      "date": "2023-11-03",
      "product_id": 2,
      "product_name": "Mie",
      "first_stock": 200,
      "stock_in": 0,
      "sold_stock": 15,
      "remaining_stock": 185
    }
  ]
}
```

### Properties
- `outlet_id`: ID outlet yang membuat order
- `data`: Array dari product stock items untuk outlet tersebut
  - `date`: Tanggal (YYYY-MM-DD)
  - `product_id`: ID produk
  - `product_name`: Nama produk
  - `first_stock`: Stock awal
  - `stock_in`: Stock yang masuk
  - `sold_stock`: Stock yang terjual
  - `remaining_stock`: Stock tersisa

## Event: `new-material-stock`

### Trigger
Event ini di-emit ketika order baru berhasil dibuat via `POST /api/v1/orders`

### Data Structure
```json
{
  "outlet_id": 1,
  "data": [
    {
      "date": "2023-11-03",
      "material_id": 1,
      "material_name": "Tepung",
      "first_stock": 500,
      "stock_in": 200,
      "used_stock": 50,
      "remaining_stock": 650
    },
    {
      "date": "2023-11-03",
      "material_id": 2,
      "material_name": "Minyak",
      "first_stock": 100,
      "stock_in": 0,
      "used_stock": 20,
      "remaining_stock": 80
    }
  ]
}
```

### Properties
- `outlet_id`: ID outlet yang membuat order
- `data`: Array dari material stock items untuk outlet tersebut
  - `date`: Tanggal (YYYY-MM-DD)
  - `material_id`: ID material
  - `material_name`: Nama material
  - `first_stock`: Stock awal
  - `stock_in`: Stock yang masuk
  - `used_stock`: Stock yang digunakan
  - `remaining_stock`: Stock tersisa

## Client Implementation

### JavaScript/TypeScript
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Listen for product stock updates
socket.on('new-product-stock', (data) => {
  console.log('Product stock updated:', data);
  console.log(`Outlet ${data.outlet_id} product stocks:`, data.data);
  // Update UI with new product stock data
});

// Listen for material stock updates
socket.on('new-material-stock', (data) => {
  console.log('Material stock updated:', data);
  console.log(`Outlet ${data.outlet_id} material stocks:`, data.data);
  // Update UI with new material stock data
});
```

### React Example
```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface StockUpdate {
  outlet_id: number;
  data: StockItem[];
}

export function StockMonitor() {
  const [productStocks, setProductStocks] = useState<StockUpdate | null>(null);
  const [materialStocks, setMaterialStocks] = useState<StockUpdate | null>(null);

  useEffect(() => {
    const socket: Socket = io('http://localhost:3000');

    socket.on('new-product-stock', (data: StockUpdate) => {
      setProductStocks(data);
    });

    socket.on('new-material-stock', (data: StockUpdate) => {
      setMaterialStocks(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h2>Product Stocks (Outlet {productStocks?.outlet_id})</h2>
      <ul>
        {productStocks?.data.map(item => (
          <li key={item.product_id}>
            {item.product_name}: {item.remaining_stock}
          </li>
        ))}
      </ul>

      <h2>Material Stocks (Outlet {materialStocks?.outlet_id})</h2>
      <ul>
        {materialStocks?.data.map(item => (
          <li key={item.material_id}>
            {item.material_name}: {item.remaining_stock}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Integration Flow

```
POST /api/v1/orders
      ↓
  Create Order
      ↓
  Order Created Successfully
      ↓
  ├─→ Fetch Product Stocks → emit('new-product-stock', {...})
  ├─→ Fetch Material Stocks → emit('new-material-stock', {...})
  └─→ Return Response
```

## Error Handling

Jika terjadi error saat emit WebSocket:
- Log error di console
- **TIDAK** membuat order creation request gagal
- Order tetap berhasil dibuat
- Clients yang terhubung tidak akan menerima stock update

Contoh error handling:
```
⚠️  WebSocket product stock emit failed: [error details]
⚠️  WebSocket material stock emit failed: [error details]
```

## Performance Notes

- Stock data di-fetch dari database untuk full outlet stock history
- Tanpa pagination - semua stock items untuk outlet di-send
- Recommended untuk UI yang perlu real-time stock visibility
- Jika outlet memiliki banyak historical stock data, pertimbangkan pagination di masa depan

## Browser Compatibility

- ✅ Chrome/Edge (WebSocket)
- ✅ Firefox (WebSocket)
- ✅ Safari (WebSocket)
- ✅ Mobile browsers yang support WebSocket

## Related Events

- `new-order`: Order details ketika order dibuat (diemit bersamaan)
- Stock REST endpoints:
  - `GET /outlets/:id/stocks/products` - Get product stocks
  - `GET /outlets/:id/stocks/materials` - Get material stocks
