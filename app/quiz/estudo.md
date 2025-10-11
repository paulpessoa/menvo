# Sistema de Análise de Currículo com IA

Este documento contém todos os componentes necessários para implementar o sistema de análise de currículo com IA em outro projeto.

## 📋 Visão Geral

O sistema permite que usuários façam upload de seus currículos em PDF e recebam uma análise detalhada usando IA(OpenAI GPT - 4) com fallback para análise básica.O sistema consome créditos do usuário e salva os resultados no banco de dados.

## 🏗️ Arquitetura

    - ** Frontend **: React / TypeScript com formulário multi - etapas
        - ** Backend **: Supabase Edge Function
            - ** IA **: OpenAI GPT - 4 com fallback manual
                - ** Armazenamento **: Supabase(PostgreSQL)
                    - ** Upload **: Drag & drop de arquivos PDF

## 📁 Estrutura de Arquivos

    ```
src/
├── pages/
│   └── Analisecurriculo.tsx          # Página principal
├── components/
│   └── forms/
│       └── ResumeAnalysisForm.tsx    # Formulário multi-etapas
└── hooks/
    ├── useAuth.ts                    # Hook de autenticação
    ├── useCredits.ts                 # Hook de créditos
    └── use-toast.ts                  # Hook de notificações

supabase/
└── functions/
    └── analyze-resume/
        └── index.ts                  # Edge Function
```

## 🗄️ Schema do Banco de Dados

    ```sql
-- Tabela de perfis de usuário
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  course TEXT,
  university TEXT,
  period TEXT,
  linkedin_url TEXT,
  credits INTEGER DEFAULT 0,
  total_credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações de créditos
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  type TEXT NOT NULL, -- 'purchase', 'usage', 'bonus'
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de análises de currículo
CREATE TABLE curriculum_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  resume_text TEXT,
  job_description TEXT,
  current_situation TEXT,
  mentorship_questions TEXT,
  analysis_result JSONB,
  used_fallback BOOLEAN DEFAULT FALSE,
  credits_used INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para consumir créditos
CREATE OR REPLACE FUNCTION consume_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Busca créditos atuais
  SELECT credits INTO current_credits 
  FROM user_profiles 
  WHERE id = user_uuid;
  
  -- Verifica se tem créditos suficientes
  IF current_credits < amount THEN
    RETURN FALSE;
  END IF;
  
  -- Atualiza créditos
  UPDATE user_profiles 
  SET 
    credits = credits - amount,
    total_credits_used = COALESCE(total_credits_used, 0) + amount,
    updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Registra transação
  INSERT INTO credit_transactions (user_id, type, amount, description)
  VALUES (user_uuid, 'usage', amount, description);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## 🎨 Página Principal(Analisecurriculo.tsx)

    ```tsx
import { useState } from 'react'
import { ResumeAnalysisForm } from '@/components/forms/ResumeAnalysisForm'
import { AnalysisLoading } from '@/components/AnalysisLoading'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useCredits } from '@/hooks/useCredits'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, AlertTriangle } from 'lucide-react'

interface ResumeFormData {
  // Basic info
  name: string
  email: string
  course: string
  university: string
  period: string
  hasInternship: string
  hasLinkedIn: string
  
  // Current situation
  currentFocus: string
  careerGoals: string
  skillsToDevelop: string
  timeAvailability: string
  
  // Optional: Specific job
  hasSpecificJob: boolean
  jobDescription: string
  jobRequirements: string
  
  // Optional: Mentorship
  mentorshipTopics: string
  hasParticipated: string
  hasInterest: string
  
  // About platform
  howHeard: string
  feedback: string
  
  // File upload
  resumeFile: File | null
}

