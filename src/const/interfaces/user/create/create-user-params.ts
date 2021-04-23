/**
 * User creation params interface
 */
export interface CreateUserParams {
  userId: string;
  jobId: number;
}

/**
 * User creation params list interface
 */
export interface CreateUserListParams {
  createUserParamsList: CreateUserParams[];
}
