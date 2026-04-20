// TODO: Implement Toast Component
// Props: variant: 'default' | 'success' | 'error' | 'warning', title: string, description?: string
// - Built on @radix-ui/react-toast (ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose)
// - Positioned bottom-right of the screen
// - Auto-dismisses after 4 seconds
// - success: green, error: dana-red, warning: amber, default: dana-blue

import toast, {Toaster} from 'react-hot-toast'

export default function Toast() {
  // TODO: Implement
  return (
    <div className=''>
      <Toaster 
        toastOptions={{
          style: {
          padding: '16px',
          color: 'white',
        },
          success: {
            style: {
              background: 'green',
            },
          },
          error: {
            style: {
              background: '#e9212e ',
            },
          },
        }}
      />
    </div>
  )
}
