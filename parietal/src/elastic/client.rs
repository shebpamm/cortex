use crate::elastic::data::{ClusterInfo, IndexInfo, Recovery, ShallowShard, NodeOutput};
use crate::elastic::demo::DEMO_DATA;

use anyhow::Result;
use serde::de::DeserializeOwned;

#[derive(Debug)]
pub struct ElasticsearchClient {
    client: reqwest::Client,
    base_url: String,
    demo_mode: bool,
}

impl ElasticsearchClient {
    pub fn new(base_url: &str) -> Self {
        ElasticsearchClient {
            client: reqwest::Client::new(),
            base_url: base_url.to_string(),
            demo_mode: false,
        }
    }

    async fn fetch_and_parse<T: DeserializeOwned>(
        &self,
        endpoint: &str,
    ) -> Result<T> {
        let url = format!("{}/{}", self.base_url, endpoint);
        let response = match self.demo_mode {
            true => DEMO_DATA.iter().find(|(k, _)| k == &endpoint).unwrap().1.to_string(),
            false => self.client.get(&url).send().await?.text().await?, 
        };
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<T, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(data) => Ok(data),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn health(&self) -> Result<ClusterInfo> {
        self.fetch_and_parse("_cluster/health").await
    }

    pub async fn indices(&self) -> Result<Vec<IndexInfo>> {
        self.fetch_and_parse("_cat/indices?format=json").await
    }

    pub async fn recovery(&self) -> Result<Recovery> {
        self.fetch_and_parse("_recovery?format=json&active_only=true").await
    }

    pub async fn shards(&self) -> Result<Vec<ShallowShard>> {
        self.fetch_and_parse("_cat/shards?format=json").await
    }

    pub async fn nodes(&self) -> Result<NodeOutput> {
        self.fetch_and_parse("_nodes/stats/fs,process,os?format=json").await
    }
}
