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

#[tokio::main]
async fn main() {
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]);

    let health = warp::path!("elastic" / "health").and_then(elastic_health);
    let hello = warp::path!("hello").and_then(hello);
    
    let routes = health.or(hello).with(cors);


    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
