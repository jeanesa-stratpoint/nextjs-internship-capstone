import { useBoardStore } from "@/stores/board-store";

describe("Board Store", () => {
  // Reset the store before each test
  beforeEach(() => {
    useBoardStore.setState({ lists: [], tasks: [], isLoading: false });
  });

  it("sets initial board data correctly", () => {
    const mockLists = [
      { id: "list-1", name: "To Do", projectId: "proj-1", order: 0, color: "#6B7280", stage: "unstarted" as const }
    ];
    const mockTasks = [
      { id: "task-1", 
        title: "Fix Drag and Drop", 
        listId: "list-1", 
        order: 0, 
        priority: "high" as const, 
        description: null,
        contentHtml: null,
        attachmentUrl: null,
        assigneeId: null }
    ];

    useBoardStore.getState().setBoardData(mockLists, mockTasks);
    
    const state = useBoardStore.getState();
    expect(state.lists).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.lists[0].name).toBe("To Do");
  });

  it("updates lists independently", () => {
    const newLists = [
      { id: "list-2", name: "Done", projectId: "proj-1", order: 1, color: "#10B981", stage: "completed" as const }
    ];
    
    useBoardStore.getState().setLists(newLists);
    expect(useBoardStore.getState().lists[0].id).toBe("list-2");
  });
});