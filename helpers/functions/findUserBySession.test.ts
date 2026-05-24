import { describe, it, expect } from 'vitest';
import { findUserBySession, findUserIndexBySession } from './findUserBySession';
import { BorgWarehouseUser } from '~/types';

const usersList: BorgWarehouseUser[] = [
  { id: 1, username: 'Ada', email: 'ada@example.com', password: 'hashed', roles: ['admin'] },
  {
    id: 2,
    username: 'Lovelace',
    email: 'lovelace@example.com',
    password: 'hashed',
    roles: ['user'],
  },
];

describe('findUserBySession', () => {
  it('should return the matching user when id matches', () => {
    const session = { user: { id: '1', name: 'Ada', email: 'ada@example.com' } };
    expect(findUserBySession(usersList, session)).toEqual(usersList[0]);
  });

  it('should return the correct user among multiple users', () => {
    const session = { user: { id: '2', name: 'Lovelace', email: 'lovelace@example.com' } };
    expect(findUserBySession(usersList, session)).toEqual(usersList[1]);
  });

  it('should return undefined when id does not match any user', () => {
    const session = { user: { id: '99', name: 'Ghost', email: 'ghost@example.com' } };
    expect(findUserBySession(usersList, session)).toBeUndefined();
  });

  it('should return undefined when session is null', () => {
    expect(findUserBySession(usersList, null)).toBeUndefined();
  });

  it('should return undefined when session.user.id is missing', () => {
    const session = { user: { name: 'Ada', email: 'ada@example.com' } };
    expect(findUserBySession(usersList, session as any)).toBeUndefined();
  });

  it('should return undefined when session.user.id is not a valid number', () => {
    const session = { user: { id: 'not-a-number', name: 'Ada', email: 'ada@example.com' } };
    expect(findUserBySession(usersList, session)).toBeUndefined();
  });

  it('should return undefined when usersList is empty', () => {
    const session = { user: { id: '1', name: 'Ada', email: 'ada@example.com' } };
    expect(findUserBySession([], session)).toBeUndefined();
  });
});

describe('findUserIndexBySession', () => {
  it('should return the correct index when id matches', () => {
    const session = { user: { id: '1', name: 'Ada', email: 'ada@example.com' } };
    expect(findUserIndexBySession(usersList, session)).toBe(0);
  });

  it('should return the correct index among multiple users', () => {
    const session = { user: { id: '2', name: 'Lovelace', email: 'lovelace@example.com' } };
    expect(findUserIndexBySession(usersList, session)).toBe(1);
  });

  it('should return -1 when id does not match any user', () => {
    const session = { user: { id: '99', name: 'Ghost', email: 'ghost@example.com' } };
    expect(findUserIndexBySession(usersList, session)).toBe(-1);
  });

  it('should return -1 when session is null', () => {
    expect(findUserIndexBySession(usersList, null)).toBe(-1);
  });

  it('should return -1 when session.user.id is missing', () => {
    const session = { user: { name: 'Ada', email: 'ada@example.com' } };
    expect(findUserIndexBySession(usersList, session as any)).toBe(-1);
  });

  it('should return -1 when session.user.id is not a valid number', () => {
    const session = { user: { id: 'not-a-number', name: 'Ada', email: 'ada@example.com' } };
    expect(findUserIndexBySession(usersList, session)).toBe(-1);
  });

  it('should return -1 when usersList is empty', () => {
    const session = { user: { id: '1', name: 'Ada', email: 'ada@example.com' } };
    expect(findUserIndexBySession([], session)).toBe(-1);
  });
});
