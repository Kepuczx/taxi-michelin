// ✅ DOBRZE - każdy interface ma export
export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  phone: string
  role: 'admin' | 'driver' | 'employee'
  isActive: boolean
}

export interface NewUser {  
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: 'admin' | 'driver' | 'employee'
}

export type UserRole = 'admin' | 'driver' | 'employee';