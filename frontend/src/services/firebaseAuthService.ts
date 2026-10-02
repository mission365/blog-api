import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import type { UserSession } from '../types';

export async function mapFirebaseUser(user: FirebaseUser): Promise<UserSession> {
  const token = await user.getIdToken();
  const email = user.email || '';

  return {
    username: user.displayName || email.split('@')[0] || 'Author',
    email,
    // Firebase identity alone does not grant API administrator privileges.
    role: 'User',
    token,
    photoURL: user.photoURL || undefined,
    emailVerified: user.emailVerified,
  };
}

export function formatFirebaseError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled by an administrator.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/popup-closed-by-user':
        return 'Google Sign-In was cancelled before completion.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/network-request-failed':
        return 'Network error: Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Access has been temporarily restricted. Please try again later.';
      default:
        return (err as { message?: string }).message || 'Authentication failed. Please try again.';
    }
  }
  return err instanceof Error ? err.message : 'An unexpected error occurred.';
}

export const firebaseAuthService = {
  // Sign in with Google Popup
  async signInWithGoogle(): Promise<UserSession> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await mapFirebaseUser(result.user);
    } catch (err) {
      throw new Error(formatFirebaseError(err));
    }
  },

  // Sign in with Email and Password
  async signInWithEmail(email: string, password: string): Promise<UserSession> {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      return await mapFirebaseUser(result.user);
    } catch (err) {
      throw new Error(formatFirebaseError(err));
    }
  },

  // Register with Email and Password
  async registerWithEmail(email: string, password: string, displayName?: string): Promise<{ session: UserSession; verificationSent: boolean }> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      if (displayName?.trim()) {
        try {
          await updateProfile(result.user, { displayName: displayName.trim() });
        } catch {
          // ignore profile update error
        }
      }

      // Automatically send Google/Firebase email verification
      let verificationSent = false;
      try {
        await sendEmailVerification(result.user);
        verificationSent = true;
      } catch (e) {
        console.warn('Could not send verification email:', e);
      }

      const session = await mapFirebaseUser(result.user);
      return { session, verificationSent };
    } catch (err) {
      throw new Error(formatFirebaseError(err));
    }
  },

  // Send Password Reset Email directly via Firebase / Google
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(formatFirebaseError(err));
    }
  },

  // Resend Email Verification
  async resendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) {
      throw new Error('No active user to verify. Please sign in first.');
    }
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      throw new Error(formatFirebaseError(err));
    }
  },

  // Sign out
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Listen to Auth State Changes
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
};
