# Finance Report JSON API - Response Format

## Endpoint
```
GET /api/v1/finance/reports?type=pdf&start_date=2024-11-10&end_date=2025-11-19&report_category=laba_rugi
```
**Note:** Both `type=json` and `type=pdf` return the same JSON format with monthly amount arrays.

## Query Parameters

| Parameter | Type | Required | Values | Description |
|-----------|------|----------|--------|-------------|
| `type` | string | Yes | `json` or `pdf` | Both return JSON format with monthly arrays |
| `start_date` | string | Yes | `YYYY-MM-DD` | Start date of report period |
| `end_date` | string | Yes | `YYYY-MM-DD` | End date (must be >= start_date) |
| `report_category` | string | Yes | `laba_rugi`, `neraca`, `all` | Which report to generate |

---

## Dynamic Configuration

All report structure and calculations are defined in `/src/configs/financeMapping.ts`. To change formulas or structure, **simply edit the config file** - no code changes needed.

### Example Configuration:

```typescript
{
  section: SectionName.GrossProfitLoss,
  label: 'Laba/Rugi Kotor',
  calculation: 'net_sales - cogs',  // Formula evaluated dynamically
  subsections: []
}
```

Formulas support:
- Basic operators: `+ - * / ( )`
- Variable names: Any section identifier (e.g., `net_sales`, `cogs`)
- Automatic monthly evaluation: Formula applied to each month independently

### How It Works:
1. Service reads structure from `financeMapping.ts`
2. For sections with `calculation`, evaluates formula for each month
3. Replaces variables with actual section values
4. Returns array of results matching month count

**Example**: For formula `net_sales - cogs`:
- Same month: `[10000000 - 4000000] = [6000000]`
- Two months: `[10000000 - 4000000, 12000000 - 5000000] = [6000000, 7000000]`

---

## Response Structure

```json
{
  "success": true,
  "message": "Finance report generated successfully",
  "data": {
    "period": {
      "start_date": "2025-01-01",
      "end_date": "2025-02-28",
      "months": ["2025-01", "2025-02"]  // 1 element if same month, 2 if different
    },
    "laba_rugi": [ /* Profit & Loss sections */ ],
    "neraca": [ /* Balance Sheet sections */ ],
    "cashflow": [ /* Cash Flow sections */ ]
  }
}
```

### Period Object
- `start_date`: Start date of the report period (YYYY-MM-DD)
- `end_date`: End date of the report period (YYYY-MM-DD)  
- `months`: Array of month strings in YYYY-MM format
  - **Same month**: 1 element `["2025-01"]`
  - **Different months**: 2 elements `["2025-01", "2025-12"]` (first and last only)

---

## SectionResult Structure

### SectionResult Object

```typescript
interface SectionResult {
  label: string;             // Display label in Bahasa Indonesia
  amount: number[];          // Monthly values - length matches period.months.length
  subsections?: SectionResult[]; // Nested sections (only included if not empty)
}
```

- `label`: Human-readable label for display
- `amount`: Array of monetary values
  - **Same month**: 1 value `[10000000]`
  - **Different months**: 2 values `[10000000, 12000000]` (first month, last month)
- `subsections`: Nested sections following the same structure
  - **Only included if there are subsections** (empty subsections are omitted)

**Note:** The `section` and `calculation` fields are used internally for processing but are **not included** in the API response.

---

## Example Response: Laba Rugi (2-Month Period)

### Request
```
GET /api/v1/finance/reports?type=pdf&start_date=2025-01-01&end_date=2025-02-28&report_category=laba_rugi
```
**Note:** `type=json` returns the exact same format.

