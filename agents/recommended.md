# 🧠 Mapping to Your 8 Agent Types

Agent Type	            Recommended Eval Types

Knowledge / Insight	    basic, modelgraded, system
Decision / Strategy	    modelgraded, regression
Creative Generation	    modelgraded, safety
Workflow Assistant	    system, regression, safety
Data Analyst / Debugger	basic, system
Simulation / Scenario	system, regression
Educational / Coach	    modelgraded, safety
Dev Infrastructure	    regression, system

  eval-basic/          # deterministic checks (match/includes/fuzzy/json schema)
  eval-modelgraded/    # LLM-as-judge with rubric (helpfulness, coherence, factuality)
  eval-system/         # end-to-end agent/trace grading (RAG recall, tool correctness)
  eval-safety/         # Goal: detect unsafe, biased, or policy-violating outputs (moderation / PII / toxicity).
  eval-regression/     # Goal: compare the current agent’s results to a stored baseline (for CI/CD gating)


# 🧭 5. How orchestration maps to your agent types

Agent Type	        Recommended Orchestration Style	    Why

Knowledge Insight	LangChain or OpenAI	                RAG pipelines and context reasoning.
Strategy        	LangGraph or CrewAI	                Multiple agents debating or coordinating.
Creative Generation	Direct or OpenAI	                Rapid iteration, minimal latency.
Workflow Assistant	LangGraph	                        Event-driven and memoryful task sequences.
Data Analyst Debugger	LangChain	                    Structured reasoning with tools and code blocks.
Simulation Scenario	CrewAI	                        Multi-role simulation of personas.
Educational 	    LangGraph	                        Adaptive loop with feedback.
Dev Infrastructure	Direct	                        Efficiency and determinism matter most.

This makes orchestration an opt-in runtime behaviour per agent type.