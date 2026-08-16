import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import LoginPage from './page'

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Login Page', () => {
  it('renders login form correctly', () => {
    render(<LoginPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('OBRAS ERP')
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument()
  })
})
