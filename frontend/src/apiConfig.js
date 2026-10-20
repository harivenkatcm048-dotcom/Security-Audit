/**
 * API Base URL Configuration for Nexentra Security Audit Engine
 * -------------------------------------------------------------
 * In Local Development: Falls back to '' (proxied through Vite to localhost:5000)
 * In Production on Vercel: Reads VITE_API_BASE_URL (points to Render backend)
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
