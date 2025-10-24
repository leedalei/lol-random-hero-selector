import { toast as sonnerToast } from 'sonner'

type ToastProps = {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useToast = () => {
  const toast = ({ message, type = 'info', duration = 3000 }: ToastProps) => {
    switch (type) {
      case 'success':
        return sonnerToast.success(message, { duration })
      case 'error':
        return sonnerToast.error(message, { duration })
      case 'warning':
        return sonnerToast.warning(message, { duration })
      case 'info':
      default:
        return sonnerToast.info(message, { duration })
    }
  }

  return { toast }
}