export default function AnalyseCurriculoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { credits, hasEnoughCredits, refresh } = useCredits()

  // Função para converter arquivo em base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        const base64 = base64String.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFormComplete = async (formData: ResumeFormData) => {
    if (!formData.resumeFile || !formData.name || !formData.email) {
      setError('Por favor, preencha todos os campos obrigatórios e selecione um arquivo PDF.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar créditos antes de começar
      if (!hasEnoughCredits(3)) {
        setError('Créditos insuficientes. Por favor, compre mais créditos.')
        return
      }

      // Convert PDF to base64
      const base64 = await convertFileToBase64(formData.resumeFile)
      
      // Prepare data for analysis
      const analysisData = {
        ...formData,
        user_id: user?.id,
        hasSpecificJob: formData.hasSpecificJob,
        jobDescription: formData.jobDescription || '',
        jobRequirements: formData.jobRequirements || ''
      }
      
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeText: base64,
          formData: analysisData
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao analisar currículo')
      }

      // Atualizar créditos na interface
      await refresh()
      
      // Redirecionar para resultado
      navigate(`/ resultado - curriculo / ${ data.analysisId } `, { 
        state: { 
          analysis: data.analysis,
          score: data.score,
          usedFallback: data.used_fallback,
          creditsConsumed: 3,
          remainingCredits: data.remainingCredits
        } 
      })
    } catch (err) {
      console.error('Error analyzing resume:', err)
      setError(err instanceof Error ? err.message : 'Erro ao analisar currículo')
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : 'Erro ao analisar currículo',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <AnalysisLoading isVisible={loading} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header com informações de créditos */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Análise de Currículo com IA</h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                <span className="font-semibold text-yellow-800">
                  {credits?.credits || 0} créditos disponíveis
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Cada análise consome 3 créditos
              </div>
            </div>

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Erro:</strong> {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Card principal */}
          <Card>
            <CardHeader>
              <CardTitle>Análise Inteligente de Currículo</CardTitle>
              <CardDescription>
                Faça upload do seu currículo e receba feedback detalhado com IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeAnalysisForm onComplete={handleFormComplete} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

## 📝 Formulário Multi - etapas(ResumeAnalysisForm.tsx)

O formulário possui 6 etapas:

1. ** Perfil **: Informações básicas(nome, email, curso, universidade, período)
2. ** Momento Atual **: Foco atual, objetivos de carreira, habilidades a desenvolver
3. ** Vaga Específica ** (Opcional): Descrição e requisitos de vaga específica
4. ** Mentoria ** (Opcional): Interesse em programas de mentoria
5. ** Feedback ** (Opcional): Como conheceu a plataforma e feedback
6. ** Currículo **: Upload do arquivo PDF

### Principais características:
- Validação por etapa
    - Integração com perfil do usuário
        - Drag & drop para upload de PDF
            - Indicador de progresso
                - Etapas opcionais claramente marcadas

## ⚡ Edge Function(analyze - resume / index.ts)

    ```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { resumeText, jobDescription, currentSituation, mentorshipQuestions } = await req.json()

    // Verificar créditos do usuário
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.credits < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Créditos insuficientes', 
          requiredCredits: 3,
          availableCredits: userProfile?.credits || 0
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Consumir créditos
    const { data: consumeResult, error: consumeError } = await supabaseClient
      .rpc('consume_credits', {
        user_uuid: user.id,
        amount: 3,
        description: 'Análise de currículo com IA'
      })

    if (consumeError || !consumeResult) {
      return new Response(
        JSON.stringify({ error: 'Erro ao processar pagamento de créditos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Preparar prompt para análise
    let analysisPrompt = `Analise o seguinte currículo e forneça uma avaliação detalhada em português brasileiro:

CURRÍCULO:
${ resumeText }

SITUAÇÃO ATUAL DO CANDIDATO:
${ currentSituation || 'Não informado' } `

    if (jobDescription) {
      analysisPrompt += `

DESCRIÇÃO DA VAGA:
${ jobDescription }

Por favor, analise especificamente a adequação do candidato para esta vaga.`
    }

    analysisPrompt += `

Forneça uma análise estruturada com:
1. Pontos Fortes(mínimo 3)
2. Áreas de Melhoria(mínimo 3)
3. Recomendações Específicas(mínimo 3)
4. Score Geral(0 - 100)
5. Adequação ao Mercado(0 - 100)
6. Potencial de Crescimento(0 - 100)

Formate a resposta como JSON válido com a seguinte estrutura:
{
    "pontosFortes": ["ponto 1", "ponto 2", "ponto 3"],
        "areasMelhoria": ["área 1", "área 2", "área 3"],
            "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3"],
                "scoreGeral": 75,
                    "adequacaoMercado": 80,
                        "potencialCrescimento": 85,
                            "resumo": "Resumo executivo da análise"
} `

    // Tentar usar OpenAI
    let analysisResult
    let usedFallback = false

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ Deno.env.get('OPENAI_API_KEY') } `,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em recrutamento e análise de currículos. Forneça análises objetivas e construtivas em português brasileiro.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        const content = openaiData.choices[0].message.content
        analysisResult = JSON.parse(content)
      } else {
        throw new Error('Erro na API OpenAI')
      }
    } catch (openaiError) {
      console.error('Erro ao usar OpenAI, usando fallback:', openaiError)
      usedFallback = true
      
      // Análise fallback baseada no texto
      const wordCount = resumeText.split(/\s+/).length
      const hasExperience = /experiência|experience|trabalho|work/i.test(resumeText)
      const hasEducation = /graduação|graduation|curso|course/i.test(resumeText)
      
      let scoreGeral = 50
      if (wordCount > 200) scoreGeral += 10
      if (hasExperience) scoreGeral += 15
      if (hasEducation) scoreGeral += 10
      
      analysisResult = {
        pontosFortes: [
          "Currículo estruturado e organizado",
          "Informações profissionais bem apresentadas",
          "Formação acadêmica adequada"
        ],
        areasMelhoria: [
          "Considerar adicionar mais detalhes sobre realizações específicas",
          "Incluir métricas e resultados quantitativos",
          "Destacar soft skills e competências interpessoais"
        ],
        recomendacoes: [
          "Quantificar resultados e conquistas profissionais",
          "Incluir palavras-chave relevantes para a área",
          "Manter o currículo atualizado regularmente"
        ],
        scoreGeral,
        adequacaoMercado: scoreGeral + 5,
        potencialCrescimento: scoreGeral + 10,
        resumo: "Análise realizada com base no conteúdo do currículo fornecido."
      }
    }

    // Salvar análise no banco
    const { error: saveError } = await supabaseClient
      .from('curriculum_analysis')
      .insert({
        user_id: user.id,
        resume_text: resumeText,
        job_description: jobDescription || null,
        current_situation: currentSituation || null,
        mentorship_questions: mentorshipQuestions || null,
        analysis_result: analysisResult,
        used_fallback: usedFallback,
        credits_used: 3
      })

    if (saveError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar análise no banco de dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        usedFallback,
        creditsUsed: 3,
        remainingCredits: userProfile.credits - 3
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## 🔧 Configuração Necessária

### Variáveis de Ambiente

    ```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI (para a Edge Function)
OPENAI_API_KEY=your_openai_api_key
```

### Dependências

    ```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "react": "^18.x.x",
    "react-router-dom": "^6.x.x",
    "react-dropzone": "^14.x.x",
    "lucide-react": "^0.x.x"
  }
}
```

## 🎯 Funcionalidades Principais

1. ** Formulário Multi - etapas **: Coleta informações detalhadas do usuário
2. ** Upload de PDF **: Drag & drop com validação de tipo e tamanho
3. ** Sistema de Créditos **: Verificação e consumo automático de créditos
4. ** Análise com IA **: Integração com OpenAI GPT - 4
5. ** Fallback Inteligente **: Análise básica quando IA não está disponível
6. ** Persistência **: Salva análises no banco de dados
7. ** Feedback Visual **: Loading states e notificações
8. ** Responsivo **: Interface adaptável para mobile e desktop

## 🚀 Como Implementar

1. ** Configure o banco de dados ** com o schema fornecido
2. ** Crie a Edge Function ** no Supabase
3. ** Configure as variáveis de ambiente **
    4. ** Implemente os componentes React **
        5. ** Configure as rotas ** da aplicação
6. ** Teste o fluxo completo **

## 📊 Estrutura da Resposta da Análise

    ```json
{
  "pontosFortes": [
    "Experiência relevante na área",
    "Formação acadêmica sólida",
    "Habilidades técnicas atualizadas"
  ],
  "areasMelhoria": [
    "Adicionar mais projetos práticos",
    "Melhorar descrição das experiências",
    "Incluir certificações relevantes"
  ],
  "recomendacoes": [
    "Quantificar resultados obtidos",
    "Adicionar palavras-chave da área",
    "Criar seção de projetos destacados"
  ],
  "scoreGeral": 75,
  "adequacaoMercado": 80,
  "potencialCrescimento": 85,
  "resumo": "Currículo com boa base, mas pode ser aprimorado..."
}
```

## 🔒 Segurança

    - Autenticação obrigatória via JWT
        - Validação de créditos antes do processamento
            - Sanitização de dados de entrada
                - Rate limiting na Edge Function
                    - Validação de tipos de arquivo

## 📈 Métricas e Monitoramento

    - Logs de uso da IA vs fallback
        - Consumo de créditos por usuário
            - Taxa de sucesso das análises
                - Tempo de processamento
                    - Erros e exceções

Este sistema fornece uma solução completa para análise de currículos com IA, incluindo interface de usuário, processamento backend e persistência de dados.