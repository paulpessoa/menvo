import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getFileById, deleteFileMetadata } from '@/lib/services/file-service';
import { deleteFileFromS3 } from '@/lib/s3';
import { FileDeleteResponse } from '@/types/user-files';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<FileDeleteResponse>> {
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

    // Delete from S3 first
    const s3DeleteResult = await deleteFileFromS3(file.s3_key);
    
    if (!s3DeleteResult.success) {
      console.error('S3 deletion failed:', s3DeleteResult.error);
      // Continue with database deletion even if S3 fails
      // This prevents orphaned database records
    }

    // Delete from database
    const dbDeleteResult = await deleteFileMetadata(fileId, userId);
    
    if (!dbDeleteResult.success) {
      return NextResponse.json(
        { success: false, error: dbDeleteResult.error },
        { status: 500 }
      );
    }

    // If S3 deletion failed but database succeeded, log warning
    if (!s3DeleteResult.success) {
      console.warn(`File ${fileId} deleted from database but S3 deletion failed for key: ${file.s3_key}`);
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}