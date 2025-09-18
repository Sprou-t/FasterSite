import { unstable_cache as next_unstable_cache } from "next/cache";
import { cache } from "react";

// NextFaster's cache wrapper - combines Next.js cache with React cache for deduplication
export const unstable_cache = <Inputs extends unknown[], Output>(
  callback: (...args: Inputs) => Promise<Output>,
  key: string[],
  options: { revalidate: number },
) => cache(next_unstable_cache(callback, key, options));