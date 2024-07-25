use crate::elastic::data::{ClusterInfo, NodeOutput, Recovery, ShallowShard, IndexInfo};
use crate::elastic::client::ElasticsearchClient;
use crate::config;
use anyhow::Result;
use log::debug;
use tokio::sync::RwLock;
use std::sync::Arc;
use once_cell::sync::OnceCell;

pub static WAREHOUSE: OnceCell<std::sync::Arc<tokio::sync::RwLock<Warehouse>>> = OnceCell::new();
pub static CONFIG: OnceCell<config::Config> = OnceCell::new();

#[derive(Debug)]
pub struct Warehouse {
    pub client: ElasticsearchClient,
    pub cluster: Arc<RwLock<ClusterInfo>>,
    pub indices: Arc<RwLock<Vec<IndexInfo>>>,
    pub recovery: Arc<RwLock<Recovery>>,
    pub shards: Arc<RwLock<Vec<ShallowShard>>>,
    pub nodes: Arc<RwLock<NodeOutput>>,
}

impl Warehouse {
    pub async fn new(base_url: &str) -> Self {
        let client = ElasticsearchClient::new(base_url);
        let nodes = client.nodes().await.unwrap();
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
            nodes: Arc::new(RwLock::new(nodes)),
        }
    }

    pub async fn refresh(&self) -> Result<()> {
        {
            let cluster_data = self.client.health().await?;
            let mut cluster = self.cluster.write().await;
            *cluster = cluster_data;
        }

        {
            let indices_data = self.client.indices().await?;
            let mut indices = self.indices.write().await;
            *indices = indices_data;
        }

        {
            let recovery_data = self.client.recovery().await?;
            let mut recovery = self.recovery.write().await;
            *recovery = recovery_data;
        }

        {
            let shards_data = self.client.shards().await?;
            let mut shards = self.shards.write().await;
            *shards = shards_data;
        }

        {
            let nodes_data = self.client.nodes().await?;
            let mut nodes = self.nodes.write().await;
            *nodes = nodes_data;
        }

        Ok(())
    }

    pub async fn start_refresh(warehouse: Arc<RwLock<Warehouse>>) {
    debug!("Spawning refresh loop...");
    tokio::spawn(async move {
        loop {
            debug!("Sleeping for 5 seconds...");
            tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            debug!("Refreshing data...");
            let warehouse = warehouse.read().await;
            if let Err(e) = warehouse.refresh().await {
                panic!("Failed to refresh data: {:?}", e);
            }
            debug!("Data refreshed!");
        }
    });
}
}
