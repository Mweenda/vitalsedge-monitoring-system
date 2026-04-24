#!/bin/bash
set -e

echo "=============================================="
echo "VitalsEdge Kubernetes Deployment Script"
echo "=============================================="

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-vitalsedge-monitoring-system}"
CLUSTER_NAME="${GKE_CLUSTER_NAME:-vitalsedge-cluster}"
ZONE="${GKE_ZONE:-us-central1-a}"
NAMESPACE="vitalsedge"
K8S_DIR="$(dirname "$0")/k8s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v gcloud >/dev/null 2>&1 || { log_error "gcloud CLI is required"; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required"; exit 1; }
    
    log_info "Prerequisites check passed"
}

# Set up GCS bucket
setup_gcs_bucket() {
    log_info "Setting up GCS bucket for medical corpora..."
    
    BUCKET_NAME="${PROJECT_ID}-medical-corpus"
    
    # Create bucket if it doesn't exist
    if ! gsutil ls -b "gs://${BUCKET_NAME}" >/dev/null 2>&1; then
        gsutil mb -p "${PROJECT_ID}" -l us-central1 "gs://${BUCKET_NAME}"
        log_info "Created GCS bucket: ${BUCKET_NAME}"
    else
        log_info "GCS bucket already exists: ${BUCKET_NAME}"
    fi
    
    # Set bucket policies
    gsutil iam ch allUsers:objectViewer "gs://${BUCKET_NAME}"
    
    # Upload initial corpora
    if [ -d "docs" ]; then
        gsutil cp docs/*.csv "gs://${BUCKET_NAME}/"
        log_info "Uploaded corpora to GCS bucket"
    fi
}

# Create GKE cluster
create_cluster() {
    log_info "Creating GKE cluster..."
    
    if gcloud container clusters describe "${CLUSTER_NAME}" --zone="${ZONE}" >/dev/null 2>&1; then
        log_warn "Cluster ${CLUSTER_NAME} already exists"
    else
        gcloud container clusters create "${CLUSTER_NAME}" \
            --zone="${ZONE}" \
            --num-nodes=3 \
            --machine-type=e2-standard-2 \
            --disk-type=pd-ssd \
            --enable-autoscaling \
            --min-nodes=2 \
            --max-nodes=10 \
            --enable-ip-alias \
            --network=default \
            --subnetwork=default \
            --enable-network-policy \
            --workload-pool="${PROJECT_ID}.svc.id.goog"
        
        log_info "Created GKE cluster: ${CLUSTER_NAME}"
    fi
    
    # Get credentials
    gcloud container clusters get-credentials "${CLUSTER_NAME}" --zone="${ZONE}"
}

# Deploy to Kubernetes
deploy() {
    log_info "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl apply -f "${K8S_DIR}/00-namespace-config.yaml"
    log_info "Created namespace: ${NAMESPACE}"
    
    # Set namespace context
    kubectl config set-context --current --namespace="${NAMESPACE}"
    
    # Apply configurations in order
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f "${K8S_DIR}/01-backend-deployment.yaml"
    kubectl apply -f "${K8S_DIR}/02-frontend-deployment.yaml"
    kubectl apply -f "${K8S_DIR}/03-corpus-deployment.yaml"
    kubectl apply -f "${K8S_DIR}/04-ingress.yaml"
    kubectl apply -f "${K8S_DIR}/05-monitoring.yaml"
    
    log_info "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/vitalsedge-backend -n "${NAMESPACE}"
    kubectl wait --for=condition=available --timeout=300s deployment/vitalsedge-frontend -n "${NAMESPACE}"
    
    log_info "Deployment complete!"
}

# Show status
status() {
    log_info "Deployment status:"
    kubectl get all -n "${NAMESPACE}"
    echo ""
    log_info "Ingress status:"
    kubectl get ingress -n "${NAMESPACE}"
}

# Show logs
logs() {
    SERVICE="${1:-backend}"
    kubectl logs -l app=vitalsedge-${SERVICE} -n "${NAMESPACE}" --tail=100
}

# Scale deployment
scale() {
    SERVICE="${1:-backend}"
    REPLICAS="${2:-2}"
    kubectl scale deployment/vitalsedge-${SERVICE} -n "${NAMESPACE}" --replicas="${REPLICAS}"
}

# Main menu
main() {
    case "${1}" in
        setup)
            check_prerequisites
            setup_gcs_bucket
            ;;
        cluster)
            check_prerequisites
            create_cluster
            ;;
        deploy)
            check_prerequisites
            deploy
            ;;
        all)
            check_prerequisites
            setup_gcs_bucket
            create_cluster
            deploy
            ;;
        status)
            status
            ;;
        logs)
            logs "${2:-backend}"
            ;;
        scale)
            scale "${2:-backend}" "${3:-2}"
            ;;
        destroy)
            log_warn "Destroying all resources..."
            kubectl delete namespace "${NAMESPACE}"
            gcloud container clusters delete "${CLUSTER_NAME}" --zone="${ZONE}" --quiet
            gsutil rm -r "gs://${PROJECT_ID}-medical-corpus"
            ;;
        *)
            echo "Usage: $0 {setup|cluster|deploy|all|status|logs|scale|destroy}"
            echo ""
            echo "Commands:"
            echo "  setup    - Set up GCS bucket for medical corpora"
            echo "  cluster  - Create GKE cluster"
            echo "  deploy   - Deploy to existing cluster"
            echo "  all      - Full setup (setup + cluster + deploy)"
            echo "  status   - Show deployment status"
            echo "  logs      - Show logs (optional: service name)"
            echo "  scale     - Scale service (service replicas)"
            echo "  destroy   - Remove all resources"
            exit 1
            ;;
    esac
}

main "$@"