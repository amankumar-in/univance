import React from 'react'

function Container({children}) {
  return (
    <div className='w-full min-h-[calc(100vh-64px)] py-4 md:py-8 px-4 pb-12 mx-auto max-w-screen-2xl md:px-6 lg:px-8 xl:px-12'>
      {children}
    </div>
  )
}{}

export default Container
