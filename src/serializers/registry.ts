/**
 * Explicit Serializer Registry - ES5 compatible
 */

import type { Serializer } from "./types";

// Initialize empty registry - using let to ensure it's mutable
let registry: Record<string, Serializer> = {};
let isInitialized = false;

// Import serializers at module level to ensure they're loaded
import "./json";
import "./html";
import "./react";
import "./react-native";
import "./flutter";
import "./swiftui";
import "./vue";

export function register(serializer: Serializer): void {
  // Ensure registry exists before assignment
  if (!registry) {
    registry = {};
  }
  registry[serializer.id] = serializer;
}

export function getAvailableSerializers(): readonly Serializer[] {
  // Defensive check for registry
  if (!registry) {
    return [];
  }
  return Object.keys(registry).map(function (key) {
    return registry[key];
  });
}

export function getSerializer(id: string): Serializer | undefined {
  // Defensive check for registry
  if (!registry || !registry[id]) {
    return undefined;
  }
  return registry[id];
}

// Initialize registry by calling this function
export function initializeSerializers(): void {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  // Ensure registry is initialized before importing serializers
  if (!registry) {
    registry = {};
  }

  // Import serializers explicitly to trigger registration
  // These imports will call register() which populates the registry
}
