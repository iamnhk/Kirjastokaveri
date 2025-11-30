export interface AuthResponse {
  username: string
}

export async function login(/* credentials: LoginPayload */): Promise<AuthResponse> {
  console.warn('Auth service login stub: replace with backend call when ready')
  return { username: 'demo.user' }
}

export async function logout(): Promise<void> {
  console.warn('Auth service logout stub: replace with backend call when ready')
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
  console.warn('Auth service getCurrentUser stub: replace with backend call when ready')
  return null
}
