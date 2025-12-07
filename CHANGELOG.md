# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2024-12-07

### Changed
- Switch to npm Trusted Publishing (OIDC) - no token required
- Add provenance attestation for published packages
- Add README and CHANGELOG

## [0.1.3] - 2024-12-07

### Fixed
- Remove `--provenance` flag from npm publish for private repository compatibility

## [0.1.2] - 2024-12-07

### Fixed
- Add crypto polyfill for Node.js test environment (`crypto.getRandomValues`)

## [0.1.1] - 2024-12-07

### Fixed
- Add ESLint configuration file
- Rename package from `@tessera-network/sdk` to `@tessera-network/sdk-ts`

## [0.1.0] - 2024-12-07

### Added
- Initial release
- `TesseraClient` for RPC communication
- `Wallet` class with mnemonic and private key support
- `TransactionBuilder` for constructing transactions
- `KeyPair` for Ed25519 cryptography
- Support for transfer, stake, unstake, and governance transactions
- Mnemonic phrase generation and recovery (BIP39)
- Amount formatting utilities (9 decimal places)
- Address validation and formatting
- TypeScript types for all blockchain entities
