// Avisa a las demás pestañas del mismo navegador que cambió una cita, para que
// sus paneles se actualicen sin esperar al siguiente ciclo de 30 s. La pestaña
// que hizo el cambio refresca por su cuenta. Un BroadcastChannel no recibe sus
// propios mensajes, así que usar una sola instancia limita el aviso a otras pestañas.
const CHANNEL_NAME = 'essence-appointments';
const listeners = new Set();
let channel;

const getChannel = () => {
  if (channel !== undefined) return channel;
  channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL_NAME) : null;
  if (channel) channel.onmessage = () => listeners.forEach(listener => listener());
  return channel;
};

export const notifyAppointmentsChanged = () => {
  getChannel()?.postMessage({ type: 'appointments-changed', at: Date.now() });
};

export const subscribeAppointmentsChanged = listener => {
  getChannel();
  listeners.add(listener);
  return () => listeners.delete(listener);
};
