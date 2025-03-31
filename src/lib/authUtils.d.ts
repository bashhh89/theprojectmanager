/**
 * Type definitions for authUtils.js
 */

export function signIn(email: string, password: string): Promise<{ data: any, error: any }>;
export function signOut(): Promise<{ error: any }>;
export function getSession(): Promise<{ session: any, error: any }>;
export function isAuthenticated(): Promise<boolean>;
export function requireAuth(): Promise<any | null>;
export function redirectIfUnauthenticated(router: any): Promise<any | null>; 