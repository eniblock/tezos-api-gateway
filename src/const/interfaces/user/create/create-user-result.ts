/**
 * User creation result interface
 */
export interface CreateUserResult {
  userId: string;
  adress: string;
}

/**
 * User creation result list interface
 */
export interface CreateUserListResult {
  createUserResult: CreateUserResult[];
}
