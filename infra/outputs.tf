output "app_url" {
  description = "Public HTTPS URL of the LMS app."
  value       = "https://${azurerm_container_app.app.latest_revision_fqdn}"
}

output "container_app_name" {
  description = "Container App resource name (use with az containerapp commands)."
  value       = azurerm_container_app.app.name
}

output "resource_group_name" {
  description = "Resource group containing all resources."
  value       = azurerm_resource_group.main.name
}

output "acr_name" {
  description = "ACR resource name (use with `az acr login --name`)."
  value       = azurerm_container_registry.main.name
}

output "acr_login_server" {
  description = "ACR login server (used as the docker push target)."
  value       = azurerm_container_registry.main.login_server
}

output "image_reference" {
  description = "Fully-qualified image reference the Container App pulls."
  value       = "${azurerm_container_registry.main.login_server}/${var.image_repository}:${var.image_tag}"
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace receiving Container Apps logs."
  value       = azurerm_log_analytics_workspace.main.id
}
