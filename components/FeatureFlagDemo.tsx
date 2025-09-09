"use client"

import { useFeatureFlags, useFeatureFlag } from "@/lib/feature-flags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Settings } from "lucide-react"

export function FeatureFlagDemo() {
    const { flags, isLoading, error, refreshFlags } = useFeatureFlags()
    const waitingListEnabled = useFeatureFlag("waitingListEnabled")

    if (isLoading) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Feature Flags
                    </CardTitle>
                    <CardDescription>Loading feature flags...</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Feature Flags
                </CardTitle>
                <CardDescription>
                    Current feature flag status
                    {error && <span className="text-red-500 block">Error: {error}</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2">
                    {Object.entries(flags).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{key}</span>
                            <Badge variant={value ? "default" : "secondary"}>
                                {value ? "ON" : "OFF"}
                            </Badge>
                        </div>
                    ))}
                </div>

                <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                        Example usage: Waiting List is {waitingListEnabled ? "enabled" : "disabled"}
                    </p>
                    <Button
                        onClick={refreshFlags}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isLoading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Flags
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
