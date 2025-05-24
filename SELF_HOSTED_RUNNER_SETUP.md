# Self-Hosted Runner Setup Guide

This guide explains how to set up and troubleshoot self-hosted runners for the ageSchemaClient project.

## Current Issues

The self-hosted runner jobs are queued but not being picked up because:
1. No self-hosted runners are currently registered with the repository
2. The runner needs to have the label `standardbeagle` to match our workflow configuration

## Setting Up a Self-Hosted Runner

### 1. Add Runner to Repository

1. Go to https://github.com/standardbeagle/ageSchemaClient/settings/actions/runners
2. Click "New self-hosted runner"
3. Choose your OS (Linux recommended)
4. Follow the download and configuration instructions

### 2. Add Custom Labels

When configuring the runner, make sure to add the label `standardbeagle`:

```bash
./config.sh --url https://github.com/standardbeagle/ageSchemaClient --token YOUR_TOKEN --labels standardbeagle
```

### 3. Install Required Software

The runner needs:
- Docker (for PostgreSQL service containers)
- Node.js (ideally multiple versions or use a version manager)
- pnpm 10.10.0 or later

#### Installing Node.js with NVM (Recommended)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node versions
nvm install 18
nvm install 20

# Set default
nvm alias default 20
```

#### Installing Docker

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

#### Installing pnpm

```bash
npm install -g pnpm@10.10.0
```

### 4. Start the Runner

```bash
./run.sh
```

Or install as a service:

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

## Testing the Runner

Use the test workflow to verify your runner is working:

```bash
gh workflow run test-self-hosted.yml
```

Or via the GitHub UI:
1. Go to Actions tab
2. Select "Test Self-Hosted Runner" workflow
3. Click "Run workflow"

## Current Workflow Configuration

The integration tests workflow now:
1. Runs quick tests on GitHub-hosted runners (always available)
2. Attempts to run full tests on self-hosted runners (when available)
3. Uses a single Node.js version (20.x) for self-hosted runners to simplify setup
4. Marks self-hosted runner jobs as `continue-on-error: true` so they don't block CI

## Troubleshooting

### Runner Not Picking Up Jobs

1. Check runner is online:
   ```bash
   gh api repos/standardbeagle/ageSchemaClient/actions/runners
   ```

2. Verify runner labels match workflow:
   - Workflow expects: `[self-hosted, standardbeagle]`
   - Runner must have both labels

3. Check runner logs:
   ```bash
   tail -f _diag/Runner_*.log
   ```

### Multiple Node Versions

Self-hosted runners don't support matrix builds the same way as GitHub-hosted runners. Options:

1. **Use a single Node version** (current approach)
2. **Install multiple Node versions** and switch in the workflow:
   ```yaml
   - name: Use Node.js 18
     run: nvm use 18
   ```
3. **Run multiple runners** with different Node versions

### Docker Issues

If Docker service containers fail:

1. Ensure Docker daemon is running:
   ```bash
   sudo systemctl status docker
   ```

2. Check runner user can access Docker:
   ```bash
   docker run hello-world
   ```

3. Check port 5432 is available:
   ```bash
   sudo lsof -i :5432
   ```

## Alternative: Organization-Level Runners

For better resource sharing, consider setting up organization-level runners:

1. Go to https://github.com/organizations/standardbeagle/settings/actions/runners
2. Add runners there instead of repository-level
3. Grant repository access to use organization runners

## References

- [GitHub Self-Hosted Runners Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Runner Labels Documentation](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/using-labels-with-self-hosted-runners)
- [Service Containers Documentation](https://docs.github.com/en/actions/using-workflows/about-service-containers)