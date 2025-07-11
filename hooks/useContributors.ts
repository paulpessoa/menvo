import { useQuery } from '@tanstack/react-query'

interface Contributor {
  login: string
  avatar_url: string
  html_url: string
  contributions: number
}

async function fetchContributors(): Promise<Contributor[]> {
  const response = await fetch('https://api.github.com/repos/paulpessoa/menvo/contributors')
  if (!response.ok) {
    throw new Error('Failed to fetch contributors')
  }
  return response.json()
}

export function useContributors() {
  return useQuery({
    queryKey: ['contributors'],
    queryFn: fetchContributors,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
