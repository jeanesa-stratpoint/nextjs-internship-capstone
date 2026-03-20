import { useUIStore } from "@/stores/ui-store";

describe("UI Store", () => {
  // Reset the store before each test
  beforeEach(() => {
    useUIStore.setState({
      isCreateProjectModalOpen: false,
      isTaskDetailModalOpen: false,
      selectedTaskId: null,
      isSidebarCollapsed: false,
    });
  });

  it("toggles the create project modal", () => {
    const store = useUIStore.getState();
    expect(store.isCreateProjectModalOpen).toBe(false);

    useUIStore.getState().openCreateProjectModal();
    expect(useUIStore.getState().isCreateProjectModalOpen).toBe(true);

    useUIStore.getState().closeCreateProjectModal();
    expect(useUIStore.getState().isCreateProjectModalOpen).toBe(false);
  });

  it("opens task detail modal with correct task ID", () => {
    const testTaskId = "task-999";
    
    useUIStore.getState().openTaskDetailModal(testTaskId);
    
    expect(useUIStore.getState().isTaskDetailModalOpen).toBe(true);
    expect(useUIStore.getState().selectedTaskId).toBe(testTaskId);
  });

  it("toggles the sidebar correctly", () => {
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
    
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(true);
    
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarCollapsed).toBe(false);
  });
});