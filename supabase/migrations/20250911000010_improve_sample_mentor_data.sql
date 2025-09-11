-- Improve existing sample mentor data and add new mentors for better testing
-- This will make the mentor listing more realistic and useful for testing

-- Update existing mentors with better data
UPDATE public.profiles 
SET 
    job_title = 'Desenvolvedora Full Stack Senior',
    company = 'TechCorp',
    city = 'São Paulo',
    state = 'SP',
    country = 'Brasil',
    bio = 'Desenvolvedora Full Stack com 8 anos de experiência em React, Node.js e Python. Especialista em arquitetura de sistemas e mentoria técnica. Ajudo desenvolvedores a crescer na carreira e dominar tecnologias modernas.',
    mentorship_topics = ARRAY['Desenvolvimento Frontend', 'React', 'JavaScript', 'Carreira em Tech', 'Arquitetura de Software'],
    languages = ARRAY['pt-BR', 'en'],
    inclusive_tags = ARRAY['Mulheres em Tech', 'Diversidade'],
    experience_years = 8,
    session_price_usd = 0,
    average_rating = 4.8,
    total_reviews = 23,
    total_sessions = 45,
    linkedin_url = 'https://linkedin.com/in/ana-silva-dev',
    github_url = 'https://github.com/anasilva',
    timezone = 'America/Sao_Paulo',
    updated_at = NOW()
WHERE email = 'ana.silva.mentor@menvo.com';

UPDATE public.profiles 
SET 
    job_title = 'Tech Lead & Arquiteto de Software',
    company = 'InnovaTech',
    city = 'Rio de Janeiro',
    state = 'RJ',
    country = 'Brasil',
    bio = 'Tech Lead e Arquiteto de Software com foco em microserviços e DevOps. 10+ anos ajudando desenvolvedores a crescer na carreira e implementar soluções escaláveis.',
    mentorship_topics = ARRAY['Arquitetura de Software', 'Microserviços', 'DevOps', 'Liderança Técnica', 'Java'],
    languages = ARRAY['pt-BR', 'en'],
    inclusive_tags = ARRAY['Liderança Inclusiva'],
    experience_years = 12,
    session_price_usd = 0,
    average_rating = 4.9,
    total_reviews = 31,
    total_sessions = 67,
    linkedin_url = 'https://linkedin.com/in/carlos-santos-tech',
    github_url = 'https://github.com/carlossantos',
    timezone = 'America/Sao_Paulo',
    updated_at = NOW()
WHERE email = 'carlos.santos.mentor@menvo.com';

UPDATE public.profiles 
SET 
    job_title = 'Product Manager Senior',
    company = 'DesignHub',
    city = 'Belo Horizonte',
    state = 'MG',
    country = 'Brasil',
    bio = 'Product Manager e UX Designer com background técnico. Especialista em transformação digital e gestão de produtos tech. Ajudo profissionais a fazer a transição para produto.',
    mentorship_topics = ARRAY['Product Management', 'UX/UI Design', 'Gestão de Produto', 'Carreira em Produto', 'Design Thinking'],
    languages = ARRAY['pt-BR', 'en', 'es'],
    inclusive_tags = ARRAY['Mulheres em Tech', 'Diversidade', 'LGBTQ+'],
    experience_years = 7,
    session_price_usd = 0,
    average_rating = 4.7,
    total_reviews = 18,
    total_sessions = 34,
    linkedin_url = 'https://linkedin.com/in/mariana-costa-pm',
    timezone = 'America/Sao_Paulo',
    updated_at = NOW()
WHERE email = 'mariana.costa.mentor@menvo.com';

UPDATE public.profiles 
SET 
    job_title = 'Engenheiro de Dados Senior',
    company = 'DataScience Corp',
    city = 'Florianópolis',
    state = 'SC',
    country = 'Brasil',
    bio = 'Engenheiro de Dados e Machine Learning Engineer. Focado em Big Data, AI e ajudando profissionais a entrar na área de dados. Especialista em Python, SQL e ferramentas de Big Data.',
    mentorship_topics = ARRAY['Data Science', 'Machine Learning', 'Python', 'Big Data', 'Carreira em Dados'],
    languages = ARRAY['pt-BR', 'en'],
    inclusive_tags = ARRAY['Diversidade'],
    experience_years = 9,
    session_price_usd = 0,
    average_rating = 4.6,
    total_reviews = 15,
    total_sessions = 28,
    linkedin_url = 'https://linkedin.com/in/roberto-oliveira-data',
    github_url = 'https://github.com/robertooliveira',
    timezone = 'America/Sao_Paulo',
    updated_at = NOW()
WHERE email = 'roberto.oliveira.mentor@menvo.com';

