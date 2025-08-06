'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { UserRolesProvider } from './context/user-roles-context'; // Keep this if still needed for specific role checks outside AuthProvider

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* UserRolesProvider might be redundant now if useAuth covers all role logic,
          but keeping it for now if it has other specific functionalities. */}
      <UserRolesProvider>
        {children}
      </UserRolesProvider>
    </AuthProvider>
  );
}
