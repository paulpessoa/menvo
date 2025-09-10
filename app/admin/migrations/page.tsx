"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Database,
    RefreshCw,
    Copy,
    ExternalLink
} from "lucide-react"
import { toast } from "sonner"

interface TableStatus {
    exists: boolean
    count?: number
}

interface MigrationStatus {
    tables: {
        volunteer_activities: TableStatus
        profiles_is_volunteer_column: TableStatus & { volunteers_count?: number }
    }
    migration_needed: boolean
    recommendations?: Record<string, string>
}

export default function MigrationsPage() {
    const [status, setStatus] = useState<MigrationStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const checkMigrationStatus = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch("/api/admin/check-tables")
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to check migration status")
            }

            setStatus(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error")
        } finally {
            setLoading(false)
        }
    }

    const getMigrationInstructions = async () => {
        try {
            const response = await fetch("/api/admin/check-tables", { method: "POST" })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to get migration instructions")
            }

            toast.success("Migration instructions loaded")
            return data
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Unknown error")
            return null
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success("Copied to clipboard")
        } catch (err) {
            toast.error("Failed to copy to clipboard")
        }
    }

    useEffect(() => {
        checkMigrationStatus()
    }, [])

    const sqlScript = `-- Execute este script no Supabase SQL Editor
DO $$
BEGIN
    -- Adicionar coluna is_volunteer se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'is_volunteer'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_volunteer BOOLEAN DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_profiles_is_volunteer ON profiles(is_volunteer);
    END IF;

    -- Criar tabela volunteer_activities se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'volunteer_activities'
    ) THEN
        CREATE TABLE volunteer_activities (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            activity_type TEXT NOT NULL CHECK (activity_type IN (
                'mentoria', 'workshop', 'palestra', 'codigo', 'design', 
                'marketing', 'administracao', 'suporte', 'traducao', 'outro'
            )),
            description TEXT,
            hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
            date DATE NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
            validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            validated_at TIMESTAMP WITH TIME ZONE,
            validation_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Criar índices
        CREATE INDEX idx_volunteer_activities_user_id ON volunteer_activities(user_id);
        CREATE INDEX idx_volunteer_activities_status ON volunteer_activities(status);
        CREATE INDEX idx_volunteer_activities_date ON volunteer_activities(date DESC);
        CREATE INDEX idx_volunteer_activities_type ON volunteer_activities(activity_type);

        -- Habilitar RLS
        ALTER TABLE volunteer_activities ENABLE ROW LEVEL SECURITY;

        -- Políticas RLS
        CREATE POLICY "Users can insert own volunteer activities" ON volunteer_activities
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can view own volunteer activities" ON volunteer_activities
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can update own pending activities" ON volunteer_activities
            FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

        CREATE POLICY "Volunteers and admins can view all activities" ON volunteer_activities
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() 
                    AND (p.user_role = 'admin' OR p.is_volunteer = true)
                )
            );

        CREATE POLICY "Admins can validate activities" ON volunteer_activities
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM public.profiles p
                    WHERE p.id = auth.uid() 
                    AND p.user_role = 'admin'
                )
            );

        -- Trigger para updated_at
        CREATE OR REPLACE FUNCTION update_volunteer_activities_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE TRIGGER volunteer_activities_updated_at
            BEFORE UPDATE ON volunteer_activities
            FOR EACH ROW
            EXECUTE FUNCTION update_volunteer_activities_updated_at();

        -- Atualizar mentores existentes para serem voluntários
        UPDATE profiles 
        SET is_volunteer = true 
        WHERE user_role IN ('admin', 'mentor');

        RAISE NOTICE 'Migração aplicada com sucesso!';
    END IF;
END
$$;`

    if (loading) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Migrações do Banco de Dados</h1>
                        <p className="text-muted-foreground">
                            Verificar e aplicar migrações necessárias para o sistema de voluntários
                        </p>
                    </div>
                    <Button onClick={checkMigrationStatus} disabled={loading}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar Status
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {status && (
                    <>
                        {/* Status Overview */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5" />
                                    Status das Tabelas
                                </CardTitle>
                                <CardDescription>
                                    Verificação das tabelas necessárias para o sistema de voluntários
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Volunteer Activities Table */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium">volunteer_activities</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Tabela de atividades de voluntários
                                            </p>
                                            {status.tables.volunteer_activities.exists && (
                                                <p className="text-xs text-muted-foreground">
                                                    {status.tables.volunteer_activities.count} registros
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={status.tables.volunteer_activities.exists ? "default" : "destructive"}>
                                            {status.tables.volunteer_activities.exists ? (
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                            ) : (
                                                <XCircle className="w-3 h-3 mr-1" />
                                            )}
                                            {status.tables.volunteer_activities.exists ? "Existe" : "Não existe"}
                                        </Badge>
                                    </div>

                                    {/* Is Volunteer Column */}
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h4 className="font-medium">profiles.is_volunteer</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Coluna para identificar voluntários
                                            </p>
                                            {status.tables.profiles_is_volunteer_column.exists && (
                                                <p className="text-xs text-muted-foreground">
                                                    {status.tables.profiles_is_volunteer_column.volunteers_count} voluntários
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={status.tables.profiles_is_volunteer_column.exists ? "default" : "destructive"}>
                                            {status.tables.profiles_is_volunteer_column.exists ? (
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                            ) : (
                                                <XCircle className="w-3 h-3 mr-1" />
                                            )}
                                            {status.tables.profiles_is_volunteer_column.exists ? "Existe" : "Não existe"}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Migration Status */}
                                <div className="pt-4 border-t">
                                    {status.migration_needed ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Migração necessária!</strong> Algumas tabelas ou colunas estão faltando.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Alert>
                                            <CheckCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Tudo certo!</strong> Todas as tabelas e colunas necessárias estão presentes.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Migration Instructions */}
                        {status.migration_needed && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Instruções de Migração</CardTitle>
                                    <CardDescription>
                                        Execute o script SQL abaixo no Supabase Dashboard para aplicar as migrações necessárias
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Passos para aplicar a migração:</h4>
                                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                            <li>Vá para o Supabase Dashboard</li>
                                            <li>Acesse SQL Editor</li>
                                            <li>Copie e cole o script SQL abaixo</li>
                                            <li>Execute o script</li>
                                            <li>Volte aqui e clique em "Atualizar Status"</li>
                                        </ol>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium">Script SQL:</h4>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(sqlScript)}
                                                >
                                                    <Copy className="w-3 h-3 mr-1" />
                                                    Copiar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href="https://supabase.com/dashboard"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        Abrir Supabase
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                                            <code>{sqlScript}</code>
                                        </pre>
                                    </div>

                                    {status.recommendations && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Recomendações:</h4>
                                            <ul className="space-y-1">
                                                {Object.entries(status.recommendations).map(([key, value]) => (
                                                    <li key={key} className="text-sm text-muted-foreground">
                                                        • {value}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}