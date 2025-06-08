import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useContributors } from '@/hooks/useContributors'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function Contributors() {
  const { t } = useTranslation()
  const { data: contributors, isLoading } = useContributors()

  if (isLoading || !contributors) {
    return null
  }

  return (
    <div className="w-full py-8">
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
        {contributors.map((contributor) => (
          <TooltipProvider key={contributor.login}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={contributor.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Avatar className="h-12 w-12 transition-transform hover:scale-110">
                    <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                    <AvatarFallback>{contributor.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{contributor.login}</p>
                <p className="text-sm text-muted-foreground">
                  {t('about.contributors.contributions', { count: contributor.contributions })}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <Button asChild variant="outline" className="gap-2">
          <a
            href="https://github.com/paulpessoa/menvo"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-4 w-4" />
            {t('about.contributors.viewRepository')}
          </a>
        </Button>
      </div>
    </div>
  )
} 