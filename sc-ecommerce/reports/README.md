# Ecommerce Contract Reports

This directory contains all reports generated during the development and testing of the Ecommerce smart contract.

## Available Reports

- `gas_report.md`: Detailed gas consumption analysis for all contract functions
- `security_audit.md`: Security assessment including reentrancy, access control, and other vulnerabilities
- `test_coverage.md`: Test coverage report showing which functions and branches are covered by tests
- `contract_structure.md`: UML diagram and detailed description of contract architecture
- `deployment_summary.md`: Summary of deployment parameters and contract addresses

## Report Generation

All reports are generated automatically by running the deployment script:

```bash
./script/deploy.sh
```

This script will compile, test, generate gas reports, and deploy the contract to a local Anvil node.