import { faker } from '@faker-js/faker';

export type TestUser = {
  id: string;
  email: string;
  name: string;
  role: 'reviewer' | 'validator' | 'admin';
  createdAt: string;
  active: boolean;
};

export function createUserFactory(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'reviewer',
    createdAt: new Date().toISOString(),
    active: true,
    ...overrides,
  };
}
