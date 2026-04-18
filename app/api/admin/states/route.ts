import { NextRequest, NextResponse } from 'next/server';
import { createState, updateState, deleteState, getAllStates } from '@/lib/data';
import { State } from '@/lib/data';

export async function GET() {
  try {
    const states = await getAllStates();
    return NextResponse.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state = body as State;

    if (!state.slug || !state.name || !state.code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createState(state);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating state:', error);
    return NextResponse.json({ error: 'Failed to create state' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, ...updates } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const result = await updateState(slug, updates);
    if (!result) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating state:', error);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const success = await deleteState(slug);
    if (!success) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting state:', error);
    return NextResponse.json({ error: 'Failed to delete state' }, { status: 500 });
  }
}
