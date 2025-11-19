# Finance Report - Dynamic Configuration Guide

## Overview

The financial report system is **fully dynamic** - both the structure and calculations are controlled by configuration files, not hard-coded in the service layer.

## Key Features

### 1. Dynamic Month Ranges

The system automatically adjusts array lengths based on the date range:

| Scenario | Months Array | Amount Arrays | Example |
|----------|--------------|---------------|---------|
| Same month | 1 element | 1 value per section | `months: ["2025-01"]`, `amount: [10000000]` |
| Different months | 2 elements | 2 values per section | `months: ["2025-01", "2025-03"]`, `amount: [10000000, 12000000]` |

**Implementation**: `/src/core/services/FinancialStatementService.ts` → `generateMonthRange()`

```typescript
private generateMonthRange(startDate: Date, endDate: Date): string[] {
  const firstMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
  
  // If same month, return single element
  if (firstMonth === lastMonth) {
    return [firstMonth];
  }
  
  // Return first and last month
  return [firstMonth, lastMonth];
}
```

### 2. Dynamic Calculations from Config

All formulas are defined in `/src/configs/financeMapping.ts` and evaluated at runtime.

**Example Configuration:**

```typescript
{
  section: SectionName.GrossProfitLoss,
  label: 'Laba/Rugi Kotor',
  calculation: 'net_sales - cogs',  // ← Formula defined here
  subsections: []
}
```

**How It Works:**

1. Service reads the formula from config
2. Evaluates it for each month independently
3. Returns array of results matching month count

**Same Month Example:**
- Formula: `net_sales - cogs`
- Input: `net_sales: [10000000]`, `cogs: [4000000]`
- Output: `gross_profit_loss: [6000000]`

**Different Months Example:**
- Formula: `net_sales - cogs`
- Input: `net_sales: [10000000, 12000000]`, `cogs: [4000000, 5000000]`
- Output: `gross_profit_loss: [6000000, 7000000]`

### 3. Supported Formula Operators

- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Parentheses: `(` `)`

**Complex Example:**
```typescript
calculation: '(net_sales - cogs) / net_sales * 100'  // Gross margin percentage
```

## How to Modify Report Structure

### Adding a New Section

**Step 1:** Add enum value in `/src/configs/financeMapping.ts`

```typescript
export enum SectionName {
  // ... existing values
  NewSection = "new_section"
}
```

**Step 2:** Add section to mapping configuration

```typescript
{
  section: SectionName.NewSection,
  label: 'New Section Label',
  accountTypes: ['ACCOUNT_TYPE_CODE'],  // For data sections
  // OR
  calculation: 'section1 + section2',    // For calculated sections
  subsections: []
}
```

**That's it!** The service will automatically:
- Fetch data from specified account types
- Apply formula if provided
- Return arrays matching month count
- Include in API response

### Modifying an Existing Formula

**Before:**
```typescript
{
  section: SectionName.OperatingExpenses,
  calculation: 'selling_expenses + general_admin_expenses'
}
```

**After:**
```typescript
{
  section: SectionName.OperatingExpenses,
  calculation: 'selling_expenses + general_admin_expenses + depreciation'
}
```

**No code changes needed!** Just edit the config and restart the server.

## Implementation Details

### Service Layer Functions

| Function | Purpose | Dynamic Behavior |
|----------|---------|------------------|
| `generateMonthRange()` | Create months array | Returns 1 or 2 elements based on date range |
| `fetchFromTransactions()` | Get account data | Aggregates data for each month in the range |
| `calculateFromFormula()` | Evaluate formulas | Loops through `monthCount` (1 or 2) |
| `evaluateFormula()` | Apply formula for one month | Replaces variables with actual values |
| `safeEval()` | Execute math expression | Sanitizes and evaluates safely |

### Data Flow

```
1. User Request: start_date=2025-01-01, end_date=2025-03-31

2. generateMonthRange() 
   → Returns: ["2025-01", "2025-03"]

3. For each section in financeMapping.ts:
   
   a. If has accountTypes:
      fetchFromTransactions()
      → Returns: [jan_total, mar_total]
   
   b. If has calculation:
      calculateFromFormula()
      → Evaluates for index 0: net_sales[0] - cogs[0]
      → Evaluates for index 1: net_sales[1] - cogs[1]
      → Returns: [result_0, result_1]

4. Build response with amount arrays matching months.length
```

## Testing

Run tests to verify dynamic behavior:

```bash
npm test tests/unit/services/FinancialStatementService.test.ts
```

**Tests verify:**
- ✅ Same month returns 1-element arrays
- ✅ Different months return 2-element arrays (first & last)
- ✅ Calculations work for both scenarios
- ✅ Subsections follow same pattern

## Example API Responses

### Same Month Request

**Request:**
```
GET /api/v1/finance/reports?type=json&start_date=2025-01-01&end_date=2025-01-31&report_category=laba_rugi
```

