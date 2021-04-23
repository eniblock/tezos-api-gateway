/**
 * User getting result interface
 */
export interface GetUserResult {
  userId: string;
  address: string;
}

/**
 * User getting result list interface
 */
export interface GetUserListResult {
  getUserResult: GetUserResult[];
}
