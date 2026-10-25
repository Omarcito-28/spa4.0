import { describe, expect, it, vi } from 'vitest';
import { notifyAppointmentsChanged, subscribeAppointmentsChanged } from './appointmentEvents';

const CHANNEL = 'essence-appointments';
const nextMessage = channel => new Promise(resolve => { channel.onmessage = event => resolve(event.data); });

describe('appointmentEvents', () => {
  it('avisa a las otras pestañas cuando cambia una cita', async () => {
    const otherTab = new BroadcastChannel(CHANNEL);
    const received = nextMessage(otherTab);

    notifyAppointmentsChanged();

    await expect(received).resolves.toMatchObject({ type: 'appointments-changed' });
    otherTab.close();
  });

  it('notifica a los suscriptores cuando otra pestaña avisa y permite desuscribirse', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAppointmentsChanged(listener);
    const otherTab = new BroadcastChannel(CHANNEL);

    otherTab.postMessage({ type: 'appointments-changed' });
    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));

    unsubscribe();
    otherTab.postMessage({ type: 'appointments-changed' });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(listener).toHaveBeenCalledTimes(1);
    otherTab.close();
  });

  it('no se avisa a sí misma: la pestaña que cambia la cita refresca por su cuenta', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAppointmentsChanged(listener);

    notifyAppointmentsChanged();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
