# Admin API - Automation & Integration Guide

For automated agents and third-party integrations to manage the directory.

---

## 🔐 Authentication

All requests require a valid JWT token. Generate a token link from the Admin Dashboard:

1. Go to `/admin`
2. Click "Generate Admin Token Link"
3. The token in the URL is valid for the specified duration
4. Use this token in your API requests

```bash
TOKEN="your_jwt_token_here"
```

---

## 📍 Base URL

```
http://localhost:3000/api/admin
```

(Or your production domain)

---

## 🏢 Business Operations

### Create a Business

**Endpoint:** `POST /api/admin/businesses`

**Headers:**
```
Content-Type: application/json
Cookie: admin_session=<JWT_TOKEN>
```

**Request Body - Full Example with All Fields:**

```json
{
  "id": "b001",
  "slug": "acme-mobile-tire-dallas-tx",
  "name": "ACME Mobile Tire Repair",
  "phone": "+12145551234",
  "phoneDisplay": "(214) 555-1234",
  "address": "Dallas, TX 75201",
  "city": "dallas",
  "state": "texas",
  "stateCode": "TX",
  "description": "24/7 professional mobile tire repair and installation serving the Dallas metro area.",
  "services": ["mobile-tire-repair", "flat-tire-repair", "tire-installation"],
  "areasServed": ["Dallas", "Irving", "Garland", "Mesquite", "Carrollton"],
  "rating": 4.8,
  "reviewCount": 142,
  "email": "contact@acmetirepro.com",
  "website": "https://acmetirepro.com",
  "zipCode": "75201",
  "serviceRadius": "35 mi",
  "responseTime": "25 min",
  "vehicleTypes": ["Passenger Cars", "SUVs & Trucks", "Vans & Minivans"],
  "certifications": ["ASE Certified", "Licensed & Insured", "BBB Accredited - A+"],
  "acceptedPayment": ["Credit Card", "Debit Card", "Apple Pay", "Cash"],
  "photos": [
    "https://images.unsplash.com/photo-1487754180142-891d5c3c3c39?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1537462715957-eb7ad9102b60?w=800&h=600&fit=crop"
  ],
  "hours": {
    "monday": { "open": "08:00", "close": "22:00" },
    "tuesday": { "open": "08:00", "close": "22:00" },
    "wednesday": { "open": "08:00", "close": "22:00" },
    "thursday": { "open": "08:00", "close": "22:00" },
    "friday": { "open": "08:00", "close": "22:00" },
    "saturday": { "open": "09:00", "close": "20:00" },
    "sunday": { "open": "10:00", "close": "18:00" }
  },
  "pricing": [
    {
      "service": "Flat Tire Repair (Plug/Patch)",
      "minPrice": 65,
      "maxPrice": 85,
      "note": "Standard puncture repair"
    },
    {
      "service": "Spare Tire Swap",
      "minPrice": 75,
      "maxPrice": 95,
      "note": "Get back on the road fast"
    },
    {
      "service": "New Tire Installation",
      "minPrice": 130,
      "maxPrice": 250,
      "note": "Includes mounting & balancing"
    }
  ]
}
```

**Required Fields:**
- `slug` - Unique identifier (lowercase, hyphens, no spaces)
- `name` - Business name
- `phone` - E.164 format (e.g., "+12145551234")
- `phoneDisplay` - Formatted phone (e.g., "(214) 555-1234")
- `address` - Full address
- `city` - City slug (lowercase)
- `state` - State slug (lowercase)
- `stateCode` - State code (e.g., "TX")
- `description` - Business description
- `services` - Array of service slugs
- `areasServed` - Array of area names
- `rating` - Number 0-5
- `reviewCount` - Number of reviews

**Optional Fields:**
- `id` - Generated if not provided
- `email` - Email address
- `website` - Website URL
- `zipCode` - ZIP code
- `serviceRadius` - Service radius (e.g., "35 mi")
- `responseTime` - Response time (e.g., "25 min")
- `vehicleTypes` - Array of vehicle types
- `certifications` - Array of certifications
- `acceptedPayment` - Array of payment methods
- `photos` - Array of image URLs (S3, public HTTPS, etc.)
- `hours` - Operating hours by day
- `pricing` - Array of service pricing

