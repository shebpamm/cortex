use crate::elastic::{ClusterInfo, ElasticsearchClient, IndexInfo};
use tokio::sync::RwLock;
use std::sync::Arc;

#[derive(Debug)]
pub struct Warehouse {
    pub client: ElasticsearchClient,
    pub cluster: Arc<RwLock<ClusterInfo>>,
    pub indices: Arc<RwLock<Vec<IndexInfo>>>,
}

impl Warehouse {
    pub async fn new(base_url: &str) -> Self {
        let client = ElasticsearchClient::new(base_url);
        let cluster = client.health().await.unwrap();
        let indices = client.indices().await.unwrap();

        Warehouse {
            client,
            cluster: Arc::new(RwLock::new(cluster)),
            indices: Arc::new(RwLock::new(indices)),
        }
    }

    pub async fn refresh(&self) {
        let cluster_data = self.client.health().await.unwrap();
        let indices_data = self.client.indices().await.unwrap();

        let mut cluster = self.cluster.write().await;
        *cluster = cluster_data;

        let mut indices = self.indices.write().await;
        *indices = indices_data;
    }

    pub fn start_refresh(warehouse: Arc<RwLock<Warehouse>>) {
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                let warehouse = warehouse.read().await;
                warehouse.refresh().await;
            }
        });
    }
}