-- Add new mentors for more variety
INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    job_title,
    company,
    city,
    state,
    country,
    bio,
    expertise_areas,
    mentorship_topics,
    languages,
    inclusive_tags,
    experience_years,
    session_price_usd,
    average_rating,
    total_reviews,
    total_sessions,
    verified,
    availability_status,
    linkedin_url,
    github_url,
    timezone,
    created_at,
    updated_at
) VALUES 
-- Frontend Specialist
(
    gen_random_uuid(),
    'julia.frontend@menvo.com',
    'Julia',
    'Ferreira',
    'Frontend Developer Senior',
    'StartupTech',
    'Porto Alegre',
    'RS',
    'Brasil',
    'Especialista em Frontend com foco em React, Vue.js e performance web. 6 anos de experiência criando interfaces modernas e acessíveis. Apaixonada por ensinar e compartilhar conhecimento.',
    ARRAY['React', 'Vue.js', 'JavaScript', 'TypeScript', 'CSS', 'HTML'],
    ARRAY['Desenvolvimento Frontend', 'React', 'Vue.js', 'Performance Web', 'Acessibilidade'],
    ARRAY['pt-BR', 'en'],
    ARRAY['Mulheres em Tech', 'Acessibilidade'],
    6,
    0,
    4.5,
    12,
    22,
    true,
    'available',
    'https://linkedin.com/in/julia-ferreira-frontend',
    'https://github.com/juliaferreira',
    'America/Sao_Paulo',
    NOW(),
    NOW()
),
-- Mobile Developer
(
    gen_random_uuid(),
    'pedro.mobile@menvo.com',
    'Pedro',
    'Almeida',
    'Mobile Developer Senior',
    'AppSolutions',
    'Recife',
    'PE',
    'Brasil',
    'Desenvolvedor Mobile especializado em React Native e Flutter. 7 anos criando apps para iOS e Android. Mentor experiente em ajudar desenvolvedores web a migrar para mobile.',
    ARRAY['React Native', 'Flutter', 'iOS', 'Android', 'JavaScript', 'Dart'],
    ARRAY['Desenvolvimento Mobile', 'React Native', 'Flutter', 'Carreira Mobile', 'Publicação de Apps'],
    ARRAY['pt-BR', 'en'],
    ARRAY['Diversidade'],
    7,
    0,
    4.4,
    9,
    18,
    true,
    'available',
    'https://linkedin.com/in/pedro-almeida-mobile',
    'https://github.com/pedroalmeida',
    'America/Recife',
    NOW(),
    NOW()
),
-- DevOps Engineer
(
    gen_random_uuid(),
    'lucas.devops@menvo.com',
    'Lucas',
    'Rodrigues',
    'DevOps Engineer',
    'CloudFirst',
    'Brasília',
    'DF',
    'Brasil',
    'Engenheiro DevOps especializado em AWS, Docker e Kubernetes. 5 anos automatizando deploys e criando infraestrutura como código. Ajudo desenvolvedores a entender DevOps e Cloud.',
    ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
    ARRAY['DevOps', 'Cloud Computing', 'AWS', 'Infraestrutura', 'Automação'],
    ARRAY['pt-BR', 'en'],
    ARRAY[]::text[],
    5,
    0,
    4.3,
    7,
    14,
    true,
    'busy',
    'https://linkedin.com/in/lucas-rodrigues-devops',
    'https://github.com/lucasrodrigues',
    'America/Sao_Paulo',
    NOW(),
    NOW()
),
-- QA Engineer
(
    gen_random_uuid(),
    'camila.qa@menvo.com',
    'Camila',
    'Souza',
    'QA Engineer Senior',
    'QualityTech',
    'Curitiba',
    'PR',
    'Brasil',
    'Engenheira de QA com especialização em automação de testes e qualidade de software. 8 anos garantindo a qualidade de produtos digitais. Mentora em transição de carreira para QA.',
    ARRAY['Selenium', 'Cypress', 'Jest', 'Automação de Testes', 'QA Manual', 'API Testing'],
    ARRAY['Quality Assurance', 'Automação de Testes', 'Carreira em QA', 'Testes de API', 'Metodologias Ágeis'],
    ARRAY['pt-BR', 'en'],
    ARRAY['Mulheres em Tech', 'Diversidade'],
    8,
    0,
    4.6,
    14,
    26,
    true,
    'available',
    'https://linkedin.com/in/camila-souza-qa',
    'https://github.com/camilasouza',
    'America/Sao_Paulo',
    NOW(),
    NOW()
);

-- Assign mentor role to new mentors
INSERT INTO public.user_roles (user_id, role_id)
SELECT 
    p.id,
    r.id
FROM public.profiles p
CROSS JOIN public.roles r
WHERE p.email IN (
    'julia.frontend@menvo.com',
    'pedro.mobile@menvo.com',
    'lucas.devops@menvo.com',
    'camila.qa@menvo.com'
)
AND r.name = 'mentor'
AND p.created_at > NOW() - INTERVAL '5 minutes'; -- Only newly created profiles

-- Add some mentor availability for better testing
INSERT INTO public.mentor_availability (mentor_id, day_of_week, start_time, end_time, timezone)
SELECT 
    p.id,
    generate_series(1, 5) as day_of_week, -- Monday to Friday
    '09:00'::time as start_time,
    '17:00'::time as end_time,
    'America/Sao_Paulo' as timezone
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
WHERE r.name = 'mentor' 
AND p.verified = true
AND NOT EXISTS (
    SELECT 1 FROM public.mentor_availability ma 
    WHERE ma.mentor_id = p.id
);

-- Update one mentor to be unverified for testing admin verification
UPDATE public.profiles 
SET verified = false
WHERE email = 'lucas.devops@menvo.com';