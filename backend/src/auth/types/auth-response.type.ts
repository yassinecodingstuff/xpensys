import { PublicUser } from '../../users/types/user.type.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface AuthResult {
  response: AuthResponse;
  refreshToken: string;
}
