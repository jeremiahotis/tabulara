import { test, expect } from '@playwright/test';
import {
  createCreateSessionCommandEnvelope,
  createPinSessionCommandEnvelope,
} from '../support/fixtures/factories/session-command-factory';

test.describe('Story 1.2 session command handlers (ATDD RED)', () => {
  test.skip(
    '[P0][AC1] should create a session only through CreateSession command handlers',
    async ({ request }) => {
      const command = createCreateSessionCommandEnvelope();

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body).toMatchObject({
        accepted: true,
        command_id: command.command_id,
        mutation_applied: true,
        event_appended: true,
        session: {
          project_id: command.payload.project_id,
          schema_id: command.payload.schema_id,
          status: 'created',
        },
      });
    },
  );

  test.skip(
    '[P0][AC1] should append SessionCreated in audit_log with caused_by linked to command_id',
    async ({ request }) => {
      const command = createCreateSessionCommandEnvelope();

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body.audit_log).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'SessionCreated',
            caused_by: command.command_id,
            data: expect.objectContaining({
              project_id: command.payload.project_id,
              schema_id: command.payload.schema_id,
            }),
          }),
        ]),
      );
    },
  );

  test.skip(
    '[P0][AC2] should pin a session atomically and append SessionPinned in the same transaction',
    async ({ request }) => {
      const command = createPinSessionCommandEnvelope({
        payload: { pinned: true },
      });

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body).toMatchObject({
        accepted: true,
        command_id: command.command_id,
        transaction: expect.objectContaining({
          atomic: true,
        }),
        session: expect.objectContaining({
          id: command.payload.session_id,
          pinned: true,
        }),
        events: expect.arrayContaining([
          expect.objectContaining({
            type: 'SessionPinned',
            caused_by: command.command_id,
          }),
        ]),
      });
    },
  );

  test.skip(
    '[P1][AC2] should unpin a session atomically and append SessionUnpinned in the same transaction',
    async ({ request }) => {
      const command = createPinSessionCommandEnvelope({
        payload: { pinned: false },
      });

      const response = await request.post('/api/v1/commands/dispatch', {
        data: command,
      });

      expect(response.status()).toBe(202);
      const body = await response.json();
      expect(body).toMatchObject({
        accepted: true,
        command_id: command.command_id,
        transaction: expect.objectContaining({
          atomic: true,
        }),
        session: expect.objectContaining({
          id: command.payload.session_id,
          pinned: false,
        }),
        events: expect.arrayContaining([
          expect.objectContaining({
            type: 'SessionUnpinned',
            caused_by: command.command_id,
          }),
        ]),
      });
    },
  );
});
