export class AddressNotRevealedError extends Error {
  constructor(address: string) {
    super(`Address ${address} is not revealed`);
  }
}
