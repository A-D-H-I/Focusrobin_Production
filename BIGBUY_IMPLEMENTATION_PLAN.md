# BigBuy API Discovery Notes

## Sandbox Limitations
- Most sandbox endpoints return 400 "Bad request"
- Only `GET /rest/catalog/taxonomies.json?firstLevel=true` works
- The sandbox API key authenticates successfully (200 for taxonomies)
- Rate limit: 24 requests per hour

## Top-Level Taxonomy IDs (Spanish names - sandbox default)
| ID | Name (ES) | Likely English | Relevant? |
|----|-----------|----------------|-----------|
| 19648 | Alimentación y bebidas | Food & Drinks | ❌ |
| 19649 | Bebé | Baby | ❌ |
| 19650 | Belleza | Beauty | ❌ |
| 19651 | Bricolaje y herramientas | DIY & Tools | ❌ |
| 19652 | Coche y moto | Car & Motorcycle | ❌ |
| 19653 | Electrónica | Electronics | ❌ |
| 19654 | Equipaje | Luggage | ❌ |
| 19656 | Hogar y cocina | Home & Kitchen | ❌ |
| 19657 | Iluminación | Lighting | ❌ |
| 19658 | Industria, empresas y ciencia | Industry & Science | ❌ |
| 19660 | Instrumentos musicales | Musical Instruments | ❌ |
| 19661 | Jardín | Garden | ❌ |
| 19662 | Joyería | Jewelry | ❌ |
| 19663 | Juguetes y juegos | Toys & Games | ❌ |
| 19664 | Oficina y papelería | Office & Stationery | ❌ |
| 19665 | Productos Handmade | Handmade Products | ❌ |
| 19666 | Productos para mascotas | Pet Products | ❌ |
| 19667 | Relojes | Watches | ❌ |
| 19668 | Ropa | Clothing | ⚠️ May contain eyeglasses |
| 19669 | Salud y cuidado personal | Health & Personal Care | ⚠️ May contain eyeglasses |
| 19670 | Software | Software | ❌ |
| 19671 | Zapatos y complementos | Shoes & Accessories | ✅ Most likely contains sunglasses |
| 19672 | Videojuegos | Video Games | ❌ |
| 19756 | Deportes y aire libre | Sports & Outdoors | ⚠️ May contain sports sunglasses |

## Strategy
Since the sandbox is limited, we'll build the sync script to:
1. Use the production API (same endpoints, just different base URL)
2. First run: discover all sub-taxonomies under the likely parents (19668, 19669, 19671, 19756)
3. Filter for sunglasses/eyewear taxonomy IDs
4. Use `parentTaxonomy` filter on products endpoint to pull only eyewear
5. OpenAI GPT-4o-mini to classify any ambiguous products

## Key API Endpoints for Sync
- `GET /rest/catalog/taxonomies.json` - All taxonomy tree
- `GET /rest/catalog/products.json?parentTaxonomy={id}` - Products by category
- `GET /rest/catalog/productsinformation.json` - Product details (names, descriptions)
- `GET /rest/catalog/productsimages.json` - Product images
- `GET /rest/catalog/productprices.json` - Product prices
- `GET /rest/catalog/productsvariations.json` - Product variants (colors, sizes)
- `GET /rest/catalog/productsstockbyhandlingdays.json` - Stock levels
- `GET /rest/catalog/manufacturers.json` - Brand/manufacturer names
