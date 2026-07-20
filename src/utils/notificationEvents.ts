type Listener = (count: number) => void;

const listeners = new Set<Listener>();

export const notificationEvents = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(count: number) {
    listeners.forEach(fn => {
      try {
        fn(count);
      } catch (e) {
        // ignore listener errors
      }
    });
  },
};

export default notificationEvents;
