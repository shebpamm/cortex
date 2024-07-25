use crate::elastic::data::{ClusterInfo, IndexInfo, Recovery, ShallowShard, NodeOutput};
use anyhow::Result;

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
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<ClusterInfo, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(cluster_info) => Ok(cluster_info),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn indices(&self) -> Result<Vec<IndexInfo>> {
        let url = format!("{}/_cat/indices?format=json", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<Vec<IndexInfo>, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(indices) => Ok(indices),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn recovery(&self) -> Result<Recovery> {
        let url = format!("{}/_recovery?format=json&active_only=true", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<Recovery, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(recovery) => Ok(recovery),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn shards(&self) -> Result<Vec<ShallowShard>> {
        let url = format!("{}/_cat/shards?format=json", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<Vec<ShallowShard>, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(shards) => Ok(shards),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn nodes(&self) -> Result<NodeOutput> {
        let url = format!("{}/_nodes/stats/fs,process,os?format=json", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<NodeOutput, _> = serde_path_to_error::deserialize(jd);
        
        match result {
            Ok(nodes) => Ok(nodes),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }
}
