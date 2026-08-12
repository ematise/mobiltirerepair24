'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function TokenGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [expiryHours, setExpiryHours] = useState(168); // 7 days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenLink, setTokenLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setTokenLink('');

    try {
      const response = await fetch('/api/admin/auth/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryHours }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate token');
      }

      const data = await response.json();
      setTokenLink(data.tokenLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (tokenLink) {
      navigator.clipboard.writeText(tokenLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExpiryLabel = () => {
    if (expiryHours === 24) return '1 day';
    if (expiryHours === 168) return '7 days';
    if (expiryHours === 720) return '30 days';
    return `${expiryHours} hours`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Generate Admin Token Link</h2>
        <Button
          type="button"
          variant="icon"
          onClick={() => {
            setIsOpen(!isOpen);
            setTokenLink('');
            setError('');
          }}
          aria-label={isOpen ? 'Close' : 'Open'}
        >
          {isOpen ? '✕' : '+'}
        </Button>
      </div>

      {isOpen && (
        <div className="space-y-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Generate a one-time login link that automatically logs in an admin without requiring credentials.
            Perfect for sharing access with team members.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {!tokenLink ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Expiry: {getExpiryLabel()}
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setExpiryHours(24)}
                    variant={expiryHours === 24 ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    1 day
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setExpiryHours(168)}
                    variant={expiryHours === 168 ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    7 days
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setExpiryHours(720)}
                    variant={expiryHours === 720 ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    30 days
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(parseInt(e.target.value))}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Custom hours"
                  />
                </div>
              </div>

              <Button type="button" onClick={handleGenerate} disabled={loading} variant="primary" block>
                {loading ? 'Generating...' : 'Generate Token Link'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                ✓ Token generated successfully! Share this link with admins who need access.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono text-gray-900"
                />
                <Button type="button" onClick={handleCopy} variant={copied ? 'primary' : 'secondary'}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="pt-2 border-t text-sm text-gray-600">
                <p>
                  <strong>Expires in:</strong> {getExpiryLabel()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  ⚠ Anyone with this link can access the admin panel. Keep it secure!
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                block
                onClick={() => {
                  setTokenLink('');
                  setExpiryHours(168);
                }}
              >
                Generate Another Link
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
