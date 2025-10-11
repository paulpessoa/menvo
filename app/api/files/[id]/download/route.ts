import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getFileById } from '@/lib/services/file-service';
import { getSignedDownloadUrl } from '@/lib/s3';
import { FileDownloadResponse } from '@/types/user-files';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<FileDownloadResponse> | Response> {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const fileId = params.id;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'ID do arquivo não fornecido' },
        { status: 400 }
      );
    }

    // Get file metadata and verify ownership
    const fileResult = await getFileById(fileId, userId);
    
    if (fileResult.error) {
      const status = fileResult.error === 'Arquivo não encontrado' ? 404 : 500;
      return NextResponse.json(
        { success: false, error: fileResult.error },
        { status }
      );
    }

    const file = fileResult.file!;

    // Generate signed download URL
    const urlResult = await getSignedDownloadUrl(file.s3_key, 3600); // 1 hour expiry
    
    if (urlResult.error) {
      return NextResponse.json(
        { success: false, error: urlResult.error },
        { status: 500 }
      );
    }

    // Option 1: Return the signed URL as JSON (for programmatic access)
    const { searchParams } = new URL(request.url);
    const returnJson = searchParams.get('json') === 'true';
    
    if (returnJson) {
      return NextResponse.json({
        success: true,
        url: urlResult.url
      });
    }

    // Option 2: Redirect to the signed URL (for direct download)
    return NextResponse.redirect(urlResult.url!);

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}