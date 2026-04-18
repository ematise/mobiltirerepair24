'use client';

import { FormEvent, useState } from 'react';
import { Business } from '@/lib/data';
import ImageUploader from './ImageUploader';

interface BusinessFormFullProps {
  business?: Business;
  onSubmit: (business: Business) => Promise<void>;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Cash', 'Check'];

export default function BusinessFormFull({ business, onSubmit }: BusinessFormFullProps) {
  const [formData, setFormData] = useState<Business>(
    business || {
      id: Math.random().toString(36).substr(2, 9),
      slug: '',
      name: '',
      phone: '',
      phoneDisplay: '',
      address: '',
      city: '',
      state: '',
      stateCode: '',
      services: [],
      areasServed: [],
      description: '',
      rating: 0,
      reviewCount: 0,
      photos: [],
      hours: {
        monday: { open: '08:00', close: '17:00' },
        tuesday: { open: '08:00', close: '17:00' },
        wednesday: { open: '08:00', close: '17:00' },
        thursday: { open: '08:00', close: '17:00' },
        friday: { open: '08:00', close: '17:00' },
        saturday: { open: '09:00', close: '14:00' },
        sunday: { open: '', close: '', closed: true },
      },
      pricing: [],
      certifications: [],
      vehicleTypes: [],
      acceptedPayment: [],
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'pricing' | 'gallery' | 'details'>('basic');
  const [newPricingItem, setNewPricingItem] = useState({ service: '', minPrice: 0, maxPrice: 0, note: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPricingItem = () => {
    if (newPricingItem.service && newPricingItem.minPrice >= 0 && newPricingItem.maxPrice >= newPricingItem.minPrice) {
      setFormData({
        ...formData,
        pricing: [...(formData.pricing || []), newPricingItem],
      });
      setNewPricingItem({ service: '', minPrice: 0, maxPrice: 0, note: '' });
    }
  };

  const handleRemovePricingItem = (index: number) => {
    setFormData({
      ...formData,
      pricing: formData.pricing?.filter((_, i) => i !== index),
    });
  };

  const handleHourChange = (day: string, field: 'open' | 'close', value: string) => {
    const hours = formData.hours || {};
    setFormData({
      ...formData,
      hours: {
        ...hours,
        [day]: {
          ...(hours[day] || {}),
          [field]: value,
          closed: field === 'open' && !value,
        },
      },
    });
  };

  const handleToggleClosed = (day: string) => {
    const hours = formData.hours || {};
    const dayHours = hours[day] || { open: '', close: '', closed: false };
    setFormData({
      ...formData,
      hours: {
        ...hours,
        [day]: {
          ...dayHours,
          closed: !dayHours.closed,
          open: !dayHours.closed ? '' : dayHours.open,
          close: !dayHours.closed ? '' : dayHours.close,
        },
      },
    });
  };

  const handlePaymentToggle = (method: string) => {
    const current = formData.acceptedPayment || [];
    setFormData({
      ...formData,
      acceptedPayment: current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method],
    });
  };

  const handlePhotosUpdate = (photos: string[]) => {
    setFormData({ ...formData, photos });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {['basic', 'hours', 'pricing', 'gallery', 'details'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 capitalize font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB: BASIC INFO */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="dfw-mobile-tire-pros-dallas-tx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!business}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Raw) *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+12145550101"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Display) *</label>
              <input
                type="text"
                value={formData.phoneDisplay}
                onChange={(e) => setFormData({ ...formData, phoneDisplay: e.target.value })}
                placeholder="(214) 555-0101"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City Slug *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="dallas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State Slug *</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="texas"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State Code *</label>
              <input
                type="text"
                value={formData.stateCode}
                onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                placeholder="TX"
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Count</label>
              <input
                type="number"
                min="0"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services (comma separated)</label>
              <input
                type="text"
                value={formData.services.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    services: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
                placeholder="mobile-tire-repair, flat-tire-repair"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Areas Served (comma separated)</label>
              <input
                type="text"
                value={formData.areasServed.join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    areasServed: e.target.value.split(',').map((s) => s.trim()),
                  })
                }
                placeholder="Dallas, Irving, Garland"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Radius</label>
              <input
                type="text"
                value={formData.serviceRadius || ''}
                onChange={(e) => setFormData({ ...formData, serviceRadius: e.target.value })}
                placeholder="35 mi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response Time</label>
              <input
                type="text"
                value={formData.responseTime || ''}
                onChange={(e) => setFormData({ ...formData, responseTime: e.target.value })}
                placeholder="25 min"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: HOURS */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Hours of Operation</h3>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const dayHours = (formData.hours || {})[day] || { open: '', close: '', closed: false };
              return (
                <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 capitalize">{day}</label>
                  </div>
                  <div className="flex-1 flex gap-2">
                    {!dayHours.closed ? (
                      <>
                        <input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        />
                        <span className="flex items-center text-gray-600">to</span>
                        <input
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded"
                        />
                      </>
                    ) : (
                      <div className="flex-1 flex items-center text-gray-500 font-medium">Closed</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleClosed(day)}
                    className={`px-3 py-2 rounded text-sm font-medium transition ${
                      dayHours.closed
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {dayHours.closed ? 'Open' : 'Close'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: PRICING */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>

          {/* Add New Price Item */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Add Pricing Item</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Service name"
                value={newPricingItem.service}
                onChange={(e) => setNewPricingItem({ ...newPricingItem, service: e.target.value })}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                placeholder="Min price"
                value={newPricingItem.minPrice}
                onChange={(e) =>
                  setNewPricingItem({ ...newPricingItem, minPrice: parseFloat(e.target.value) })
                }
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                placeholder="Max price"
                value={newPricingItem.maxPrice}
                onChange={(e) =>
                  setNewPricingItem({ ...newPricingItem, maxPrice: parseFloat(e.target.value) })
                }
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={newPricingItem.note}
                onChange={(e) => setNewPricingItem({ ...newPricingItem, note: e.target.value })}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded"
              />
              <button
                type="button"
                onClick={handleAddPricingItem}
                className="col-span-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Pricing List */}
          {formData.pricing && formData.pricing.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Service</th>
                    <th className="px-4 py-2 text-right">Min</th>
                    <th className="px-4 py-2 text-right">Max</th>
                    <th className="px-4 py-2 text-left">Note</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.pricing.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{item.service}</td>
                      <td className="px-4 py-2 text-right">${item.minPrice}</td>
                      <td className="px-4 py-2 text-right">${item.maxPrice}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{item.note}</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => handleRemovePricingItem(idx)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
          <ImageUploader
            photos={formData.photos || []}
            onPhotosChange={handlePhotosUpdate}
            businessSlug={formData.slug || undefined}
          />
        </div>
      )}

      {/* TAB: DETAILS */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Vehicle Types */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Types</h3>
            <input
              type="text"
              value={formData.vehicleTypes?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vehicleTypes: e.target.value.split(',').map((s) => s.trim()),
                })
              }
              placeholder="Passenger Cars, SUVs & Trucks, Vans & Minivans"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Certifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
            <input
              type="text"
              value={formData.certifications?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  certifications: e.target.value.split(',').map((s) => s.trim()),
                })
              }
              placeholder="ASE Certified, Licensed & Insured, BBB Accredited"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Accepted Payment Methods</h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.acceptedPayment || []).includes(method)}
                    onChange={() => handlePaymentToggle(method)}
                    className="rounded"
                  />
                  <span className="text-gray-700">{method}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
      >
        {loading ? 'Saving...' : business ? 'Update Business' : 'Create Business'}
      </button>
    </form>
  );
}
