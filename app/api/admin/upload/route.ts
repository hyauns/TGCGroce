import { NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/storage/r2';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 5 MB max upload size
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

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
    if (!process.env.R2_ACCOUNT_ID) {
      console.error('[admin/upload] Missing R2_ACCOUNT_ID or other R2 credentials');
      return NextResponse.json({ error: 'File upload storage is not configured' }, { status: 500 });
    }

    if (!request.body) {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const contentLengthStr = request.headers.get("content-length");
    const contentLength = contentLengthStr ? parseInt(contentLengthStr, 10) : 0;

    if (contentLength > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
    }

    // Read stream into buffer
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;

      if (receivedLength > MAX_UPLOAD_SIZE) {
        return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 });
      }
    }

    const fileBuffer = Buffer.concat(chunks);
    const result = await uploadToR2(fileBuffer, filename, contentType);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error uploading to Cloudflare R2:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload file' }, 
      { status: 500 }
    );
  }
}
