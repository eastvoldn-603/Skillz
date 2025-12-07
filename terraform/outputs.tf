output "backend_url" {
  description = "Backend API URL"
  value       = "https://${azurerm_linux_web_app.skillz_backend.default_hostname}"
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${azurerm_linux_web_app.skillz_frontend.default_hostname}"
}

output "database_host" {
  description = "MySQL database host"
  value       = azurerm_mysql_flexible_server.skillz.fqdn
  sensitive   = true
}

