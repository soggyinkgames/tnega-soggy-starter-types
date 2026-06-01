npm run new-agent <your-agent-name>

That command will now:

✅ Prompt you to select the agent type

✅ Ask whether to use default evals or pick your own

✅ Copy the correct template folder

✅ Replace placeholders ({{AGENT_NAME}}, {{AGENT_TITLE}}, etc.)

✅ Write the selected evals into config.ts

✅ Dynamically generate the new eval.ts file




npm run agent <your-agent-name> <"my query eg summarize the">

Run an agent without evals:

```bash
npm run agent -- <your-agent-name> "my query eg summarize the" --no-evals
```

Direct script form:

```bash
tsx scripts/run-agent.ts <your-agent-name> "my query eg summarize the" --no-evals
```
