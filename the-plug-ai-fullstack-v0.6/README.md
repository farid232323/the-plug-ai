# The Plug AI Full Stack v0.6

Independent AI-built storefront + admin/backend for **The Plug**. This project is separate from the Devsy staging site.

## What is included

### Storefront
- Branded PLUG homepage and responsive navigation
- Shop/catalog and product cards
- Product detail view
- Vehicle/VIN compatibility UI foundation
- Cart, checkout, account and order UI prototype

### Admin / Backend
- Dashboard statistics
- Full product editor:
  - title, descriptions, status
  - Brand / Category
  - The Plug ID / Manufacturer Part ID
  - USD + SAR MSRP and selling prices
  - cost, stock, low-stock threshold, lead time
  - image URLs and alt text
  - fitment records
  - SEO title + description
- Excel import for the actual workbook format supplied by The Plug
- Import preview showing:
  - source rows
  - unique products
  - new vs existing products
  - price changes
  - validation issues
  - workbook sheet names
- Vehicle fitment database and manual overrides
- Inventory adjustments
- Brand and category management
- Order status management
- Editable storefront content/settings
- Audit log
- API Ninjas / HyperPay integration placeholders (credentials intentionally not hard-coded)

## Real workbook test
The importer was tested against `The Plug update30-6-2026.xlsx`:
- 5,826 source rows
- 503 grouped products
- 4,617 fitment records in the current database
- sheets detected: P3, valvetronic, AUTOID

## Running the site
Requirements:
- Node.js 22+
- Python 3

From this folder:

```bash
node server.js
```

Open:
- Storefront: http://localhost:4173
- Admin: http://localhost:4173/admin

The database is stored at:
`data/theplug.sqlite`

## Excel source mapping
The importer currently recognizes these columns from the supplied workbook:
- Brand
- Car Brand
- MFG Part ID
- The Plug Part ID
- Product Name
- Product Description
- MAP (MSRP) USD
- The Plug Price USD
- MAP (MSRP) SAR
- The Plug Price SAR
- Model
- Year of manufacture
- Chasis
- Liters
- Cylinders
- Engine
- Image 1 URL through Image 6 URL

Products are primarily grouped by **Brand + MFG Part ID**. Individual Excel rows become product aliases and/or fitment records instead of duplicate storefront products.

## Production notes
This is a functional prototype/backend foundation, not yet production-hardened. Before a live launch it still needs authentication, HTTPS deployment, CSRF protection, permission roles, secure environment-variable secrets, automated backups, production object storage for downloaded supplier images, HyperPay production integration, and live API Ninjas VIN integration.
