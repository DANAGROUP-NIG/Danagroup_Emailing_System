'use client'

import toast, {Toaster} from 'react-hot-toast'

export default function Toast() {
  // TODO: Implement
  return (
    <div className=''>
      <Toaster 
        toastOptions={{
          style: {
          border: '1px solid #713200',
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
