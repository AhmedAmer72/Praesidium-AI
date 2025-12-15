import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertTriangle, FiInfo, FiX, FiAlertCircle } from 'react-icons/fi';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  txHash?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  notifyPolicyPurchased: (protocol: string, coverage: number, txHash?: string) => void;
  notifyClaimSubmitted: (protocol: string, amount: number, txHash?: string) => void;
  notifyClaimApproved: (protocol: string, amount: number, txHash?: string) => void;
  notifyClaimRejected: (protocol: string, reason: string) => void;
  notifyPolicyExpiring: (protocol: string, daysLeft: number) => void;
  notifyDeposit: (amount: number, txHash?: string) => void;
  notifyWithdraw: (amount: number, txHash?: string) => void;
  notifyError: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const iconMap = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  warning: FiAlertTriangle,
  info: FiInfo,
};

const colorMap = {
  success: 'from-green-500/20 to-green-600/10 border-green-500/50',
  error: 'from-red-500/20 to-red-600/10 border-red-500/50',
  warning: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50',
  info: 'from-blue-500/20 to-blue-600/10 border-blue-500/50',
};

const iconColorMap = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const Icon = iconMap[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={`relative bg-gradient-to-r ${colorMap[notification.type]} border rounded-xl p-4 shadow-xl backdrop-blur-xl min-w-[320px] max-w-[420px]`}
    >
      <div className="flex items-start gap-3">
        <div className={`${iconColorMap[notification.type]} mt-0.5`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
          <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
          {notification.txHash && (
            <a
              href={`https://polygonscan.com/tx/${notification.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-glow-blue text-xs hover:underline mt-2 inline-block"
            >
              View Transaction →
            </a>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification = { ...notification, id };
      
      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove after duration
      const duration = notification.duration || 5000;
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    },
    [removeNotification]
  );

  // Pre-built notification helpers
  const notifyPolicyPurchased = useCallback(
    (protocol: string, coverage: number, txHash?: string) => {
      addNotification({
        type: 'success',
        title: 'Policy Purchased! 🛡️',
        message: `Your ${protocol} insurance policy for $${coverage.toLocaleString()} is now active.`,
        txHash,
        duration: 7000,
      });
    },
    [addNotification]
  );

  const notifyClaimSubmitted = useCallback(
    (protocol: string, amount: number, txHash?: string) => {
      addNotification({
        type: 'info',
        title: 'Claim Submitted',
        message: `Your claim for $${amount.toLocaleString()} on ${protocol} has been submitted for review.`,
        txHash,
        duration: 6000,
      });
    },
    [addNotification]
  );

  const notifyClaimApproved = useCallback(
    (protocol: string, amount: number, txHash?: string) => {
      addNotification({
        type: 'success',
        title: 'Claim Approved! 💰',
        message: `Your ${protocol} claim for $${amount.toLocaleString()} has been approved. Funds sent to your wallet.`,
        txHash,
        duration: 8000,
      });
    },
    [addNotification]
  );

  const notifyClaimRejected = useCallback(
    (protocol: string, reason: string) => {
      addNotification({
        type: 'error',
        title: 'Claim Rejected',
        message: `Your ${protocol} claim was rejected: ${reason}`,
        duration: 8000,
      });
    },
    [addNotification]
  );

  const notifyPolicyExpiring = useCallback(
    (protocol: string, daysLeft: number) => {
      addNotification({
        type: 'warning',
        title: 'Policy Expiring Soon ⚠️',
        message: `Your ${protocol} policy expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to stay protected.`,
        duration: 10000,
      });
    },
    [addNotification]
  );

  const notifyDeposit = useCallback(
    (amount: number, txHash?: string) => {
      addNotification({
        type: 'success',
        title: 'Deposit Successful',
        message: `${amount} MATIC deposited to the liquidity pool.`,
        txHash,
        duration: 6000,
      });
    },
    [addNotification]
  );

  const notifyWithdraw = useCallback(
    (amount: number, txHash?: string) => {
      addNotification({
        type: 'success',
        title: 'Withdrawal Successful',
        message: `Successfully withdrew from the liquidity pool.`,
        txHash,
        duration: 6000,
      });
    },
    [addNotification]
  );

  const notifyError = useCallback(
    (message: string) => {
      addNotification({
        type: 'error',
        title: 'Error',
        message,
        duration: 6000,
      });
    },
    [addNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        notifyPolicyPurchased,
        notifyClaimSubmitted,
        notifyClaimApproved,
        notifyClaimRejected,
        notifyPolicyExpiring,
        notifyDeposit,
        notifyWithdraw,
        notifyError,
      }}
    >
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
