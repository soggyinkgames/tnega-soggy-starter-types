# 🧠 Mapping to Your 8 Agent Types

Agent Type	            Recommended Eval Types

Knowledge / Insight	    basic, modelgraded, system
Decision / Strategy	    modelgraded, regression
Creative Generation	    modelgraded, safety
Workflow Assistant	    system, regression, safety
Data Analyst / Debugger	basic, system
Simulation / Scenario	system, regression
Educational / Coach	    modelgraded, safety
Dev Infrastructure	    regression, 

  eval-basic/          # deterministic checks (match/includes/fuzzy/json schema)
  eval-modelgraded/    # LLM-as-judge with rubric (helpfulness, coherence, factuality)
  eval-system/         # end-to-end agent/trace grading (RAG recall, tool correctness)
  eval-safety/         # Goal: detect unsafe, biased, or policy-violating outputs (moderation / PII / toxicity).
  eval-regression/     # Goal: compare the current agent’s results to a stored baseline (for CI/CD gating)