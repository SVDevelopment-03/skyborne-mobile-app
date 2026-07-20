import reducer, { setOnboardingCompleted } from '../src/store/authSlice';

test('should set onboarding completed flag', () => {
  const initialState = { loggedIn: false, status: 'idle' } as any;
  const next = reducer(initialState, setOnboardingCompleted(true));
  expect(next.onboardingCompleted).toBe(true);
});
