import {
  CentralisedOrch,
  HierarchicalOrch,
  SharedMemoryOrch,
  NegotiateOrch,
  ConcurrentOrch,
  SequentialOrch,
  GroupCollaborativeOrch,
  HybridAdaptiveOrch,
} from "./";

export const OrchestrationRegistry = {
  "orch-centralised": CentralisedOrch,
  "orch-hierarchical": HierarchicalOrch,
  "orch-shared-memory": SharedMemoryOrch,
  "orch-negotiate": NegotiateOrch,
  "orch-concurrent": ConcurrentOrch,
  "orch-sequential": SequentialOrch,
  "orch-group-collaborative": GroupCollaborativeOrch,
  "orch-hybrid-adaptive": HybridAdaptiveOrch,
};

