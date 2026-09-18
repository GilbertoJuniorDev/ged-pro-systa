import { act, fireEvent, render, screen } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import { SessionExpiredClient } from './session-expired-client';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

const mockSignOut = jest.mocked(signOut);

/** Espelha o `COUNTDOWN_SECONDS` fixo do componente. */
const COUNTDOWN_SECONDS = 5;

function advanceSeconds(seconds: number): void {
  act(() => {
    jest.advanceTimersByTime(seconds * 1000);
  });
}

describe('SessionExpiredClient', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should render the heading and the reason text when the screen mounts', () => {
    render(<SessionExpiredClient />);

    expect(screen.getByRole('heading', { level: 1, name: 'Sua sessão expirou' })).toBeInTheDocument();
    expect(screen.getByText(/Por segurança, sua sessão foi encerrada\./)).toBeInTheDocument();
  });

  it('should announce the message region with role status when the screen mounts', () => {
    render(<SessionExpiredClient />);

    const status = screen.getByRole('status');

    expect(status).toHaveTextContent('Sua sessão expirou');
    expect(status).toHaveTextContent('Entre novamente para continuar.');
  });

  it('should show the remaining seconds when the screen mounts', () => {
    render(<SessionExpiredClient />);

    expect(screen.getByText(/em 5s/)).toBeInTheDocument();
  });

  it('should decrement the visible countdown when one second elapses', () => {
    render(<SessionExpiredClient />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/em 4s/)).toBeInTheDocument();
    expect(screen.queryByText(/em 5s/)).not.toBeInTheDocument();
  });

  it('should not call signOut before the countdown elapses', () => {
    render(<SessionExpiredClient />);

    advanceSeconds(COUNTDOWN_SECONDS - 1);

    expect(screen.getByText(/em 1s/)).toBeInTheDocument();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('should call signOut with the login callbackUrl when the user clicks "Entrar novamente"', () => {
    render(<SessionExpiredClient />);

    fireEvent.click(screen.getByRole('button', { name: /Entrar novamente/ }));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('should disable the button and show the redirecting label when the redirect starts', () => {
    render(<SessionExpiredClient />);

    fireEvent.click(screen.getByRole('button', { name: /Entrar novamente/ }));

    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Redirecionando…');
  });

  it('should hide the countdown text from assistive tech when the screen mounts', () => {
    render(<SessionExpiredClient />);

    expect(screen.getByText(/em 5s/)).toHaveAttribute('aria-hidden', 'true');
  });

  it('should keep the progress bar decorative when the screen mounts', () => {
    render(<SessionExpiredClient />);

    const progressTrack = screen.getByText(/em 5s/).nextElementSibling;

    expect(progressTrack).toBeInTheDocument();
    expect(progressTrack).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
