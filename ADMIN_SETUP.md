# Admin Panel Setup & Configuration

## 🎯 Overview

The admin panel is located at `/admin` and provides CRUD management for:
- **States** - US states
- **Cities** - Cities within states
- **Businesses** - Tire repair businesses with full details

---

## 📁 File Structure

```
app/
├── admin/                          # Admin panel pages
│   ├── layout.tsx                  # Admin layout with navigation
│   ├── page.tsx                    # Dashboard/overview
│   ├── states/page.tsx             # States management
│   ├── cities/page.tsx             # Cities management
│   └── businesses/page.tsx         # Businesses management
│
└── api/
    └── admin/
        ├── states/route.ts         # States CRUD API
        ├── cities/route.ts         # Cities CRUD API
        ├── businesses/route.ts     # Businesses CRUD API
        └── upload/route.ts         # S3 image upload API

components/admin/
├── StateForm.tsx                   # State form component
├── CityForm.tsx                    # City form component
├── BusinessFormFull.tsx            # Comprehensive business form
├── ImageUploader.tsx               # S3 image upload component
└── business/                       # Individual components

lib/
├── data.ts                         # Database queries & mutations
└── s3.ts                          # S3 utilities & functions
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mobiltirerepair24?retryWrites=true&w=majority

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your-bucket-name
```

### Getting AWS Credentials

1. **Create AWS Account** at aws.amazon.com
2. **Create S3 Bucket**
   - Go to S3 console
   - Create new bucket with a meaningful name
   - Make sure it's in the same region
3. **Create IAM User**
   - Go to IAM → Users
   - Create new user with programmatic access
   - Attach policy: `AmazonS3FullAccess`
   - Copy Access Key ID and Secret Access Key
4. **Enable CORS** (optional, for browser uploads)
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://yourdomain.com"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

---

## 📊 Business Data Structure

### Complete Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | ✅ | Unique identifier |
| `slug` | string | ✅ | URL-friendly ID (auto-generated or custom) |
| `name` | string | ✅ | Business name |
| `phone` | string | ✅ | Raw format: +12145550101 |
| `phoneDisplay` | string | ✅ | Display format: (214) 555-0101 |
| `address` | string | ✅ | Full address |
| `city` | string | ✅ | City slug |
| `state` | string | ✅ | State slug |
| `stateCode` | string | ✅ | State code (TX, FL, CA) |
| `description` | string | ✅ | Business description |
| `services` | string[] | ✅ | Service slugs offered |
| `areasServed` | string[] | ✅ | Named areas served |
| `rating` | number | ✅ | Star rating (0-5) |
| `reviewCount` | number | ✅ | Number of reviews |
| `photos` | string[] | ❌ | S3 image URLs |
| `hours` | object | ❌ | Operating hours by day |
| `pricing` | object[] | ❌ | Service pricing details |
| `certifications` | string[] | ❌ | Business certifications |
| `vehicleTypes` | string[] | ❌ | Vehicle types served |
| `responseTime` | string | ❌ | Avg response time (e.g., "25 min") |
| `serviceRadius` | string | ❌ | Service radius (e.g., "35 mi") |
| `website` | string | ❌ | Website URL |
| `email` | string | ❌ | Email address |
| `zipCode` | string | ❌ | ZIP code |
| `acceptedPayment` | string[] | ❌ | Payment methods accepted |

### Hours Format

```typescript
{
  monday: { open: "08:00", close: "22:00" },
  tuesday: { open: "08:00", close: "22:00" },
  // ...
  sunday: { open: "", close: "", closed: true }
}
```

### Pricing Format

```typescript
[
  {
    service: "Flat Tire Repair",
    minPrice: 65,
    maxPrice: 85,
    note: "Standard puncture repair"
  },
  // ... more items
]
```

### Payment Methods Available

- Credit Card
- Debit Card
- Apple Pay
- Google Pay
- Cash
- Check

---

## 🖼️ Image Upload

### How It Works

1. **Client Upload**
   - User selects images via drag-drop or file picker
   - Images are validated (JPEG, PNG, WebP, GIF, max 5MB)
   
2. **Get Signed URL**
   - `/api/admin/upload` generates AWS signed URL
   - Valid for 15 minutes
   
3. **Direct Upload to S3**
   - Browser uploads directly to S3
   - No file stored on server (more efficient)
   
4. **URL Storage**
   - S3 URL saved in database
   - Can be used immediately in business pages

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Max File Size

- 5MB per image

### S3 File Structure

All uploads go to: `s3://your-bucket/business-photos/[timestamp]-[filename]`

Example: `business-photos/1704067200000-tire-shop.jpg`

---

## 🚀 Usage Guide

### Dashboard (`/admin`)

