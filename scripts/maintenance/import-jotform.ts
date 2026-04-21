
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Configurações
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FORM_IDS = ['200697163523354', '92985548715676'];
const ORG_SLUG = 'estagio-recife';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function downloadFile(url: string, dest: string) {
    const response = await axios({
        method: 'GET',
        url: `${url}?apiKey=${JOTFORM_API_KEY}`,
        responseType: 'stream'
    });
    const writer = fs.createWriteStream(dest);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function runImport() {
    console.log('🚀 Iniciando importação do Jotform...');

    // 1. Garantir que a organização existe
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', ORG_SLUG)
        .single();

    if (orgError || !org) {
        console.error('❌ Organização "Estágio Recife" não encontrada. Execute a migração primeiro.');
        return;
    }

    const organizationId = org.id;

    for (const formId of FORM_IDS) {
        console.log(`\n📄 Processando formulário: ${formId}`);
        
        try {
            const response = await axios.get(`https://api.jotform.com/form/${formId}/submissions?apiKey=${JOTFORM_API_KEY}&limit=1000`);
            const submissions = response.data.content;

            for (const sub of submissions) {
                const email = sub.answers['3']?.answer;
                const nameData = sub.answers['1']?.answer;
                const fullName = sub.answers['1']?.prettyFormat;
                const resumeUrls = sub.answers['11']?.answer; // Array de URLs
                const linkedin = sub.answers['15']?.answer;
                const bio = sub.answers['21']?.answer;
                const createdAt = sub.created_at;

                if (!email) continue;

                console.log(`- Importando: ${email} (${fullName})`);

                // A. Criar Usuário no Auth (Email já confirmado)
                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    email,
                    email_confirm: true,
                    user_metadata: {
                        full_name: fullName,
                        first_name: nameData?.first,
                        last_name: nameData?.last,
                        origin: 'jotform_estagio_recife'
                    }
                });

                if (authError) {
                    if (authError.message.includes('already registered')) {
                        console.log(`  ⚠ Usuário já existe, pulando criação.`);
                    } else {
                        console.error(`  ❌ Erro Auth: ${authError.message}`);
                        continue;
                    }
                }

                const userId = authUser.user?.id || (await getUserIdByEmail(email));
                if (!userId) continue;

                // B. Upload do Currículo se existir
                let finalCvUrl = null;
                if (resumeUrls && resumeUrls.length > 0) {
                    const originalUrl = resumeUrls[0];
                    const fileName = `${userId}_cv.pdf`;
                    const tempPath = path.join(__dirname, 'temp_cv.pdf');

                    try {
                        await downloadFile(originalUrl, tempPath);
                        const fileBuffer = fs.readFileSync(tempPath);
                        
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('cvs')
                            .upload(`estagio-recife/${fileName}`, fileBuffer, {
                                contentType: 'application/pdf',
                                upsert: true
                            });

                        if (!uploadError) {
                            const { data: urlData } = supabase.storage.from('cvs').getPublicUrl(`estagio-recife/${fileName}`);
                            finalCvUrl = urlData.publicUrl;
                        }
                    } catch (err) {
                        console.error(`  ⚠ Falha no CV: ${err.message}`);
                    }
                }

                // C. Criar/Atualizar Perfil
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email,
                        first_name: nameData?.first,
                        last_name: nameData?.last,
                        full_name: fullName,
                        bio,
                        linkedin_url: linkedin,
                        cv_url: finalCvUrl,
                        organization_id: organizationId,
                        
                        // Novos campos acadêmicos para Mentees
                        institution: sub.answers['6']?.answer || null,
                        course: sub.answers['24']?.answer || null,
                        academic_level: sub.answers['7']?.answer || null,
                        
                        origin_platform: 'jotform',
                        external_id: sub.id,
                        original_data: sub,
                        created_at: createdAt, // Preserva data original
                        show_in_community: false, // Por segurança inicia como falso
                        is_public: false
                    } as any);

                if (profileError) console.error(`  ❌ Erro Perfil: ${profileError.message}`);

                // D. Atribuir Role de Mentee
                await supabase.from('user_roles').upsert({
                    user_id: userId,
                    role_id: (await getRoleId('mentee'))
                } as any);
            }
        } catch (err) {
            console.error(`💥 Erro no form ${formId}:`, err.message);
        }
    }
}

async function getUserIdByEmail(email: string) {
    const { data } = await supabase.from('profiles').select('id').eq('email', email).single();
    return data?.id;
}

async function getRoleId(name: string) {
    const { data } = await supabase.from('roles').select('id').eq('name', name).single();
    return data?.id;
}

runImport();
