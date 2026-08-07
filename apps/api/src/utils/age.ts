export const ageFromBirthDate = (birthDate: Date, now = new Date()): number => {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear()
  const birthdayPending =
    now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() &&
      now.getUTCDate() < birthDate.getUTCDate())
  if (birthdayPending) age -= 1
  return age
}