- Quick overview of all entities
- Display counts: States, Cities, Businesses
- Quick action buttons to create new items

### States (`/admin/states`)

**Fields to manage:**
- Slug (unique identifier)
- Name (e.g., "Texas")
- Code (e.g., "TX")
- Intro (state description)

**Actions:**
- ✅ Create new state
- ✅ View all states
- ✅ Edit state details
- ✅ Delete state

### Cities (`/admin/cities`)

**Fields to manage:**
- Slug (unique identifier)
- Name (e.g., "Dallas")
- State (parent state slug)
- State Code (TX, FL, etc.)
- Latitude & Longitude (for map features)
- Intro (city description)
- Nearby Cities (comma-separated slugs)

**Features:**
- ✅ Filter cities by state
- ✅ View coordinates
- ✅ Manage nearby city relationships

### Businesses (`/admin/businesses`)

**Tabbed Interface:**

1. **Basic Info**
   - Business details (name, phone, address)
   - Location (city, state)
   - Description
   - Rating & review count
   - Services & areas served
   - Service radius & response time

2. **Hours**
   - Day-by-day operating hours
   - Toggle closed days
   - Time picker UI

3. **Pricing**
   - Add/remove service pricing
   - Set min/max price per service
   - Add optional notes

4. **Gallery**
   - Drag-drop image upload
   - S3 upload with progress
   - View uploaded photos
   - Remove photos

5. **Details**
   - Vehicle types served
   - Certifications/trust signals
   - Payment methods (checkboxes)

**Features:**
- ✅ Filter by state and city
- ✅ View all business info at a glance
- ✅ Edit any field
- ✅ Upload up to 5MB images directly to S3
- ✅ Manage complex nested data (hours, pricing)

---

## 🔌 API Endpoints

### States

```bash
# List all states
GET /api/admin/states

# Create state
POST /api/admin/states
Content-Type: application/json
{
  "slug": "texas",
  "name": "Texas",
  "code": "TX",
  "intro": "...",
  "cities": []
}

# Update state
PUT /api/admin/states
Content-Type: application/json
{
  "slug": "texas",
  "name": "Texas Updated",
  ...
}

# Delete state
DELETE /api/admin/states?slug=texas
```

### Cities

```bash
# List all cities
GET /api/admin/cities

# Create city
POST /api/admin/cities

# Update city
PUT /api/admin/cities

# Delete city
DELETE /api/admin/cities?slug=dallas
```

### Businesses

```bash
# List all businesses
GET /api/admin/businesses

# Create business
POST /api/admin/businesses

# Update business
PUT /api/admin/businesses

# Delete business
DELETE /api/admin/businesses?slug=dfw-mobile-tire-pros-dallas-tx
```

### Image Upload

```bash
# Upload image to S3
POST /api/admin/upload
Content-Type: multipart/form-data

# Returns:
{
  "url": "https://bucket.s3.amazonaws.com/business-photos/...",
  "message": "File uploaded successfully"
}
```

---

## 🛡️ Security Considerations

- **No authentication** currently implemented (add Auth0, NextAuth, etc. before production)
- **S3 credentials** stored in environment variables only
- **File validation** on both client and server
- **Signed URLs** expire after 15 minutes
- **S3 bucket** should have appropriate access controls

### Recommended: Add Authentication

```typescript
// Add middleware to check auth before admin routes
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check user session/token
    // Redirect to login if unauthorized
  }
}
```

---

## 🧪 Testing

### Quick Test Workflow

1. Navigate to `/admin`
2. Click "Add State"
3. Fill in form and submit
4. Should appear in states list
5. Click "Add City" for that state
6. Click "Add Business" in that city
7. Upload photos via drag-drop
8. Fill in hours and pricing
9. Submit and verify in database

### Troubleshooting

| Issue | Solution |
|-------|----------|
| S3 upload fails | Check AWS credentials in `.env.local` |
| Images not showing | Verify S3 bucket CORS settings |
| Database errors | Check MongoDB URI connection |
| Form validation errors | Ensure required fields are filled |

---

## 📝 Notes

- Keep `zipCode` in the schema for future use (currently optional)
- All dates are stored as ISO strings in MongoDB
- Slugs should be URL-safe (lowercase, hyphens)
- Photos array is unlimited in size (but keep under 100 for performance)
- Complex fields (hours, pricing) require tab-based form UI

---

## 🚀 Next Steps

1. ✅ Set up MongoDB connection
2. ✅ Configure AWS S3 bucket and credentials
3. ✅ Add `.env.local` with all environment variables
4. ✅ Start dev server: `npm run dev`
5. ✅ Navigate to `/admin` to manage content
6. (Optional) Add authentication layer
7. (Optional) Add audit logging
8. (Optional) Add bulk import/export
