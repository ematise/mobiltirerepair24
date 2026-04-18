'use client';

import { FormEvent, useState, ChangeEvent } from 'react';
import { Business } from '@/lib/data';

interface BusinessFormJSONProps {
  onSubmit: (business: Business) => Promise<void>;
  onCancel?: () => void;
}

export default function BusinessFormJSON({ onSubmit, onCancel }: BusinessFormJSONProps) {
  const [jsonText, setJsonText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const exampleJSON = {
    slug: 'example-tire-repair-dallas-tx',
    name: 'Example Tire Repair',
    phone: '+12145551234',
    phoneDisplay: '(214) 555-1234',
    address: 'Dallas, TX',
    city: 'dallas',
    state: 'texas',
    stateCode: 'TX',
    description: 'Professional mobile tire repair and installation services.',
    services: ['mobile-tire-repair', 'flat-tire-repair', 'tire-installation'],
    areasServed: ['Dallas', 'Irving', 'Garland'],
    rating: 4.8,
    reviewCount: 42,
    email: 'contact@example.com',
    website: 'https://example.com',
    serviceRadius: '35 mi',
    responseTime: '25 min',
    photos: [
      'https://images.unsplash.com/photo-1487754180142-891d5c3c3c39?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1537462715957-eb7ad9102b60?w=800&h=600&fit=crop'
    ],
    vehicleTypes: ['Passenger Cars', 'SUVs & Trucks'],
    certifications: ['ASE Certified', 'Licensed & Insured'],
    acceptedPayment: ['Credit Card', 'Cash'],
    hours: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '09:00', close: '20:00' },
      sunday: { open: '10:00', close: '18:00' }
    },
    pricing: [
      {
        service: 'Flat Tire Repair (Plug/Patch)',
        minPrice: 65,
        maxPrice: 85,
        note: 'Standard puncture repair'
      },
      {
        service: 'Spare Tire Swap',
        minPrice: 75,
        maxPrice: 95,
        note: 'Get back on the road fast'
      },
      {
        service: 'New Tire Installation',
        minPrice: 130,
        maxPrice: 250,
        note: 'Includes mounting & balancing'
      }
    ]
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Parse and validate JSON
      const business = JSON.parse(jsonText) as Business;

      const requiredFields = [
        'slug',
        'name',
        'phone',
        'phoneDisplay',
        'address',
        'city',
        'state',
        'stateCode',
        'description',
        'services',
        'areasServed',
        'rating',
        'reviewCount',
      ];

      const missingFields = requiredFields.filter((field) => !(field in business));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Use multipart endpoint if files are present
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('business', JSON.stringify(business));
        selectedFiles.forEach((file) => {
          formData.append('photos', file);
        });

        const response = await fetch('/api/admin/businesses/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create business');
        }

        const result = await response.json();
        setSuccess(`Business created with ${result.photosUploaded} photos uploaded!`);
      } else {
        // Use regular endpoint if no files
        if (!business.id) {
          business.id = Math.random().toString(36).substr(2, 9);
        }

        await onSubmit(business);
        setSuccess('Business created successfully!');
      }

      setJsonText('');
      setSelectedFiles([]);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillExample = () => {
    setJsonText(JSON.stringify(exampleJSON, null, 2));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Required Fields</h4>
        <p className="text-sm text-blue-800 mb-3">
          The following fields are <strong>required</strong>:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
          <li><code className="bg-white px-1 rounded">slug</code> - Unique URL identifier (e.g., "acme-tire-dallas-tx")</li>
          <li><code className="bg-white px-1 rounded">name</code> - Business name</li>
          <li><code className="bg-white px-1 rounded">phone</code> - Raw format (e.g., "+12145551234")</li>
          <li><code className="bg-white px-1 rounded">phoneDisplay</code> - Display format (e.g., "(214) 555-1234")</li>
          <li><code className="bg-white px-1 rounded">address, city, state, stateCode</code> - Location</li>
          <li><code className="bg-white px-1 rounded">description</code> - Business bio</li>
          <li><code className="bg-white px-1 rounded">services</code> - Array of service slugs</li>
          <li><code className="bg-white px-1 rounded">areasServed</code> - Array of area names</li>
          <li><code className="bg-white px-1 rounded">rating</code> - Number 0-5</li>
          <li><code className="bg-white px-1 rounded">reviewCount</code> - Number</li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">🖼️ Adding Photos</h4>
        <p className="text-sm text-gray-700">
          Include a <code className="bg-white px-1 rounded">photos</code> array with image URLs:
        </p>
        <pre className="bg-white p-2 rounded mt-2 text-xs overflow-auto">
{`"photos": [
  "https://example.com/photo1.jpg",
  "https://example.com/photo2.jpg"
]`}
        </pre>
        <p className="text-xs text-gray-600 mt-2">
          ✓ Use publicly accessible HTTPS URLs or S3 URLs
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">⏰ Optional: Hours, Pricing & More</h4>
        <p className="text-sm text-gray-700 mb-2">You can also include:</p>
        <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
          <li><code className="bg-white px-1 rounded">email</code>, <code className="bg-white px-1 rounded">website</code>, <code className="bg-white px-1 rounded">zipCode</code></li>
          <li><code className="bg-white px-1 rounded">serviceRadius</code> (e.g., "35 mi")</li>
          <li><code className="bg-white px-1 rounded">responseTime</code> (e.g., "25 min")</li>
          <li><code className="bg-white px-1 rounded">vehicleTypes</code>, <code className="bg-white px-1 rounded">certifications</code>, <code className="bg-white px-1 rounded">acceptedPayment</code></li>
          <li><code className="bg-white px-1 rounded">hours</code> - Day-by-day operating hours</li>
          <li><code className="bg-white px-1 rounded">pricing</code> - Service pricing array</li>
        </ul>
        <button
          type="button"
          onClick={fillExample}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Full Example JSON →
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          JSON Data
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={`Paste your JSON here or click "View Full Example JSON" to see the format...\n\n{\n  "slug": "my-tire-shop-dallas-tx",\n  "name": "My Tire Shop",\n  ...`}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
        >
          {loading ? 'Creating...' : 'Create Business from JSON'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
