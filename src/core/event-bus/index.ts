type EventHandler<T = unknown> = (payload: T) => void;

interface EventBus {
  publish<T = unknown>(event: string, payload?: T): void;
  subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  unsubscribe(event: string, handler: EventHandler): void;
  clear(event?: string): void;
  // Aliases for compatibility
  emit<T = unknown>(event: string, payload?: T): void;
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  off(event: string, handler: EventHandler): void;
}

class EventBusImpl implements EventBus {
  private subscribers: Record<string, EventHandler[]> = {};

  publish<T = unknown>(event: string, payload?: T): void {
    if (!this.subscribers[event]) return;
    
    console.debug(`[EventBus] Publishing ${event}`, payload);
    this.subscribers[event].forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }
    });
  }

  subscribe<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }

    const wrappedHandler = handler as EventHandler;
    this.subscribers[event].push(wrappedHandler);
    console.debug(`[EventBus] Subscribed to ${event}`);

    return () => this.unsubscribe(event, wrappedHandler);
  }

  unsubscribe(event: string, handler: EventHandler): void {
    if (!this.subscribers[event]) return;
    
    this.subscribers[event] = this.subscribers[event].filter(
      h => h !== handler
    );
    console.debug(`[EventBus] Unsubscribed from ${event}`);
  }

  clear(event?: string): void {
    if (event) {
      delete this.subscribers[event];
      console.debug(`[EventBus] Cleared all subscribers for ${event}`);
    } else {
      this.subscribers = {};
      console.debug('[EventBus] Cleared all subscribers');
    }
  }

  // Alias methods for compatibility with event emitter patterns
  emit<T = unknown>(event: string, payload?: T): void {
    this.publish(event, payload);
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    return this.subscribe(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    this.unsubscribe(event, handler);
  }
}

export const eventBus = new EventBusImpl();
export type { EventBus };
export { EventBusImpl };