### Response
```json
{
  "status": "success",
  "message": "Financial statements generated successfully",
  "data": {
    "period": {
      "start_date": "2025-01-01",
      "end_date": "2025-02-28",
      "months": ["2025-01", "2025-02"]  // First and last month only
    },
    "laba_rugi": [
      {
        "label": "Penjualan Bersih",
        "amount": [10000000, 12000000]  // Jan: 10M, Feb: 12M
      },
      {
        "label": "Harga Pokok Penjualan",
        "amount": [4000000, 5000000]  // Jan: 4M, Feb: 5M
      },
      {
        "label": "Laba/Rugi Kotor",
        "amount": [6000000, 7000000]  // Calculated: [10M-4M, 12M-5M]
      },
      {
        "label": "Beban Operasional",
        "amount": [3000000, 3700000],  // Calculated sum of subsections
        "subsections": [
          {
            "label": "Beban Penjualan",
            "amount": [1000000, 1200000]
          },
          {
            "label": "Beban Umum & Administrasi",
            "amount": [2000000, 2500000]
          }
        ]
      },
      {
        "label": "Laba/Rugi Operasional",
        "amount": [3000000, 3300000]  // Calculated: [6M-3M, 7M-3.7M]
      },
      {
        "label": "Pendapatan/Beban Lainnya",
        "amount": [200000, 200000],  // Calculated: income - expenses
        "subsections": [
          {
            "label": "Pendapatan Lainnya",
            "amount": [500000, 600000]
          },
          {
            "label": "Beban Lainnya",
            "amount": [300000, 400000]
          }
        ]
      },
      {
        "label": "Laba/Rugi Bersih",
        "amount": [3200000, 3500000]  // Final: operating + other
      }
    ]
  },
  "metadata": {}
}
```

---

## Example Response: Neraca (Balance Sheet)

### Request
```
GET /api/v1/finance/reports?type=pdf&start_date=2025-01-01&end_date=2025-02-28&report_category=neraca
```
**Note:** `type=json` returns the exact same format.

### Response
```json
{
  "status": "success",
  "message": "Financial statements generated successfully",
  "data": {
    "period": {
      "start_date": "2025-01-01",
      "end_date": "2025-02-28",
      "months": ["2025-01", "2025-02"]
    },
    "neraca": [
      {
        "section": "assets",
        "label": "Aset",
        "amount": [150000000, 155000000],
        "calculation": "current_assets + fixed_assets",
        "subsections": [
          {
            "section": "current_assets",
            "label": "Kas",
            "amount": [50000000, 55000000],
            "calculation": "kas + bank + piutang + inventory + prepaid_expenses",
            "subsections": [
              {
                "section": "kas",
                "label": "Kas",
                "amount": [10000000, 12000000],
                "subsections": []
              },
              {
                "section": "bank",
                "label": "Bank",
                "amount": [30000000, 33000000],
                "subsections": []
              },
              {
                "section": "piutang",
                "label": "Piutang",
                "amount": [5000000, 5000000],
                "subsections": []
              },
              {
                "section": "inventory",
                "label": "Persediaan",
                "amount": [5000000, 5000000],
                "subsections": []
              },
              {
                "section": "prepaid_expenses",
                "label": "Biaya Dibayar Dimuka",
                "amount": [0, 0],
                "subsections": []
              }
            ]
          },
          {
            "section": "fixed_assets",
            "label": "Asset Tetap",
            "amount": [100000000, 100000000],
            "calculation": "asset_inventory - asset_depreciation",
            "subsections": [
              {
                "section": "asset_inventory",
                "label": " Inventaris",
                "amount": [120000000, 120000000],
                "subsections": []
              },
              {
                "section": "asset_depreciation",
                "label": " Akumulasi Penyusutan",
                "amount": [20000000, 20000000],
                "subsections": []
              }
            ]
          }
        ]
      },
      {
        "section": "liabilities_equity",
        "label": "Kewajiban dan Ekuitas",
        "amount": [150000000, 155000000],
        "calculation": "liabilities + equity",
        "subsections": [
          {
            "section": "short_term_liabilities",
            "label": "Kewajiban Jangka Pendek",
            "amount": [30000000, 32000000],
            "calculation": "hutang",
            "subsections": [
              {
                "section": "hutang",
                "label": "Hutang Usaha",
                "amount": [30000000, 32000000],
                "subsections": []
              }
            ]
          },
          {
            "section": "equity",
            "label": "Ekuitas",
            "amount": [120000000, 123000000],
            "calculation": "paid_in_capital + retained_earnings",
            "subsections": [
              {
                "section": "paid_in_capital",
                "label": "Modal Disetor",
                "amount": [100000000, 100000000],
                "subsections": []
              },
              {
                "section": "retained_earnings",
                "label": "Laba Ditahan",
                "amount": [20000000, 23000000],
                "subsections": []
              }
            ]
          }
        ]
      }
    ]
  },
  "metadata": {}
}
```

