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

function validateEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  if (!isValidEmail || normalizedEmail.length > 254) {
    throw new AuthServiceError(400, "A valid email address is required.");
  }

  return normalizedEmail;
}

function validatePasswordPolicy(password: string) {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length < 10 || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
    throw new AuthServiceError(
      400,
      "Password must be at least 10 characters and include uppercase, lowercase, number, and symbol characters.",
    );
  }
}

function validateProfileText(value: string, label: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new AuthServiceError(400, `${label} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

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
  const user = await findUserByEmail(validateEmail(email));
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

export async function registerLocalUser(
  email: string,
  password: string,
  profile?: {
    contactNumber: string;
    firstName: string;
    lastName: string;
    middleName: string;
  },
): Promise<AuthUserRow> {
  const normalizedEmail = validateEmail(email);
  validatePasswordPolicy(password);

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AuthServiceError(409, "An account with that email already exists.");
  }

  const firstName = validateProfileText(profile?.firstName ?? "", "First name", 80);
  const lastName = validateProfileText(profile?.lastName ?? "", "Last name", 80);
  const middleName = validateProfileText(profile?.middleName ?? "", "Middle name", 80);
  const contactNumber = validateProfileText(profile?.contactNumber ?? "", "Contact number", 40);

  if (!firstName || !lastName) {
    throw new AuthServiceError(400, "First name and last name are required.");
  }

  const passwordHash = await hashPassword(password);
  return createLocalUser(normalizedEmail, passwordHash, {
    contactNumber,
    firstName,
    lastName,
    middleName,
  });
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
  const middleName = validateProfileText(profile.middleName, "Middle name", 80);
  const contactNumber = validateProfileText(profile.contactNumber, "Contact number", 40);

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

  validatePasswordPolicy(newPassword);

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

export async function verifyCurrentPassword(userId: number, currentPassword: string) {
  if (!currentPassword) {
    throw new AuthServiceError(400, "Current password is required.");
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

    isValidPassword = canUpgradeLegacySeed || canUpgradePlaintext;
  }

  if (!isValidPassword) {
    throw new AuthServiceError(401, "Current password is incorrect.");
  }
}
