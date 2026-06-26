/** Primary nav active state — includes experiment routes on their parent tab. */
export function isPrimaryNavActive(to: string, pathname: string, end: boolean): boolean {
  if (to === '/') {
    return (
      pathname === '/' ||
      pathname === '/home-experiment' ||
      pathname === '/experiment-home' ||
      pathname === '/home-ikea-experiment' ||
      pathname === '/home-experiment-1' ||
      pathname === '/home-experiment-2'
    )
  }

  if (to === '/browse') {
    return (
      pathname === '/browse' ||
      pathname === '/experiment-browse' ||
      pathname === '/experiment-browse-3' ||
      pathname === '/browse-experiment'
    )
  }

  if (to === '/share') {
    return pathname === '/share' || pathname === '/share-experiment'
  }

  if (to === '/about') {
    return pathname === '/about' || pathname === '/about-experiment' || pathname === '/experiment_about'
  }

  return end ? pathname === to : pathname.startsWith(to)
}
