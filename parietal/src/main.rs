use warp::Filter;
use once_cell::sync::Lazy;

static ELASTIC: Lazy<elastic::ElasticsearchClient> = Lazy::new(|| elastic::ElasticsearchClient::new("http://localhost:9200"));

mod elastic;

async fn hello() -> Result<impl warp::Reply, warp::Rejection> {
    Ok("Hello, World!")
}

async fn elastic_health() -> Result<impl warp::Reply, warp::Rejection> {
    let health = ELASTIC.health().await.unwrap();
    let health = serde_json::to_value(health).unwrap();
    Ok(warp::reply::json(&health))
}

async fn elastic_indices() -> Result<impl warp::Reply, warp::Rejection> {
    let indices = ELASTIC.indices().await.unwrap();
    let indices = serde_json::to_value(indices).unwrap();
    Ok(warp::reply::json(&indices))
}

#[tokio::main]
async fn main() {
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]);

    let health = warp::path!("elastic" / "health").and_then(elastic_health);
    let indices = warp::path!("elastic" / "indices").and_then(elastic_indices);
    let hello = warp::path!("hello").and_then(hello);
    
    let routes = health.or(indices).or(hello).with(cors);


    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
