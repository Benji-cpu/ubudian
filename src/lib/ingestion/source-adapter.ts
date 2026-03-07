/**
 * Source adapter registry.
 * All source adapters register themselves here for discovery by the pipeline.
 */

import type { SourceAdapter } from "./types";

const adapterRegistry = new Map<string, SourceAdapter>();

/**
 * Register a source adapter by its slug.
 */
export function registerAdapter(adapter: SourceAdapter): void {
  adapterRegistry.set(adapter.sourceSlug, adapter);
}

/**
 * Get a registered adapter by source slug.
 */
export function getAdapter(sourceSlug: string): SourceAdapter | undefined {
  return adapterRegistry.get(sourceSlug);
}

/**
 * Get all registered adapter slugs.
 */
export function getRegisteredAdapters(): string[] {
  return Array.from(adapterRegistry.keys());
}
