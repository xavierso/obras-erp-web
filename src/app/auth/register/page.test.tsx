import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import RegisterPage from './page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Register Page', () => {
  it('renders register form correctly', () => {
    render(<RegisterPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Crear Cuenta')
    expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Registrarse/i })).toBeInTheDocument()
  })
})
