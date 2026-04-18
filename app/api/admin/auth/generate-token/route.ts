import { NextRequest, NextResponse } from 'next/server';
import { getSession, generateTokenLink } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { expiryHours = 168 } = body; // Default 7 days

    // Validate expiry hours
    if (typeof expiryHours !== 'number' || expiryHours < 1 || expiryHours > 8760) {
      return NextResponse.json(
        { error: 'Expiry hours must be between 1 and 8760 (1 year)' },
        { status: 400 }
      );
    }

    // Get base URL from request
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Generate token link
    const tokenLink = generateTokenLink(baseUrl, expiryHours);

    return NextResponse.json({
      success: true,
      tokenLink,
      expiryHours,
      message: 'Token link generated successfully. Share this link to auto-login.',
    });
  } catch (error) {
    console.error('Generate token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
