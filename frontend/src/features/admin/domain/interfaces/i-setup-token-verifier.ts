export interface ISetupTokenVerifier {
  /** False when no setup token is configured: setup is then switched off. */
  isEnabled(): boolean;
  matches(candidate: string): boolean;
}