**Response:**
```json
{
  "id": "b001",
  "slug": "acme-mobile-tire-dallas-tx",
  "name": "ACME Mobile Tire Repair",
  ...
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/admin/businesses \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_JWT_TOKEN" \
  -d '{
    "slug": "acme-mobile-tire-dallas-tx",
    "name": "ACME Mobile Tire",
    "phone": "+12145551234",
    "phoneDisplay": "(214) 555-1234",
    "address": "Dallas, TX",
    "city": "dallas",
    "state": "texas",
    "stateCode": "TX",
    "description": "Mobile tire repair",
    "services": ["mobile-tire-repair"],
    "areasServed": ["Dallas"],
    "rating": 4.8,
    "reviewCount": 50
  }'
```

---

### Update a Business

**Endpoint:** `PUT /api/admin/businesses`

**Request Body:**
```json
{
  "slug": "acme-mobile-tire-dallas-tx",
  "name": "ACME Mobile Tire Repair (Updated)",
  "rating": 4.9,
  ...
}
```

Include `slug` and any fields you want to update. Only changed fields need to be included.

---

### Delete a Business

**Endpoint:** `DELETE /api/admin/businesses?slug=acme-mobile-tire-dallas-tx`

---

## 🖼️ Image Management

### Uploading Images via S3

Images should be hosted on S3 or a public HTTPS URL. Include the URLs in the `photos` array:

```json
{
  "slug": "my-business",
  "name": "My Business",
  ...,
  "photos": [
    "https://s3.amazonaws.com/my-bucket/photo1.jpg",
    "https://s3.amazonaws.com/my-bucket/photo2.jpg"
  ]
}
```

**To upload files through the admin panel:**

**Endpoint:** `POST /api/admin/upload`

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/upload \
  -H "Cookie: admin_session=YOUR_JWT_TOKEN" \
  -F "file=@path/to/image.jpg"
```

**Response:**
```json
{
  "url": "https://bucket.s3.amazonaws.com/business-photos/1704067200000-image.jpg",
  "message": "File uploaded successfully"
}
```

Use the returned URL in your business JSON.

---

## 🏛️ States & Cities

### Create a State

**Endpoint:** `POST /api/admin/states`

```json
{
  "slug": "texas",
  "name": "Texas",
  "code": "TX",
  "intro": "Texas is the second largest state...",
  "cities": []
}
```

### Create a City

**Endpoint:** `POST /api/admin/cities`

```json
{
  "slug": "dallas",
  "name": "Dallas",
  "state": "texas",
  "stateCode": "TX",
  "lat": 32.7767,
  "lng": -96.7970,
  "intro": "Dallas is the largest city in Texas...",
  "nearbyCities": ["fort-worth", "irving", "garland"]
}
```

---

## 🤖 Python Example - Automated Business Creation

```python
import requests
import json

# Configuration
TOKEN = "your_jwt_token_here"
BASE_URL = "http://localhost:3000/api/admin"
COOKIES = {"admin_session": TOKEN}

# Business data
business_data = {
    "slug": "python-tire-shop-dallas-tx",
    "name": "Python Tire Shop",
    "phone": "+12145559999",
    "phoneDisplay": "(214) 555-9999",
    "address": "Dallas, TX",
    "city": "dallas",
    "state": "texas",
    "stateCode": "TX",
    "description": "Automated business entry via Python",
    "services": ["mobile-tire-repair", "tire-installation"],
    "areasServed": ["Dallas", "Irving"],
    "rating": 4.5,
    "reviewCount": 30,
    "email": "info@pythontires.com",
    "website": "https://pythontires.com",
    "photos": [
        "https://images.unsplash.com/photo-1487754180142-891d5c3c3c39?w=800&h=600&fit=crop"
    ]
}

