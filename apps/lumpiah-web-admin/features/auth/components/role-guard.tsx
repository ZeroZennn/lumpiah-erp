'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles?: string[];
    fallback?: ReactNode;
}

/**
 * RoleGuard Component
 * Protects children from being rendered if user does not have required role.
 */
export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
    const { data: user, isLoading } = useCurrentUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-full">Loading...</div>; // You might want a better spinner
    }

    if (!user) {
        return null;
    }

    const hasAccess = !allowedRoles || allowedRoles.includes(user.role.name);

    if (!hasAccess) {
        return fallback || (
            <div className="flex flex-col items-center justify-center p-8 h-full">
                <h2 className="text-2xl font-bold text-red-600">403 - Forbidden</h2>
                <p className="mt-2 text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
            </div>
        );
    }

    return <>{children}</>;
}
