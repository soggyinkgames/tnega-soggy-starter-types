# Dev Container

This repository includes a VS Code Dev Container configuration for a clean Node 22 development environment.

## Open In VS Code

1. Install Docker Desktop or another compatible container runtime.
2. Install the VS Code **Dev Containers** extension.
3. Open this repository in VS Code.
4. Run **Dev Containers: Reopen in Container** from the Command Palette.

VS Code will build the container from `.devcontainer/devcontainer.json`, install the configured VS Code extensions, and open terminals inside the isolated Linux container as the `node` user.

## Runtime

The container uses Node 22 and forwards port `3000` to the host so local servers can be opened at `localhost:3000`.
