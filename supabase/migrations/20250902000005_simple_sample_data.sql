-- =================================================================
-- SIMPLE SAMPLE DATA FOR TESTING
-- Create sample mentor profiles for testing (temporarily disable FK constraint)
-- =================================================================

-- Note: These are sample profiles for testing the UI
-- In production, these would be created through the normal signup flow

-- First ensure we have the mentor role
INSERT INTO public.roles (name) 
VALUES ('mentor')
ON CONFLICT (name) DO NOTHING;

-- Temporarily disable foreign key constraint to allow test data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

DO $$
DECLARE
    mentor_role_id INTEGER;
BEGIN
    -- Get mentor role ID
    SELECT id INTO mentor_role_id FROM public.roles WHERE name = 'mentor';

    -- Insert sample profiles with fixed UUIDs for testing
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        bio, 
        job_title, 
        company, 
        city, 
        state, 
        country, 
        languages, 
        mentorship_topics, 
        inclusive_tags, 
        expertise_areas,
        session_price_usd, 
        availability_status, 
        average_rating, 
        total_reviews, 
        total_sessions, 
        experience_years, 
        linkedin_url, 
        website_url, 
        timezone, 
        slug, 
        verified, 
        created_at, 
        updated_at
    ) VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        'ana.carolina@example.com',
        'Ana Carolina',
        'Silva',
        'Pedagoga apaixonada por educação inclusiva e desenvolvimento infantil. Amo viajar e conhecer diferentes culturas educacionais pelo mundo. Acredito que cada criança tem seu próprio ritmo e potencial único.',
        'Pedagoga e Consultora Educacional',
        'Escola Criativa Ltda',
        'São Paulo',
        'SP',
        'Brasil',
        ARRAY['pt-BR', 'en', 'es'],
        ARRAY['Educação Infantil', 'Pedagogia', 'Educação Inclusiva', 'Desenvolvimento Infantil'],
        ARRAY['Mulheres na Educação', 'Educação Inclusiva'],
        ARRAY['Psicopedagogia', 'Metodologias Ativas', 'Educação Montessori'],
        85.00,
        'available',
        4.8,
        23,
        45,
        8,
        'https://linkedin.com/in/ana-carolina-silva',
        'https://educacaoinclusiva.com.br',
        'America/Sao_Paulo',
        'ana-carolina-silva',
        true,
        NOW(),
        NOW()
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'roberto.mendes@example.com',
        'Roberto Mendes',
        'Costa',
        'Engenheiro Civil especializado em construções sustentáveis e ecológicas. Trabalho com materiais alternativos e técnicas de baixo impacto ambiental. Minha missão é construir um futuro mais verde.',
        'Engenheiro Civil - Construções Sustentáveis',
        'EcoBuild Engenharia',
        'Curitiba',
        'PR',
        'Brasil',
        ARRAY['pt-BR', 'en'],
        ARRAY['Engenharia Civil', 'Construção Sustentável', 'Arquitetura Verde', 'Materiais Ecológicos'],
        ARRAY['Sustentabilidade', 'Inovação Verde'],
        ARRAY['Construção com Bambu', 'Energia Solar', 'Captação de Água da Chuva'],
        120.00,
        'available',
        4.9,
        31,
        67,
        12,
        'https://linkedin.com/in/roberto-mendes-costa',
        'https://ecobuild.eng.br',
        'America/Sao_Paulo',
        'roberto-mendes-costa',
        true,
        NOW(),
        NOW()
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'carlos.eduardo@example.com',
        'Carlos Eduardo',
        'Santos',
        'Chaveiro profissional há 15 anos, especialista em segurança residencial e comercial. Nas horas vagas, sou um entusiasta da astronomia e adoro observar as estrelas. Acredito que precisão é fundamental tanto nas chaves quanto no universo.',
        'Chaveiro Especialista em Segurança',
        'Chaves & Segurança Santos',
        'Belo Horizonte',
        'MG',
        'Brasil',
        ARRAY['pt-BR'],
        ARRAY['Chaveiro', 'Segurança Residencial', 'Fechaduras', 'Empreendedorismo'],
        ARRAY['Pequenos Negócios', 'Trabalho Manual'],
        ARRAY['Sistemas de Segurança', 'Fechaduras Eletrônicas', 'Gestão de Pequenos Negócios'],
        65.00,
        'busy',
        4.7,
        18,
        38,
        15,
        'https://linkedin.com/in/carlos-eduardo-santos',
        NULL,
        'America/Sao_Paulo',
        'carlos-eduardo-santos',
        true,
        NOW(),
        NOW()
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'mariana.oliveira@example.com',
        'Mariana Oliveira',
        'Lima',
        'Costureira artesanal especializada em roupas sob medida e sustentáveis. Mãe de pet dedicada - tenho 3 gatos e 2 cachorros que são minha inspiração diária. Acredito na moda consciente e no amor pelos animais.',
        'Costureira Artesanal e Estilista',
        'Ateliê Mariana Lima',
        'Florianópolis',
        'SC',
        'Brasil',
        ARRAY['pt-BR', 'en'],
        ARRAY['Costura', 'Moda Sustentável', 'Artesanato', 'Empreendedorismo Feminino'],
        ARRAY['Mulheres Empreendedoras', 'Moda Sustentável', 'Amor aos Animais'],
        ARRAY['Modelagem', 'Costura Artesanal', 'Upcycling', 'Design de Moda'],
        75.00,
        'available',
        4.6,
        15,
        29,
        6,
        'https://linkedin.com/in/mariana-oliveira-lima',
        'https://ateliemariana.com.br',
        'America/Sao_Paulo',
        'mariana-oliveira-lima',
        true,
        NOW(),
        NOW()
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'patricia.fernandes@example.com',
        'Patricia Fernandes',
        'Rocha',
        'Empresária no ramo de itens personalizados, contadora e administradora. Combino criatividade com números para ajudar negócios a crescerem de forma sustentável. Especialista em gestão financeira para pequenas empresas.',
        'Empresária, Contadora e Administradora',
        'Personaliza & Cia',
        'Porto Alegre',
        'RS',
        'Brasil',
        ARRAY['pt-BR', 'en', 'es'],
        ARRAY['Empreendedorismo', 'Contabilidade', 'Administração', 'Gestão Financeira'],
        ARRAY['Mulheres Empreendedoras', 'Liderança Feminina'],
        ARRAY['Planejamento Financeiro', 'Gestão de Pequenos Negócios', 'Produtos Personalizados'],
        95.00,
        'available',
        4.9,
        42,
        78,
        10,
        'https://linkedin.com/in/patricia-fernandes-rocha',
        'https://personalizaecia.com.br',
        'America/Sao_Paulo',
        'patricia-fernandes-rocha',
        true,
        NOW(),
        NOW()
    ),
    (
        '66666666-6666-6666-6666-666666666666',
        'juliana.carvalho@example.com',
        'Juliana Carvalho',
        'Mendes',
        'Jornalista especializada em comunicação sobre economia circular e sustentabilidade. Trabalho para tornar temas complexos acessíveis ao público geral. Acredito no poder da comunicação para transformar o mundo.',
        'Jornalista - Economia Circular',
        'Verde Comunicação',
        'Rio de Janeiro',
        'RJ',
        'Brasil',
        ARRAY['pt-BR', 'en', 'fr'],
        ARRAY['Jornalismo', 'Comunicação', 'Economia Circular', 'Sustentabilidade'],
        ARRAY['Mulheres no Jornalismo', 'Comunicação Sustentável'],
        ARRAY['Redação', 'Comunicação Digital', 'Marketing Verde', 'Storytelling'],
        110.00,
        'available',
        4.8,
        28,
        52,
        7,
        'https://linkedin.com/in/juliana-carvalho-mendes',
        'https://verdecomunicacao.com.br',
        'America/Sao_Paulo',
        'juliana-carvalho-mendes',
        true,
        NOW(),
        NOW()
    )
