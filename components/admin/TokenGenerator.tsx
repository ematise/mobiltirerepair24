'use client';

import { useState } from 'react';

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
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setTokenLink('');
            setError('');
          }}
          className="text-2xl text-gray-400 hover:text-gray-600"
        >
          {isOpen ? '✕' : '+'}
        </button>
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
                  <button
                    onClick={() => setExpiryHours(24)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      expiryHours === 24
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    1 day
                  </button>
                  <button
                    onClick={() => setExpiryHours(168)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      expiryHours === 168
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    7 days
                  </button>
                  <button
                    onClick={() => setExpiryHours(720)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      expiryHours === 720
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    30 days
                  </button>
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

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
              >
                {loading ? 'Generating...' : 'Generate Token Link'}
              </button>
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
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="pt-2 border-t text-sm text-gray-600">
                <p>
                  <strong>Expires in:</strong> {getExpiryLabel()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  ⚠ Anyone with this link can access the admin panel. Keep it secure!
                </p>
              </div>
              <button
                onClick={() => {
                  setTokenLink('');
                  setExpiryHours(168);
                }}
                className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Generate Another Link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
