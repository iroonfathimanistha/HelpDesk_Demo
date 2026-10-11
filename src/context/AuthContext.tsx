import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ProviderProfile, UserRole } from '../types';
import { api } from '../services/api';

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badge: string;
  description: string;
  status?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'customer-dinuka',
    name: 'Dinuka Senanayake',
    email: 'dinuka@gmail.com',
    role: 'CUSTOMER',
    badge: 'Customer (Colombo 03)',
    description: 'Active emergency leak request in Kollupitiya'
  },
  {
    id: 'customer-nimalka',
    name: 'Nimalka Ranasinghe',
    email: 'nimalka@gmail.com',
    role: 'CUSTOMER',
    badge: 'Customer (Colombo 07)',
    description: 'Completed electrical ceiling fan repair'
  },
  {
    id: 'provider-kasun',
    name: 'Kasun Perera',
    email: 'kasun.plumber@helpdesk.lk',
    role: 'PROVIDER',
    badge: 'Plumber (Approved ⭐ 4.9)',
    description: 'Active job in progress (Kitchen sink pipe repair)',
    status: 'APPROVED'
  },
  {
    id: 'provider-nuwan',
    name: 'Nuwan Silva',
    email: 'nuwan.electric@helpdesk.lk',
    role: 'PROVIDER',
    badge: 'Electrician (Approved ⭐ 4.85)',
    description: 'Available online for incoming electrical & appliance requests',
    status: 'APPROVED'
  },
  {
    id: 'provider-dilshan',
    name: 'Dilshan Jayasuriya',
    email: 'dilshan.carpenter@helpdesk.lk',
    role: 'PROVIDER',
    badge: 'Carpenter (Pending Review ⏳)',
    description: 'Fresh applicant awaiting Admin background check approval',
    status: 'PENDING_VERIFICATION'
  },
  {
    id: 'admin-dilrukshi',
    name: 'Dilrukshi Alwis',
    email: 'admin@helpdesk.lk',
    role: 'ADMIN',
    badge: 'Platform Administrator',
    description: 'Full management oversight & provider approvals'
  }
];

interface AuthContextType {
  user: User | null;
  providerProfile: ProviderProfile | null;
  isLoading: boolean;
  unreadCount: number;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchDemoAccount: (accountId: string) => Promise<void>;
  switchMode: (targetRole: 'CUSTOMER' | 'PROVIDER') => Promise<void>;
  refreshMe: () => Promise<void>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshMe = useCallback(async () => {
    try {
      if (api.getToken()) {
        const res = await api.getMe();
        setUser(res.user);
        setProviderProfile(res.providerProfile || null);

        // Fetch notifications count
        try {
          const notifs = await api.getNotifications();
          setUnreadCount(notifs.unreadCount);
        } catch {
          // Ignore
        }
      } else {
        setUser(null);
        setProviderProfile(null);
      }
    } catch (err) {
      console.warn('Session check failed, logging out:', err);
      api.logout();
      setUser(null);
      setProviderProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // If no token exists on startup, default login as Customer Dinuka for quick demo experience
    const existingToken = api.getToken();
    if (!existingToken) {
      switchDemoAccount('customer-dinuka');
    } else {
      refreshMe();
    }
  }, [refreshMe]);

  // Periodic poll for unread notifications if logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const notifs = await api.getNotifications();
        setUnreadCount(notifs.unreadCount);
      } catch {
        // quiet
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      setProviderProfile(res.providerProfile || null);
      const notifs = await api.getNotifications();
      setUnreadCount(notifs.unreadCount);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setUser(res.user);
      setProviderProfile(res.providerProfile || null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setProviderProfile(null);
    setUnreadCount(0);
  };

  const switchMode = async (targetRole: 'CUSTOMER' | 'PROVIDER') => {
    setIsLoading(true);
    try {
      const res = await api.switchMode(targetRole);
      setUser(res.user);
      if (res.providerProfile) {
        setProviderProfile(res.providerProfile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoAccount = async (accountId: string) => {
    const account = DEMO_ACCOUNTS.find(a => a.id === accountId);
    if (!account) return;
    await login(account.email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        providerProfile,
        isLoading,
        unreadCount,
        login,
        register,
        logout,
        switchDemoAccount,
        switchMode,
        refreshMe,
        setUnreadCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