# Create business
response = requests.post(
    f"{BASE_URL}/businesses",
    json=business_data,
    cookies=COOKIES
)

if response.status_code == 201:
    result = response.json()
    print(f"✓ Business created: {result['name']}")
    print(f"  Slug: {result['slug']}")
else:
    print(f"✗ Error: {response.json()}")
```

---

## 🔗 JavaScript/Node.js Example

```javascript
const TOKEN = "your_jwt_token_here";
const BASE_URL = "http://localhost:3000/api/admin";

const businessData = {
  slug: "js-tire-shop-dallas-tx",
  name: "JavaScript Tire Shop",
  phone: "+12145558888",
  phoneDisplay: "(214) 555-8888",
  address: "Dallas, TX",
  city: "dallas",
  state: "texas",
  stateCode: "TX",
  description: "Automated business via Node.js",
  services: ["mobile-tire-repair"],
  areasServed: ["Dallas"],
  rating: 4.6,
  reviewCount: 25
};

async function createBusiness() {
  const response = await fetch(`${BASE_URL}/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include", // Include cookies
    body: JSON.stringify(businessData)
  });

  if (response.ok) {
    const result = await response.json();
    console.log("✓ Business created:", result.name);
  } else {
    const error = await response.json();
    console.error("✗ Error:", error.error);
  }
}

createBusiness();
```

---

## 📋 Slug Format Requirements

Slugs must be:
- Lowercase letters and numbers
- Hyphens allowed (no spaces)
- Unique across the system
- Readable and descriptive

**Good slugs:**
- `acme-mobile-tire-dallas-tx`
- `tire-pro-houston-tx`
- `rapid-repair-austin-tx`

**Bad slugs:**
- `Acme Tire Shop` (spaces and capitals)
- `AcmeTires` (no hyphens)
- `tire-shop-tx-dallas-123` (too long, poorly ordered)

---

## 🚀 Batch Operations Example

Create multiple businesses in one script:

```python
import requests

TOKEN = "your_jwt_token_here"
BASE_URL = "http://localhost:3000/api/admin"
COOKIES = {"admin_session": TOKEN}

businesses = [
    {
        "slug": "batch-tire-1-dallas-tx",
        "name": "Batch Business 1",
        ...
    },
    {
        "slug": "batch-tire-2-houston-tx",
        "name": "Batch Business 2",
        ...
    }
]

for business in businesses:
    response = requests.post(
        f"{BASE_URL}/businesses",
        json=business,
        cookies=COOKIES
    )
    status = "✓" if response.ok else "✗"
    print(f"{status} {business['name']}")
```

---

## 🔒 Token Management

### Generate a Long-Lived Token for Automation

From the admin dashboard:
1. Click "Generate Admin Token Link"
2. Set expiry to 30 days
3. Copy the token from the URL
4. Store securely (environment variables, secrets manager)
5. Use in your automation scripts

---

## ❌ Error Responses

```json
{
  "error": "Missing required fields: slug, name"
}
```

Common errors:
- `400` - Missing or invalid required fields
- `401` - Unauthorized (invalid or expired token)
- `404` - Resource not found
- `500` - Server error

---

## 💡 Tips for Automation

1. **Always validate data** before sending - check required fields
2. **Use descriptive slugs** that include location and business type
3. **Batch operations efficiently** - one request per business
4. **Store tokens securely** - use environment variables, not hardcoded
5. **Handle retries** - network failures happen, implement exponential backoff
6. **Log responses** - track what was created/updated for auditing
7. **Test in development first** - use localhost before production

---

## 📞 Service Slugs

Common service slugs for the `services` array:
- `mobile-tire-repair`
- `flat-tire-repair`
- `tire-installation`
- `tire-replacement`
- `tire-balancing`
- `wheel-alignment`

---

## 🗺️ State/City Slugs

States should be lowercase full names:
- `texas`
- `florida`
- `california`

Cities should be lowercase:
- `dallas`
- `houston`
- `austin`
- `san-francisco`

