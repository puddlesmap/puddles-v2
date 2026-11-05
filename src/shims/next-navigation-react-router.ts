/**
 * Vite shim for `next/navigation` — map to React Router so shared hooks
 * (e.g. useEventNavigation) work under BrowserRouter without crashing.
 */
import {
  useLocation,
  useNavigate,
  useParams as useRrParams,
  useSearchParams as useRrSearchParams,
} from 'react-router-dom'

export function useRouter() {
  const navigate = useNavigate()
  return {
    push: (href: string) => {
      void navigate(href)
    },
    replace: (href: string) => {
      void navigate(href, { replace: true })
    },
    back: () => {
      void navigate(-1)
    },
    forward: () => {
      void navigate(1)
    },
    prefetch: () => undefined,
    refresh: () => undefined,
  }
}

export function usePathname(): string {
  return useLocation().pathname
}

export function useSearchParams(): URLSearchParams {
  const [params] = useRrSearchParams()
  return params
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>() {
  return useRrParams() as T
}
