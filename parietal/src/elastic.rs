use std::collections::HashMap;
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

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct IndexInfo {
    health: String,
    status: String,
    index: String,
    uuid: String,
    pri: String,
    rep: String,
    #[serde(alias = "docs.count")]
    docs_count: String,
    #[serde(alias = "docs.deleted")]
    docs_deleted: String,
    #[serde(alias = "store.size")]
    store_size: String,
    #[serde(alias = "pri.store.size")]
    pri_store_size: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct Recovery {
    #[serde(flatten)]
    indices: HashMap<String, IndexRecovery>,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct IndexRecovery {
    shards: Vec<RecoveryShard>,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct RecoveryShard {
    id: u32,
    #[serde(alias = "type")]
    shard_type: String,
    stage: String,
    primary: bool,
    start_time_in_millis: u64,
    total_time_in_millis: u64,
    source: NodeInfo,
    target: NodeInfo,
    index: TransportIndexInfo,
    translog: TranslogInfo,
    verify_index: VerifyIndexInfo,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
struct NodeInfo {
    id: String,
    host: String,
    transport_address: String,
    ip: String,
    name: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
struct TransportIndexInfo {
    size: SizeInfo,
    files: FilesInfo,
    total_time_in_millis: u64,
    source_throttle_time_in_millis: u64,
    target_throttle_time_in_millis: u64,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
struct SizeInfo {
    total_in_bytes: u64,
    reused_in_bytes: u64,
    recovered_in_bytes: u64,
    recovered_from_snapshot_in_bytes: u64,
    percent: String, // This can sometimes be a string like "18.2%"
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
struct FilesInfo {
    total: u32,
    reused: u32,
    recovered: u32,
    percent: String, // This can sometimes be a string like "91.6%"
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
struct TranslogInfo {
    recovered: u32,
    total: u32,
    percent: String, // This can sometimes be a string like "100.0%"
    total_on_start: u32,
    total_time_in_millis: u64,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
struct VerifyIndexInfo {
    check_index_time_in_millis: u64,
    total_time_in_millis: u64,
}

#[derive(Debug)]
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

    pub async fn indices(&self) -> Result<Vec<IndexInfo>> {
        let url = format!("{}/_cat/indices?format=json", self.base_url);
        let response = self.client.get(&url).send().await?;
        let indices = response.text().await?;
        let indices: Vec<IndexInfo> = serde_json::from_str(&indices)?;

        Ok(indices)
    }

    pub async fn recovery(&self) -> Result<Recovery> {
        let url = format!("{}/_recovery?format=json&active_only=true", self.base_url);
        let response = self.client.get(&url).send().await?;
        let recovery = response.text().await?;
        let recovery: Recovery = serde_json::from_str(&recovery)?;

        Ok(recovery)
    }
}