;

    -- Assign mentor role to all sample users (only if not exists)
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = '11111111-1111-1111-1111-111111111111') THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES 
            ('11111111-1111-1111-1111-111111111111', mentor_role_id),
            ('22222222-2222-2222-2222-222222222222', mentor_role_id),
            ('33333333-3333-3333-3333-333333333333', mentor_role_id),
            ('44444444-4444-4444-4444-444444444444', mentor_role_id),
            ('55555555-5555-5555-5555-555555555555', mentor_role_id),
            ('66666666-6666-6666-6666-666666666666', mentor_role_id);
    END IF;

    -- Add some availability for the mentors
    INSERT INTO public.mentor_availability (mentor_id, day_of_week, start_time, end_time, timezone, created_at)
    VALUES 
        -- Ana Carolina (Segunda, Quarta, Sexta)
        ('11111111-1111-1111-1111-111111111111', 1, '09:00:00', '12:00:00', 'America/Sao_Paulo', NOW()),
        ('11111111-1111-1111-1111-111111111111', 3, '14:00:00', '17:00:00', 'America/Sao_Paulo', NOW()),
        ('11111111-1111-1111-1111-111111111111', 5, '09:00:00', '11:00:00', 'America/Sao_Paulo', NOW()),
        
        -- Roberto (Terça, Quinta, Sábado)
        ('22222222-2222-2222-2222-222222222222', 2, '08:00:00', '12:00:00', 'America/Sao_Paulo', NOW()),
        ('22222222-2222-2222-2222-222222222222', 4, '13:00:00', '17:00:00', 'America/Sao_Paulo', NOW()),
        ('22222222-2222-2222-2222-222222222222', 6, '09:00:00', '13:00:00', 'America/Sao_Paulo', NOW()),
        
        -- Carlos (Segunda a Sexta)
        ('33333333-3333-3333-3333-333333333333', 1, '08:00:00', '18:00:00', 'America/Sao_Paulo', NOW()),
        ('33333333-3333-3333-3333-333333333333', 2, '08:00:00', '18:00:00', 'America/Sao_Paulo', NOW()),
        ('33333333-3333-3333-3333-333333333333', 3, '08:00:00', '18:00:00', 'America/Sao_Paulo', NOW()),
        ('33333333-3333-3333-3333-333333333333', 4, '08:00:00', '18:00:00', 'America/Sao_Paulo', NOW()),
        ('33333333-3333-3333-3333-333333333333', 5, '08:00:00', '18:00:00', 'America/Sao_Paulo', NOW()),
        
        -- Mariana (Terça, Quinta, Sábado)
        ('44444444-4444-4444-4444-444444444444', 2, '14:00:00', '18:00:00', 'America/Sao_Paulo', NOW()),
        ('44444444-4444-4444-4444-444444444444', 4, '09:00:00', '12:00:00', 'America/Sao_Paulo', NOW()),
        ('44444444-4444-4444-4444-444444444444', 6, '10:00:00', '16:00:00', 'America/Sao_Paulo', NOW()),
        
        -- Patricia (Segunda, Quarta, Sexta)
        ('55555555-5555-5555-5555-555555555555', 1, '09:00:00', '17:00:00', 'America/Sao_Paulo', NOW()),
        ('55555555-5555-5555-5555-555555555555', 3, '09:00:00', '17:00:00', 'America/Sao_Paulo', NOW()),
        ('55555555-5555-5555-5555-555555555555', 5, '09:00:00', '15:00:00', 'America/Sao_Paulo', NOW()),
        
        -- Juliana (Terça, Quinta, Sexta)
        ('66666666-6666-6666-6666-666666666666', 2, '10:00:00', '16:00:00', 'America/Sao_Paulo', NOW()),
        ('66666666-6666-6666-6666-666666666666', 4, '14:00:00', '18:00:00', 'America/Sao_Paulo', NOW()),
        ('66666666-6666-6666-6666-666666666666', 5, '09:00:00', '13:00:00', 'America/Sao_Paulo', NOW())
;

    RAISE NOTICE 'Successfully created 6 sample mentors with availability schedules';
END $$;

-- Re-enable foreign key constraint (but allow existing data)
-- Note: This will allow the test data to remain but enforce FK for new records
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
-- FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

-- For now, we'll leave the constraint disabled for testing purposes
-- In production, you should remove this test data and re-enable the constraint