import { useMemo } from 'react';
import { x402Service } from './x402Stub';
import { IX402Service } from './types';

/**
 * React hook to access x402 payment service
 * 
 * For MVP, this returns the stub service.
 * When integrating a real x402 SDK, replace the stub with the real implementation.
 */
export const useX402 = (): IX402Service => {
  return useMemo(() => x402Service, []);
};