**Response:**
```json
{
  "data": {
    "period": {
      "months": ["2025-01"]
    },
    "laba_rugi": [
      {
        "label": "Penjualan Bersih",
        "amount": [10000000]
      },
      {
        "label": "Harga Pokok Penjualan",
        "amount": [4000000]
      },
      {
        "label": "Laba/Rugi Kotor",
        "amount": [6000000]
      }
    ]
  }
}
```

**Note:** `section` and `calculation` fields are used internally but not included in response. Empty `subsections` arrays are omitted.

### Different Months Request

**Request:**
```
GET /api/v1/finance/reports?type=json&start_date=2025-01-01&end_date=2025-12-31&report_category=laba_rugi
```

**Response:**
```json
{
  "data": {
    "period": {
      "months": ["2025-01", "2025-12"]
    },
    "laba_rugi": [
      {
        "label": "Penjualan Bersih",
        "amount": [10000000, 15000000]
      },
      {
        "label": "Harga Pokok Penjualan",
        "amount": [4000000, 6000000]
      },
      {
        "label": "Laba/Rugi Kotor",
        "amount": [6000000, 9000000]
      }
    ]
  }
}
```
        "calculation": "net_sales - cogs"
      }
    ]
  }
}
```

## Benefits of This Architecture

1. **No Code Changes**: Modify reports by editing config only
2. **Consistent Logic**: Same calculation engine for all formulas
3. **Type Safe**: TypeScript ensures all sections exist
4. **Testable**: Easy to test with mock data
5. **Maintainable**: Single source of truth for report structure
6. **Flexible**: Support any date range automatically

## Configuration File Reference

**Location:** `/src/configs/financeMapping.ts`

**Structure:**
```typescript
export const financeMapping = {
  gross_to_net: [
    {
      section: SectionName,      // Enum value
      label: string,             // Display label
      account_types?: string[],  // For data sections (e.g., ["INCOME"])
      account_numbers?: string[], // Specific account codes (e.g., ["4101", "4102"])
      calculation?: string,      // For calculated sections
      subsections: Section[]     // Nested sections
    }
  ],
  neraca: [...],
}
```

### Current Configuration

#### Laba Rugi (Profit & Loss) - `gross_to_net`

| Section | Account Types | Account Numbers | Calculation |
|---------|---------------|-----------------|-------------|
| Net Sales | `["INCOME"]` | `["4101", "4102"]` | - |
| COGS | `[]` | `["5101"]` | - |
| Gross Profit/Loss | `[]` | `[]` | `net_sales - cogs` |
| Operating Expenses | `[]` | `[]` | `selling_expenses + general_admin_expenses` |
| ↳ Selling Expenses | `[]` | `[]` | - |
| ↳ General Admin Expenses | `[]` | `[]` | - |
| Operating Profit/Loss | `[]` | `[]` | `gross_profit_loss - operating_expenses` |
| Other Income/Expenses | `[]` | `[]` | `other_income - other_expenses` |
| ↳ Other Income | `["INCOME_NON_OPERATING"]` | `[]` | - |
| ↳ Other Expenses | `["EXPENSE_NON_OPERATING"]` | `[]` | - |
| Net Profit/Loss | `[]` | `[]` | `operating_profit_loss + other_income_expenses` |

#### Neraca (Balance Sheet) - `neraca`

| Section | Account Types | Account Numbers | Calculation |
|---------|---------------|-----------------|-------------|
| Assets | `[]` | `[]` | `current_assets + fixed_assets` |
| ↳ Current Assets | `[]` | `[]` | `kas + bank + piutang + inventory + prepaid_expenses` |
|   ↳ Kas | `[""]` | `["1101"]` | - |
|   ↳ Bank | `[""]` | `["1102"]` | - |
|   ↳ Piutang | `[""]` | `["1104"]` | - |
|   ↳ Inventory | `[""]` | `["1106"]` | - |
|   ↳ Prepaid Expenses | `[""]` | `[]` | - |
| ↳ Fixed Assets | `[]` | `[]` | `asset_inventory - asset_depreciation` |
|   ↳ Inventaris | `[""]` | `["1201", "1202"]` | - |
|   ↳ Akumulasi Penyusutan | `[""]` | `["1203"]` | - |
| Liabilities & Equity | `[]` | `[]` | `liabilities + equity` |
| ↳ Short Term Liabilities | `[]` | `[]` | `hutang` |
|   ↳ Hutang Usaha | `[""]` | `["2101"]` | - |
| ↳ Equity | `[]` | `[]` | `paid_in_capital + retained_earnings` |
|   ↳ Modal Disetor | `[""]` | `["3101"]` | - |
|   ↳ Laba Ditahan | `[""]` | `["3201"]` | - |

**Note:** Empty string `[""]` in `account_types` is automatically filtered out by the service.

## Summary

The financial report system is designed to be **configuration-driven**:

- ✅ **Month arrays**: Automatically 1 or 2 elements based on date range
- ✅ **Calculations**: All formulas come from `financeMapping.ts`
- ✅ **Data aggregation**: Dynamically sums for matching months
- ✅ **No hardcoded logic**: Service layer is generic and reusable

**To modify reports**: Edit `/src/configs/financeMapping.ts` - that's it!
