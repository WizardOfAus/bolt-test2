// This script will help diagnose Supabase auth issues
console.log("Debug script loaded");

// Check if URL contains auth tokens (after redirect from magic link)
const url = new URL(window.location.href);
const hashParams = new URLSearchParams(url.hash.substring(1));
const accessToken = hashParams.get("access_token");
const refreshToken = hashParams.get("refresh_token");
const type = hashParams.get("type");

if (accessToken) {
  console.log("Auth tokens found in URL:");
  console.log(" - type:", type);
  console.log(" - access_token: [REDACTED]");
  console.log(" - refresh_token: [REDACTED]");
}

// Display environment variables (only the format, not actual values)
console.log("Environment variables:");
console.log(" - VITE_SUPABASE_URL format check:", 
  import.meta.env.VITE_SUPABASE_URL ? 
  (import.meta.env.VITE_SUPABASE_URL.startsWith("https://") ? "✅ Valid format" : "❌ Invalid format") : 
  "❌ Missing");
console.log(" - VITE_SUPABASE_ANON_KEY format check:", 
  import.meta.env.VITE_SUPABASE_ANON_KEY ? 
  (import.meta.env.VITE_SUPABASE_ANON_KEY.length > 20 ? "✅ Valid format" : "❌ Invalid format") : 
  "❌ Missing");

// Add this script to your index.html
// <script type="module" src="/debug.js"></script>