use crate::elastic::{ClusterInfo, ElasticsearchClient, IndexInfo, Recovery, ShallowShard};
use log::debug;
use tokio::sync::RwLock;
use std::sync::Arc;
use once_cell::sync::OnceCell;

pub static WAREHOUSE: OnceCell<std::sync::Arc<tokio::sync::RwLock<Warehouse>>> = OnceCell::new();

#[derive(Debug)]
pub struct Warehouse {
    pub client: ElasticsearchClient,
    pub cluster: Arc<RwLock<ClusterInfo>>,
    pub indices: Arc<RwLock<Vec<IndexInfo>>>,
    pub recovery: Arc<RwLock<Recovery>>,
    pub shards: Arc<RwLock<Vec<ShallowShard>>>,
}

impl Warehouse {
    pub async fn new(base_url: &str) -> Self {
        let client = ElasticsearchClient::new(base_url);
        let cluster = client.health().await.unwrap();
        let recovery = client.recovery().await.unwrap();
        let shards = client.shards().await.unwrap();
        let indices = client.indices().await.unwrap();

        Warehouse {
            client,
            cluster: Arc::new(RwLock::new(cluster)),
            indices: Arc::new(RwLock::new(indices)),
            recovery: Arc::new(RwLock::new(recovery)),
            shards: Arc::new(RwLock::new(shards)),
        }
    }

    pub async fn refresh(&self) {
        {
            let cluster_data = self.client.health().await.unwrap();
            let mut cluster = self.cluster.write().await;
            *cluster = cluster_data;
        }

        {
            let indices_data = self.client.indices().await.unwrap();
            let mut indices = self.indices.write().await;
            *indices = indices_data;
        }

        {
            let recovery_data = self.client.recovery().await.unwrap();
            let mut recovery = self.recovery.write().await;
            *recovery = recovery_data;
        }

        {
            let shards_data = self.client.shards().await.unwrap();
            let mut shards = self.shards.write().await;
            *shards = shards_data;
        }
    }

    pub fn start_refresh(warehouse: Arc<RwLock<Warehouse>>) {
        debug!("Spawning refresh loop...");
        tokio::spawn(async move {
            loop {
                debug!("Sleeping for 5 seconds...");
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                debug!("Refreshing data...");
                let warehouse = warehouse.read().await;
                warehouse.refresh().await;
                debug!("Data refreshed!");
            }
        });
    }
}
