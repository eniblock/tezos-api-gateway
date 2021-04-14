export class AddressNotFoundError extends Error {
  constructor(address: string) {
    super(`Could not find the adress: ${address}`);
  }
}
