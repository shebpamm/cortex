use serde::{Deserialize, Serialize};
use anyhow::Result;
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ClusterInfo {
    cluster_name: String,
    status: String,
    timed_out: bool,
    number_of_nodes: u32,
    number_of_data_nodes: u32,
    active_primary_shards: u32,
    active_shards: u32,
    relocating_shards: u32,
    initializing_shards: u32,
    unassigned_shards: u32,
    delayed_unassigned_shards: u32,
    number_of_pending_tasks: u32,
    number_of_in_flight_fetch: u32,
    task_max_waiting_in_queue_millis: u64,
    active_shards_percent_as_number: f64,
}

pub struct ElasticsearchClient {
    client: reqwest::Client,
    base_url: String,
}

impl ElasticsearchClient {
    pub fn new(base_url: &str) -> Self {
        ElasticsearchClient {
            client: reqwest::Client::new(),
            base_url: base_url.to_string(),
        }
    }

    pub async fn health(&self) -> Result<ClusterInfo> {
        let url = format!("{}/_cluster/health", self.base_url);
        let response = self.client.get(&url).send().await?;
        let info = serde_json::from_str(&response.text().await?)?;
        Ok(info)
    }
}