---

## Amount Array Explanation

The `amount` array contains values for each month in the period:

```json
"amount": [10000, 20000]
```

- **Index 0** (`10000`) = First month in period (e.g., "2025-01")
- **Index 1** (`20000`) = Last month in period (e.g., "2025-02")

For a 12-month period (full year):
```json
"amount": [100, 200, 150, 300, 250, 400, 350, 500, 450, 600, 550, 700]
```
- Index 0 = January
- Index 1 = February
- ...
- Index 11 = December

---

## Mapping to Configuration

The response structure follows `financeMapping.ts`:

### Laba Rugi Mapping
```typescript
grossToNetMapping: [
  {
    section: "net_sales",           // → amount: [10000, 12000]
    label: "Penjualan Bersih",
    account_types: ["REVENUE"]
  },
  {
    section: "cogs",                 // → amount: [4000, 5000]
    label: "Harga Pokok Penjualan",
    account_types: ["COGS"]
  },
  {
    section: "gross_profit_loss",    // → amount: [6000, 7000]
    label: "Laba/Rugi Kotor",
    calculation: "net_sales - cogs"   // Calculated: [10000-4000, 12000-5000]
  }
]
```

### Neraca Mapping
```typescript
neracaMapping: [
  {
    section: "assets",
    label: "Aset",
    subsections: [
      {
        section: "current_assets",
        subsections: [
          {
            section: "kas",           // → amount: [1000, 1200]
            account_numbers: ["1101"]
          },
          {
            section: "bank",          // → amount: [3000, 3300]
            account_numbers: ["1102"]
          }
        ],
        calculation: "kas + bank + ..."
      }
    ]
  }
]
```

---

## Features

✅ **Monthly Arrays**: Each amount field is an array of values per month
✅ **First/Last Month**: Index 0 = first month, last index = last month in range
✅ **Hierarchical Structure**: Subsections nested within parent sections
✅ **Calculated Fields**: Sections with formulas auto-calculate from subsections
✅ **Account Filtering**: Data fetched by account_types or account_numbers
✅ **Dynamic Period**: Supports any date range (1 month to multiple years)

---

## Error Responses

### Missing Parameters
```json
{
  "status": "failed",
  "message": "Validation error",
  "errors": [
    { "field": "start_date", "message": "Required", "type": "required" }
  ]
}
```

### Invalid Date Range
```json
{
  "status": "failed",
  "message": "end_date must be greater than or equal to start_date"
}
```

### Invalid Category
```json
{
  "status": "failed",
  "message": "Validation error",
  "errors": [
    { 
      "field": "report_category", 
      "message": "Invalid enum value", 
      "type": "invalid_enum_value" 
    }
  ]
}
```

---

## Testing

### cURL Example
```bash
# Using type=pdf (returns JSON)
curl -X GET "http://localhost:3000/api/v1/finance/reports?type=pdf&start_date=2025-01-01&end_date=2025-02-28&report_category=laba_rugi" \
  -H "Content-Type: application/json"

# Using type=json (returns same JSON)
curl -X GET "http://localhost:3000/api/v1/finance/reports?type=json&start_date=2025-01-01&end_date=2025-02-28&report_category=laba_rugi" \
  -H "Content-Type: application/json"
```

### Postman Example
```
GET http://localhost:3000/api/v1/finance/reports
Query Params:
  - type: pdf (or json - both return same format)
  - start_date: 2025-01-01
  - end_date: 2025-02-28
  - report_category: laba_rugi
```
