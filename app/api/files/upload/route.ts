import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { uploadFileToS3, generateFileKey, getMimeType } from '@/lib/s3';
import { validateFile } from '@/lib/file-validation';
import { saveFileMetadata } from '@/lib/services/file-service';
import { FileUploadResponse } from '@/types/user-files';

export async function POST(request: NextRequest): Promise<NextResponse<FileUploadResponse>> {
  try {
    console.log('Upload API called');
    
    // Try both authentication methods for better compatibility
    let userId: string | null = null;
    let authMethod = '';

    // Method 1: Try cookies (for Supabase local)
    try {
      const supabaseCookies = createRouteHandlerClient({ cookies });
      const { data: { session }, error: cookieError } = await supabaseCookies.auth.getSession();
      
      if (session?.user && !cookieError) {
        userId = session.user.id;
        authMethod = 'cookies';
        console.log('Auth via cookies successful:', { userId });
      }
    } catch (cookieErr) {
      console.log('Cookie auth failed:', cookieErr);
    }

    // Method 2: Try authorization header (fallback)
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        
        const supabaseToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );

        const { data: { user }, error: tokenError } = await supabaseToken.auth.getUser();
        
        if (user && !tokenError) {
          userId = user.id;
          authMethod = 'token';
          console.log('Auth via token successful:', { userId });
        }
      }
    }

    if (!userId) {
      console.log('All authentication methods failed');
      return NextResponse.json(
        { success: false, error: 'Não autorizado - faça login novamente' },
        { status: 401 }
      );
    }

    console.log(`Authentication successful via ${authMethod}:`, { userId });

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique file key
    const s3Key = generateFileKey(userId, file.name);
    const mimeType = getMimeType(file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const uploadResult = await uploadFileToS3(buffer, s3Key, mimeType);
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || 'Falha no upload' },
        { status: 500 }
      );
    }

    // Save metadata to database
    const fileMetadata = {
      user_id: userId,
      original_name: file.name,
      file_name: file.name,
      file_size: file.size,
      mime_type: mimeType,
      s3_key: s3Key,
      upload_status: 'completed' as const
    };

    const saveResult = await saveFileMetadata(fileMetadata);
    
    if (saveResult.error) {
      // If database save fails, we should ideally clean up S3, but for now just log
      console.error('Database save failed after S3 upload:', saveResult.error);
      return NextResponse.json(
        { success: false, error: 'Falha ao salvar metadados do arquivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      file: saveResult.file
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}