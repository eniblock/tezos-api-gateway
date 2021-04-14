export interface MessageValidationSchema {
  type?: string;
  additionalProperties?: boolean;
  required?: string[];
  description?: string;
  items?: MessageValidationSchema;
  pattern?: string;
  properties?: { [key: string]: MessageValidationSchema };
  oneOf?: { type: string }[];
}
