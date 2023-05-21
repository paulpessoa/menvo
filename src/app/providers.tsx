"use client"
import React from 'react'

import { ChakraProvider } from '@chakra-ui/react'

function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ChakraProvider>
            {children}
        </ChakraProvider>
    )
}

export default Providers