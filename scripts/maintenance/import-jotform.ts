
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

/**
 * IMPORTAÇÃO JOTFORM -> SUPABASE
 * Script para migração de jovens e currículos.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!; 
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY!;

const ORGANIZATION_ID = '39895894-d30d-4bf2-a287-9cdf0fd2702a';
const FORM_IDS = ['200697163523354', '92985548715676'];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function downloadFile(url: string, dest: string) {
    const response = await axios({
        method: 'GET',
        url: `${url}?apiKey=${JOTFORM_API_KEY}`,
        responseType: 'stream'
    });
    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);
    return new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
    });
}

async function runImport() {
    console.log('🚀 Iniciando processamento do Jotform...');

    for (const formId of FORM_IDS) {
        try {
            const response = await axios.get(`https://api.jotform.com/form/${formId}/submissions?apiKey=${JOTFORM_API_KEY}&limit=1000`);
            const submissions = response.data.content;

            if (!submissions || !Array.isArray(submissions)) continue;

            for (const sub of submissions) {
                const email = sub.answers['3']?.answer;
                const nameData = sub.answers['1']?.answer;
                const fullName = sub.answers['1']?.prettyFormat;
                const resumeUrls = sub.answers['11']?.answer;
                const linkedin = sub.answers['15']?.answer;
                const bio = sub.answers['21']?.answer;
                const createdAt = sub.created_at;

                if (!email) continue;

                // Buscar ID ou Criar
                const { data: userData } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
                let userId = userData?.id;

                if (!userId) {
                    const { data: authUser } = await supabase.auth.admin.createUser({
                        email,
                        email_confirm: true,
                        user_metadata: { full_name: fullName, origin: 'jotform_estagio_recife' }
                    });
                    userId = authUser.user?.id;
                }

                if (!userId) continue;

                // Upload CV
                let finalCvUrl = null;
                if (resumeUrls && resumeUrls.length > 0) {
                    const originalUrl = Array.isArray(resumeUrls) ? resumeUrls[0] : resumeUrls;
                    const fileName = `${userId}_cv.pdf`;
                    const tempPath = path.join(process.cwd(), 'temp_cv.pdf');

                    try {
                        const { data: fileExists } = await supabase.storage.from('cvs').list('estagio-recife', { search: fileName });
                        if (!fileExists || fileExists.length === 0) {
                            await downloadFile(originalUrl, tempPath);
                            const fileBuffer = fs.readFileSync(tempPath);
                            await supabase.storage.from('cvs').upload(`estagio-recife/${fileName}`, fileBuffer, { contentType: 'application/pdf', upsert: true });
                            fs.unlinkSync(tempPath);
                        }
                        const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(`estagio-recife/${fileName}`);
                        finalCvUrl = urlData.publicUrl;
                    } catch (err) {}
                }

                // Upsert Perfil
                await supabase.from('profiles').upsert({
                    id: userId,
                    email,
                    first_name: nameData?.first,
                    last_name: nameData?.last,
                    bio,
                    linkedin_url: linkedin,
                    cv_url: finalCvUrl,
                    organization_id: ORGANIZATION_ID,
                    institution: sub.answers['6']?.answer || null,
                    course: sub.answers['24']?.answer || null,
                    academic_level: sub.answers['7']?.answer || null,
                    origin_platform: 'jotform',
                    external_id: sub.id,
                    original_data: sub,
                    created_at: createdAt,
                    verified: true,
                    verified_at: new Date().toISOString(),
                    verification_status: 'approved',
                    verification_notes: 'Migração automática do Jotform'
                } as any);

                // Role
                const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'mentee').single();
                if (roleData) {
                  await supabase.from('user_roles').upsert({ user_id: userId, role_id: roleData.id } as any);
                }
            }
        } catch (err) {}
    }
    console.log('✨ Sincronização finalizada!');
}

runImport();
