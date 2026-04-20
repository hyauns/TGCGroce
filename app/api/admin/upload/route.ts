import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  // Security check: Make sure this is an admin
  // Example placeholder for whatever auth mechanism is used
  // const user = await checkAdminSession(request);
  // if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

  try {
    if (!request.body) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 });
    }

    const blob = await put(filename, request.body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload file' }, { status: 500 });
  }
}
