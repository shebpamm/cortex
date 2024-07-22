use anyhow::Result;
use serde::{Deserialize, Serialize};
use juniper::GraphQLObject;
use figment::{providers::{Format, Env, Json, Toml, Yaml}, Figment};

const DEFAULT_CONFIG: &str = include_str!("../.config/config.toml");

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Config {
    pub port: u16,
    pub elastic: ElasticConfig,
    pub ui: UiConfig,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ElasticConfig {
    pub url: String,
}

#[derive(GraphQLObject, Clone, Debug, Deserialize, Serialize)]
pub struct UiConfig {
    pub colorscheme: String,
}

pub fn read_config() -> Result<Config> {
    let config: Config = Figment::new()
        .merge(Toml::string(DEFAULT_CONFIG))
        .merge(Json::file("config.json"))
        .merge(Yaml::file("config.yaml"))
        .merge(Toml::file("config.toml"))
        .merge(Env::prefixed("CORTEX_"))
        .extract()?;

    Ok(config)
}
