export class AddressAlreadyRevealedError extends Error {
  constructor(address: string) {
    super(`Address ${address} is already revealed`);
  }
}
