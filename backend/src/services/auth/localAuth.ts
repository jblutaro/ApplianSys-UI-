import {
  hashPassword,
  isLegacyPlaintextPassword,
  LEGACY_SEEDED_PASSWORD_MARKER,
  SEEDED_USER_PASSWORD,
  verifyPassword,
} from "../../auth/password.js";
import {
  createLocalUser,
  findUserByEmail,
  findUserById,
  findUserProfileById,
  isActiveStatus,
  mapAccountProfile,
  normalizeEmail,
  touchUserLogin,
  updateUserPassword,
  updateUserProfile,
  type AuthUserRow,
} from "../../auth/users.js";
import { AuthServiceError } from "./errors.js";

export async function getAuthenticatedUser(userId: number): Promise<AuthUserRow | null> {
  const user = await findUserById(userId);
  if (!user || !isActiveStatus(user.status)) {
    return null;
  }

  return user;
}

export async function authenticateLocalUser(
  email: string,
  password: string,
): Promise<AuthUserRow> {
  const user = await findUserByEmail(normalizeEmail(email));
  if (!user) {
    throw new AuthServiceError(401, "Invalid email or password.");
  }

  if (!isActiveStatus(user.status)) {
    throw new AuthServiceError(403, "This account is inactive.");
  }

  let isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    const canUpgradeLegacySeed =
      user.password === LEGACY_SEEDED_PASSWORD_MARKER &&
      password === SEEDED_USER_PASSWORD;
    const canUpgradePlaintext = isLegacyPlaintextPassword(password, user.password);

    if (canUpgradeLegacySeed || canUpgradePlaintext) {
      const upgradedHash = await hashPassword(password);
      await updateUserPassword(user.user_id, upgradedHash);
      isValidPassword = true;
    }
  }

  if (!isValidPassword) {
    throw new AuthServiceError(401, "Invalid email or password.");
  }

  await touchUserLogin(user.user_id);
  return (await findUserById(user.user_id)) ?? user;
}

export async function registerLocalUser(email: string, password: string): Promise<AuthUserRow> {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AuthServiceError(409, "An account with that email already exists.");
  }

  const passwordHash = await hashPassword(password);
  return createLocalUser(normalizedEmail, passwordHash);
}

export async function getAccountProfile(userId: number) {
  const user = await findUserProfileById(userId);
  if (!user || !isActiveStatus(user.status)) {
    throw new AuthServiceError(401, "Authentication required.");
  }

  return mapAccountProfile(user);
}

export async function saveAccountProfile(
  userId: number,
  profile: {
    contactNumber: string;
    firstName: string;
    lastName: string;
    middleName: string;
  },
) {
  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();
  const middleName = profile.middleName.trim();
  const contactNumber = profile.contactNumber.trim();

  if (!firstName || !lastName) {
    throw new AuthServiceError(400, "First name and last name are required.");
  }

  await updateUserProfile(userId, {
    contactNumber,
    firstName,
    lastName,
    middleName,
  });

  return getAccountProfile(userId);
}

export async function changeAccountPassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
) {
  if (!currentPassword || !newPassword) {
    throw new AuthServiceError(400, "Current password and new password are required.");
  }

  if (newPassword.length < 8) {
    throw new AuthServiceError(400, "New password must be at least 8 characters.");
  }

  const user = await findUserById(userId);
  if (!user || !isActiveStatus(user.status)) {
    throw new AuthServiceError(401, "Authentication required.");
  }

  let isValidPassword = await verifyPassword(currentPassword, user.password);
  if (!isValidPassword) {
    const canUpgradeLegacySeed =
      user.password === LEGACY_SEEDED_PASSWORD_MARKER &&
      currentPassword === SEEDED_USER_PASSWORD;
    const canUpgradePlaintext = isLegacyPlaintextPassword(currentPassword, user.password);

    if (canUpgradeLegacySeed || canUpgradePlaintext) {
      isValidPassword = true;
    }
  }

  if (!isValidPassword) {
    throw new AuthServiceError(401, "Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(user.user_id, passwordHash);
}
