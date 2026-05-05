# Azure Infrastructure (Terraform)

Provisions hosting for the LMS app on Azure.

## Architecture

```
Internet ──HTTPS──> Container Apps Environment ──> Container App (Next.js)
                              │                          │
                              ├── Log Analytics          ├── Azure Files (SQLite at /data)
                              └── Managed Identity ──pull──> Azure Container Registry
```

| Resource                       | Purpose                                              |
|--------------------------------|------------------------------------------------------|
| Resource Group                 | Bounding scope for everything below.                 |
| Log Analytics Workspace        | Stdout/stderr + platform metrics from ACA.           |
| Azure Container Registry (ACR) | Holds the app image. Admin disabled; MI for pulls.   |
| User-Assigned Managed Identity | ACA pulls from ACR using this (no passwords).        |
| Storage Account + File Share   | Persists `lms.db` across replica restarts.           |
| Container Apps Environment     | Shared compute/networking plane for the app.         |
| Container App                  | The Next.js workload. HTTPS-only, autoscale 1–3.     |

## Prereqs

- Terraform `>= 1.6`
- Azure CLI (`az login` then `az account set --subscription <id>`)
- Docker (to build/push the image)

## First deploy

```bash
cd infra

cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars — at minimum set session_secret:
#   openssl rand -base64 48

terraform init
terraform apply
```

The first `apply` provisions the registry but the app will fail to start
because no image exists yet. Build and push, then restart the revision:

```bash
ACR=$(terraform output -raw acr_name)
IMAGE=$(terraform output -raw image_reference)
APP=$(terraform output -raw container_app_name)
RG=$(terraform output -raw resource_group_name)

az acr login --name "$ACR"
docker build -t "$IMAGE" ..
docker push "$IMAGE"

az containerapp revision restart \
  --name "$APP" \
  --resource-group "$RG" \
  --revision "$(az containerapp revision list -n "$APP" -g "$RG" --query '[0].name' -o tsv)"

terraform output app_url
```

## Subsequent deploys

Tag the image with the new version and bump `image_tag` in `terraform.tfvars`,
then `terraform apply` — Container Apps creates a new revision and shifts traffic.

```bash
docker build -t "$(terraform output -raw acr_login_server)/lab-lms:v0.2.0" ..
docker push "$(terraform output -raw acr_login_server)/lab-lms:v0.2.0"
terraform apply -var image_tag=v0.2.0
```

## Remote state (recommended for shared work)

Bootstrap a tfstate storage account once, then uncomment the `backend "azurerm"`
block in `providers.tf` and run `terraform init -migrate-state`.

## Production hardening (next steps)

- Replace SQLite + Azure Files with Azure Database for PostgreSQL Flexible Server.
  Azure Files works for an MVP but doesn't support concurrent writers or scaling
  past one replica safely with SQLite.
- Add Azure Front Door + custom domain + WAF.
- Move secrets from `secret { ... }` blocks to Key Vault references.
- Enable Defender for Containers and ACR vulnerability scanning.
- Restrict ingress to a VNet + Private Endpoint if exposed via Front Door only.

## Destroy

```bash
terraform destroy
```
