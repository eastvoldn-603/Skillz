variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "db_admin_user" {
  description = "MySQL administrator username"
  type        = string
  default     = "skillzadmin"
}

variable "db_admin_password" {
  description = "MySQL administrator password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

