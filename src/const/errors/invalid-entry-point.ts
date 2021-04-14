export class InvalidEntryPoint extends Error {
  constructor(entryPointsList: string[] | undefined, entryPoint: string) {
    super(
      `The given entryPoint ${entryPoint} does not exist in the contract entryPoint list: ${entryPointsList}`,
    );
  }
}
