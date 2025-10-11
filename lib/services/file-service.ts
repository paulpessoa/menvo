import { supabase } from '@/lib/supabase';
import { 
  UserFile, 
  UserFileInsert, 
  UserFileUpdate, 
  FileListResponse,
  FileDeleteResponse 
} from '@/types/user-files';

/**
 * Save file metadata to database
 */
export async function saveFileMetadata(fileData: UserFileInsert): Promise<{ file?: UserFile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .insert(fileData)
      .select()
      .single();

    if (error) {
      console.error('Database save error:', error);
      return { error: error.message };
    }

    return { file: data };
  } catch (error) {
    console.error('Unexpected error saving file metadata:', error);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Get user files with pagination and search
 */
export async function getUserFiles(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<FileListResponse | { error: string }> {
  try {
    const { page = 1, limit = 20, search } = options;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_files')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search && search.trim()) {
      query = query.ilike('original_name', `%${search.trim()}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database query error:', error);
      return { error: error.message };
    }

    return {
      files: data || [],
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    console.error('Unexpected error fetching user files:', error);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Get a single file by ID (with ownership check)
 */
export async function getFileById(fileId: string, userId: string): Promise<{ file?: UserFile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: 'Arquivo não encontrado' };
      }
      console.error('Database query error:', error);
      return { error: error.message };
    }

    return { file: data };
  } catch (error) {
    console.error('Unexpected error fetching file:', error);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Update file metadata
 */
export async function updateFileMetadata(
  fileId: string, 
  userId: string, 
  updates: UserFileUpdate
): Promise<{ file?: UserFile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .update(updates)
      .eq('id', fileId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return { error: error.message };
    }

    return { file: data };
  } catch (error) {
    console.error('Unexpected error updating file:', error);
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Delete file metadata from database
 */
export async function deleteFileMetadata(fileId: string, userId: string): Promise<FileDeleteResponse> {
  try {
    const { error } = await supabase
      .from('user_files')
      .delete()
      .eq('id', fileId)
      .eq('user_id', userId);

    if (error) {
      console.error('Database delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting file:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

/**
 * Get file statistics for a user
 */
export async function getUserFileStats(userId: string): Promise<{
  totalFiles: number;
  totalSize: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select('file_size')
      .eq('user_id', userId);

    if (error) {
      console.error('Database stats error:', error);
      return { totalFiles: 0, totalSize: 0, error: error.message };
    }

    const totalFiles = data.length;
    const totalSize = data.reduce((sum, file) => sum + file.file_size, 0);

    return { totalFiles, totalSize };
  } catch (error) {
    console.error('Unexpected error fetching file stats:', error);
    return { totalFiles: 0, totalSize: 0, error: 'Erro interno do servidor' };
  }
}

/**
 * Check if user has reached file limits (for future use)
 */
export async function checkUserFileLimits(userId: string): Promise<{
  canUpload: boolean;
  reason?: string;
  stats: { totalFiles: number; totalSize: number };
}> {
  const stats = await getUserFileStats(userId);
  
  if (stats.error) {
    return {
      canUpload: false,
      reason: 'Erro ao verificar limites',
      stats: { totalFiles: 0, totalSize: 0 }
    };
  }

  // Future: Add actual limits here
  const MAX_FILES = 1000;
  const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB

  if (stats.totalFiles >= MAX_FILES) {
    return {
      canUpload: false,
      reason: `Limite de ${MAX_FILES} arquivos atingido`,
      stats
    };
  }

  if (stats.totalSize >= MAX_TOTAL_SIZE) {
    return {
      canUpload: false,
      reason: 'Limite de armazenamento atingido (1GB)',
      stats
    };
  }

  return {
    canUpload: true,
    stats
  };
}