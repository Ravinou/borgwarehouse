// This function is used to hash user passwords and to verify them with the bcryptjs library
//Lib
import { hash, compare } from 'bcryptjs';

export async function hashPassword(password) {
  return await hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return await compare(password, hashedPassword);
}
