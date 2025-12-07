# Deployment Guide

This guide covers deploying the Skillz application to Azure using Terraform.

## Prerequisites

1. Azure account with appropriate permissions
2. Terraform installed (v1.0+)
3. Azure CLI installed and configured
4. GitHub repository with secrets configured

## Step 1: Azure Setup

### Login to Azure

```bash
az login
```

### Create Service Principal (for CI/CD)

```bash
az ad sp create-for-rbac --name "skillz-sp" --role contributor --scopes /subscriptions/{subscription-id} --sdk-auth
```

Save the output as a GitHub secret named `AZURE_CREDENTIALS`.

## Step 2: Terraform Configuration

### 1. Navigate to terraform directory

```bash
cd terraform
```

### 2. Create terraform.tfvars

```hcl
location = "East US"
db_admin_user = "skillzadmin"
db_admin_password = "YourSecurePassword123!"
jwt_secret = "YourJWTSecretKey123!"
```

**Important**: Never commit `terraform.tfvars` to version control.

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Review the plan

```bash
terraform plan
```

### 5. Apply the configuration

```bash
terraform apply
```

This will create:
- Resource Group
- App Service Plan
- Two App Services (backend and frontend)
- MySQL Flexible Server
- Database
- Firewall rules

## Step 3: Configure Application Settings

### Backend App Settings

In Azure Portal, navigate to your backend App Service and add/update these Application Settings:

- `NODE_ENV`: production
- `PORT`: 8080
- `DB_HOST`: (from Terraform output)
- `DB_USER`: (from Terraform output)
- `DB_PASSWORD`: (from Terraform output)
- `DB_NAME`: skillz_db
- `JWT_SECRET`: (your JWT secret)

### Frontend App Settings

In Azure Portal, navigate to your frontend App Service and add:

- `REACT_APP_API_URL`: https://your-backend-url.azurewebsites.net/api

## Step 4: Deploy Application

### Option 1: Using GitHub Actions (Recommended)

1. Push code to main branch
2. GitHub Actions will automatically:
   - Run tests
   - Build frontend
   - Deploy to Azure

### Option 2: Manual Deployment

#### Backend Deployment

```bash
# Install Azure CLI extension
az extension add --name webapp

# Deploy backend
cd server
az webapp up --name <backend-app-name> --resource-group skillz-rg --runtime "NODE:18-lts"
```

#### Frontend Deployment

```bash
# Build frontend
cd client
npm run build

# Deploy frontend
az webapp up --name <frontend-app-name> --resource-group skillz-rg --runtime "NODE:18-lts"
```

## Step 5: Database Migration

The database schema is automatically created when the backend starts. However, you can also run migrations manually if needed.

## Step 6: Verify Deployment

1. Check backend health: `https://your-backend-url.azurewebsites.net/api/health`
2. Access frontend: `https://your-frontend-url.azurewebsites.net`
3. Test user registration and login

## Troubleshooting

### Backend not starting

- Check Application Settings in Azure Portal
- Review logs: `az webapp log tail --name <app-name> --resource-group skillz-rg`
- Verify database connection settings

### Frontend not connecting to backend

- Verify `REACT_APP_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is accessible

### Database connection issues

- Verify firewall rules allow Azure services
- Check database credentials
- Ensure database server is running

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete all resources and data.

## Cost Optimization

- Use Basic tier for development
- Scale down during non-business hours
- Use Azure Dev/Test pricing if eligible
- Monitor usage in Azure Cost Management

## Security Best Practices

1. Use Azure Key Vault for secrets
2. Enable HTTPS only
3. Configure CORS properly
4. Use managed identities where possible
5. Regularly update dependencies
6. Enable Azure Security Center

## Monitoring

- Set up Application Insights
- Configure alerts for errors
- Monitor database performance
- Track API response times

