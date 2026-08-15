/**
 * Admin Authentication Service
 * Uses provided environment variables or standard festival admin credentials.
 */

const SESSION_KEY = 'kfc_admin_auth_session';

interface AdminSession {
  username: string;
  authenticatedAt: number;
  token: string;
}

export function getExpectedAdminCredentials() {
  // Read from Vite environment if injected, or use specified defaults
  const envUser = (import.meta as unknown as { env: Record<string, string> }).env.ADMIN_USERNAME || 'admin';
  const envPass = (import.meta as unknown as { env: Record<string, string> }).env.ADMIN_PASSWORD || '1234';
  return { username: envUser, password: envPass };
}

export function loginAdmin(usernameInput: string, passwordInput: string): { success: boolean; error?: string } {
  const { username, password } = getExpectedAdminCredentials();

  if (usernameInput.trim() === username && passwordInput.trim() === password) {
    const session: AdminSession = {
      username: usernameInput.trim(),
      authenticatedAt: Date.now(),
      token: `kfc_admin_token_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true };
  }

  return { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
}

export function checkIsAdminAuthenticated(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const session: AdminSession = JSON.parse(raw);
    
    // Session valid for 12 hours
    const maxAge = 12 * 60 * 60 * 1000;
    if (Date.now() - session.authenticatedAt > maxAge) {
      logoutAdmin();
      return false;
    }
    return !!session.token;
  } catch {
    return false;
  }
}

export function logoutAdmin(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}
