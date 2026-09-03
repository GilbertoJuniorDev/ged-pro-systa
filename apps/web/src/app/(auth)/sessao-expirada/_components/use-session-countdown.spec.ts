import { act, renderHook } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import { useSessionCountdown } from './use-session-countdown';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

const mockSignOut = jest.mocked(signOut);

const COUNTDOWN_SECONDS = 5;

function advanceSeconds(seconds: number): void {
  act(() => {
    jest.advanceTimersByTime(seconds * 1000);
  });
}

describe('useSessionCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should start at the configured number of seconds when the hook mounts', () => {
    const { result } = renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    expect(result.current.secondsLeft).toBe(COUNTDOWN_SECONDS);
    expect(result.current.isRedirecting).toBe(false);
  });

  it('should decrement secondsLeft by one when one second elapses', () => {
    const { result } = renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.secondsLeft).toBe(COUNTDOWN_SECONDS - 1);
  });

  it('should reach zero when the full countdown elapses', () => {
    const { result } = renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    advanceSeconds(COUNTDOWN_SECONDS);

    expect(result.current.secondsLeft).toBe(0);
  });

  it('should call signOut with the login callbackUrl when the countdown reaches zero', () => {
    renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    advanceSeconds(COUNTDOWN_SECONDS);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });

  it('should call signOut only once when time keeps advancing after the countdown ended', () => {
    renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    advanceSeconds(COUNTDOWN_SECONDS);
    advanceSeconds(COUNTDOWN_SECONDS);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should call signOut immediately when redirectNow is invoked before the countdown ends', () => {
    const { result } = renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    act(() => {
      result.current.redirectNow();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    expect(result.current.secondsLeft).toBe(COUNTDOWN_SECONDS);
  });

  it('should not call signOut again when redirectNow is invoked after the countdown already fired', () => {
    const { result } = renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    advanceSeconds(COUNTDOWN_SECONDS);
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.redirectNow();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should set isRedirecting to true when redirectNow is invoked', () => {
    const { result } = renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    expect(result.current.isRedirecting).toBe(false);

    act(() => {
      result.current.redirectNow();
    });

    expect(result.current.isRedirecting).toBe(true);
  });

  it('should clear the interval when the hook unmounts', () => {
    const { unmount } = renderHook(() => useSessionCountdown(COUNTDOWN_SECONDS));

    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
