import toast from 'react-hot-toast'

export const useNotifications = () => {
  const success = (message: string, duration = 4000) => {
    return toast.success(message, {
      duration,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10B981',
      },
    })
  }

  const error = (message: string, duration = 5000) => {
    return toast.error(message, {
      duration,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
    })
  }

  const loading = (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#3B82F6',
        color: '#fff',
        fontWeight: '500',
      },
    })
  }

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((result: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, messages, {
      position: 'top-right',
      success: {
        style: {
          background: '#10B981',
          color: '#fff',
        },
      },
      error: {
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      },
      loading: {
        style: {
          background: '#3B82F6',
          color: '#fff',
        },
      },
    })
  }

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId)
  }

  return {
    success,
    error,
    loading,
    promise,
    dismiss,
  }
}