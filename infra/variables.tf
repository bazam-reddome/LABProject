variable "project" {
  type        = string
  default     = "lablms"
  description = "Project short name; lowercase letters and digits only (used in resource names)."

  validation {
    condition     = can(regex("^[a-z0-9]{3,12}$", var.project))
    error_message = "project must be 3-12 chars, lowercase letters and digits only."
  }
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Environment name (e.g. dev, staging, prod)."

  validation {
    condition     = can(regex("^[a-z0-9]{2,8}$", var.environment))
    error_message = "environment must be 2-8 chars, lowercase letters and digits only."
  }
}

variable "location" {
  type        = string
  default     = "westeurope"
  description = "Azure region for all resources."
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Extra tags merged into the default tag set."
}

variable "image_repository" {
  type        = string
  default     = "lab-lms"
  description = "Container image repository name in ACR."
}

variable "image_tag" {
  type        = string
  default     = "latest"
  description = "Container image tag deployed to the app."
}

variable "session_secret" {
  type        = string
  sensitive   = true
  description = "Random string (32+ chars) used to sign session cookies."

  validation {
    condition     = length(var.session_secret) >= 32
    error_message = "session_secret must be at least 32 characters."
  }
}

variable "min_replicas" {
  type        = number
  default     = 1
  description = "Minimum Container App replicas."
}

variable "max_replicas" {
  type        = number
  default     = 3
  description = "Maximum Container App replicas."
}

variable "cpu" {
  type        = number
  default     = 0.5
  description = "CPU cores per replica."
}

variable "memory" {
  type        = string
  default     = "1Gi"
  description = "Memory per replica (must pair with CPU per ACA rules)."
}

variable "data_share_quota_gb" {
  type        = number
  default     = 5
  description = "Azure Files share quota in GiB (SQLite database lives here)."
}
