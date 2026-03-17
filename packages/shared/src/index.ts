export type DomainModule =
  | 'auth'
  | 'courses'
  | 'community'
  | 'payments'
  | 'checkout'
  | 'gamification'
  | 'admin'
  | 'analytics'
  | 'dashboard';

export const CORE_MODULES: DomainModule[] = [
  'auth',
  'courses',
  'community',
  'payments',
  'checkout',
  'gamification',
  'admin'
];
