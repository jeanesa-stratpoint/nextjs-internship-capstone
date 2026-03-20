import { useToastStore } from "@/stores/toast-store";

describe("Toast Store", () => {
  beforeEach(() => {
    useToastStore.setState({ toast: null });
    jest.useFakeTimers(); // Intercept JavaScript's setTimeout
  });

  afterEach(() => {
    jest.useRealTimers(); // Clean up timers
  });

  it("shows and manually hides a toast", () => {
    expect(useToastStore.getState().toast).toBeNull();

    useToastStore.getState().showToast({ message: "Project created!", type: "success" });
    expect(useToastStore.getState().toast?.message).toBe("Project created!");

    useToastStore.getState().hideToast();
    expect(useToastStore.getState().toast).toBeNull();
  });

  it("auto-hides the toast after the specified duration", () => {
    useToastStore.getState().showToast({ message: "Auto hiding", duration: 3000 });
    expect(useToastStore.getState().toast).not.toBeNull();

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);
    
    expect(useToastStore.getState().toast).toBeNull();
  });
});