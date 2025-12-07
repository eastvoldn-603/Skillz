terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "skillz" {
  name     = "skillz-rg"
  location = var.location
}

# App Service Plan
resource "azurerm_service_plan" "skillz" {
  name                = "skillz-app-plan"
  resource_group_name = azurerm_resource_group.skillz.name
  location            = azurerm_resource_group.skillz.location
  os_type             = "Linux"
  sku_name            = "B1"
}

# Web App for Backend
resource "azurerm_linux_web_app" "skillz_backend" {
  name                = "skillz-backend-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.skillz.name
  location            = azurerm_service_plan.skillz.location
  service_plan_id     = azurerm_service_plan.skillz.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }
    always_on = false
  }

  app_settings = {
    "NODE_ENV"           = "production"
    "PORT"               = "8080"
    "DB_HOST"            = azurerm_mysql_flexible_server.skillz.fqdn
    "DB_USER"            = azurerm_mysql_flexible_server.skillz.administrator_login
    "DB_PASSWORD"        = azurerm_mysql_flexible_server.skillz.administrator_password
    "DB_NAME"            = azurerm_mysql_flexible_database.skillz.name
    "JWT_SECRET"         = var.jwt_secret
  }
}

# Web App for Frontend
resource "azurerm_linux_web_app" "skillz_frontend" {
  name                = "skillz-frontend-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.skillz.name
  location            = azurerm_service_plan.skillz.location
  service_plan_id     = azurerm_service_plan.skillz.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }
    always_on = false
  }

  app_settings = {
    "REACT_APP_API_URL" = "https://${azurerm_linux_web_app.skillz_backend.default_hostname}/api"
  }
}

# MySQL Flexible Server
resource "azurerm_mysql_flexible_server" "skillz" {
  name                   = "skillz-mysql-${random_string.suffix.result}"
  resource_group_name    = azurerm_resource_group.skillz.name
  location               = azurerm_resource_group.skillz.location
  administrator_login    = var.db_admin_user
  administrator_password = var.db_admin_password
  sku_name              = "B_Standard_B1ms"
  version               = "8.0.21"
  backup_retention_days = 7
  geo_redundant_backup_enabled = false
}

# MySQL Database
resource "azurerm_mysql_flexible_database" "skillz" {
  name                = "skillz_db"
  resource_group_name = azurerm_resource_group.skillz.name
  server_name         = azurerm_mysql_flexible_server.skillz.name
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}

# MySQL Firewall Rule - Allow Azure Services
resource "azurerm_mysql_flexible_server_firewall_rule" "azure_services" {
  name                = "AllowAzureServices"
  resource_group_name = azurerm_resource_group.skillz.name
  server_name         = azurerm_mysql_flexible_server.skillz.name
  start_ip_address    = "0.0.0.0"
  end_ip_address      = "0.0.0.0"
}

# Random suffix for unique names
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

